import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * Centralised rate limiting for BearCart, backed by Upstash Redis.
 *
 * - One Redis connection and one limiter instance per endpoint, cached at the
 *   module level (no per-request allocation).
 * - Sliding-window algorithm everywhere for smooth limiting.
 * - FAIL OPEN: if UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not
 *   configured (they are added later), rate limiting is skipped instead of
 *   breaking the app — mirroring how moderation degrades gracefully.
 *
 * Server actions should call `enforceRateLimit(...)`, which throws a
 * `RateLimitError` whose message surfaces to the user (e.g. as a toast).
 * Route handlers can catch that error (or call `checkRateLimit`) and return a
 * real HTTP 429 response.
 */

// ─── Endpoint configuration ─────────────────────────────────────────────────

export type RateLimitEndpoint =
  | "moderation"
  | "welcomeEmail"
  | "imageUpload"
  | "postListing"
  | "postRequest"
  | "messages"
  | "reports"
  | "search";

type Duration = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

// const rates

const LIMITS: Record<
  RateLimitEndpoint,
  { tokens: number; window: Duration; prefix: string; label: string }
> = {
  moderation:   { tokens: 10, window: "1 m", prefix: "rl:moderation",   label: "moderation checks" },
  welcomeEmail: { tokens: 3,  window: "1 h", prefix: "rl:welcome-email", label: "welcome emails" },
  imageUpload:  { tokens: 10, window: "1 m", prefix: "rl:image-upload",  label: "image uploads" },
  postListing:  { tokens: 5,  window: "1 m", prefix: "rl:post-listing",  label: "listings" },
  postRequest:  { tokens: 5,  window: "1 m", prefix: "rl:post-request",  label: "requests" },
  messages:     { tokens: 20, window: "1 m", prefix: "rl:messages",      label: "messages" },
  reports:      { tokens: 10, window: "1 h", prefix: "rl:reports",       label: "reports" },
  search:       { tokens: 30, window: "1 m", prefix: "rl:search",        label: "searches" },
};

// ─── Lazy singletons ────────────────────────────────────────────────────────

let redis: Redis | null | undefined; // undefined = not yet resolved, null = unavailable
const limiters = new Map<RateLimitEndpoint, Ratelimit>();

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  if (!redis) {
    console.warn("[ratelimit] Upstash env vars not set — rate limiting disabled (fail open).");
  }
  return redis;
}

function getLimiter(endpoint: RateLimitEndpoint): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const cached = limiters.get(endpoint);
  if (cached) return cached;

  const cfg = LIMITS[endpoint];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
    prefix: cfg.prefix,
    analytics: false,
  });
  limiters.set(endpoint, limiter);
  return limiter;
}

// ─── Error ──────────────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  /** Seconds the caller should wait before retrying. */
  readonly retryAfter: number;
  readonly endpoint: RateLimitEndpoint;

  constructor(endpoint: RateLimitEndpoint, retryAfter: number, message: string) {
    super(message);
    this.name = "RateLimitError";
    this.endpoint = endpoint;
    this.retryAfter = retryAfter;
  }
}

// ─── Identity helpers ───────────────────────────────────────────────────────

/** Best-effort client IP from the proxy headers, for guests / public routes. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

// ─── Core API ───────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean;
  /** Seconds until the window resets (0 when allowed). */
  retryAfter: number;
}

/**
 * Checks (and consumes) one token for `endpoint` against `identifier`.
 * Never throws — returns `{ success }`. Returns success when Redis is not
 * configured (fail open).
 */
export async function checkRateLimit(
  endpoint: RateLimitEndpoint,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(endpoint);
  if (!limiter) return { success: true, retryAfter: 0 };

  try {
    const { success, reset } = await limiter.limit(identifier);
    const retryAfter = success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { success, retryAfter };
  } catch (err) {
    // A Redis outage must not take down the endpoint — fail open.
    console.error(`[ratelimit] check failed for ${endpoint} — allowing:`, err);
    return { success: true, retryAfter: 0 };
  }
}

function limitMessage(endpoint: RateLimitEndpoint, retryAfter: number): string {
  const { label } = LIMITS[endpoint];
  const wait =
    retryAfter >= 60
      ? `about ${Math.ceil(retryAfter / 60)} minute(s)`
      : `${retryAfter} second(s)`;
  return `You're doing that too fast. You've hit the limit for ${label} — please wait ${wait} and try again.`;
}

/**
 * Enforces the limit for `endpoint` against `identifier`. Throws a
 * `RateLimitError` (HTTP 429-equivalent) when exceeded. No-op when Redis is
 * unconfigured. Use this from server actions.
 */
export async function enforceRateLimit(
  endpoint: RateLimitEndpoint,
  identifier: string
): Promise<void> {
  const { success, retryAfter } = await checkRateLimit(endpoint, identifier);
  if (!success) {
    throw new RateLimitError(endpoint, retryAfter, limitMessage(endpoint, retryAfter));
  }
}
