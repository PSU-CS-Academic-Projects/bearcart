"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flag, Package, Prohibit, ArrowCounterClockwise, Trash,
  Warning, ShieldCheck,
  UserPlus, Note, ArrowClockwise, EyeSlash, CaretLeft, CaretRight,
  Tag, CheckCircle, XCircle,
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
  adminRestoreListing, adminTakedownListing,
  adminRestoreRequest, adminTakedownRequest,
  adminDismissReports, adminDismissMessageReport, adminDeleteMessage,
  warnUser, banUser, unbanUser, promoteToAdmin, demoteSelf, searchAdminUsers,
  type AdminOverviewStats, type PlatformStats, type ActivityItem, type ActivityType,
  type ReportsPerDay, type ReportedPost, type ReportedMessage,
  type AdminUserRow, type BanType,
} from "@/lib/actions/admin";

// ─── Shared UI helpers ────────────────────────────────────────────────────────

/**
 * Relative timestamps ("2 hours ago") differ between the server render and the
 * client hydration moment, which trips a hydration mismatch. Render them only
 * after mount so server and first client paint agree (empty), then fill in.
 */
function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <span className={className} suppressHydrationWarning>
      {mounted ? formatTimeAgo(iso) : ""}
    </span>
  );
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function MiniAvatar({ src, name, size = 28 }: { src: string | null; name: string | null; size?: number }) {
  const sz = `${size}px`;
  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? ""}
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: sz, height: sz }}
      />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-mono font-semibold text-muted-foreground"
      style={{ width: sz, height: sz, fontSize: `${Math.round(size * 0.38)}px` }}
    >
      {initials(name)}
    </span>
  );
}

function MiniThumbnail({ src, title, onOpen }: { src: string | null; title: string; onOpen?: (s: string) => void }) {
  if (src) {
    return (
      <button
        type="button"
        onClick={() => onOpen?.(src)}
        className="shrink-0 overflow-hidden rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: 44, height: 44 }}
        aria-label={`View image for ${title}`}
      >
        <Image
          src={src}
          alt={title}
          width={44}
          height={44}
          unoptimized
          className="size-full object-cover transition-opacity hover:opacity-80"
        />
      </button>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-md bg-muted" style={{ width: 44, height: 44 }}>
      <Package className="size-5 text-muted-foreground/50" />
    </span>
  );
}

// ─── Pending action (drives the single confirmation dialog) ───────────────────

type Pending =
  | { kind: "restore" | "dismiss"; target: "listing" | "request"; id: string; title: string }
  | { kind: "takedown"; target: "listing" | "request"; id: string; title: string }
  | { kind: "msg-dismiss"; reportId: string }
  | { kind: "msg-delete"; reportId: string; messageId: string }
  | { kind: "warn" | "ban"; userId: string; userName: string }
  | { kind: "unban" | "promote"; userId: string; userName: string }
  | { kind: "demote-self" };


// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  currentUserId: string;
  stats: AdminOverviewStats;
  platformStats: PlatformStats;
  recentActivity: ActivityItem[];
  reportsPerDay: ReportsPerDay[];
  reportedListings: ReportedPost[];
  reportedRequests: ReportedPost[];
  reportedMessages: ReportedMessage[];
  initialUsers: AdminUserRow[];
}

