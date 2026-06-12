/**
 * Content moderation helpers. Server-only — imported exclusively by "use server"
 * action modules, so the API keys below never reach the client bundle.
 *
 * - Text  → leo-profanity (sync, no API key) → OpenAI omni-moderation-latest
 * - Image → Google Cloud Vision SafeSearch (free tier, ~1000 units/month)
 *
 * Behaviour:
 * - leo-profanity runs first and throws immediately on a match — OpenAI is
 *   never called when local profanity detection fires.
 * - A genuinely flagged item throws an Error with a user-facing message. The
 *   server actions let this bubble up to the form, which shows it as a toast.
 * - Missing API keys or transient API failures FAIL OPEN (log + allow) so the
 *   app keeps working in development and isn't taken down by a provider outage.
 *   Real flagged content always fails closed.
 */

// (no "server-only" import — keep this module dependency-free; it is only ever
//  imported by server action files.)

import leoProfanity from "leo-profanity";
import { FILIPINO_PROFANITY, WHITELISTED_WORDS } from "@/lib/moderation-constants";

// ─── Initialise leo-profanity once (module-level, runs on first import) ───────

leoProfanity.loadDictionary("en");
leoProfanity.add(FILIPINO_PROFANITY);
leoProfanity.addWhitelist(WHITELISTED_WORDS);

// ─── Text moderation (leo-profanity → OpenAI Moderation API) ─────────────────

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
  console.log("[moderation] moderateTextOrThrow called — fields:", fields.map((f) => `${f.label}="${f.value}"`));

  const inputs = fields.filter((f) => f.value && f.value.trim().length > 0);
  if (inputs.length === 0) {
    console.log("[moderation] all fields empty — skipping");
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[moderation] OPENAI_API_KEY not set — skipping text moderation");
    return; // fail open
  }

  // ── Fast local check (leo-profanity) ─────────────────────────────────
  // Runs synchronously with no network call. If it fires we throw immediately
  // and never hit the OpenAI API.
  for (const field of inputs) {
    if (leoProfanity.check(field.value)) {
      console.log(`[moderation] leo-profanity flagged field "${field.label}"`);
      throw new Error(
        `Your ${field.label} appears to contain inappropriate content. Please revise it and try again.`
      );
    }
  }

  console.log("[moderation] leo-profanity passed — calling OpenAI omni-moderation-latest with", inputs.length, "input(s)");

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
    console.error("[moderation] OpenAI request failed — allowing content:", err);
    return; // fail open on network error
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    console.error(`[moderation] OpenAI returned ${res.status} — allowing content. Body: ${body}`);
    return; // fail open on API error
  }

  const data = (await res.json()) as OpenAIModerationResponse;
  console.log("[moderation] OpenAI response:", JSON.stringify(data));

  // results align by index with inputs
  for (let i = 0; i < data.results.length; i++) {
    const result = data.results[i];
    console.log(`[moderation] result[${i}] (${inputs[i]?.label}): flagged=${result?.flagged}`);
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
  console.log("[moderation] all fields passed — content allowed");
}

// ─── Image moderation (Google Cloud Vision SafeSearch) ────────────────────────

// Vision likelihood enum, ascending severity.
type Likelihood =
  | "UNKNOWN" | "VERY_UNLIKELY" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";

interface VisionResponse {
  responses: {
    safeSearchAnnotation?: {
      adult: Likelihood;
      spoof: Likelihood;
      medical: Likelihood;
      violence: Likelihood;
      racy: Likelihood;
    };
    error?: { message: string };
  }[];
}

function stripDataUrl(b64: string): string {
  const comma = b64.indexOf(",");
  return comma === -1 ? b64 : b64.slice(comma + 1);
}

/** Throws if a single base64 image is flagged by SafeSearch. */
export async function moderateImageOrThrow(base64Data: string): Promise<void> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    console.warn("[moderation] GOOGLE_CLOUD_VISION_API_KEY not set — skipping image moderation");
    return; // fail open
  }

  let res: Response;
  try {
    res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: stripDataUrl(base64Data) },
            features: [{ type: "SAFE_SEARCH_DETECTION" }],
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[moderation] Vision request failed — allowing image:", err);
    return; // fail open
  }

  if (!res.ok) {
    console.error(`[moderation] Vision returned ${res.status} — allowing image`);
    return; // fail open
  }

  const data = (await res.json()) as VisionResponse;
  const annotation = data.responses?.[0]?.safeSearchAnnotation;
  if (!annotation) return;

  // adult & violence block at LIKELY+; racy only at VERY_LIKELY to avoid
  // false positives on legitimate clothing/swimwear listings.
  const strong = new Set<Likelihood>(["LIKELY", "VERY_LIKELY"]);
  const reasons: string[] = [];
  if (strong.has(annotation.adult)) reasons.push("explicit/adult content");
  if (annotation.racy === "VERY_LIKELY") reasons.push("sexually suggestive content");
  if (strong.has(annotation.violence)) reasons.push("graphic violence");

  if (reasons.length > 0) {
    throw new Error(
      `One of your images was rejected because it may contain ${reasons.join(", ")}. ` +
        `Please choose a different image.`
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
