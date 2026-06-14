"use server";

import { createClient } from "@/lib/supabase-server";
import { logActivity } from "@/lib/activity-log";
import {
  sendPostDelistedEmail,
  sendPostRestoredEmail,
  sendPostTakedownEmail,
  sendAccountWarnedEmail,
  sendAccountBannedEmail,
} from "@/lib/email";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BanType = "none" | "post" | "chat" | "full";

export interface AdminOverviewStats {
  reportedListings: number;
  reportedRequests: number;
  reportedMessages: number;
  bannedUsers: number;
  pendingReports: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalListings: number;
  totalRequests: number;
  totalSold: number;
}

export type ActivityType =
  | "user_registered"
  | "listing_posted"
  | "request_posted"
  | "report_submitted"
  | "listing_sold"
  | "request_closed"
  | "request_fulfilled"
  | "listing_delisted"
  | "listing_restored"
  | "listing_takedown"
  | "request_takedown"
  | "user_banned"
  | "user_warned"
  | "message_deleted";

export interface ActivityItem {
  type: ActivityType;
  description: string;
  timestamp: string;
  /** Resolved navigation link, or null when the target no longer exists / isn't linkable. */
  href: string | null;
  /** When true, clicking should jump to the Reported Content tab (no URL). */
  jumpToReported: boolean;
}

export interface ReportsPerDay {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Short weekday label, e.g. "Mon" */
  label: string;
  count: number;
}

export interface ReportInfo {
  reason: string;
  details: string | null;
  created_at: string;
  reporterName: string | null;
}

export interface ReportedPost {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string | null;
  isDelisted: boolean;
  isTakenDown: boolean;
  thumbnail: string | null;
  reportCount: number;
  reports: ReportInfo[];
}

export interface ReportedMessage {
  reportId: string;
  messageId: string;
  content: string | null;
  senderName: string | null;
  senderAvatar: string | null;
  recipientName: string | null;
  recipientAvatar: string | null;
  messageCreatedAt: string | null;
  reason: string;
  details: string | null;
  reporterName: string | null;
  createdAt: string;
  status: string;
}

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_admin: boolean;
  ban_type: BanType;
  warning_count: number;
  created_at: string;
}

// ─── Guard ────────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) throw new Error("Not authorized");
  return { supabase, userId: user.id };
}

/** Look up the acting user's display name (for activity-log attribution). */
async function getActorName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase.from("users").select("full_name").eq("id", userId).single();
  return data?.full_name ?? null;
}

