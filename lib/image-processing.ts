import "server-only";
import sharp from "sharp";

/**
 * Shared image-processing step for every user upload (listings, requests,
 * avatars, chat images). Runs between receiving the raw bytes and uploading
 * them to Supabase Storage.
 *
 * - Flattens transparency onto a white background so PNGs with alpha don't
 *   render with see-through areas on light/dark surfaces.
 * - Re-encodes to WebP for a smaller file size (also strips any embedded
 *   metadata / polyglot payload as a side effect of the re-encode).
 *
 * Only still images are accepted across BearCart (JPEG/PNG/WebP), so there is
 * no animated-frame handling here.
 */
export async function processToWebp(
  input: Buffer | Uint8Array,
  opts: { quality?: number } = {}
): Promise<Buffer> {
  const { quality = 85 } = opts;

  return sharp(input)
    .flatten({ background: "#ffffff" })
    .webp({ quality })
    .toBuffer();
}
