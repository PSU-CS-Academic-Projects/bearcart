"use server";

import { createClient } from "@/lib/supabase-server";
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
  openReports: number;
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
  recipientName: string | null;
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

  const distinctCount = async (targetType: string) => {
    const { data } = await supabase.from("reports").select("target_id").eq("target_type", targetType);
    return new Set((data ?? []).map((r) => r.target_id)).size;
  };

  const [reportedListings, reportedRequests, reportedMessages] = await Promise.all([
    distinctCount("listing"),
    distinctCount("request"),
    distinctCount("message"),
  ]);

  const { count: bannedUsers } = await supabase
    .from("users").select("id", { count: "exact", head: true }).neq("ban_type", "none");
  const { count: openReports } = await supabase
    .from("reports").select("id", { count: "exact", head: true }).eq("status", "open");

  return {
    reportedListings,
    reportedRequests,
    reportedMessages,
    bannedUsers: bannedUsers ?? 0,
    openReports: openReports ?? 0,
  };
}

// ─── Reported content ─────────────────────────────────────────────────────────

async function buildReportedPosts(
  targetType: "listing" | "request"
): Promise<ReportedPost[]> {
  const { supabase } = await requireAdmin();

  const { data: reps } = await supabase
    .from("reports")
    .select("target_id, reason, details, created_at, reporter:users!reports_reporter_id_fkey(full_name)")
    .eq("target_type", targetType)
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
      sender:users!reports_message_sender_id_fkey(full_name),
      recipient:users!reports_message_recipient_id_fkey(full_name)
    `)
    .eq("target_type", "message")
    .order("created_at", { ascending: false });

  return (reps ?? []).map((r) => ({
    reportId: r.id,
    messageId: r.target_id,
    content: r.message_content,
    senderName: (r.sender as { full_name?: string } | null)?.full_name ?? null,
    recipientName: (r.recipient as { full_name?: string } | null)?.full_name ?? null,
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
  const { supabase } = await requireAdmin();
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
}

export async function adminDelistListing(id: string) { return setPostDelisted("listing", id, true); }
export async function adminRestoreListing(id: string) { return setPostDelisted("listing", id, false); }
export async function adminDelistRequest(id: string) { return setPostDelisted("request", id, true); }
export async function adminRestoreRequest(id: string) { return setPostDelisted("request", id, false); }

async function takedownPost(
  targetType: "listing" | "request",
  id: string,
  reason: string
) {
  const { supabase } = await requireAdmin();
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
    .order("created_at", { ascending: false })
    .limit(40);
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
  const { supabase } = await requireAdmin();
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
}

export async function banUser(targetId: string, banType: Exclude<BanType, "none">, reason: string) {
  const { supabase } = await requireAdmin();
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
