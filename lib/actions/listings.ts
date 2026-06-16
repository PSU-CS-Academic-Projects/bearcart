"use server";

import { createClient } from "@/lib/supabase-server";
import { uploadImage, deleteImage } from "./storage";
import { MAX_CURRENCY_AMOUNT } from "@/lib/currency";
import { moderateTextOrThrow, moderateImagesOrThrow } from "@/lib/moderation";
import { logActivity } from "@/lib/activity-log";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  is_negotiable: boolean;
  category: string;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
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
  slug: string;
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
  seller: { id: string; slug: string; full_name: string; avatar_url: string | null; role: string; college: string | null; created_at: string };
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
  ]);
  await moderateImagesOrThrow(input.photos);

  // 1. Generate the listng ID + slug up front so the slug is set on insert
  //    (the slug column is NOT NULL).
  const listingId = crypto.randomUUID();
  const baseSlug =
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-") || "listing";
  const slug = `${baseSlug}-${listingId.slice(0, 6)}`;

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .insert({
      id: listingId,
      seller_id: user.id,
      title: input.title,
      description: input.description,
      price: input.price,
      is_negotiable: input.is_negotiable,
      category: input.category,
      condition: input.condition,
      slug,
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

  return { id: listing.id, slug };
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
      id, slug, seller_id, title, description, price, is_negotiable,
      category, condition, status, is_delisted, tags, views_count, created_at, updated_at,
      listing_images ( id, image_url, is_cover, order ),
      seller:users!listings_seller_id_fkey ( id, slug, full_name, avatar_url, role, college, created_at )
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

// ─── READ (single by slug — canonical) ───────────────────────────────────────

export async function getListingBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id, slug, seller_id, title, description, price, is_negotiable,
      category, condition, status, is_delisted, tags, views_count, created_at, updated_at,
      listing_images ( id, image_url, is_cover, order ),
      seller:users!listings_seller_id_fkey ( id, slug, full_name, avatar_url, role, college, created_at )
    `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Listing fetch error: ${error.message}`);
  if (!data) return null;

  supabase
    .from("listings")
    .update({ views_count: (data.views_count ?? 0) + 1 })
    .eq("id", data.id)
    .then();

  return data as unknown as ListingWithImages;
}

// ─── READ (single by ID — kept for edit page & internal use) ─────────────────

export async function getListingById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id, slug, seller_id, title, description, price, is_negotiable,
      category, condition, status, is_delisted, tags, views_count, created_at, updated_at,
      listing_images ( id, image_url, is_cover, order ),
      seller:users!listings_seller_id_fkey ( id, slug, full_name, avatar_url, role, college, created_at )
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

  // Delisted listings are only visible to their owner and to admins. Everyone
  // else (e.g. visitors browsing a public profile) must not see them.
  const { data: { user } } = await supabase.auth.getUser();
  let canSeeDelisted = !!user && user.id === sellerId;
  if (user && !canSeeDelisted) {
    const { data: viewer } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
    canSeeDelisted = !!viewer?.is_admin;
  }

  let query = supabase
    .from("listings")
    .select(
      `
      id, slug, seller_id, title, description, price, is_negotiable,
      category, condition, status, is_delisted, tags, views_count, created_at, updated_at,
      listing_images ( id, image_url, is_cover, order )
    `
    )
    .eq("seller_id", sellerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!canSeeDelisted) {
    query = query.eq("is_delisted", false);
  }

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

  // Audit: record "marked as sold" for the admin activity feed.
  if (status === "sold") {
    const [{ data: listing }, { data: actor }] = await Promise.all([
      supabase.from("listings").select("title").eq("id", listingId).single(),
      supabase.from("users").select("full_name").eq("id", user.id).single(),
    ]);
    await logActivity({
      type: "listing_sold",
      actorId: user.id,
      actorName: actor?.full_name ?? null,
      targetType: "listing",
      targetId: listingId,
      targetTitle: listing?.title ?? null,
    });
  }
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
    .map((c) => c.buyer as unknown as { id: string; full_name: string; avatar_url: string | null })
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
  /**
   * Full photo list in final display order. Existing photos are http(s) URLs,
   * newly added photos are base64 data URLs. Position 0 becomes the cover.
   */
  orderedPhotos: string[];
  /** Image IDs that were removed by the user */
  removedImageIds: string[];
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

  const newPhotos = input.orderedPhotos.filter((p) => p.startsWith("data:"));

  // 0. Content moderation — text plus any newly added images.
  await moderateTextOrThrow([
    { label: "title", value: input.title },
    { label: "description", value: input.description },
  ]);
  await moderateImagesOrThrow(newPhotos);

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

  // 3. Upload new photos, mapping each base64 entry to its uploaded URL while
  //    preserving the caller's interleaved display order.
  const resolvedUrls: string[] = [];
  for (const photo of input.orderedPhotos) {
    if (photo.startsWith("data:")) {
      try {
        const imageUrl = await uploadImage("listing-images", photo, `${user.id}/${input.listingId}`);
        resolvedUrls.push(imageUrl);
      } catch (err) {
        console.error("Failed to upload new photo:", err);
      }
    } else {
      resolvedUrls.push(photo);
    }
  }

  // Insert rows for the freshly uploaded images (existing rows are reordered below).
  const { data: existingRows } = await supabase
    .from("listing_images")
    .select("id, image_url")
    .eq("listing_id", input.listingId);
  const existingUrls = new Set((existingRows ?? []).map((r) => r.image_url));

  const newImageRows = resolvedUrls
    .map((url, index) => ({ url, index }))
    .filter(({ url }) => !existingUrls.has(url))
    .map(({ url, index }) => ({
      listing_id: input.listingId,
      image_url: url,
      is_cover: index === 0,
      order: index,
    }));

  if (newImageRows.length > 0) {
    await supabase.from("listing_images").insert(newImageRows);
  }

  // 4. Update order + is_cover for ALL images from their position in the final
  //    ordered list. Position 0 is the cover; anything not in the list (should
  //    not happen) sinks to the end and loses cover status.
  const { data: allImages } = await supabase
    .from("listing_images")
    .select("id, image_url")
    .eq("listing_id", input.listingId);

  if (allImages) {
    const updatePromises = allImages.map((img) => {
      const order = resolvedUrls.indexOf(img.image_url);
      const finalOrder = order === -1 ? 999 : order;
      return supabase
        .from("listing_images")
        .update({ order: finalOrder, is_cover: finalOrder === 0 })
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
      id, slug, title, price, category, condition, created_at,
      listing_images ( id, image_url, is_cover, order ),
      seller:users!listings_seller_id_fkey ( id, slug, full_name, avatar_url )
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
