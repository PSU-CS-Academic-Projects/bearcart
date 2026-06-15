"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Handbag,
  Desktop,
  TShirt,
  Hamburger,
  GraduationCap,
  Wrench,
  DotsThree,
  Package,
  PencilSimple,
  Check,
  XCircle,
  CaretDown,
  X,
  Flag,
  Prohibit,
  ArrowCounterClockwise,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ReportDialog } from "@/components/report-dialog";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/listing-helpers";
import {
  getRequesterShortName,
  formatBudget,
  hasPositiveBudget,
  urgencyLabel,
  getRequestCoverImage,
} from "@/lib/request-helpers";
import { markRequestFulfilled, closeRequest, deleteRequest } from "@/lib/actions/requests";
import { reportRequest } from "@/lib/actions/reports";
import {
  adminRestoreRequest,
  adminTakedownRequest,
} from "@/lib/actions/admin";
import type { RequestRow as RequestRowType, RequestUrgency } from "@/lib/actions/requests";
import { toast } from "sonner";

// ─── Category Icon Lookup ─────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Accessories: Handbag,
  Electronics: Desktop,

  Clothing: TShirt,
  Food: Hamburger,
  "School Supplies": GraduationCap,
  Services: Wrench,
  Others: DotsThree,
};

function categoryIconFor(category: string): React.ComponentType<{ className?: string }> {
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  const found = Object.entries(CATEGORY_ICONS).find(
    ([k]) => k.toLowerCase() === category.toLowerCase()
  );
  return found ? found[1] : Package;
}

// ─── Urgency Badge ────────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<RequestUrgency, string> = {
  not_urgent: "bg-muted text-muted-foreground",
  moderate: "bg-primary/10 text-primary",
  urgent: "bg-amber-900/10 text-amber-900",
};

function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        URGENCY_STYLES[urgency]
      )}
    >
      {urgencyLabel(urgency)}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RequestRowProps {
  request: RequestRowType;
  currentUserId: string | null;
  variant?: "default" | "owner";
  rightAction?: React.ReactNode;
  isAdmin?: boolean;
}

