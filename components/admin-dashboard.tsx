"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flag, Package, ChatCircle, Prohibit, ArrowCounterClockwise, Trash,
  Warning, ShieldCheck, User as UserIcon, ArrowUpRight,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatTimeAgo } from "@/lib/listing-helpers";
import {
  adminDelistListing, adminRestoreListing, adminTakedownListing,
  adminDelistRequest, adminRestoreRequest, adminTakedownRequest,
  adminDismissReports,
  warnUser, banUser, unbanUser, promoteToAdmin, demoteSelf, searchAdminUsers,
  type AdminOverviewStats, type ReportedPost, type ReportedMessage,
  type AdminUserRow, type BanType,
} from "@/lib/actions/admin";

// ─── Pending action (drives the single confirmation dialog) ───────────────────

type Pending =
  | { kind: "delist" | "restore" | "dismiss"; target: "listing" | "request"; id: string; title: string }
  | { kind: "takedown"; target: "listing" | "request"; id: string; title: string }
  | { kind: "warn" | "ban"; userId: string; userName: string }
  | { kind: "unban" | "promote"; userId: string; userName: string }
  | { kind: "demote-self" };

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  currentUserId: string;
  stats: AdminOverviewStats;
  reportedListings: ReportedPost[];
  reportedRequests: ReportedPost[];
  reportedMessages: ReportedMessage[];
  initialUsers: AdminUserRow[];
}