/** Non-throwing check for guarding pages / conditionally rendering UI. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  return !!data?.is_admin;
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const { supabase } = await requireAdmin();

  // Count distinct target_ids that still have at least one open (unresolved) report.
  const distinctCount = async (targetType: string) => {
    const { data } = await supabase.from("reports").select("target_id")
      .eq("target_type", targetType).eq("status", "open");
    return new Set((data ?? []).map((r) => r.target_id)).size;
  };

  const [reportedListings, reportedRequests, reportedMessages] = await Promise.all([
    distinctCount("listing"),
    distinctCount("request"),
    distinctCount("message"),
  ]);

  const { count: bannedUsers } = await supabase
    .from("users").select("id", { count: "exact", head: true }).neq("ban_type", "none");
  const { count: pendingReports } = await supabase
    .from("reports").select("id", { count: "exact", head: true }).eq("status", "open");

  return {
    reportedListings,
    reportedRequests,
    reportedMessages,
    bannedUsers: bannedUsers ?? 0,
    pendingReports: pendingReports ?? 0,
  };
}

// ─── Platform stats (totals) ──────────────────────────────────────────────────

export async function getPlatformStats(): Promise<PlatformStats> {
  const { supabase } = await requireAdmin();

  const headCount = async (table: string) => {
    const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
    return count ?? 0;
  };

  const [totalUsers, totalListings, totalRequests] = await Promise.all([
    headCount("users"),
    headCount("listings"),
    headCount("requests"),
  ]);

  const { count: totalSold } = await supabase
    .from("listings").select("id", { count: "exact", head: true }).eq("status", "sold");

  return { totalUsers, totalListings, totalRequests, totalSold: totalSold ?? 0 };
}

// ─── Recent activity feed ─────────────────────────────────────────────────────

type RawActivity = {
  type: ActivityType;
  description: string;
  timestamp: string;
  targetKind: "listing" | "request" | "user" | "report" | "message" | null;
  targetId: string | null;
};

function describeLogActivity(type: string, actorName: string | null, title: string | null): string {
  const who = actorName ?? "An admin";
  const t = title ?? "untitled";
  switch (type) {
    case "listing_sold": return `Listing "${t}" was marked as sold`;
    case "request_closed": return `Request "${t}" was closed`;
    case "request_fulfilled": return `Request "${t}" was fulfilled`;
    case "listing_delisted": return `Listing "${t}" was delisted by ${who}`;
    case "listing_restored": return `Listing "${t}" was restored by ${who}`;
    case "listing_takedown": return `Listing "${t}" was taken down by ${who}`;
    case "request_takedown": return `Request "${t}" was taken down by ${who}`;
    case "user_banned": return `${t} was banned by ${who}`;
    case "user_warned": return `${t} was warned by ${who}`;
    case "message_deleted": return `A message was deleted by ${who}`;
    default: return "Activity";
  }
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const { supabase } = await requireAdmin();

  // Creation events come straight from the base tables (reliable + historical);
  // action / status events come from the activity_log audit table.
  const [users, listings, requests, reports, logs] = await Promise.all([
    supabase.from("users").select("id, full_name, created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(12),
    supabase.from("listings").select("id, title, created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(12),
    supabase.from("requests").select("id, title, created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(12),
    supabase.from("reports").select("id, target_type, created_at").order("created_at", { ascending: false }).limit(12),
    supabase.from("activity_log").select("type, actor_name, target_type, target_id, target_title, created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const raw: RawActivity[] = [];

  for (const u of users.data ?? []) {
    raw.push({ type: "user_registered", description: `${u.full_name ?? "Someone"} registered`, timestamp: u.created_at, targetKind: "user", targetId: u.id });
  }
  for (const l of listings.data ?? []) {
    raw.push({ type: "listing_posted", description: `New listing "${l.title}"`, timestamp: l.created_at, targetKind: "listing", targetId: l.id });
  }
  for (const r of requests.data ?? []) {
    raw.push({ type: "request_posted", description: `New request "${r.title}"`, timestamp: r.created_at, targetKind: "request", targetId: r.id });
  }
  for (const rep of reports.data ?? []) {
    raw.push({ type: "report_submitted", description: `New report on a ${rep.target_type}`, timestamp: rep.created_at, targetKind: "report", targetId: rep.id });
  }
  for (const lg of logs.data ?? []) {
    raw.push({
      type: lg.type as ActivityType,
      description: describeLogActivity(lg.type, lg.actor_name, lg.target_title),
      timestamp: lg.created_at,
      targetKind: (lg.target_type ?? null) as RawActivity["targetKind"],
      targetId: lg.target_id ?? null,
    });
  }

  const top = raw
    .filter((i) => !!i.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  // Resolve which listing/request targets still exist → only link to live items.
  const listingIds = [...new Set(top.filter((i) => i.targetKind === "listing" && i.targetId).map((i) => i.targetId as string))];
  const requestIds = [...new Set(top.filter((i) => i.targetKind === "request" && i.targetId).map((i) => i.targetId as string))];
  const aliveListings = new Set<string>();
  const aliveRequests = new Set<string>();
  if (listingIds.length) {
    const { data } = await supabase.from("listings").select("id").in("id", listingIds).is("deleted_at", null);
    for (const r of data ?? []) aliveListings.add(r.id);
  }
  if (requestIds.length) {
    const { data } = await supabase.from("requests").select("id").in("id", requestIds).is("deleted_at", null);
    for (const r of data ?? []) aliveRequests.add(r.id);
  }

  return top.map((i) => {
    let href: string | null = null;
    let jumpToReported = false;
    if (i.targetKind === "report") {
      jumpToReported = true;
    } else if (i.targetKind === "user" && i.targetId) {
      href = `/profile/${i.targetId}`;
    } else if (i.targetKind === "listing" && i.targetId && aliveListings.has(i.targetId)) {
      href = `/listings/${i.targetId}`;
    } else if (i.targetKind === "request" && i.targetId && aliveRequests.has(i.targetId)) {
      href = `/requests/${i.targetId}`;
    }
    return { type: i.type, description: i.description, timestamp: i.timestamp, href, jumpToReported };
  });
}

// ─── Reports per day (last 7 days) ────────────────────────────────────────────

export async function getReportsPerDay(): Promise<ReportsPerDay[]> {
  const { supabase } = await requireAdmin();

  // 7-day window starting at midnight 6 days ago.
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const { data } = await supabase
    .from("reports")
    .select("created_at")
    .gte("created_at", start.toISOString());

  // Seed 7 day buckets.
  const days: ReportsPerDay[] = [];
  const keyOf = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = keyOf(d);
    buckets.set(key, 0);
    days.push({ date: key, label: d.toLocaleDateString("en-US", { weekday: "short" }), count: 0 });
  }

  for (const r of data ?? []) {
    const d = new Date(r.created_at);
    const key = keyOf(d);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return days.map((d) => ({ ...d, count: buckets.get(d.date) ?? 0 }));
}

// ─── Reported content ─────────────────────────────────────────────────────────

async function buildReportedPosts(
  targetType: "listing" | "request"
): Promise<ReportedPost[]> {
  const { supabase } = await requireAdmin();

  // Only surface items that still have at least one open (unresolved) report.
  const { data: reps } = await supabase
    .from("reports")
    .select("target_id, reason, details, created_at, status, reporter:users!reports_reporter_id_fkey(full_name)")
    .eq("target_type", targetType)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (!reps || reps.length === 0) return [];

  const ids = [...new Set(reps.map((r) => r.target_id))];

  const table = targetType === "listing" ? "listings" : "requests";
  const ownerFk = targetType === "listing"
    ? "seller:users!listings_seller_id_fkey(full_name)"
    : "requester:users!requests_requester_id_fkey(full_name)";
  const ownerCol = targetType === "listing" ? "seller_id" : "requester_id";
  const imageSel = targetType === "listing"
    ? "listing_images(image_url, is_cover)"
    : "request_images(image_url)";

  const { data: posts } = await supabase
    .from(table)
    .select(`id, title, ${ownerCol}, is_delisted, deleted_at, ${ownerFk}, ${imageSel}`)
    .in("id", ids);

  const byId = new Map((posts ?? []).map((p) => [p.id as string, p]));

  return ids.map((id) => {
    const post = byId.get(id) as Record<string, unknown> | undefined;
    const postReports = reps.filter((r) => r.target_id === id);
    const owner = post?.[targetType === "listing" ? "seller" : "requester"] as { full_name?: string } | null;
    const images = (post?.[targetType === "listing" ? "listing_images" : "request_images"] ?? []) as { image_url: string; is_cover?: boolean }[];
    const thumb = images.find((i) => i.is_cover)?.image_url ?? images[0]?.image_url ?? null;

    return {
      id,
      title: (post?.title as string) ?? "(deleted)",
      ownerId: (post?.[ownerCol] as string) ?? "",
      ownerName: owner?.full_name ?? null,
      isDelisted: !!post?.is_delisted,
      isTakenDown: !!post?.deleted_at || !post,
      thumbnail: thumb,
      reportCount: postReports.length,
      reports: postReports.map((r) => ({
        reason: r.reason,
        details: r.details,
        created_at: r.created_at,
        reporterName: (r.reporter as { full_name?: string } | null)?.full_name ?? null,
      })),
    };
  });
}

export async function getReportedListings(): Promise<ReportedPost[]> {
  return buildReportedPosts("listing");
}

export async function getReportedRequests(): Promise<ReportedPost[]> {
  return buildReportedPosts("request");
}

export async function getReportedMessages(): Promise<ReportedMessage[]> {
  const { supabase } = await requireAdmin();

  const { data: reps } = await supabase
    .from("reports")
    .select(`
      id, target_id, reason, details, status, created_at,
      message_content, message_created_at,
      reporter:users!reports_reporter_id_fkey(full_name),
      sender:users!reports_message_sender_id_fkey(full_name, avatar_url),
      recipient:users!reports_message_recipient_id_fkey(full_name, avatar_url)
    `)
    .eq("target_type", "message")
    .order("created_at", { ascending: false });

  return (reps ?? []).map((r) => ({
    reportId: r.id,
    messageId: r.target_id,
    content: r.message_content,
    senderName: (r.sender as { full_name?: string; avatar_url?: string } | null)?.full_name ?? null,
    senderAvatar: (r.sender as { full_name?: string; avatar_url?: string } | null)?.avatar_url ?? null,
    recipientName: (r.recipient as { full_name?: string; avatar_url?: string } | null)?.full_name ?? null,
    recipientAvatar: (r.recipient as { full_name?: string; avatar_url?: string } | null)?.avatar_url ?? null,
    messageCreatedAt: r.message_created_at,
    reason: r.reason,
    details: r.details,
    reporterName: (r.reporter as { full_name?: string } | null)?.full_name ?? null,
    createdAt: r.created_at,
    status: r.status,
  }));
}

// ─── Content controls (delist / restore / takedown) ──────────────────────────

async function notifyOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  type: "post_delisted" | "post_restored" | "post_takedown",
  title: string,
  body: string,
  refId: string,
  refTable: string
) {
  await supabase.from("notifications").insert({
    user_id: ownerId, type, title, body, reference_id: refId, reference_table: refTable,
  });
}

async function setPostDelisted(
  targetType: "listing" | "request",
  id: string,
  delisted: boolean
) {
  const { supabase, userId } = await requireAdmin();
  const table = targetType === "listing" ? "listings" : "requests";
  const ownerCol = targetType === "listing" ? "seller_id" : "requester_id";

  const { data: post } = await supabase
    .from(table).select(`title, ${ownerCol}`).eq("id", id).single();
  if (!post) throw new Error("Post not found");
  const ownerId = (post as Record<string, unknown>)[ownerCol] as string;
  const title = (post as Record<string, unknown>).title as string;

  const { error } = await supabase
    .from(table)
    .update({ is_delisted: delisted, delisted_at: delisted ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(`Failed to ${delisted ? "delist" : "restore"}: ${error.message}`);

  // Mark reports reviewed / dismissed
  await supabase.from("reports")
    .update({ status: delisted ? "reviewed" : "dismissed" })
    .eq("target_type", targetType).eq("target_id", id);

  // Notify owner (in-app + email)
  if (delisted) {
    await notifyOwner(supabase, ownerId, "post_delisted",
      `Your ${targetType} was removed`,
      `Your ${targetType} "${title}" has been delisted by an admin and is hidden from other users.`,
      id, table);
  } else {
    await notifyOwner(supabase, ownerId, "post_restored",
      `Your ${targetType} is live again`,
      `Your ${targetType} "${title}" has been restored and is visible again.`,
      id, table);
  }

  const { data: owner } = await supabase
    .from("users").select("email, first_name").eq("id", ownerId).single();
  if (owner?.email) {
    try {
      if (delisted) {
        await sendPostDelistedEmail({ toEmail: owner.email, firstName: owner.first_name ?? "there", postType: targetType, postTitle: title, reason: null });
      } else {
        await sendPostRestoredEmail({ toEmail: owner.email, firstName: owner.first_name ?? "there", postType: targetType, postTitle: title });
      }
    } catch (err) { console.error("[admin] delist/restore email error:", err); }
  }

  // Audit (listings only — the activity feed tracks listing delist/restore)
  if (targetType === "listing") {
    await logActivity({
      type: delisted ? "listing_delisted" : "listing_restored",
      actorId: userId,
      actorName: await getActorName(supabase, userId),
      targetType: "listing",
      targetId: id,
      targetTitle: title,
    });
  }
}

export async function adminDelistListing(id: string) { return setPostDelisted("listing", id, true); }
export async function adminRestoreListing(id: string) { return setPostDelisted("listing", id, false); }
export async function adminDelistRequest(id: string) { return setPostDelisted("request", id, true); }
export async function adminRestoreRequest(id: string) { return setPostDelisted("request", id, false); }

/** Dismiss all reports for a post without changing its listing status.
 *  Marks every open report as 'dismissed' so the item disappears from the
 *  queue and the report counts reset to zero. */
