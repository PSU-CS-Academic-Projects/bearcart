"use server";

import { createClient } from "@/lib/supabase-server";
import { v4 as uuidv4 } from "crypto";

/**
 * Uploads a base64-encoded image to a Supabase Storage bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadImage(
  bucket: "listing-images" | "request_images" | "avatars",
  base64Data: string,
  folder?: string
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Extract mime type and raw data from base64 string
  const match = base64Data.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (!match) throw new Error("Invalid image format. Only JPEG, PNG, and WebP are allowed.");

  const mimeType = match[1];
  const extension = match[2] === "jpeg" ? "jpg" : match[2];
  const rawBase64 = match[3];

  // Convert base64 to Uint8Array
  const binaryString = atob(rawBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Build the file path
  const fileId = crypto.randomUUID();
  const prefix = folder ?? user.id;
  const filePath = `${prefix}/${fileId}.${extension}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Extract the file path from the public URL
  const bucketUrl = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(bucketUrl);
  if (idx === -1) throw new Error("Invalid URL for this bucket");

  const filePath = decodeURIComponent(publicUrl.slice(idx + bucketUrl.length));

  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
