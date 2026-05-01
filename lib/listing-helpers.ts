import type { ListingWithImages } from "@/lib/actions/listings";

/** Format a Postgres timestamp into a human-friendly relative string. */
export function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Get the cover image URL from a listing's images array. */
export function getCoverImage(listing: ListingWithImages): string {
  const cover = listing.listing_images?.find((img) => img.is_cover);
  return cover?.image_url ?? listing.listing_images?.[0]?.image_url ?? "";
}

/** Build the seller display name from the joined user record. */
export function getSellerName(listing: ListingWithImages): string {
  const seller = listing.seller;
  if (!seller) return "Unknown seller";
  return seller.full_name ?? "PSU Student";
}

/** Format the condition value from the DB to a display-friendly label. */
export function formatCondition(condition: string): string {
  const map: Record<string, string> = {
    new: "New",
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
  };
  return map[condition] ?? condition;
}

/** Map a display condition label back to the DB value. */
export function conditionToDbValue(display: string): string {
  const map: Record<string, string> = {
    "New": "new",
    "Like New": "like_new",
    "Good": "good",
    "Fair": "fair",
    "Poor": "poor",
  };
  return map[display] ?? display.toLowerCase();
}
