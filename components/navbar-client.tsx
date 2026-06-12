"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  ShieldCheck,
} from "@phosphor-icons/react";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { NavbarUser } from "@/components/navbar";
import { NotificationsBell } from "@/components/notifications-bell";
import type { NotificationRow } from "@/lib/actions/notifications";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchMode = "items" | "people";

interface PersonResult {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  postCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(user: { full_name: string; first_name?: string | null; last_name?: string | null }): string {
  const first = user.first_name?.charAt(0) ?? "";
  const last = user.last_name?.charAt(0) ?? "";
  if (first || last) return (first + last).toUpperCase();
  return user.full_name?.charAt(0)?.toUpperCase() ?? "?";
}

function formatUnreadCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

// ─── People Dropdown ──────────────────────────────────────────────────────────

function PeopleDropdownContent({
  results,
  loading,
  onSelect,
}: {
  results: PersonResult[];
  loading: boolean;
  onSelect: () => void;
}) {
  if (loading) {
    return <p className="px-4 py-3 text-sm text-muted-foreground">Searching...</p>;
  }
  if (results.length === 0) {
    return <p className="px-4 py-3 text-sm text-muted-foreground">No users found</p>;
  }
  return (
    <>
      {results.map((person) => (
        <Link
          key={person.id}
          href={`/profile/${person.id}`}
          onClick={onSelect}
          className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            {person.avatar_url ? (
              <Image
                src={person.avatar_url}
                alt={person.full_name}
                width={32}
                height={32}
                unoptimized
                className="size-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {getInitials(person)}
              </span>
            )}
            <span className="text-sm font-medium text-foreground">{person.full_name}</span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {person.postCount} {person.postCount === 1 ? "post" : "posts"}
          </span>
        </Link>
      ))}
    </>
  );
}

// ─── Mode Toggle ──────────────────────────────────────────────────────────────

function ModeToggle({ mode, onToggle }: { mode: SearchMode; onToggle: (m: SearchMode) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 border-r pr-2.5 mr-0">
      <button
        type="button"
        onClick={() => onToggle("items")}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          mode === "items"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Items
      </button>
      <button
        type="button"
        onClick={() => onToggle("people")}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          mode === "people"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        People
      </button>
    </div>
  );
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

// ─── Avatar Image ─────────────────────────────────────────────────────────────

function AvatarImage({ user }: { user: NavbarUser }) {
  if (user.avatar_url) {
    return (
      <Image
        src={user.avatar_url}
        alt={user.full_name}
        width={32}
        height={32}
        unoptimized
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
          <Link href="/post" className="flex cursor-pointer items-center gap-2">
            <Plus className="size-4" />
            Create a Post
          </Link>
        </DropdownMenuItem>

        {user.is_admin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex cursor-pointer items-center gap-2 font-medium text-primary">
                <ShieldCheck className="size-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={async () => await signOut()}
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Items search state ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── People search state ────────────────────────────────────────────────
  const [searchMode, setSearchMode] = useState<SearchMode>("items");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleResults, setPeopleResults] = useState<PersonResult[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);

  // ── Other state ────────────────────────────────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifCount, setNotifCount] = useState(initialNotificationCount);

  const desktopSearchRef = useRef<HTMLDivElement>(null);

  // ── People search: debounced Supabase query ────────────────────────────
  useEffect(() => {
    if (searchMode !== "people" || peopleQuery.length < 2) {
      setPeopleResults([]);
      setShowPeopleDropdown(false);
      setPeopleLoading(false);
      return;
    }

    setPeopleLoading(true);
    const timer = setTimeout(async () => {
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, first_name, last_name, avatar_url")
        .ilike("full_name", `%${peopleQuery}%`)
        .is("deleted_at", null)
        .limit(6);

      if (!users || users.length === 0) {
        setPeopleResults([]);
        setShowPeopleDropdown(true);
        setPeopleLoading(false);
        return;
      }

      const ids = users.map((u) => u.id);
      const { data: listings } = await supabase
        .from("listings")
        .select("seller_id")
        .in("seller_id", ids)
        .is("deleted_at", null);

      const countMap: Record<string, number> = {};
      for (const l of listings ?? []) {
        countMap[l.seller_id] = (countMap[l.seller_id] ?? 0) + 1;
      }

      setPeopleResults(users.map((u) => ({ ...u, postCount: countMap[u.id] ?? 0 })));
      setShowPeopleDropdown(true);
      setPeopleLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [peopleQuery, searchMode]);

  // ── Close people dropdown on outside click (desktop) ──────────────────
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setShowPeopleDropdown(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // ── Realtime: notifications ────────────────────────────────────────────
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`navbar-notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => setNotifCount((c) => c + 1))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        async () => {
          const { count } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_read", false);
          setNotifCount(count ?? 0);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // ── Recompute unread conversation count ─────────────────────────────────
  // Counts distinct conversations with at least one unread message from the other person,
  // not raw message count — so 5 unread msgs in 1 conversation shows badge "1".
  const refetchUnreadCount = useCallback(async (userId: string) => {
    try {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      if (!convos || convos.length === 0) { setUnreadCount(0); return; }
      const { data } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convos.map((c) => c.id))
        .neq("sender_id", userId)
        .eq("is_read", false);
      setUnreadCount(new Set((data ?? []).map((m) => m.conversation_id)).size);
    } catch { /* non-critical */ }
  }, []);

  // ── Realtime: messages ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`navbar-messages:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as { sender_id: string; is_read: boolean; conversation_id: string };
          if (msg.sender_id === userId || msg.is_read) return;
          // Only bump the badge if this is the first unread in this conversation.
          // If there are already other unreads in the same convo, the conversation
          // was already counted — incrementing again would over-count.
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", msg.conversation_id)
            .neq("sender_id", userId)
            .eq("is_read", false);
          // count includes the new message itself; if it's exactly 1 this convo
          // just went from 0 → 1 unread, so it's a new unread conversation.
          if ((count ?? 0) === 1) setUnreadCount((c) => c + 1);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" },
        () => refetchUnreadCount(userId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, refetchUnreadCount]);

  useEffect(() => {
    if (!userId) return;
    const handler = () => refetchUnreadCount(userId);
    window.addEventListener("bearcart:messages-read", handler);
    return () => window.removeEventListener("bearcart:messages-read", handler);
  }, [userId, refetchUnreadCount]);

  // ── Mode toggle ────────────────────────────────────────────────────────
  function handleModeToggle(mode: SearchMode) {
    setSearchMode(mode);
    if (mode === "items") {
      setPeopleQuery("");
      setShowPeopleDropdown(false);
      setPeopleResults([]);
    } else {
      setSearchQuery("");
    }
  }

  function handlePeopleSelect() {
    setShowPeopleDropdown(false);
    setPeopleQuery("");
    setMobileMenuOpen(false);
  }

  // ── Items search submit ────────────────────────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === "people") return;
    const targetPath = pathname.startsWith("/requests") ? "/requests" : "/listings";
    const isOnTargetPage = pathname === targetPath;
    const base = isOnTargetPage ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    base.delete("page");
    if (searchQuery.trim()) { base.set("search", searchQuery.trim()); } else { base.delete("search"); }
    const query = base.toString();
    setMobileMenuOpen(false);
    router.push(query ? `${targetPath}?${query}` : targetPath);
  };

  const showDesktopPeople = searchMode === "people" && (showPeopleDropdown || peopleLoading) && peopleQuery.length >= 2;

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
          className="hidden min-w-0 flex-1 items-center justify-center gap-2 px-5 lg:flex"
        >
          <div ref={desktopSearchRef} className="relative w-full max-w-xl">
            <div className="flex min-w-0 w-full items-center rounded-lg border bg-background px-2">
              <ModeToggle mode={searchMode} onToggle={handleModeToggle} />
              <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
                {searchMode === "items" ? (
                  <input
                    type="text"
                    placeholder={pathname.startsWith("/requests") ? "Search requests..." : "Search listings..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={peopleQuery}
                    onChange={(e) => setPeopleQuery(e.target.value)}
                    autoComplete="off"
                    className="h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                )}
              </div>
            </div>

            {/* People results dropdown */}
            {showDesktopPeople && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-card shadow-lg">
                <PeopleDropdownContent
                  results={peopleResults}
                  loading={peopleLoading}
                  onSelect={handlePeopleSelect}
                />
              </div>
            )}
          </div>
        </form>

        {/* ── Desktop Right ─────────────────────────────────────────── */}
        <div className="relative z-10 hidden shrink-0 items-center gap-2 lg:flex">
          <Link href="/listings" className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            Listings
          </Link>
          <Link href="/requests" className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            Requests
          </Link>

          {user ? (
            <>
              <Button size="sm" asChild>
                <Link href={pathname.startsWith("/requests") ? "/post?type=request" : "/post?type=listing"}>
                  <Plus className="size-4" />
                  Post
                </Link>
              </Button>
              <MessagesIcon count={unreadCount} />
              <NotificationsBell
                userId={user.id}
                initialUnreadCount={initialNotificationCount}
                initialNotifications={initialNotifications}
              />
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
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="relative">
              <List className="size-5" />
              {user && unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
              )}
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" />
                BearCart
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 flex flex-col gap-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2">
                {/* Mode toggle */}
                <div className="flex rounded-lg border bg-background">
                  <button
                    type="button"
                    onClick={() => handleModeToggle("items")}
                    className={`flex-1 rounded-l-lg py-2 text-xs font-medium transition-colors ${
                      searchMode === "items"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Items
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeToggle("people")}
                    className={`flex-1 rounded-r-lg py-2 text-xs font-medium transition-colors ${
                      searchMode === "people"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    People
                  </button>
                </div>

                {/* Search input */}
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3">
                  <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
                  {searchMode === "items" ? (
                    <input
                      type="text"
                      placeholder={pathname.startsWith("/requests") ? "Search requests..." : "Search listings..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Search people..."
                      value={peopleQuery}
                      onChange={(e) => setPeopleQuery(e.target.value)}
                      autoComplete="off"
                      className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  )}
                </div>

                {/* Mobile people results (inline, not floating) */}
                {searchMode === "people" && peopleQuery.length >= 2 && (
                  <div className="overflow-hidden rounded-lg border bg-background">
                    <PeopleDropdownContent
                      results={peopleResults}
                      loading={peopleLoading}
                      onSelect={handlePeopleSelect}
                    />
                  </div>
                )}
              </form>

              <div className="h-px bg-border" />

              <Link
                href="/listings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <ShoppingCart className="size-4" />
                Listings
              </Link>

              <Link
                href="/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <MagnifyingGlass className="size-4" />
                Requests
              </Link>

              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.full_name} fill unoptimized className="object-cover ring-2 ring-primary/30" />
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

                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <UserIcon className="size-4" />
                    My Profile
                  </Link>

                  <Link
                    href={pathname.startsWith("/requests") ? "/post?type=request" : "/post?type=listing"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <Plus className="size-4" />
                    Create a Post
                  </Link>

                  <div className="h-px bg-border" />

                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={async () => { setMobileMenuOpen(false); await signOut(); }}
                  >
                    <SignOut className="size-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => { signInWithGoogle(); setMobileMenuOpen(false); }}
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
