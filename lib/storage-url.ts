/**
 * Rewrites a full Supabase public storage URL to the local `/storage/` proxy.
 *
 *   https://<ref>.supabase.co/storage/v1/object/public/listing-images/a/b.webp
 *     → /storage/listing-images/a/b.webp
 *
 * Pure function, no side effects. Anything that isn't a Supabase public storage
 * URL (relative paths, base64 data URLs, Google avatar URLs, etc.) is returned
 * unchanged.
 */
export function toStorageUrl(url: string): string {
  if (!url) return url;

  const match = url.match(
    /^https?:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/(.+)$/i
  );
  if (!match) return url;

  return `/storage/${match[1]}`;
}
