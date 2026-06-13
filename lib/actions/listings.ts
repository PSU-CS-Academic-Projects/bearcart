"use server";

import { createClient } from "@/lib/supabase-server";
import { uploadImage, deleteImage } from "./storage";
import { MAX_CURRENCY_AMOUNT } from "@/lib/currency";
import { moderateTextOrThrow, moderateImagesOrThrow } from "@/lib/moderation";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  is_negotiable: boolean;
  category: string;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
  tags: string[];
  /** Base64-encoded images from the photo upload component */
  photos: string[];
}

export interface ListingFilters {
  search?: string;
  /** Single category or comma-separated list of categories */
  category?: string;
  /** Parsed array of categories; takes precedence over the string `category` field */
  categories?: string[];
  /** Single condition or comma-separated list; kept for back-compat */
  condition?: string;
  /** Parsed array of conditions; takes precedence over the string `condition` field */
  conditions?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "price-low" | "price-high" | "recent";
  page?: number;
  pageSize?: number;
}

export interface ListingWithImages {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  is_negotiable: boolean;
  category: string;
  condition: string;
  status: string;
  is_delisted: boolean;
  tags: string[] | null;
  views_count: number;
  created_at: string;
  updated_at: string;
  listing_images: { id: string; image_url: string; is_cover: boolean; order: number }[];
  seller: { id: string; full_name: string; avatar_url: string | null; role: string; college: string | null; created_at: string };
}

export interface PostModerationState {
  exists: boolean;
  is_delisted: boolean;
  is_removed: boolean;
}

/** Minimal moderation flags for a post — lets a detail page show a "removed"
 *  message for delisted content (hidden by RLS) without leaking the content. */
export async function getPostModerationState(
  type: "listing" | "request",
  id: string
): Promise<PostModerationState> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_post_moderation_state", { p_type: type, p_id: id });
  return (data ?? { exists: false, is_delisted: false, is_removed: false }) as PostModerationState;
}

async function assertNotPostBanned(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("users").select("ban_type").eq("id", userId).single();
  if (data?.ban_type === "post" || data?.ban_type === "full") {
    throw new Error("Your account is banned from posting. Contact an admin if you believe this is a mistake.");
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createListing(input: CreateListingInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (input.photos.length === 0) throw new Error("At least one photo is required");
  if (input.price < 1) throw new Error("Price must be at least ₱1");
  if (input.price > MAX_CURRENCY_AMOUNT) throw new Error("Price cannot exceed ₱999,999");

  await assertNotPostBanned(supabase, user.id);

  // 0. Content moderation — runs before any DB write so flagged content
  //    never produces an orphaned listing row.
  await moderateTextOrThrow([
    { label: "title", value: input.title },
    { label: "description", value: input.description },
    ...(input.tags.length > 0 ? [{ label: "tags", value: input.tags.join(", ") }] : []),
  ]);
  await moderateImagesOrThrow(input.photos);

  // 1. Insert the listing row
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title: input.title,
      description: input.description,
      price: input.price,
      is_negotiable: input.is_negotiable,
      category: input.category,
      condition: input.condition,
      tags: input.tags.length > 0 ? input.tags : null,
    })
    .select("id")
    .single();

  if (listingError) throw new Error(`Failed to create listing: ${listingError.message}`);

  // 2. Upload photos to storage and insert listing_images rows
  const imagePromises = input.photos.map(async (photo, index) => {
    const imageUrl = await uploadImage("listing-images", photo, `${user.id}/${listing.id}`);
    return {
      listing_id: listing.id,
      image_url: imageUrl,
      is_cover: index === 0,
      order: index,
    };
  });

  const imageRows = await Promise.all(imagePromises);

  const { error: imagesError } = await supabase
    .from("listing_images")
    .insert(imageRows);

  if (imagesError) {
    console.error("Failed to insert listing_images:", imagesError.message);
  }

  return { id: listing.id };
}

// ─── READ (list) ──────────────────────────────────────────────────────────────

