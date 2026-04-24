"use server";

import { createClient } from "@/lib/supabase-server";

/**
 * Toggle save/unsave a listing for the current user.
 * Returns `true` if now saved, `false` if unsaved.
 */
export async function toggleSaveListing(listingId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if already saved
  const { data: existing } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    // Unsave
    await supabase
      .from("saved_listings")
      .delete()
      .eq("id", existing.id);
    return false;
  } else {
    // Save
    const { error } = await supabase
      .from("saved_listings")
      .insert({ user_id: user.id, listing_id: listingId });
    if (error) throw new Error(`Failed to save listing: ${error.message}`);
    return true;
  }
}

/**
 * Check if a listing is saved by the current user.
 */
export async function isListingSaved(listingId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  return !!data;
}

/**
 * Get all saved listings for the current user.
 */
export async function getSavedListings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("saved_listings")
    .select(
      `
      id, created_at,
      listing:listings (
        id, title, price, category, condition, status, created_at,
        listing_images ( id, image_url, is_cover, order )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch saved listings: ${error.message}`);
  return data ?? [];
}

/**
 * Remove a saved listing.
 */
export async function removeSavedListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("saved_listings")
    .delete()
    .eq("user_id", user.id)
    .eq("listing_id", listingId);

  if (error) throw new Error(`Failed to remove saved listing: ${error.message}`);
}
