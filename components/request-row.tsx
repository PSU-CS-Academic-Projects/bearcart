"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Book,
  Desktop,
  TShirt,
  Hamburger,
  GraduationCap,
  Wrench,
  DotsThree,
  Package,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/listing-helpers";
import {
  getRequesterShortName,
  formatBudget,
  urgencyLabel,
  getRequestCoverImage,
} from "@/lib/request-helpers";
import type { RequestRow as RequestRowType, RequestUrgency } from "@/lib/actions/requests";

// ─── Category Icon Lookup ─────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Books: Book,
  Electronics: Desktop,
  Clothing: TShirt,
  Food: Hamburger,
  "School Supplies": GraduationCap,
  Services: Wrench,
  Others: DotsThree,
};

function categoryIconFor(category: string): React.ComponentType<{ className?: string }> {
  // Exact match first, fall back to lowercase comparison, fall back to Package
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  const found = Object.entries(CATEGORY_ICONS).find(
    ([k]) => k.toLowerCase() === category.toLowerCase()
  );
  return found ? found[1] : Package;
}

// ─── Urgency Badge ────────────────────────────────────────────────────────────

const URGENCY_STYLES: Record<RequestUrgency, string> = {
  not_urgent: "bg-muted text-muted-foreground",
  moderate: "bg-amber-tint text-foreground",
  urgent: "bg-destructive/10 text-destructive",
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
  /** ID of the current logged-in user, or null */
  currentUserId: string | null;
  /** Variant changes the right action; default shows "I Have This" */
  variant?: "default" | "owner";
  /** Custom right-side action node (used by profile page) */
  rightAction?: React.ReactNode;
}

export function RequestRow({
  request,
  currentUserId,
  variant = "default",
  rightAction,
}: RequestRowProps) {
  const router = useRouter();
  const Icon = categoryIconFor(request.category);
  const isOwn = currentUserId === request.requester_id;
  const cover = getRequestCoverImage(request);

  const handleRowClick = () => {
    router.push(`/requests/${request.id}`);
  };

  const handleIHaveThis = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      router.push(`/auth/login?returnTo=/requests/${request.id}`);
      return;
    }
    router.push(`/requests/${request.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/requests/${request.id}/edit`);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className="group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50 sm:gap-4 sm:px-5 sm:py-4"
    >
      {/* Left section */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Line 1: icon + urgency + title */}
        <div className="flex flex-wrap items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <UrgencyBadge urgency={request.urgency} />
          <h3 className="line-clamp-2 min-w-0 font-semibold text-foreground transition-colors group-hover:text-primary">
            {request.title}
          </h3>
        </div>

        {/* Line 2: metadata */}
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {getRequesterShortName(request.requester)}
          </span>
          {" · "}
          {request.category}
          {" · "}
          {formatBudget(request.budget_min, request.budget_max)}
          {" · "}
          {formatTimeAgo(request.created_at)}
        </p>

        {/* Line 3: action button */}
        <div className="mt-1.5">
          {rightAction ? (
            <div onClick={(e) => e.stopPropagation()}>{rightAction}</div>
          ) : variant === "owner" || isOwn ? (
            <button
              type="button"
              onClick={handleEdit}
              className="text-xs font-medium text-primary transition-colors hover:underline"
            >
              Edit
            </button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleIHaveThis}
              className="h-8"
            >
              I Have This
            </Button>
          )}
        </div>
      </div>

      {/* Right section: image (if exists) */}
      {cover && (
        <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted sm:size-16">
          <Image
            src={cover}
            alt={request.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
    </div>
  );
}

// ─── List Skeleton ────────────────────────────────────────────────────────────

export function RequestRowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="size-4 shrink-0 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-7 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
