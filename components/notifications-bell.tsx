"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  ChatCircle,
  BookmarkSimple,
  Star,
  X,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { formatTimeAgo } from "@/lib/listing-helpers";
import {
  getRecentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteReadNotifications,
  type NotificationRow,
  type NotificationType,
} from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBadgeCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

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

// ─── Notification Item ────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onClick,
  onDelete,
}: {
  notification: NotificationRow;
  onClick: (n: NotificationRow) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = getNotificationIcon(notification.type);
  const isUnread = !notification.is_read;

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onClick(notification)}
        className={cn(
          "flex w-full gap-3 border-l px-3 py-3 pr-8 text-left transition-colors hover:bg-accent/50",
          isUnread
            ? "border-l-primary bg-amber-tint/40"
            : "border-l-transparent"
        )}
      >
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p
            className={cn(
              "truncate text-sm leading-tight",
              isUnread ? "font-semibold text-foreground" : "font-normal text-foreground"
            )}
          >
            {notification.title}
          </p>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {notification.body}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {formatTimeAgo(notification.created_at)}
          </span>
        </div>
      </button>
      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        aria-label="Delete notification"
        className="absolute right-2 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100"
      >
        <X className="size-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

// ─── Main Bell Component ──────────────────────────────────────────────────────

interface NotificationsBellProps {
  userId: string;
  initialUnreadCount: number;
  initialNotifications: NotificationRow[];
}

export function NotificationsBell({
  userId,
  initialUnreadCount,
  initialNotifications,
}: NotificationsBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] =
    useState<NotificationRow[]>(initialNotifications);

  // ── Refresh helper ────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const fresh = await getRecentNotifications(10);
    setNotifications(fresh);
    setUnreadCount(fresh.filter((n) => !n.is_read).length);
  }, []);

  // ── Realtime subscription ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationRow;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  // ── Item click ────────────────────────────────────────────────────────
  const handleItemClick = async (n: NotificationRow) => {
    setOpen(false);
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((p) => (p.id === n.id ? { ...p, is_read: true } : p))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(n.id).catch(() => {});
    }
    router.push(getNotificationHref(n));
  };

  // ── Delete single ────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    deleteNotification(id).catch(() => {
      // Re-insert on failure
      refresh();
    });
  };

  // ── Mark all as read ──────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  };

  // ── Clear read ────────────────────────────────────────────────────────
  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    await deleteReadNotifications();
  };

  const hasRead = notifications.some((n) => n.is_read);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="size-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[18px] text-white">
              {formatBadgeCount(unreadCount)}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 sm:w-96"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          <div className="flex items-center gap-3">
            {hasRead && (
              <button
                type="button"
                onClick={handleClearRead}
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear read
              </button>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <Bell className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={handleItemClick}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block py-1 text-center text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