export function AdminDashboard({
  currentUserId, stats, reportedListings, reportedRequests, reportedMessages, initialUsers,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "reported" | "users">("overview");
  const [reportedTab, setReportedTab] = useState<"listings" | "requests" | "messages">("listings");

  // user search
  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [searching, startSearch] = useTransition();

  // confirmation dialog
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const [banType, setBanType] = useState<Exclude<BanType, "none">>("post");
  const [busy, setBusy] = useState(false);

  const closeDialog = () => { setPending(null); setReason(""); setBanType("post"); };

  const handleSearch = (q: string) => {
    setUserQuery(q);
    startSearch(async () => {
      try { setUsers(await searchAdminUsers(q)); } catch { /* ignore */ }
    });
  };

  const needsReason = pending && (pending.kind === "takedown" || pending.kind === "warn" || pending.kind === "ban");

  const runPending = async () => {
    if (!pending) return;
    if (needsReason && !reason.trim()) { toast.error("A reason is required."); return; }
    setBusy(true);
    try {
      switch (pending.kind) {
        case "dismiss":
          await adminDismissReports(pending.target, pending.id);
          toast.success("Reports dismissed. Listing stays active."); break;
        case "delist":
          await (pending.target === "listing" ? adminDelistListing(pending.id) : adminDelistRequest(pending.id));
          toast.success("Delisted."); break;
        case "restore":
          await (pending.target === "listing" ? adminRestoreListing(pending.id) : adminRestoreRequest(pending.id));
          toast.success("Restored. Report count reset."); break;
        case "takedown":
          await (pending.target === "listing"
            ? adminTakedownListing(pending.id, reason.trim())
            : adminTakedownRequest(pending.id, reason.trim()));
          toast.success("Permanently taken down."); break;
        case "warn":
          await warnUser(pending.userId, reason.trim()); toast.success("Warning issued."); break;
        case "ban":
          await banUser(pending.userId, banType, reason.trim()); toast.success("User banned."); break;
        case "unban":
          await unbanUser(pending.userId); toast.success("Ban lifted."); break;
        case "promote":
          await promoteToAdmin(pending.userId); toast.success("Promoted to admin."); break;
        case "demote-self":
          await demoteSelf(); toast.success("You have stepped down as admin."); break;
      }
      closeDialog();
      if (pending.kind === "demote-self") { router.push("/"); router.refresh(); }
      else router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <p className="mb-1 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-primary">Moderation</p>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold tracking-[-0.02em] text-foreground">
        <ShieldCheck className="size-6 text-primary" /> Admin control desk
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">Moderate content and manage users.</p>

      {/* Tabs — underlined console strip */}
      <div className="mb-6 flex gap-6 border-b border-border">
        {(["overview", "reported", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative -mb-px py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "reported" ? "Reported content" : t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Package} label="Reported listings" value={stats.reportedListings} />
          <StatCard icon={Package} label="Reported requests" value={stats.reportedRequests} />
          <StatCard icon={ChatCircle} label="Reported messages" value={stats.reportedMessages} />
          <StatCard icon={Prohibit} label="Banned users" value={stats.bannedUsers} />
          <StatCard icon={Flag} label="Pending reports" value={stats.pendingReports} />
        </div>
      )}

      {/* ── Reported content — Command Console Queue ── */}
      {tab === "reported" && (
        <div>
          {/* Header: label + segmented mode toggle */}
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Moderation Queue
            </span>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {(["listings", "requests", "messages"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setReportedTab(t)}
                  className={`border-r border-border px-3 py-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider transition-colors last:border-r-0 ${
                    reportedTab === t
                      ? "bg-foreground text-background"
                      : "bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Listings queue */}
          {reportedTab === "listings" && (
            reportedListings.length === 0
              ? <p className="py-8 text-center text-sm text-muted-foreground">Queue empty.</p>
              : <div className="overflow-hidden rounded-xl border border-border bg-card">
                  {/* Column header */}
                  <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border bg-muted/40 px-4 py-2">
                    <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Item</span>
                    <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Actions</span>
                  </div>
                  {reportedListings.map((post) => (
                    <div key={post.id} className="grid grid-cols-[1fr_auto] items-start gap-4 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-muted/20 transition-colors">
                      {/* Left: item info */}
                      <div>
                        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                          <a
                            href={`/listings/${post.id}`}
                            className="text-sm font-semibold text-foreground hover:underline"
                          >
                            {post.title}
                          </a>
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-mono text-[0.62rem] font-bold text-destructive">
                            {post.reportCount}×
                          </span>
                          {post.isTakenDown && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.62rem] font-medium text-muted-foreground">Taken down</span>
                          )}
                          {!post.isTakenDown && post.isDelisted && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.62rem] font-medium text-amber-700">DELISTED</span>
                          )}
                        </div>
                        <div className="font-mono text-[0.68rem] text-muted-foreground">@{post.ownerName ?? "unknown"}</div>
                        <div className="mt-1 font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
                          {post.reports.map((r, i) => (
                            <div key={i}>› {r.reason} — {r.reporterName ?? "anon"} {formatTimeAgo(r.created_at)}</div>
                          ))}
                        </div>
                      </div>
                      {/* Right: actions */}
                      <div className="flex flex-col items-end gap-1.5 pt-0.5">
                        {!post.isTakenDown && (
                          <>
                            {!post.isDelisted
                              ? <button
                                  className="inline-flex h-7 items-center gap-1 rounded border border-border bg-transparent px-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted/50"
                                  onClick={() => setPending({ kind: "delist", target: "listing", id: post.id, title: post.title })}
                                >
                                  Delist <kbd className="ml-0.5 inline-flex items-center rounded-sm border border-border bg-muted px-1 font-mono text-[0.55rem] text-muted-foreground">L</kbd>
                                </button>
                              : <button
                                  className="inline-flex h-7 items-center gap-1 rounded border border-border bg-transparent px-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted/50"
                                  onClick={() => setPending({ kind: "restore", target: "listing", id: post.id, title: post.title })}
                                >
                                  Restore <kbd className="ml-0.5 inline-flex items-center rounded-sm border border-border bg-muted px-1 font-mono text-[0.55rem] text-muted-foreground">R</kbd>
                                </button>
                            }
                            <button
                              className="inline-flex h-7 items-center gap-1 rounded border border-destructive/40 bg-transparent px-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/8"
                              onClick={() => setPending({ kind: "takedown", target: "listing", id: post.id, title: post.title })}
                            >
                              Takedown <kbd className="ml-0.5 inline-flex items-center rounded-sm border border-destructive/30 bg-destructive/5 px-1 font-mono text-[0.55rem] text-destructive/70">X</kbd>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {reportedTab === "requests" && (
            <PostReportList posts={reportedRequests} target="request" onAction={setPending} />
          )}
          {reportedTab === "messages" && (
            <MessageReportList messages={reportedMessages} />
          )}
        </div>
      )}

      {/* ── Users ── */}
      {tab === "users" && (
        <div>
          <div className="mb-3 flex items-center gap-2 rounded-lg border bg-card px-3">
            <span className="font-mono text-sm font-semibold text-primary">/</span>
            <input
              value={userQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Filter users by name or account ID…"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searching && <span className="text-xs text-muted-foreground">…</span>}
          </div>
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
          ) : (
            <>
              {/* Column header */}
              <div className="grid grid-cols-[1.5fr_1.3fr_auto] gap-4 px-3.5 pb-1.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:grid-cols-[1.6fr_1.4fr_0.7fr_auto]">
                <span>User</span>
                <span>Account</span>
                <span className="hidden sm:block">Standing</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="overflow-hidden rounded-xl border bg-card">
                {users.map((u) => (
                  <UserCard key={u.id} user={u} isSelf={u.id === currentUserId} onAction={setPending} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Single confirmation dialog ── */}
      <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle(pending)}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription(pending)}</AlertDialogDescription>
          </AlertDialogHeader>

          {pending?.kind === "ban" && (
            <div className="space-y-2">
              <Label>Ban type</Label>
              <RadioGroup value={banType} onValueChange={(v) => setBanType(v as Exclude<BanType, "none">)} className="space-y-1.5">
                {([["post", "Post ban — cannot post listings or requests"], ["chat", "Chat ban — cannot send messages"], ["full", "Full ban — both post and chat"]] as const).map(([v, label]) => (
                  <div key={v} className="flex items-center gap-2">
                    <RadioGroupItem value={v} id={`ban-${v}`} />
                    <Label htmlFor={`ban-${v}`} className="font-normal">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {needsReason && (
            <div className="space-y-1.5">
              <Textarea
                placeholder="Reason (required, included in the notification)…"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 300))}
                rows={3}
                maxLength={300}
              />
              <p className={`text-right text-xs ${reason.length >= 300 ? "text-destructive" : "text-muted-foreground"}`}>
                {reason.length}/300
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); runPending(); }}
              disabled={busy || (!!needsReason && !reason.trim())}
              className={pending && (pending.kind === "takedown" || pending.kind === "ban") ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {dialogConfirmLabel(pending)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Dialog copy helpers ──────────────────────────────────────────────────────

function dialogTitle(p: Pending | null): string {
  if (!p) return "";
  switch (p.kind) {
    case "dismiss": return `Dismiss all reports for this ${p.target}?`;
    case "delist": return `Delist this ${p.target}?`;
    case "restore": return `Restore this ${p.target}?`;
    case "takedown": return `Permanently take down this ${p.target}?`;
    case "warn": return `Warn ${p.userName}?`;
    case "ban": return `Ban ${p.userName}?`;
    case "unban": return `Lift ban on ${p.userName}?`;
    case "promote": return `Promote ${p.userName} to admin?`;
    case "demote-self": return "Step down as admin?";
  }
}

function dialogDescription(p: Pending | null): string {
  if (!p) return "";
  switch (p.kind) {
    case "dismiss": return "All pending reports will be cleared and the report count reset to zero. The listing stays active and visible.";
    case "delist": return "It will be hidden from regular users but kept on file. The owner is notified.";
    case "restore": return "It will become visible again and all pending reports will be cleared so the report count resets. The owner is notified.";
    case "takedown": return "This permanently removes it for everyone, including the owner. This cannot be undone.";
    case "warn": return "The user is notified in-app and by email with your reason.";
    case "ban": return "The user can still browse and log in, but is blocked from the selected actions. They are notified.";
    case "unban": return "The user regains full access.";
    case "promote": return "This grants the user full admin access to this dashboard and all moderation tools.";
    case "demote-self": return "You will lose admin access immediately. Only you can do this to your own account — admins cannot demote other admins.";
  }
}

function dialogConfirmLabel(p: Pending | null): string {
  if (!p) return "Confirm";
  switch (p.kind) {
    case "dismiss": return "Dismiss Reports";
    case "delist": return "Delist";
    case "restore": return "Restore";
    case "takedown": return "Take Down";
    case "warn": return "Issue Warning";
    case "ban": return "Ban User";
    case "unban": return "Lift Ban";
    case "promote": return "Promote";
    case "demote-self": return "Step Down";
  }
}

// ─── Reported posts list ──────────────────────────────────────────────────────

function PostReportList({
  posts, target, onAction,
}: {
  posts: ReportedPost[];
  target: "listing" | "request";
  onAction: (p: Pending) => void;
}) {
  if (posts.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No reported {target}s.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <div key={post.id} className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={target === "listing" ? `/listings/${post.id}` : `/requests`}
                  className="flex items-center gap-1 font-semibold text-foreground hover:underline"
                >
                  {post.title} <ArrowUpRight className="size-3.5 text-muted-foreground" />
                </Link>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                  {post.reportCount} report{post.reportCount !== 1 ? "s" : ""}
                </span>
                {post.isTakenDown ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Taken down</span>
                ) : post.isDelisted ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Delisted</span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">by {post.ownerName ?? "Unknown"}</p>
            </div>
          </div>

          {/* Reasons */}
          <ul className="mt-3 space-y-1.5">
            {post.reports.map((r, i) => (
              <li key={i} className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                <span className="font-medium text-foreground">{r.reason}</span>
                {r.details && <span className="text-muted-foreground"> — {r.details}</span>}
                <span className="text-muted-foreground"> · {r.reporterName ?? "Someone"} · {formatTimeAgo(r.created_at)}</span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          {!post.isTakenDown && (
            <div className="mt-3 flex flex-wrap gap-2">
              {!post.isDelisted ? (
                // Active listing with pending reports: dismiss (keep listing) or take down
                <Button size="sm" variant="outline" className="h-8 gap-1.5"
                  onClick={() => onAction({ kind: "dismiss", target, id: post.id, title: post.title })}>
                  <ArrowCounterClockwise className="size-4" /> Dismiss reports
                </Button>
              ) : (
                // Auto-delisted or manually delisted: restore (clears reports) or take down
                <Button size="sm" variant="outline" className="h-8 gap-1.5"
                  onClick={() => onAction({ kind: "restore", target, id: post.id, title: post.title })}>
                  <ArrowCounterClockwise className="size-4" /> Restore
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => onAction({ kind: "takedown", target, id: post.id, title: post.title })}>
                <Trash className="size-4" /> Take down
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Reported messages list ───────────────────────────────────────────────────

function MessageReportList({ messages }: { messages: ReportedMessage[] }) {
  if (messages.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No reported messages.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <div key={m.reportId} className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">{m.reason}</span>
            <span>Reported by {m.reporterName ?? "Someone"} · {formatTimeAgo(m.createdAt)}</span>
          </div>
          {/* Only the reported message + context, never the full thread */}
          <div className="rounded-lg border border-dashed bg-muted/40 p-3">
            <p className="whitespace-pre-wrap break-words text-sm text-foreground">
              {m.content ? `“${m.content}”` : <span className="italic text-muted-foreground">(no text content)</span>}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              From <span className="font-medium text-foreground">{m.senderName ?? "Unknown"}</span>
              {" → "}
              <span className="font-medium text-foreground">{m.recipientName ?? "Unknown"}</span>
              {m.messageCreatedAt && <> · {formatTimeAgo(m.messageCreatedAt)}</>}
            </p>
          </div>
          {m.details && <p className="mt-2 text-xs text-muted-foreground">Reporter note: {m.details}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── User card ────────────────────────────────────────────────────────────────

const BAN_BADGE: Record<BanType, string | null> = {
  none: null, post: "Post banned", chat: "Chat banned", full: "Fully banned",
};

function UserCard({
  user, isSelf, onAction,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  onAction: (p: Pending) => void;
}) {
  return (
    <div className="group relative grid grid-cols-[1.5fr_1.3fr_auto] items-center gap-4 border-t border-border px-3.5 py-3 first:border-t-0 sm:grid-cols-[1.6fr_1.4fr_0.7fr_auto]">
      {/* amber active sweep on hover — full-bleed gradient, not a side stripe */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--primary),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06]"
      />

      {/* User: severity dot + name + status badges */}
      <div className="relative flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden
          className={
            "size-2 shrink-0 rounded-full " +
            (user.is_admin
              ? "bg-primary ring-[3px] ring-primary/20"
              : user.ban_type !== "none"
                ? "bg-destructive"
                : "bg-primary/60")
          }
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/profile/${user.id}`} className="truncate text-sm font-semibold text-foreground hover:underline">
              {user.full_name}
            </Link>
            {BAN_BADGE[user.ban_type] && (
              <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-destructive">{BAN_BADGE[user.ban_type]}</span>
            )}
            {user.warning_count > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-medium text-amber-700">{user.warning_count}⚠</span>
            )}
          </div>
          {/* account shown inline under name on mobile only */}
          <p className="truncate font-mono text-[0.7rem] text-muted-foreground sm:hidden">{user.email}</p>
        </div>
      </div>

      {/* Account (mono) — sm+ column */}
      <p className="relative hidden truncate font-mono text-xs text-muted-foreground sm:block">{user.email}</p>

      {/* Standing — sm+ column */}
      <span className={"relative hidden text-[0.68rem] font-semibold uppercase tracking-[0.08em] sm:block " + (user.is_admin ? "text-primary" : "text-muted-foreground")}>
        {user.is_admin ? "Admin" : "Member"}
      </span>

      {/* Actions */}
      <div className="relative flex flex-wrap justify-end gap-1.5">
        {isSelf ? (
          user.is_admin && (
            <Button size="sm" variant="outline" className="h-7 gap-1.5 border-destructive/40 px-2.5 text-destructive hover:bg-destructive/10"
              onClick={() => onAction({ kind: "demote-self" })}>
              <ShieldCheck className="size-3.5" /> Step down
            </Button>
          )
        ) : user.is_admin ? (
          <span className="text-xs text-muted-foreground">Protected</span>
        ) : (
          <>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={() => onAction({ kind: "warn", userId: user.id, userName: user.full_name })}>
              <Warning className="size-3.5" /> Warn
            </Button>
            {user.ban_type === "none" ? (
              <Button size="sm" variant="outline" className="h-7 gap-1.5 border-destructive/40 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => onAction({ kind: "ban", userId: user.id, userName: user.full_name })}>
                <Prohibit className="size-3.5" /> Ban
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={() => onAction({ kind: "unban", userId: user.id, userName: user.full_name })}>
                <ArrowCounterClockwise className="size-3.5" /> Lift ban
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={() => onAction({ kind: "promote", userId: user.id, userName: user.full_name })}>
              <ShieldCheck className="size-3.5" /> Make admin
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