export async function adminDismissReports(
  targetType: "listing" | "request",
  targetId: string
): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("reports")
    .update({ status: "dismissed" })
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "open");
  if (error) throw new Error(`Failed to dismiss reports: ${error.message}`);
}

/** Dismiss all reports for a specific message (report stays, message untouched). */
export async function adminDismissMessageReport(reportId: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("reports")
    .update({ status: "dismissed" })
    .eq("id", reportId);
  if (error) throw new Error(`Failed to dismiss message report: ${error.message}`);
}

/** Soft-delete a reported message (sets deleted_at) and dismiss its report. */
export async function adminDeleteMessage(reportId: string, messageId: string): Promise<void> {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);
  if (error) throw new Error(`Failed to delete message: ${error.message}`);
  await supabase.from("reports").update({ status: "actioned" }).eq("id", reportId);

  // Audit
  await logActivity({
    type: "message_deleted",
    actorId: userId,
    actorName: await getActorName(supabase, userId),
    targetType: "message",
    targetId: messageId,
    targetTitle: null,
  });
}

async function takedownPost(
  targetType: "listing" | "request",
  id: string,
  reason: string
) {
  const { supabase, userId } = await requireAdmin();
  if (!reason || !reason.trim()) throw new Error("A takedown reason is required.");
  const cleanReason = reason.trim().slice(0, 300);

  const table = targetType === "listing" ? "listings" : "requests";
  const ownerCol = targetType === "listing" ? "seller_id" : "requester_id";

  const { data: post } = await supabase
    .from(table).select(`title, ${ownerCol}`).eq("id", id).single();
  if (!post) throw new Error("Post not found");
  const ownerId = (post as Record<string, unknown>)[ownerCol] as string;
  const title = (post as Record<string, unknown>).title as string;

  // Permanent removal: deleted_at set (gone everywhere, including owner profile)
  const update: Record<string, unknown> = {
    deleted_at: new Date().toISOString(),
    takedown_reason: cleanReason,
    is_delisted: true,
  };
  if (targetType === "listing") update.status = "deleted";
  const { error } = await supabase.from(table).update(update).eq("id", id);
  if (error) throw new Error(`Failed to take down: ${error.message}`);

  await supabase.from("reports")
    .update({ status: "actioned" })
    .eq("target_type", targetType).eq("target_id", id);

  await notifyOwner(supabase, ownerId, "post_takedown",
    `Your ${targetType} was permanently removed`,
    `Your ${targetType} "${title}" was permanently taken down. Reason: ${cleanReason}`,
    id, table);

  const { data: owner } = await supabase
    .from("users").select("email, first_name").eq("id", ownerId).single();
  if (owner?.email) {
    try {
      await sendPostTakedownEmail({ toEmail: owner.email, firstName: owner.first_name ?? "there", postType: targetType, postTitle: title, reason: cleanReason });
    } catch (err) { console.error("[admin] takedown email error:", err); }
  }

  // Audit
  await logActivity({
    type: targetType === "listing" ? "listing_takedown" : "request_takedown",
    actorId: userId,
    actorName: await getActorName(supabase, userId),
    targetType,
    targetId: id,
    targetTitle: title,
  });
}

