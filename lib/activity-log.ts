import { createClient } from "@/lib/supabase-server";

/**
 * Action / status events recorded to the `activity_log` audit table.
 * Creation events (user registered, listing/request posted) are NOT logged
 * here — the admin activity feed reads those directly from the base tables.
 */
export type ActivityLogType =
  | "listing_sold"
  | "request_closed"
  | "request_fulfilled"
  | "listing_delisted"
  | "listing_auto_delisted"
  | "listing_restored"
  | "listing_takedown"
  | "request_takedown"
  | "user_banned"
  | "user_unbanned"
  | "user_warned"
  | "message_deleted";

export interface LogActivityParams {
  type: ActivityLogType;
  /** Who performed the action (the admin for moderation, the owner for status changes). */
  actorId: string;
  /** Denormalized actor name for display without a join. */
  actorName?: string | null;
  targetType?: "listing" | "request" | "user" | "message" | null;
  targetId?: string | null;
  /** Denormalized target title (listing/request title or affected user's name). */
  targetTitle?: string | null;
  /** Extra context shown inline in the feed (e.g. the admin's takedown reason). */
  detail?: string | null;
}

/**
 * Best-effort insert into the activity_log table. Never throws — activity
 * logging must not break the action that triggered it. RLS requires
 * actor_id === auth.uid(), which always holds since the acting user writes
 * their own row.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("activity_log").insert({
      type: params.type,
      actor_id: params.actorId,
      actor_name: params.actorName ?? null,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      target_title: params.targetTitle ?? null,
      detail: params.detail ?? null,
    });
  } catch (err) {
    console.error("[activity-log] failed to record activity:", err);
  }
}
