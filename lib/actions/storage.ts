"use server";

import { createClient } from "@/lib/supabase-server";
import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { processToWebp } from "@/lib/image-processing";
import { enforceRateLimit } from "@/lib/ratelimit";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function base64ToBuffer(base64Data: string): Buffer {
  // Strip the data-URI prefix if present (data:<mime>;base64,<data>)
  const commaIdx = base64Data.indexOf(",");
  const raw = commaIdx !== -1 ? base64Data.slice(commaIdx + 1) : base64Data;
  return Buffer.from(raw, "base64");
}

/**
 * Validates the real MIME type from magic bytes, then runs the image through
 * Sharp: flattens transparency onto white and re-encodes to WebP (which also
 * strips any embedded metadata / polyglot payload).
 * Returns { bytes, mimeType, extension } for the processed image.
 */
async function validateAndSanitize(
  base64Data: string
): Promise<{ bytes: Buffer; mimeType: string; extension: string }> {
  const raw = base64ToBuffer(base64Data);

  // ── Magic-byte check ─────────────────────────────────────────────────
  const detected = await fileTypeFromBuffer(raw);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new Error(
      `Invalid file type${detected ? ` (${detected.mime})` : ""}. Only JPEG, PNG, and WebP images are allowed.`
    );
  }

  // ── Flatten transparency → white, re-encode to WebP ──────────────────
  const bytes = await processToWebp(raw, { quality: 85 });

  return { bytes, mimeType: "image/webp", extension: "webp" };
}

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
