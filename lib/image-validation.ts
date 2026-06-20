
import { fileTypeFromBuffer } from "file-type";
import { processToWebp } from "@/lib/image-processing";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_LABEL = "JPG, JPEG, PNG, or WEBP";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function base64ToBuffer(base64Data: string): Buffer {
  const commaIdx = base64Data.indexOf(",");
  const raw = commaIdx !== -1 ? base64Data.slice(commaIdx + 1) : base64Data;
  return Buffer.from(raw, "base64");
}

function claimedMimeOf(base64Data: string): string | null {
  const m = /^data:([^;,]+)[;,]/.exec(base64Data);
  return m ? m[1].toLowerCase() : null;
}

function formatLabel(mime: string, ext?: string): string {
  return (ext ?? mime.split("/")[1] ?? mime).toUpperCase();
}

function extOfMime(mime: string): string {
  const sub = mime.split("/")[1] ?? mime;
  return sub === "jpeg" ? "jpg" : sub;
}

function unsupportedImageMessage(
  base64Data: string,
  detected: { mime: string; ext: string } | undefined
): string {
  if (!detected) {
    return `That file isn't a supported image. Please upload a ${ALLOWED_LABEL} file.`;
  }

  const detectedLabel = formatLabel(detected.mime, detected.ext);
  const claimedMime = claimedMimeOf(base64Data);

  if (claimedMime && claimedMime !== detected.mime) {
    return `This file is actually .${detectedLabel}, even though it's named with a .${extOfMime(claimedMime)} extension. Please upload a ${ALLOWED_LABEL} file.`;
  }

  return `${detectedLabel} files aren't supported. Please upload a ${ALLOWED_LABEL} file.`;
}

export async function validateAndSanitize(
  base64Data: string
): Promise<{ bytes: Buffer; mimeType: string; extension: string }> {
  const raw = base64ToBuffer(base64Data);

  const detected = await fileTypeFromBuffer(raw);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new Error(unsupportedImageMessage(base64Data, detected));
  }

  const bytes = await processToWebp(raw, { quality: 85 });

  return { bytes, mimeType: "image/webp", extension: "webp" };
}