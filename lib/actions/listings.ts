"use server";

import { createClient } from "@/lib/supabase-server";
import { uploadImage, deleteImage } from "./storage";

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
  category?: string;
  condition?: string;
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
  tags: string[] | null;
  views_count: number;
  created_at: string;
  updated_at: string;
  listing_images: { id: string; image_url: string; is_cover: boolean; order: number }[];
  seller: { id: string; full_name: string; avatar_url: string | null; role: string; college: string | null; created_at: string };
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createListing(input: CreateListingInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (input.photos.length === 0) throw new Error("At least one photo is required");

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
    category,
    condition,
    minPrice,
    maxPrice,
    sortBy = "newest",
    page = 1,
    pageSize = 12,
  } = filters;

  let query = supabase
    .from("listings")
    .select(
      `
      id, seller_id, title, description, price, is_negotiable,
      category, condition, status, tags, views_count, created_at, updated_at,
      listing_images ( id, image_url, is_cover, order ),
      seller:users!listings_seller_id_fkey ( id, full_name, avatar_url, role, college, created_at )
    `,
      { count: "exact" }
    )
    .eq("status", "available")
    .is("deleted_at", null);

  // Filters
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (category && category !== "All Categories") {
    query = query.ilike("category", category);
  }
  if (condition) {
    query = query.eq("condition", condition);
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
    listings: (data ?? []) as ListingWithImages[],
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
      category, condition, status, tags, views_count, created_at, updated_at,
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

  return data as ListingWithImages;
}

// ─── READ (by seller) ────────────────────────────────────────────────────────

export async function getListingsBySeller(sellerId: string, status?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(
      `
      id, seller_id, title, description, price, is_negotiable,
      category, condition, status, tags, views_count, created_at, updated_at,
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
  status: "available" | "reserved" | "sold" | "deleted"
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

  const { error } = await supabase
    .from("listings")
    .update(update)
    .eq("id", listingId)
    .eq("seller_id", user.id);

  if (error) throw new Error(`Failed to update listing: ${error.message}`);
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
