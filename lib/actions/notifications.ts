"use server";

import { createClient } from "@/lib/supabase-server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_message"
  | "offer_received"
  | "offer_accepted"
  | "offer_declined"
  | "listing_saved"
  | "review_received"
  | "request_match"
  | "report_update"
  | "post_delisted"
  | "post_restored"
  | "post_takedown"
  | "account_warned"
  | "account_banned"
  | "new_report";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  reference_id: string | null;
  reference_table: string | null;
  created_at: string;
}

// ─── GET RECENT NOTIFICATIONS (for bell dropdown) ────────────────────────────

export async function getRecentNotifications(limit = 10): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as NotificationRow[];
}

// ─── GET ALL NOTIFICATIONS (paginated, for /notifications page) ──────────────

export interface PaginatedNotifications {
  notifications: NotificationRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getAllNotifications(
  page = 1,
  pageSize = 20,
  filter: "all" | "unread" = "all"
): Promise<PaginatedNotifications> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { notifications: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  if (filter === "unread") {
    query = query.eq("is_read", false);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return { notifications: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const total = count ?? 0;
  return {
    notifications: (data ?? []) as NotificationRow[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ─── UNREAD COUNT ─────────────────────────────────────────────────────────────

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}

// ─── MARK SINGLE AS READ ──────────────────────────────────────────────────────

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);
}

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_read", false);
}

// ─── DELETE SINGLE NOTIFICATION ──────────────────────────────────────────────

export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);
}

// ─── DELETE ALL READ NOTIFICATIONS ───────────────────────────────────────────

export async function deleteReadNotifications(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id)
    .eq("is_read", true);
}