export async function adminTakedownListing(id: string, reason: string) { return takedownPost("listing", id, reason); }
export async function adminTakedownRequest(id: string, reason: string) { return takedownPost("request", id, reason); }

// ─── User management ──────────────────────────────────────────────────────────

export async function searchAdminUsers(query: string): Promise<AdminUserRow[]> {
  const { supabase } = await requireAdmin();
  let q = supabase
    .from("users")
    .select("id, full_name, email, avatar_url, role, is_admin, ban_type, warning_count, created_at")
    .is("deleted_at", null)
    .order("full_name", { ascending: true })
    .limit(200);
  if (query.trim()) {
    q = q.or(`full_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`);
  }
  const { data } = await q;
  return (data ?? []) as AdminUserRow[];
}

async function requireNonAdminTarget(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetId: string
) {
  const { data } = await supabase.from("users").select("is_admin, email, first_name, full_name").eq("id", targetId).single();
  if (!data) throw new Error("User not found");
  if (data.is_admin) throw new Error("You cannot perform this action on another admin.");
  return data;
}

export async function warnUser(targetId: string, reason: string) {
  const { supabase, userId } = await requireAdmin();
  if (!reason?.trim()) throw new Error("A reason is required.");
  const cleanReason = reason.trim().slice(0, 300);
  const target = await requireNonAdminTarget(supabase, targetId);

  const { data: cur } = await supabase.from("users").select("warning_count").eq("id", targetId).single();
  await supabase.from("users").update({ warning_count: (cur?.warning_count ?? 0) + 1 }).eq("id", targetId);

  await supabase.from("notifications").insert({
    user_id: targetId, type: "account_warned",
    title: "You've received a warning",
    body: `An admin issued a warning on your account. Reason: ${cleanReason}`,
  });

  if (target.email) {
    try {
      await sendAccountWarnedEmail({ toEmail: target.email, firstName: target.first_name ?? "there", reason: cleanReason });
    } catch (err) { console.error("[admin] warn email error:", err); }
  }

  // Audit
  await logActivity({
    type: "user_warned",
    actorId: userId,
    actorName: await getActorName(supabase, userId),
    targetType: "user",
    targetId,
    targetTitle: target.full_name ?? null,
  });
}

