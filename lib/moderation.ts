/**
 * Content moderation helpers. Server-only - imported exclusively by "use server"
 * action modules, so the API keys below never reach the client bundle.
 *
 * - Text  → leo-profanity (sync, no API key) → OpenAI omni-moderation-latest
 * - Image → OpenAI omni-moderation-latest (image_url input with data URL)
 *
 * Behaviour:
 * - leo-profanity runs first and throws immediately on a match - OpenAI is
 *   never called when local profanity detection fires.
 * - A genuinely flagged item throws an Error with a user-facing message. The
 *   server actions let this bubble up to the form, which shows it as a toast.
 * - Missing API keys or transient API failures FAIL OPEN (log + allow) so the
 *   app keeps working in development and isn't taken down by a provider outage.
 *   Real flagged content always fails closed.
 */

// (no "server-only" import - keep this module dependency-free; it is only ever
//  imported by server action files.)

import leoProfanity from "leo-profanity";
import { FILIPINO_PROFANITY, WHITELISTED_WORDS } from "@/lib/moderation-constants";
import { enforceRateLimit, getClientIp } from "@/lib/ratelimit";

// ─── Initialise leo-profanity once (module-level, runs on first import) ───────

leoProfanity.loadDictionary("en");
leoProfanity.add(FILIPINO_PROFANITY);
leoProfanity.addWhitelist(WHITELISTED_WORDS);

// Debug logging only in dev. Prints user submitted content
const isDev = process.env.NODE_ENV !== "production";
function debug(...args: unknown[]): void {
  if (isDev) console.log(...args);
}

// ─── Text moderation (leo-profanity → OpenAI Moderation API) ─────────────────
// research if IP or ID is better for this

export interface TextField {
  /** Human-readable field name shown in the error, e.g. "title". */
  label: string;
  value: string;
}

interface OpenAIModerationResponse {
  results: { flagged: boolean; categories: Record<string, boolean> }[];
}

/** Throws if any provided text field is flagged as inappropriate. */
export async function moderateTextOrThrow(fields: TextField[]): Promise<void> {
  debug("[moderation] moderateTextOrThrow called - fields:", fields.map((f) => `${f.label}="${f.value}"`));

  const inputs = fields.filter((f) => f.value && f.value.trim().length > 0);
  if (inputs.length === 0) {
    debug("[moderation] all fields empty - skipping");
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[moderation] OPENAI_API_KEY not set - skipping text moderation");
    return; // fail open
  }

  // ── Fast local check (leo-profanity) ─────────────────────────────────
  // Runs synchronously with no network call. If it fires we throw immediately
  // and never hit the OpenAI API.
  for (const field of inputs) {
    if (leoProfanity.check(field.value)) {
      debug(`[moderation] leo-profanity flagged field "${field.label}"`);
      throw new Error(
        `Your ${field.label} appears to contain inappropriate content. Please revise it and try again.`
      );
    }
  }

  debug("[moderation] leo-profanity passed - calling OpenAI omni-moderation-latest with", inputs.length, "input(s)");

  // Rate limit omni-moderation calls (10/min per client).
  await enforceRateLimit("moderation", `ip:${await getClientIp()}`);

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        // omni-moderation requires typed input objects, not plain strings
        input: inputs.map((f) => ({ type: "text", text: f.value })),
      }),
    });
  } catch (err) {
    console.error("[moderation] OpenAI request failed - allowing content:", err);
    return; // fail open on network error
  }

  if (!res.ok) {
    console.error(`[moderation] OpenAI returned ${res.status} - allowing content (fail open).`);
    return; // fail open on API error
  }

  const data = (await res.json()) as OpenAIModerationResponse;
  debug("[moderation] OpenAI response:", JSON.stringify(data));

  // results align by index with inputs
  for (let i = 0; i < data.results.length; i++) {
    const result = data.results[i];
    debug(`[moderation] result[${i}] (${inputs[i]?.label}): flagged=${result?.flagged}`);
    if (result?.flagged) {
      const categories = Object.entries(result.categories)
        .filter(([, on]) => on)
        .map(([name]) => name.replace(/[/_]/g, " "));
      const field = inputs[i]?.label ?? "text";
      throw new Error(
        `Your ${field} appears to contain inappropriate content` +
          (categories.length ? ` (${categories.join(", ")})` : "") +
          `. Please revise it and try again.`
      );
    }
  }
  debug("[moderation] all fields passed - content allowed");
}

// ─── Image moderation (omni-moderation-latest) ────────────────────────
/** Throws if a single base64 image is flagged by OpenAI omni-moderation. */
export async function moderateImageOrThrow(base64Data: string): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[moderation] OPENAI_API_KEY not set - skipping image moderation");
    return; // fail open
  }

  // Ensure the value is a proper data URL (omni-moderation requires it)
  const dataUrl = base64Data.startsWith("data:") ? base64Data : `data:image/jpeg;base64,${base64Data}`;

  debug("[moderation] calling OpenAI omni-moderation-latest for image");

  // Rate limit omni-moderation calls (10/min per client).
  await enforceRateLimit("moderation", `ip:${await getClientIp()}`);

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [{ type: "image_url", image_url: { url: dataUrl } }],
      }),
    });
  } catch (err) {
    console.error("[moderation] OpenAI image moderation request failed - allowing image:", err);
    return; // fail open
  }

  if (!res.ok) {
    console.error(`[moderation] OpenAI image moderation returned ${res.status} - allowing image (fail open).`);
    return; // fail open
  }

  const data = (await res.json()) as OpenAIModerationResponse;
  const result = data.results?.[0];
  debug("[moderation] image moderation result: flagged=", result?.flagged);

  if (result?.flagged) {
    const categories = Object.entries(result.categories)
      .filter(([, on]) => on)
      .map(([name]) => name.replace(/[/_]/g, " "));
    throw new Error(
      `One of your images was rejected because it may contain inappropriate content` +
        (categories.length ? ` (${categories.join(", ")})` : "") +
        `. Please choose a different image.`
    );
  }
}

/** Moderates every new base64 image. Existing http(s) URLs are skipped. */
export async function moderateImagesOrThrow(photos: string[]): Promise<void> {
  const newUploads = photos.filter((p) => p.startsWith("data:"));
  for (const photo of newUploads) {
    await moderateImageOrThrow(photo);
  }
}
