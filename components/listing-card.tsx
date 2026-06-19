import Image from "next/image";
import Link from "next/link";
import { User } from "@phosphor-icons/react/dist/ssr";
import { formatListingPrice } from "@/lib/listing-helpers";
import { toStorageUrl } from "@/lib/storage-url";

interface ListingCardProps {
  id: string;
  slug?: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  sellerName: string;
  sellerAvatar: string;
  timePosted: string;
  createdAt: string;
  updatedAt?: string;
  imageUrl: string;
  /** Eager-load the cover image when the card is above the fold (improves LCP). */
  priority?: boolean;
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-[oklch(0.88_0_0)] bg-white shadow-sm">
      <div className="aspect-square animate-pulse bg-[oklch(0.93_0_0)]" />
      <div className="p-3">
        <div className="mb-1.5 h-5 w-1/3 animate-pulse rounded-sm bg-[oklch(0.93_0_0)]" />
        <div className="mb-1 h-4 w-3/4 animate-pulse rounded-sm bg-[oklch(0.93_0_0)]" />
        <div className="h-4 w-1/2 animate-pulse rounded-sm bg-[oklch(0.93_0_0)]" />
        <div className="mt-2 flex items-center gap-1.5">
          <div className="size-4 animate-pulse rounded-full bg-[oklch(0.93_0_0)]" />
          <div className="h-3 w-28 animate-pulse rounded-sm bg-[oklch(0.93_0_0)]" />
        </div>
      </div>
    </div>
  );
}

export function ListingCard({
  id,
  slug,
  title,
  price,
  category,
  condition,
  sellerName,
  sellerAvatar,
  timePosted,
  createdAt,
  updatedAt,
  imageUrl,
  priority = false,
}: ListingCardProps) {
  const parts = sellerName.trim().split(" ");
  const displayName = parts.length >= 2
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0];

    const wasUpdated =
  updatedAt && Math.abs(new Date(updatedAt).getTime() - new Date(createdAt).getTime()) > 60000;

  const tooltipDate = wasUpdated ? updatedAt : createdAt;
  const tooltipLabel = wasUpdated ? "Updated" : "Posted";

  return (
    <Link href={`/listings/${slug ?? id}`} className="group block">
      <article className="animate-in fade-in duration-300 overflow-hidden rounded-sm border border-[oklch(0.88_0_0)] bg-white shadow-sm group-hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-[oklch(0.96_0_0)]">
          {imageUrl ? (
            <Image src={toStorageUrl(imageUrl)} alt={title} fill unoptimized priority={priority} className="object-cover" />
          ) : (
            <Image src="/bearcart-placeholder.svg" alt="" fill unoptimized className="object-contain opacity-40" />
          )}
          {/* Category badge */}
          <div className="absolute left-2 top-2">
            <span className="rounded-sm bg-[oklch(0.2_0_0)]/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {category}
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-lg font-bold text-[oklch(0.585_0.144_55)] leading-tight">{formatListingPrice(price)}</p>
          <h3 className="mt-1 line-clamp-2 min-h-[2lh] text-sm font-medium text-[oklch(0.2_0_0)]">{title}</h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[oklch(0.5_0_0)]">
            <div className="relative size-4 shrink-0 overflow-hidden rounded-full bg-[oklch(0.92_0_0)]">
              {sellerAvatar ? (
                <Image src={toStorageUrl(sellerAvatar)} alt={displayName} fill unoptimized sizes="16px" className="object-cover" />
              ) : (
                <User className="size-full p-0.5" />
              )}
            </div>
           <span
              title={`${tooltipLabel} ${new Date(tooltipDate).toLocaleString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}`}
            >
              {displayName} · {timePosted} · {condition}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
