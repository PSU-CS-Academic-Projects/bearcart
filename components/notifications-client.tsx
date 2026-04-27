"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Bell,
  ChatCircle,
  BookmarkSimple,
  Star,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { formatTimeAgo } from "@/lib/listing-helpers";
import {
  getAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
  type NotificationType,
  type PaginatedNotifications,
} from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "new_message":
      return ChatCircle;
    case "listing_saved":
      return BookmarkSimple;
    case "review_received":
      return Star;
    default:
      return Bell;
  }
}

function getNotificationHref(n: NotificationRow): string {
  switch (n.type) {
    case "new_message":
      return n.reference_id
        ? `/messages?conversation=${n.reference_id}`
        : "/messages";
    case "listing_saved":
      return n.reference_id ? `/listings/${n.reference_id}` : "/listings";
    case "review_received":
      return "/profile";
    default:
      return "/notifications";
  }
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRowItem({
  notification,
  onClick,
}: {
  notification: NotificationRow;
  onClick: (n: NotificationRow) => void;
}) {
  const Icon = getNotificationIcon(notification.type);
  const isUnread = !notification.is_read;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={cn(
        "flex w-full items-start gap-4 border-l-2 rounded-md px-4 py-4 text-left transition-colors hover:bg-accent/50",
        isUnread
          ? "border-l-primary bg-amber-tint/30"
          : "border-l-transparent bg-card"
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-sm leading-snug",
              isUnread ? "font-semibold text-foreground" : "font-normal text-foreground"
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatTimeAgo(notification.created_at)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {notification.body}
        </p>
      </div>
    </button>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

interface NotificationsClientProps {
  userId: string;
  initialPage: number;
  initialFilter: "all" | "unread";
  initialData: PaginatedNotifications;
}

export function NotificationsClient({
  userId,
  initialPage,
  initialFilter,
  initialData,
}: NotificationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<"all" | "unread">(initialFilter);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<PaginatedNotifications>(initialData);
  const [loading, setLoading] = useState(false);

  // ── Load helper ───────────────────────────────────────────────────────
  const load = useCallback(
    async (newPage: number, newFilter: "all" | "unread") => {
      setLoading(true);
      try {
        const result = await getAllNotifications(newPage, 20, newFilter);
        setData(result);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ── Sync URL on filter/page change ────────────────────────────────────
  const updateUrl = useCallback(
    (newPage: number, newFilter: "all" | "unread") => {
      const params = new URLSearchParams(searchParams.toString());
      if (newFilter !== "all") params.set("filter", newFilter);
      else params.delete("filter");
      if (newPage > 1) params.set("page", String(newPage));
      else params.delete("page");
      router.replace(
        `/notifications${params.toString() ? `?${params.toString()}` : ""}`,
        { scroll: false }
      );
    },
    [router, searchParams]
  );

  // ── Realtime subscription: refresh on insert/update ───────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-page:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          load(page, filter);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, page, filter, load]);

  // ── Filter change ─────────────────────────────────────────────────────
  const handleFilterChange = (newFilter: string) => {
    const f = (newFilter === "unread" ? "unread" : "all") as "all" | "unread";
    setFilter(f);
    setPage(1);
    updateUrl(1, f);
    load(1, f);
  };

  // ── Page change ───────────────────────────────────────────────────────
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > data.totalPages) return;
    setPage(newPage);
    updateUrl(newPage, filter);
    load(newPage, filter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Item click ────────────────────────────────────────────────────────
  const handleItemClick = async (n: NotificationRow) => {
    if (!n.is_read) {
      // Optimistic
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((p) =>
          p.id === n.id ? { ...p, is_read: true } : p
        ),
      }));
      markNotificationRead(n.id).catch(() => {});
    }
    router.push(getNotificationHref(n));
  };

  // ── Mark all as read ──────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
    }));
    await markAllNotificationsRead();
    // If currently on unread tab, refresh to clear list
    if (filter === "unread") load(1, "unread");
  };

  const hasUnread = data.notifications.some((n) => !n.is_read);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {data.total} {data.total === 1 ? "notification" : "notifications"}
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* ── Filter Tabs ────────────────────────────────────────────────── */}
      <Tabs value={filter} onValueChange={handleFilterChange} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card">
        {data.notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <Bell className="size-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {data.notifications.map((n) => (
              <NotificationRowItem
                key={n.id}
                notification={n}
                onClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
            >
              <CaretLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= data.totalPages || loading}
            >
              Next
              <CaretRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
