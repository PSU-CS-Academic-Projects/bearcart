import Image from "next/image";
import Link from "next/link";
import { User, ShoppingBag } from "@phosphor-icons/react/dist/ssr";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  sellerName: string;
  sellerAvatar: string;
  timePosted: string;
  imageUrl: string;
}

export function ListingCard({
  id,
  title,
  price,
  category,
  condition,
  sellerName,
  sellerAvatar,
  timePosted,
  imageUrl,
}: ListingCardProps) {
  const parts = sellerName.trim().split(" ");
  const displayName = parts.length >= 2
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : parts[0];

  return (
    <Link href={`/listings/${id}`} className="group block">
      <article className="overflow-hidden rounded-sm border border-[oklch(0.88_0_0)] bg-white shadow-sm group-hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-[oklch(0.96_0_0)]">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ShoppingBag className="size-12 text-[oklch(0.75_0_0)]" />
            </div>
          )}
          {/* Category badge */}
          <div className="absolute left-2 top-2">
            <span className="rounded-sm bg-[oklch(0.2_0_0)]/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {category}
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-lg font-bold text-[oklch(0.585_0.144_55)] leading-tight">₱{price.toLocaleString()}</p>
          <h3 className="mt-1 line-clamp-2 min-h-[2lh] text-sm font-medium text-[oklch(0.2_0_0)]">{title}</h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[oklch(0.5_0_0)]">
            <div className="relative size-4 shrink-0 overflow-hidden rounded-full bg-[oklch(0.92_0_0)]">
              {sellerAvatar ? (
                <Image src={sellerAvatar} alt={displayName} fill unoptimized className="object-cover" />
              ) : (
                <User className="size-full p-0.5" />
              )}
            </div>
            <span>{displayName} · {timePosted} · {condition}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
