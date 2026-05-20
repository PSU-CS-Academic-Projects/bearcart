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

  return (
    <div className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/30 sm:gap-4 sm:px-5 sm:py-4">
      {/* Left section: image thumbnail */}
      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted sm:size-20">
        {cover ? (
          <a
            href={cover}
            target="_blank"
            rel="noreferrer"
            className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`View image for ${request.title}`}
          >
            <Image
              src={cover}
              alt={request.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              sizes="(max-width: 640px) 64px, 80px"
            />
          </a>
        ) : (
          <Icon className="size-8 text-muted-foreground opacity-50 sm:size-10" />
        )}
      </div>

      {/* Right section: content & actions */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        
        {/* Title + Urgency */}
        <div className="flex flex-wrap items-center gap-2">
          <UrgencyBadge urgency={request.urgency} />
          <h3 className="line-clamp-1 min-w-0 text-base font-medium text-foreground">
            {request.title}
          </h3>
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
          <span>&middot;</span>
          <span>{formatBudget(request.budget_min, request.budget_max)}</span>
          <span>&middot;</span>
          <span>{formatTimeAgo(request.created_at)}</span>
        </p>

        {/* Action row */}
        <div className="mt-1 flex items-center gap-2 text-xs">
          {rightAction ? (
            <div onClick={(e) => e.stopPropagation()}>{rightAction}</div>
          ) : variant === "owner" || isOwn ? (
            <button
              type="button"
              onClick={handleEdit}
              className="font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Edit
            </button>
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
        </div>
      </div>
    </div>
  );
}

// ─── List Skeleton ────────────────────────────────────────────────────────────

export function RequestRowSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
      {/* Thumbnail skeleton */}
      <div className="size-16 shrink-0 animate-pulse rounded-md bg-muted sm:size-20" />
      
      {/* Content skeleton */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
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