export async function getListings(filters: ListingFilters = {}) {
  const supabase = await createClient();
  const {
    search,
    minPrice,
    maxPrice,
    sortBy = "newest",
    page = 1,
    pageSize = 12,
  } = filters;

  // Resolve multi-category: prefer parsed array, fall back to comma-split string
  const resolvedCategories: string[] =
    filters.categories && filters.categories.length > 0
      ? filters.categories
      : filters.category
        ? filters.category.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

  // Resolve multi-condition: prefer parsed array, fall back to comma-split string
  const resolvedConditions: string[] =
    filters.conditions && filters.conditions.length > 0
      ? filters.conditions
      : filters.condition
        ? filters.condition.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

  let query = supabase
    .from("listings")
    .select(
      `
      id, seller_id, title, description, price, is_negotiable,
      category, condition, status, is_delisted, tags, views_count, created_at, updated_at,
      listing_images ( id, image_url, is_cover, order ),
      seller:users!listings_seller_id_fkey ( id, full_name, avatar_url, role, college, created_at )
    `,
      { count: "exact" }
    )
    .eq("status", "available")
    .eq("is_delisted", false)
    .is("deleted_at", null);

  // Filters
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  const activeCategories = resolvedCategories.filter((c) => c !== "All Categories");
  if (activeCategories.length === 1) {
    query = query.ilike("category", activeCategories[0]);
  } else if (activeCategories.length > 1) {
    query = query.in("category", activeCategories);
  }
  if (resolvedConditions.length === 1) {
    query = query.eq("condition", resolvedConditions[0]);
  } else if (resolvedConditions.length > 1) {
    query = query.in("condition", resolvedConditions);
  }
  if (minPrice !== undefined) {
    query = query.gte("price", minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte("price", maxPrice);
  }

  // Sort
  switch (sortBy) {
    case "price-low":
      query = query.order("price", { ascending: true });
      break;
    case "price-high":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to fetch listings: ${error.message}`);

  return {
    listings: (data ?? []) as unknown as ListingWithImages[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ─── READ (single) ───────────────────────────────────────────────────────────

export async function getListingById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id, seller_id, title, description, price, is_negotiable,
      category, condition, status, is_delisted, tags, views_count, created_at, updated_at,
      listing_images ( id, image_url, is_cover, order ),
      seller:users!listings_seller_id_fkey ( id, full_name, avatar_url, role, college, created_at )
    `
    )
    .eq("id", id)
    .maybeSingle();

  // Return null for invalid UUIDs (triggers 404) or actual DB errors
  if (error) {
    if (error.message.includes("invalid input syntax")) return null;
    throw new Error(`Listing fetch error: ${error.message}`);
  }
  if (!data) return null;

  // Increment view count (fire and forget)
  supabase
    .from("listings")
    .update({ views_count: (data.views_count ?? 0) + 1 })
    .eq("id", id)
    .then();

  return data as unknown as ListingWithImages;
}

// ─── READ (by seller) ────────────────────────────────────────────────────────

export async function getListingsBySeller(sellerId: string, status?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(
      `
      id, seller_id, title, description, price, is_negotiable,
      category, condition, status, is_delisted, tags, views_count, created_at, updated_at,
      listing_images ( id, image_url, is_cover, order )
    `
    )
    .eq("seller_id", sellerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch seller listings: ${error.message}`);
  return data ?? [];
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateListingStatus(
  listingId: string,
  status: "available" | "reserved" | "sold" | "deleted",
  soldToUserId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const update: Record<string, unknown> = { status };
  if (status === "deleted") {
    update.deleted_at = new Date().toISOString();
  }
  if (status === "sold" && soldToUserId) {
    update.sold_to_user_id = soldToUserId;
  }

  const { error } = await supabase
    .from("listings")
    .update(update)
    .eq("id", listingId)
    .eq("seller_id", user.id);

  if (error) throw new Error(`Failed to update listing: ${error.message}`);
}

export async function getListingChatters(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("conversations")
    .select(`buyer:users!conversations_buyer_id_fkey ( id, full_name, avatar_url )`)
    .eq("listing_id", listingId)
    .eq("seller_id", user.id);

  if (error) throw new Error(`Failed to fetch listing chatters: ${error.message}`);

  const seen = new Set<string>();
  return (data ?? [])
    .map((c) => c.buyer as { id: string; full_name: string; avatar_url: string | null })
    .filter((b) => {
      if (!b || seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    })
    .map((b) => ({ id: b.id, name: b.full_name, avatar: b.avatar_url ?? "" }));
}

// ─── UPDATE (full) ───────────────────────────────────────────────────────────

export interface UpdateListingInput {
  listingId: string;
  title: string;
  description: string;
  price: number;
  is_negotiable: boolean;
  category: string;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
  tags: string[];
  /** Existing image URLs to keep (in the new order) */
  existingPhotos: string[];
  /** Image IDs that were removed by the user */
  removedImageIds: string[];
  /** New base64-encoded images to upload */
  newPhotos: string[];
}

export async function updateListing(input: UpdateListingInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership
  const { data: listing } = await supabase
    .from("listings")
    .select("seller_id, status")
    .eq("id", input.listingId)
    .single();

  if (!listing) throw new Error("Listing not found");
  if (listing.seller_id !== user.id) throw new Error("Not authorized");
  if (listing.status === "sold" || listing.status === "deleted") {
    throw new Error("This listing cannot be edited");
  }
  if (input.price < 1) throw new Error("Price must be at least ₱1");
  if (input.price > MAX_CURRENCY_AMOUNT) throw new Error("Price cannot exceed ₱999,999");

  // 0. Content moderation — text plus any newly added images.
  await moderateTextOrThrow([
    { label: "title", value: input.title },
    { label: "description", value: input.description },
    ...(input.tags.length > 0 ? [{ label: "tags", value: input.tags.join(", ") }] : []),
  ]);
  await moderateImagesOrThrow(input.newPhotos);

  // 1. Update listing fields
  const { error: updateError } = await supabase
    .from("listings")
    .update({
      title: input.title,
      description: input.description,
      price: input.price,
      is_negotiable: input.is_negotiable,
      category: input.category,
      condition: input.condition,
      tags: input.tags.length > 0 ? input.tags : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.listingId)
    .eq("seller_id", user.id);

  if (updateError) throw new Error(`Failed to update listing: ${updateError.message}`);

  // 2. Delete removed images (storage + DB)
  if (input.removedImageIds.length > 0) {
    // Get URLs for storage deletion
    const { data: removedImages } = await supabase
      .from("listing_images")
      .select("id, image_url")
      .in("id", input.removedImageIds);

    if (removedImages) {
      // Delete from storage (fire-and-forget, don't block)
      for (const img of removedImages) {
        try {
          await deleteImage("listing-images", img.image_url);
        } catch {
          console.error(`Failed to delete image from storage: ${img.image_url}`);
        }
      }
    }

    // Delete from DB
    await supabase
      .from("listing_images")
      .delete()
      .in("id", input.removedImageIds);
  }

  // 3. Upload new photos
  const newImageRows: { listing_id: string; image_url: string; is_cover: boolean; order: number }[] = [];
  const startOrder = input.existingPhotos.length;

  for (let i = 0; i < input.newPhotos.length; i++) {
    try {
      const imageUrl = await uploadImage("listing-images", input.newPhotos[i], `${user.id}/${input.listingId}`);
      newImageRows.push({
        listing_id: input.listingId,
        image_url: imageUrl,
        is_cover: false, // Will be updated in step 4
        order: startOrder + i,
      });
    } catch (err) {
      console.error(`Failed to upload new photo ${i}:`, err);
    }
  }

  if (newImageRows.length > 0) {
    await supabase.from("listing_images").insert(newImageRows);
  }

  // 4. Update order and is_cover for all remaining images
  // existingPhotos are URLs in their new order position
  // We need to find image IDs by URL and update their order
  const { data: allImages } = await supabase
    .from("listing_images")
    .select("id, image_url")
    .eq("listing_id", input.listingId);

  if (allImages) {
    const updatePromises = allImages.map((img) => {
      // Find position: check existing photos first, then new uploads
      let order = input.existingPhotos.indexOf(img.image_url);
      if (order === -1) {
        // Might be a newly uploaded image
        const newIdx = newImageRows.findIndex((r) => r.image_url === img.image_url);
        if (newIdx !== -1) order = startOrder + newIdx;
      }
      if (order === -1) order = 999; // Fallback

      return supabase
        .from("listing_images")
        .update({ order, is_cover: order === 0 })
        .eq("id", img.id);
    });

    await Promise.all(updatePromises);
  }

  return { id: input.listingId };
}

// ─── DELETE (soft) ────────────────────────────────────────────────────────────

export async function deleteListing(listingId: string) {
  return updateListingStatus(listingId, "deleted");
}

// ─── RELATED LISTINGS ────────────────────────────────────────────────────────

export async function getRelatedListings(listingId: string, sellerId: string, limit = 4) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id, title, price, category, condition, created_at,
      listing_images ( id, image_url, is_cover, order ),
      seller:users!listings_seller_id_fkey ( id, full_name, avatar_url )
    `
    )
    .eq("seller_id", sellerId)
    .eq("status", "available")
    .is("deleted_at", null)
    .neq("id", listingId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}
