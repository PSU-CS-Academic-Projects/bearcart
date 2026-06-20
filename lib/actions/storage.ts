"use server";

import { createClient } from "@/lib/supabase-server";
import { randomUUID } from "crypto";
import { validateAndSanitize } from "@/lib/image-validation";
import { processToWebp } from "@/lib/image-processing";
import { enforceRateLimit } from "@/lib/ratelimit";

// ─── Constants ────────────────────────────────────────────────────────────────


// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Uploads a base64-encoded image to a Supabase Storage bucket.
 * Validates magic bytes (file-type) and re-encodes through Sharp to strip
 * any embedded malicious payload. Accepts JPEG, PNG, and WebP only.
 * Returns the public URL of the uploaded image.
 */
export async function uploadImage(
  bucket: "listing-images" | "request_images" | "avatars",
  base64Data: string,
  folder?: string
): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Rate limit: 10 image uploads per minute per ID.
  await enforceRateLimit("imageUpload", `user:${user.id}`);

  const { bytes, mimeType, extension } = await validateAndSanitize(base64Data);

  const fileId = randomUUID();
  const prefix = folder ?? user.id;
  const filePath = `${prefix}/${fileId}.${extension}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, bytes, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return urlData.publicUrl;
}

/**
 * Deletes an image from a Supabase Storage bucket by its public URL.
 */
export async function deleteImage(
  bucket: "listing-images" | "request_images" | "avatars",
  publicUrl: string
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const bucketUrl = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(bucketUrl);
  if (idx === -1) throw new Error("Invalid URL for this bucket");

  const filePath = decodeURIComponent(publicUrl.slice(idx + bucketUrl.length));
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