export function AdminDashboard({
  currentUserId, stats, platformStats, recentActivity, reportsPerDay,
  reportedListings, reportedRequests, reportedMessages, initialUsers,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "reported" | "users">("overview");
  const [reportedTab, setReportedTab] = useState<"listings" | "requests" | "messages">("listings");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // user search — current admin first, then other admins, then members A→Z
  const [userQuery, setUserQuery] = useState("");
  const [userPage, setUserPage] = useState(0);
  const sortUsers = (list: AdminUserRow[]) => {
    return [...list].sort((a, b) => {
      // current admin always first
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      // other admins before members
      if (a.is_admin !== b.is_admin) return a.is_admin ? -1 : 1;
      // alphabetical by full_name
      return (a.full_name ?? "").localeCompare(b.full_name ?? "");
    });
  };
  const [users, setUsers] = useState<AdminUserRow[]>(() => sortUsers(initialUsers));
  const [searching, startSearch] = useTransition();

  // confirmation dialog
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const [banType, setBanType] = useState<Exclude<BanType, "none">>("post");
  const [busy, setBusy] = useState(false);

  const closeDialog = () => { setPending(null); setReason(""); setBanType("post"); };

  const handleSearch = (q: string) => {
    setUserQuery(q);
    setUserPage(0);
    startSearch(async () => {
      try { setUsers(sortUsers(await searchAdminUsers(q))); } catch { /* ignore */ }
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
        case "msg-dismiss":
          await adminDismissMessageReport(pending.reportId); toast.success("Report dismissed."); break;
        case "msg-delete":
          await adminDeleteMessage(pending.reportId, pending.messageId); toast.success("Message deleted."); break;
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
      {tab === "overview" && (() => {
        const max = Math.max(stats.reportedListings, stats.reportedRequests, stats.reportedMessages, stats.bannedUsers, stats.pendingReports, 1);
        const pct = (v: number) => `${Math.round((v / max) * 100)}%`;
        return (
          <div className="space-y-8">
            {/* Moderation stats — amber band */}
            <div className="admin-stat-band">
              <div className="tile"><span className="lbl">Reported listings</span><span className="num">{stats.reportedListings}</span><div className="bar-bg" /><div className="bar-fill" style={{ width: pct(stats.reportedListings) }} /></div>
              <div className="tile"><span className="lbl">Reported requests</span><span className="num">{stats.reportedRequests}</span><div className="bar-bg" /><div className="bar-fill" style={{ width: pct(stats.reportedRequests) }} /></div>
              <div className="tile"><span className="lbl">Reported messages</span><span className="num">{stats.reportedMessages}</span><div className="bar-bg" /><div className="bar-fill" style={{ width: pct(stats.reportedMessages) }} /></div>
              <div className="tile"><span className="lbl">Banned users</span><span className="num">{stats.bannedUsers}</span><div className="bar-bg" /><div className="bar-fill" style={{ width: pct(stats.bannedUsers) }} /></div>
              <div className="tile peak"><span className="lbl">Pending reports</span><span className="num">{stats.pendingReports}</span></div>
            </div>

            {/* Platform stats — totals, plain cards (no peak highlight) */}
            <div>
              <p className="mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Platform Stats
              </p>
              <div className="admin-stat-band cols-4">
                <div className="tile"><span className="lbl">Total users</span><span className="num">{platformStats.totalUsers}</span></div>
                <div className="tile"><span className="lbl">Total listings</span><span className="num">{platformStats.totalListings}</span></div>
                <div className="tile"><span className="lbl">Total requests</span><span className="num">{platformStats.totalRequests}</span></div>
                <div className="tile"><span className="lbl">Total sold</span><span className="num">{platformStats.totalSold}</span></div>
              </div>
            </div>

            {/* Recent activity feed */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Recent Activity
                </p>
                <button
                  type="button"
                  onClick={() => setTab("reported")}
                  className="font-mono text-[0.65rem] font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  View all →
                </button>
              </div>
              {recentActivity.length === 0 ? (
                <p className="rounded-xl border border-border bg-card py-8 text-center text-sm text-muted-foreground">
                  No recent activity.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  {recentActivity.map((a, i) => {
                    const { Icon, tone } = activityVisual(a.type);
                    const inner = (
                      <>
                        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${tone}`}>
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{a.description}</span>
                        <TimeAgo iso={a.timestamp} className="shrink-0 font-mono text-[0.68rem] text-muted-foreground" />
                      </>
                    );
                    const rowClass = "flex w-full items-center gap-3 border-b border-border/60 px-4 py-2.5 text-left last:border-b-0";
                    const interactive = "transition-colors hover:bg-muted/30";

                    if (a.jumpToReported) {
                      return (
                        <button key={i} type="button" onClick={() => setTab("reported")} className={`${rowClass} ${interactive}`}>
                          {inner}
                        </button>
                      );
                    }
                    if (a.href) {
                      return (
                        <Link key={i} href={a.href} className={`${rowClass} ${interactive}`}>
                          {inner}
                        </Link>
                      );
                    }
                    return <div key={i} className={rowClass}>{inner}</div>;
                  })}
                </div>
              )}
            </div>

            {/* Reports over time — last 7 days */}
            <div>
              <p className="mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Reports — Last 7 Days
              </p>
              <ReportsChart data={reportsPerDay} />
            </div>
          </div>
        );
      })()}

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
                    <div key={post.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-muted/20 transition-colors">
                      <MiniThumbnail src={post.thumbnail} title={post.title} onOpen={setLightboxSrc} />
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
                        <div className="mt-1 flex flex-col gap-0.5 font-mono text-[0.65rem] text-muted-foreground">
                          {post.reports.map((r, i) => (
                            <ReportRow key={i} reason={r.reason} details={r.details} reporterName={r.reporterName} createdAt={r.created_at} />
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
                                  onClick={() => setPending({ kind: "dismiss", target: "listing", id: post.id, title: post.title })}
                                >
                                  Dismiss <kbd className="ml-0.5 inline-flex items-center rounded-sm border border-border bg-muted px-1 font-mono text-[0.55rem] text-muted-foreground">D</kbd>
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

          {/* Requests queue */}
          {reportedTab === "requests" && (
            reportedRequests.length === 0
              ? <p className="py-8 text-center text-sm text-muted-foreground">Queue empty.</p>
              : <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border bg-muted/40 px-4 py-2">
                    <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Item</span>
                    <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Actions</span>
                  </div>
                  {reportedRequests.map((post) => (
                    <div key={post.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-muted/20 transition-colors">
                      <MiniThumbnail src={post.thumbnail} title={post.title} onOpen={setLightboxSrc} />
                      <div>
                        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                          <a
                            href={`/requests/${post.id}`}
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
                        <div className="mt-1 flex flex-col gap-0.5 font-mono text-[0.65rem] text-muted-foreground">
                          {post.reports.map((r, i) => (
                            <ReportRow key={i} reason={r.reason} details={r.details} reporterName={r.reporterName} createdAt={r.created_at} />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 pt-0.5">
                        {!post.isTakenDown && (
                          <>
                            {!post.isDelisted
                              ? <button
                                  className="inline-flex h-7 items-center gap-1 rounded border border-border bg-transparent px-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted/50"
                                  onClick={() => setPending({ kind: "dismiss", target: "request", id: post.id, title: post.title })}
                                >
                                  Dismiss <kbd className="ml-0.5 inline-flex items-center rounded-sm border border-border bg-muted px-1 font-mono text-[0.55rem] text-muted-foreground">D</kbd>
                                </button>
                              : <button
                                  className="inline-flex h-7 items-center gap-1 rounded border border-border bg-transparent px-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted/50"
                                  onClick={() => setPending({ kind: "restore", target: "request", id: post.id, title: post.title })}
                                >
                                  Restore <kbd className="ml-0.5 inline-flex items-center rounded-sm border border-border bg-muted px-1 font-mono text-[0.55rem] text-muted-foreground">R</kbd>
                                </button>
                            }
                            <button
                              className="inline-flex h-7 items-center gap-1 rounded border border-destructive/40 bg-transparent px-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/8"
                              onClick={() => setPending({ kind: "takedown", target: "request", id: post.id, title: post.title })}
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

          {/* Messages queue */}
          {reportedTab === "messages" && (
            reportedMessages.length === 0
              ? <p className="py-8 text-center text-sm text-muted-foreground">Queue empty.</p>
              : <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border bg-muted/40 px-4 py-2">
                    <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Message</span>
                    <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Actions</span>
                  </div>
                  {reportedMessages.map((m) => (
                    <div key={m.reportId} className="grid grid-cols-[1fr_auto] items-start gap-4 border-b border-border/60 px-4 py-3 last:border-b-0 hover:bg-muted/20 transition-colors">
                      <div>
                        {/* Report reason — expandable toggle (details inside) */}
                        <div className="mb-1 flex flex-col gap-0.5 font-mono text-[0.65rem] text-muted-foreground">
                          <ReportRow
                            reason={m.reason}
                            details={m.details}
                            reporterName={m.reporterName}
                            createdAt={m.createdAt}
                          />
                        </div>
                        {/* Sender → recipient with avatars */}
                        <div className="flex items-center gap-1.5 font-mono text-[0.68rem] text-muted-foreground">
                          <MiniAvatar src={m.senderAvatar} name={m.senderName} size={20} />
                          <span>{m.senderName ?? "unknown"}</span>
                          <span>→</span>
                          <MiniAvatar src={m.recipientAvatar} name={m.recipientName} size={20} />
                          <span>{m.recipientName ?? "unknown"}</span>
                          {m.messageCreatedAt && <><span>·</span><TimeAgo iso={m.messageCreatedAt} /></>}
                        </div>
                        {/* Message content preview */}
                        <div className="mt-1.5 rounded border border-border/60 bg-muted/30 px-2.5 py-1.5 font-mono text-[0.68rem] leading-relaxed text-foreground">
                          {m.content
                            ? `"${m.content}"`
                            : <span className="italic text-muted-foreground">(no text content)</span>
                          }
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex flex-col items-end gap-1.5 pt-0.5">
                        <button
                          className="inline-flex h-7 items-center gap-1 rounded border border-border bg-transparent px-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-muted/50"
                          onClick={() => setPending({ kind: "msg-dismiss", reportId: m.reportId })}
                        >
                          Dismiss
                        </button>
                        <button
                          className="inline-flex h-7 items-center gap-1 rounded border border-destructive/40 bg-transparent px-2.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/8"
                          onClick={() => setPending({ kind: "msg-delete", reportId: m.reportId, messageId: m.messageId })}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
          )}
        </div>
      )}

      {/* ── Users ── */}
      {tab === "users" && (() => {
        const PAGE_SIZE = 10;
        const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
        const safePage = Math.min(userPage, pageCount - 1);
        const pageUsers = users.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
        return (
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
                {/* Real table layout → columns always align regardless of content length */}
                <div className="overflow-hidden rounded-xl border bg-card">
                  <table className="w-full table-fixed border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[0.6rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        <th className="px-3.5 py-2 text-left font-medium">User</th>
                        <th className="hidden w-[26%] px-3.5 py-2 text-left font-medium sm:table-cell">Account</th>
                        <th className="hidden w-[12%] px-3.5 py-2 text-left font-medium sm:table-cell">Role</th>
                        <th className="hidden w-[12%] px-3.5 py-2 text-left font-medium sm:table-cell">Standing</th>
                        <th className="w-[150px] px-3.5 py-2 text-right font-medium sm:w-[210px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageUsers.map((u) => (
                        <UserCard key={u.id} user={u} isSelf={u.id === currentUserId} onAction={setPending} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pageCount > 1 && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[0.68rem] text-muted-foreground">
                      Page {safePage + 1} of {pageCount} · {users.length} users
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs"
                        disabled={safePage === 0}
                        onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                      >
                        <CaretLeft className="size-3.5" /> Prev
                      </Button>
                      <Button
                        size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs"
                        disabled={safePage >= pageCount - 1}
                        onClick={() => setUserPage((p) => Math.min(pageCount - 1, p + 1))}
                      >
                        Next <CaretRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

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

      {/* ── Fullscreen image lightbox ──────────────────────────────────── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className="size-5">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Full size preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ─── Dialog copy helpers ──────────────────────────────────────────────────────

function dialogTitle(p: Pending | null): string {
  if (!p) return "";
  switch (p.kind) {
    case "dismiss": return `Dismiss all reports for this ${p.target}?`;
    case "restore": return `Restore this ${p.target}?`;
    case "takedown": return `Permanently take down this ${p.target}?`;
    case "warn": return `Warn ${p.userName}?`;
    case "ban": return `Ban ${p.userName}?`;
    case "unban": return `Lift ban on ${p.userName}?`;
    case "promote": return `Promote ${p.userName} to admin?`;
    case "demote-self": return "Step down as admin?";
    case "msg-dismiss": return "Dismiss this message report?";
    case "msg-delete": return "Delete this message?";
  }
}

function dialogDescription(p: Pending | null): string {
  if (!p) return "";
  switch (p.kind) {
    case "dismiss": return "All pending reports will be cleared and the report count reset to zero. The listing stays active and visible.";
    case "restore": return "It will become visible again and all pending reports will be cleared so the report count resets. The owner is notified.";
    case "takedown": return "This permanently removes it for everyone, including the owner. This cannot be undone.";
    case "warn": return "The user is notified in-app and by email with your reason.";
    case "ban": return "The user can still browse and log in, but is blocked from the selected actions. They are notified.";
    case "unban": return "The user regains full access.";
    case "promote": return "This grants the user full admin access to this dashboard and all moderation tools.";
    case "demote-self": return "You will lose admin access immediately. Only you can do this to your own account — admins cannot demote other admins.";
    case "msg-dismiss": return "The report will be cleared. The message stays in the conversation.";
    case "msg-delete": return "The message will be soft-deleted and replaced with a deleted placeholder. The report is marked as actioned.";
  }
}

function dialogConfirmLabel(p: Pending | null): string {
  if (!p) return "Confirm";
  switch (p.kind) {
    case "dismiss": return "Dismiss Reports";
    case "restore": return "Restore";
    case "takedown": return "Take Down";
    case "warn": return "Issue Warning";
    case "ban": return "Ban User";
    case "unban": return "Lift Ban";
    case "promote": return "Promote";
    case "demote-self": return "Step Down";
    case "msg-dismiss": return "Dismiss";
    case "msg-delete": return "Delete Message";
  }
}

// ─── Expandable report-reason row ────────────────────────────────────────────

function ReportRow({ reason, details, reporterName, createdAt }: {
  reason: string;
  details: string | null;
  reporterName: string | null;
  createdAt: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 text-left transition-colors hover:text-foreground"
      >
        <span
          className="shrink-0 transition-transform duration-200"
          style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ›
        </span>
        <span>{reason}</span>
        <span className="mx-0.5 text-muted-foreground/50">—</span>
        <span className="text-muted-foreground">{reporterName ?? "anon"} <TimeAgo iso={createdAt} /></span>
      </button>
      {open && (
        <div className="ml-3.5 mt-0.5 rounded border-l-2 border-border pl-2 font-mono text-[0.62rem] leading-relaxed">
          {details?.trim()
            ? <span className="text-foreground">{details.trim()}</span>
            : <span className="italic text-muted-foreground/70">No additional details provided.</span>
          }
        </div>
      )}
    </div>
  );
}

// ─── Activity feed visuals ────────────────────────────────────────────────────

// Admin/moderation actions are amber-toned; regular user activity is neutral.
const AMBER = "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
const NEUTRAL = "bg-muted text-muted-foreground";

function activityVisual(type: ActivityType): {
  Icon: React.ComponentType<{ className?: string }>;
  tone: string;
} {
  switch (type) {
    // ── Regular user activity (neutral) ──
    case "user_registered":
      return { Icon: UserPlus, tone: NEUTRAL };
    case "listing_posted":
      return { Icon: Package, tone: NEUTRAL };
    case "request_posted":
      return { Icon: Note, tone: NEUTRAL };
    case "report_submitted":
      return { Icon: Flag, tone: NEUTRAL };
    case "listing_sold":
      return { Icon: Tag, tone: NEUTRAL };
    case "request_fulfilled":
      return { Icon: CheckCircle, tone: NEUTRAL };
    case "request_closed":
      return { Icon: XCircle, tone: NEUTRAL };
    case "listing_restored":
      return { Icon: ArrowClockwise, tone: NEUTRAL };
    // ── Admin / moderation actions (amber) ──
    case "listing_delisted":
      return { Icon: EyeSlash, tone: AMBER };
    case "listing_auto_delisted":
      return { Icon: EyeSlash, tone: AMBER };
    case "listing_takedown":
      return { Icon: Trash, tone: AMBER };
    case "request_takedown":
      return { Icon: Trash, tone: AMBER };
    case "user_banned":
      return { Icon: Prohibit, tone: AMBER };
    case "user_warned":
      return { Icon: Warning, tone: AMBER };
    case "message_deleted":
      return { Icon: Trash, tone: AMBER };
  }
}

// ─── Reports-over-time bar chart ──────────────────────────────────────────────

function ReportsChart({ data }: { data: ReportsPerDay[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {total === 0 && (
        <p className="mb-3 text-center text-xs text-muted-foreground">No reports in the last 7 days.</p>
      )}
      <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
        {data.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ height: "100%" }}>
            <span className="font-mono text-[0.6rem] font-semibold text-muted-foreground">{d.count}</span>
            <div
              className="w-full rounded-t-sm bg-primary/70 transition-all"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 4 : 2, opacity: d.count > 0 ? 1 : 0.25 }}
            />
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── User card ────────────────────────────────────────────────────────────────

const BAN_BADGE: Record<BanType, string | null> = {
  none: null, post: "Post banned", chat: "Chat banned", full: "Fully banned",
};

/** All users share the @psu.palawan.edu.ph domain — show only the student-number local part. */
function emailLocalPart(email: string): string {
  const at = email.indexOf("@");
  return at === -1 ? email : email.slice(0, at);
}

function UserCard({
  user, isSelf, onAction,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  onAction: (p: Pending) => void;
}) {
  const roleLabel = user.role === "faculty" ? "Faculty" : "Student";
  return (
    <tr className="group border-t border-border first:border-t-0 hover:bg-primary/[0.04]">
      {/* User: avatar + name + status badges */}
      <td className="px-3.5 py-3 align-middle">
        <div className="flex min-w-0 items-center gap-2.5">
          <MiniAvatar src={user.avatar_url} name={user.full_name} size={30} />
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
            {/* account + role shown inline under name on mobile only */}
            <p className="truncate font-mono text-[0.7rem] text-muted-foreground sm:hidden" title={user.email}>
              {emailLocalPart(user.email)} · {roleLabel}
            </p>
          </div>
        </div>
      </td>

      {/* Account — local part only, full email on hover */}
      <td className="hidden px-3.5 py-3 align-middle sm:table-cell">
        <span className="block truncate font-mono text-xs text-muted-foreground" title={user.email}>
          {emailLocalPart(user.email)}
        </span>
      </td>

      {/* Role */}
      <td className="hidden px-3.5 py-3 align-middle sm:table-cell">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{roleLabel}</span>
      </td>

      {/* Standing */}
      <td className="hidden px-3.5 py-3 align-middle sm:table-cell">
        <span className={"text-[0.68rem] font-semibold uppercase tracking-[0.08em] " + (user.is_admin ? "text-primary" : "text-muted-foreground")}>
          {user.is_admin ? "Admin" : "Member"}
        </span>
      </td>

      {/* Actions — fixed-width column so Protected rows never collapse it */}
      <td className="px-3.5 py-3 text-right align-middle">
        <div className="flex flex-wrap justify-end gap-1.5">
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
      </td>
    </tr>
  );
}
