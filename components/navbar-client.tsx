"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MagnifyingGlass,
  List,
  ShoppingCart,
  User as UserIcon,
  SignOut,
  ChatCircle,
  ListBullets,
  Plus,
  Bell,
} from "@phosphor-icons/react";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { NavbarUser } from "@/components/navbar";
import { NotificationsBell } from "@/components/notifications-bell";
import type { NotificationRow } from "@/lib/actions/notifications";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All Categories",
  "Books",
  "Electronics",
  "Clothing",
  "Food",
  "Supplies",
  "Services",
  "Others",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(user: NavbarUser): string {
  const first = user.first_name?.charAt(0) ?? "";
  const last = user.last_name?.charAt(0) ?? "";
  if (first || last) return (first + last).toUpperCase();
  return user.full_name?.charAt(0)?.toUpperCase() ?? "?";
}

function formatUnreadCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

// ─── Messages Icon ────────────────────────────────────────────────────────────

function MessagesIcon({ count }: { count: number }) {
  return (
    <Link
      href="/messages"
      className="relative flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-accent"
      aria-label={`Messages${count > 0 ? ` (${count} unread)` : ""}`}
    >
      <ChatCircle className="size-5 text-foreground" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[18px] text-white">
          {formatUnreadCount(count)}
        </span>
      )}
    </Link>
  );
}

// ─── Avatar Button ────────────────────────────────────────────────────────────

function AvatarImage({ user }: { user: NavbarUser }) {
  if (user.avatar_url) {
    return (
      <Image
        src={user.avatar_url}
        alt={user.full_name}
        width={32}
        height={32}
        className="size-8 rounded-full object-cover ring-2 ring-primary/30"
      />
    );
  }
  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      {getInitials(user)}
    </span>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────

function ProfileDropdown({ user }: { user: NavbarUser }) {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Profile menu"
        >
          <AvatarImage user={user} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info header — non-clickable */}
        <DropdownMenuLabel className="flex flex-col gap-0.5 pb-2">
          <span className="text-sm font-semibold leading-tight">{user.full_name}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex cursor-pointer items-center gap-2">
            <UserIcon className="size-4" />
            My Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex cursor-pointer items-center gap-2">
            <ListBullets className="size-4" />
            My Listings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/listings/new" className="flex cursor-pointer items-center gap-2">
            <Plus className="size-4" />
            Post a Listing
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
        >
          <SignOut className="size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

interface NavbarClientProps {
  user: NavbarUser | null;
  initialUnreadCount: number;
  initialNotificationCount: number;
  initialNotifications: NotificationRow[];
}

export function NavbarClient({
  user,
  initialUnreadCount,
  initialNotificationCount,
  initialNotifications,
}: NavbarClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifCount, setNotifCount] = useState(initialNotificationCount);

  // ── Realtime: notifications INSERT/UPDATE → keep mobile bell badge live ─
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`navbar-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => setNotifCount((c) => c + 1)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const { count } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);
          setNotifCount(count ?? 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ── Recompute unread message count from current conversations ─────────
  const refetchUnreadCount = useCallback(async (userId: string) => {
    try {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (!convos || convos.length === 0) {
        setUnreadCount(0);
        return;
      }

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convos.map((c) => c.id))
        .neq("sender_id", userId)
        .eq("is_read", false);

      setUnreadCount(count ?? 0);
    } catch {
      // Silently fail — unread count is non-critical
    }
  }, []);

  // ── Realtime: messages INSERT/UPDATE → keep message badge in sync ────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`navbar-messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as { sender_id: string; is_read: boolean };
          // Only count messages from someone else as unread
          if (msg.sender_id !== user.id && msg.is_read === false) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => {
          // is_read flipping → recompute the count from server
          refetchUnreadCount(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchUnreadCount]);

  // ── Listen for in-app "messages-read" event from chat-window ─────────
  useEffect(() => {
    if (!user) return;
    const handler = () => refetchUnreadCount(user.id);
    window.addEventListener("palmart:messages-read", handler);
    return () => window.removeEventListener("palmart:messages-read", handler);
  }, [user, refetchUnreadCount]);

  // ── Search submit ──────────────────────────────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategory && selectedCategory !== "All Categories") {
      params.set("category", selectedCategory);
    }
    router.push(`/listings?${params.toString()}`);
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">

        {/* ── Logo ──────────────────────────────────────────────────── */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/bearcart.svg" alt="BearCart logo" width={48} height={48} className="size-12" />
          <span className="text-xl font-bold text-foreground">BearCart</span>
        </Link>

        {/* ── Desktop Search ────────────────────────────────────────── */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden min-w-0 flex-1 items-center justify-center gap-2 px-8 md:flex"
        >
          <div className="flex w-full max-w-xl min-w-0 items-center rounded-lg border bg-background">
            <div className="flex items-center border-r px-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 w-36 shrink-0 border-0 bg-transparent shadow-none focus:ring-0">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
              <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </form>

        {/* ── Desktop Right ─────────────────────────────────────────── */}
        <div className="relative z-10 hidden shrink-0 items-center gap-2 md:flex">
          {user ? (
            <>
              {/* Post a Listing */}
              <Button size="sm" asChild>
                <Link href="/listings/new">
                  <Plus className="size-4" />
                  Post a Listing
                </Link>
              </Button>

              {/* Messages with unread badge */}
              <MessagesIcon count={unreadCount} />

              {/* Notifications bell with unread badge */}
              <NotificationsBell
                userId={user.id}
                initialUnreadCount={initialNotificationCount}
                initialNotifications={initialNotifications}
              />

              {/* Profile avatar dropdown */}
              <ProfileDropdown user={user} />
            </>
          ) : (
            <Button size="sm" onClick={signInWithGoogle}>
              <UserIcon className="size-4" />
              Login with Google
            </Button>
          )}
        </div>

        {/* ── Mobile Menu Trigger ───────────────────────────────────── */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="relative">
              <List className="size-5" />
              {/* Unread dot on hamburger when logged in */}
              {user && unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
              )}
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" weight="fill" />
                PalMart
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 flex flex-col gap-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3">
                  <MagnifyingGlass className="size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </form>

              <div className="h-px bg-border" />

              {/* Mobile Auth Section */}
              {user ? (
                <>
                  {/* User info card */}
                  <div className="flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.full_name}
                          fill
                          className="object-cover ring-2 ring-primary/30"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
                          {getInitials(user)}
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold">{user.full_name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <ChatCircle className="size-4" />
                      Messages
                    </span>
                    {unreadCount > 0 && (
                      <span className="flex min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-5 text-white">
                        {formatUnreadCount(unreadCount)}
                      </span>
                    )}
                  </Link>

                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <Bell className="size-4" />
                      Notifications
                    </span>
                    {notifCount > 0 && (
                      <span className="flex min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-5 text-white">
                        {formatUnreadCount(notifCount)}
                      </span>
                    )}
                  </Link>

                  {/* My Profile */}
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <UserIcon className="size-4" />
                    My Profile
                  </Link>

                  {/* Post a Listing */}
                  <Link
                    href="/listings/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <Plus className="size-4" />
                    Post a Listing
                  </Link>

                  <div className="h-px bg-border" />

                  {/* Sign Out */}
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={handleSignOut}
                  >
                    <SignOut className="size-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    signInWithGoogle();
                    setMobileMenuOpen(false);
                  }}
                >
                  <UserIcon className="size-4" />
                  Login with Google
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