export async function banUser(targetId: string, banType: Exclude<BanType, "none">, reason: string) {
  const { supabase, userId } = await requireAdmin();
  if (!reason?.trim()) throw new Error("A reason is required.");
  if (!["post", "chat", "full"].includes(banType)) throw new Error("Invalid ban type.");
  const cleanReason = reason.trim().slice(0, 300);
  const target = await requireNonAdminTarget(supabase, targetId);

  const { error } = await supabase.from("users").update({
    ban_type: banType, banned_at: new Date().toISOString(), ban_reason: cleanReason,
  }).eq("id", targetId);
  if (error) throw new Error(`Failed to ban user: ${error.message}`);

  const scope = banType === "full" ? "posting and messaging" : banType === "post" ? "posting listings and requests" : "sending messages";
  await supabase.from("notifications").insert({
    user_id: targetId, type: "account_banned",
    title: "Your account has been restricted",
    body: `You are now banned from ${scope}. Reason: ${cleanReason}`,
  });

  if (target.email) {
    try {
      await sendAccountBannedEmail({ toEmail: target.email, firstName: target.first_name ?? "there", banType, reason: cleanReason });
    } catch (err) { console.error("[admin] ban email error:", err); }
  }

  // Audit
  await logActivity({
    type: "user_banned",
    actorId: userId,
    actorName: await getActorName(supabase, userId),
    targetType: "user",
    targetId,
    targetTitle: target.full_name ?? null,
  });
}

export async function unbanUser(targetId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("users").update({
    ban_type: "none", banned_at: null, ban_reason: null,
  }).eq("id", targetId);
  if (error) throw new Error(`Failed to lift ban: ${error.message}`);
}

export async function promoteToAdmin(targetId: string) {
  const { supabase } = await requireAdmin();
  const { data: target } = await supabase.from("users").select("is_admin").eq("id", targetId).single();
  if (!target) throw new Error("User not found");
  if (target.is_admin) throw new Error("This user is already an admin.");
  const { error } = await supabase.from("users").update({ is_admin: true }).eq("id", targetId);
  if (error) throw new Error(`Failed to promote: ${error.message}`);
}

export async function demoteSelf() {
  const { supabase, userId } = await requireAdmin();
  // Only ever demotes the caller — admins cannot demote other admins.
  const { error } = await supabase.from("users").update({ is_admin: false }).eq("id", userId);
  if (error) throw new Error(`Failed to step down: ${error.message}`);
}
