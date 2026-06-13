"use server";

import { createClient } from "@/lib/supabase-server";
import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_TO_SHARP_FORMAT: Record<string, keyof sharp.FormatEnum> = {
  "image/jpeg": "jpeg",
  "image/png":  "png",
  "image/webp": "webp",
};

const OUTPUT_MIME: Record<string, string> = {
  "image/jpeg": "image/jpeg",
  "image/png":  "image/png",
  "image/webp": "image/webp",
};

const OUTPUT_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function base64ToBuffer(base64Data: string): Buffer {
  // Strip the data-URI prefix if present (data:<mime>;base64,<data>)
  const commaIdx = base64Data.indexOf(",");
  const raw = commaIdx !== -1 ? base64Data.slice(commaIdx + 1) : base64Data;
  return Buffer.from(raw, "base64");
}

/**
 * Validates the real MIME type from magic bytes, then re-encodes through Sharp
 * to strip any embedded metadata / polyglot payload.
 * Returns { bytes, mimeType, extension } for the sanitised image.
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

  // ── Sharp re-encode (strips metadata, polyglots, embedded payloads) ──
  const format = MIME_TO_SHARP_FORMAT[detected.mime];
  let pipeline = sharp(raw);

  if (format === "jpeg") {
    pipeline = pipeline.jpeg({ quality: 85 });
  } else if (format === "png") {
    pipeline = pipeline.png({ compressionLevel: 8 });
  } else if (format === "webp") {
    pipeline = pipeline.webp({ quality: 85 });
  }

  const sanitised = await pipeline.toBuffer();

  return {
    bytes: sanitised,
    mimeType: OUTPUT_MIME[detected.mime],
    extension: OUTPUT_EXT[detected.mime],
  };
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