export function RequestRow({
  request,
  currentUserId,
  variant = "default",
  rightAction,
  isAdmin = false,
}: RequestRowProps) {
  const router = useRouter();
  const Icon = categoryIconFor(request.category);
  const isOwn = currentUserId === request.requester_id;
  const cover = getRequestCoverImage(request);
  const hasDescription = !!(request.description?.trim());

  const [expanded, setExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"fulfilled" | "closed" | "delete" | null>(null);
  const [acting, setActing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [adminConfirm, setAdminConfirm] = useState<"restore" | "takedown" | null>(null);
  const [takedownReason, setTakedownReason] = useState("");

  const canReport = !!currentUserId && !isOwn;
  const showMenu = canReport || isAdmin;

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen]);

  const runAdminAction = async () => {
    if (!adminConfirm) return;
    setActing(true);
    try {
      if (adminConfirm === "restore") {
        await adminRestoreRequest(request.id);
        toast.success("Request restored.");
      } else {
        if (!takedownReason.trim()) { toast.error("A reason is required."); setActing(false); return; }
        await adminTakedownRequest(request.id, takedownReason.trim());
        toast.success("Request permanently taken down.");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(false);
      setAdminConfirm(null);
      setTakedownReason("");
    }
  };

  const handleIHaveThis = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      router.push("/auth/login?returnTo=/requests");
      return;
    }
    router.push(`/profile/${request.requester_id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/requests/${request.id}/edit`);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActing(true);
    try {
      if (confirmAction === "fulfilled") {
        await markRequestFulfilled(request.id);
        toast.success("Request marked as fulfilled!");
      } else if (confirmAction === "delete") {
        await deleteRequest(request.id);
        toast.success("Request deleted.");
      } else {
        await closeRequest(request.id);
        toast.success("Request closed.");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(false);
      setConfirmAction(null);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/30 sm:gap-4 sm:px-5 sm:py-4",
        hasDescription && "cursor-pointer select-none"
      )}
      onClick={hasDescription ? () => setExpanded((prev) => !prev) : undefined}
    >
      {/* Left: image thumbnail / lightbox trigger */}
      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted sm:size-20">
        {cover ? (
          <button
            type="button"
            aria-label={`View image for ${request.title}`}
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
            className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Image
              src={cover}
              alt={request.title}
              fill
              unoptimized
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 640px) 64px, 80px"
            />
          </button>
        ) : (
          <Image src="/bearcart-placeholder.svg" alt="" fill unoptimized className="object-contain opacity-40" />
        )}
      </div>

      {/* Right: content & actions */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">

        {/* Title + Urgency + expand caret */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <UrgencyBadge urgency={request.urgency} />
            <h3 className="line-clamp-1 min-w-0 text-base font-medium text-foreground">
              {request.title}
            </h3>
            {request.is_delisted && (
              <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                <Prohibit className="size-3" />
                Delisted
              </span>
            )}
          </div>
          {hasDescription && (
            <CaretDown
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          )}
        </div>

        {/* Metadata */}
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {getRequesterShortName(request.requester)}
          </span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <Icon className="size-3.5" />
            {request.category}
          </span>
          {hasPositiveBudget(request.budget_min, request.budget_max) && (
            <>
              <span>&middot;</span>
              <span>Budget: {formatBudget(request.budget_min, request.budget_max)}</span>
              {request.is_negotiable && (
                <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Negotiable
                </span>
              )}
            </>
          )}
          <span>&middot;</span>
          <span>{formatTimeAgo(request.created_at)}</span>
        </p>

        {/* Action row */}
        <div className="mt-1 flex items-center gap-2 text-xs">
          {rightAction ? (
            <div onClick={(e) => e.stopPropagation()}>{rightAction}</div>
          ) : variant === "owner" || isOwn ? (
            <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-3 text-xs" onClick={handleEdit}>
                <PencilSimple className="size-3" />
                Edit
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-3 text-xs" onClick={(e) => { e.stopPropagation(); setConfirmAction("fulfilled"); }}>
                <Check className="size-3 text-primary" />
                Fulfilled
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-3 text-xs" onClick={(e) => { e.stopPropagation(); setConfirmAction("closed"); }}>
                <XCircle className="size-3 text-muted-foreground" />
                Close
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-3 text-xs text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmAction("delete"); }}>
                <Trash className="size-3" />
                Delete
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleIHaveThis}
              className="h-7 px-3 text-xs"
            >
              I Have This
            </Button>
          )}

          {showMenu && (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="More options"
                    className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <DotsThree className="size-4" weight="bold" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {canReport && (
                    <DropdownMenuItem onClick={() => setReportOpen(true)}>
                      <Flag className="size-4" />
                      Report request
                    </DropdownMenuItem>
                  )}
                  {isAdmin && request.is_delisted && (
                    <DropdownMenuItem onClick={() => setAdminConfirm("restore")}>
                      <ArrowCounterClockwise className="size-4" />
                      Restore (admin)
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setAdminConfirm("takedown")}
                    >
                      <Trash className="size-4" />
                      Take down (admin)
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Expandable description */}
        {hasDescription && (
          <div
            className="grid transition-all duration-200 ease-in-out"
            style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden">
              <p className="pb-1 pt-2 text-sm leading-relaxed text-muted-foreground">
                {request.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Report dialog */}
      <div onClick={(e) => e.stopPropagation()}>
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetType="request"
          onConfirm={(reason, details) => reportRequest(request.id, reason, details)}
        />
      </div>

      {/* Admin moderation confirmation */}
      <AlertDialog open={!!adminConfirm} onOpenChange={(o) => { if (!o) { setAdminConfirm(null); setTakedownReason(""); } }}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {adminConfirm === "restore" && "Restore this request?"}
              {adminConfirm === "takedown" && "Permanently take down this request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {adminConfirm === "restore" && "It will become visible to everyone again. The requester is notified."}
              {adminConfirm === "takedown" && "This permanently removes the request for everyone, including the requester. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {adminConfirm === "takedown" && (
            <div className="space-y-1.5">
              <Textarea
                placeholder="Reason for takedown (required, sent to the requester)…"
                value={takedownReason}
                onChange={(e) => setTakedownReason(e.target.value.slice(0, 300))}
                rows={3}
                maxLength={300}
              />
              <p className={`text-right text-xs ${takedownReason.length >= 300 ? "text-destructive" : "text-muted-foreground"}`}>
                {takedownReason.length}/300
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); runAdminAction(); }}
              disabled={acting || (adminConfirm === "takedown" && !takedownReason.trim())}
              className={adminConfirm === "takedown" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {adminConfirm === "restore" && "Restore"}
              {adminConfirm === "takedown" && "Take Down"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Owner action confirmation */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => { if (!o) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "fulfilled" ? "Mark as fulfilled?" : confirmAction === "delete" ? "Delete this request?" : "Close this request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "fulfilled"
                ? "This marks the request as completed and removes it from the public list."
                : confirmAction === "delete"
                ? "Are you sure you want to delete this request? This cannot be undone."
                : "This closes the request without marking it as fulfilled."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={acting}
              className={confirmAction === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction === "fulfilled" ? "Mark as Fulfilled" : confirmAction === "delete" ? "Delete" : "Close Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image lightbox */}
      {lightboxOpen && cover && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
        >
          <button
            type="button"
            aria-label="Close image"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={cover}
              alt={request.title}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── List Skeleton ────────────────────────────────────────────────────────────

export function RequestRowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
      <div className="size-16 shrink-0 animate-pulse rounded-md bg-muted sm:size-20" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-3/5 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-7 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
