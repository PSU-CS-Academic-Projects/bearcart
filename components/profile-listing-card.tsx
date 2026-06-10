"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "@phosphor-icons/react/dist/ssr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DotsThreeVertical,
  PencilSimple,
  CheckCircle,
  Heart,
  Trash,
} from "@phosphor-icons/react";

interface ProfileListingCardProps {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  timePosted: string;
  imageUrl: string;
  variant: "active" | "sold" | "saved";
  dateSold?: string;
  onEdit?: () => void;
  onMarkSold?: () => void;
  onDelete?: () => void;
  onRemoveSaved?: () => void;
}

export function ProfileListingCard({
  id,
  title,
  price,
  category,
  condition,
  timePosted,
  imageUrl,
  variant,
  dateSold,
  onEdit,
  onMarkSold,
  onDelete,
  onRemoveSaved,
}: ProfileListingCardProps) {
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

          {/* Sold overlay */}
          {variant === "sold" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-sm bg-white px-3 py-1 text-sm font-bold text-[oklch(0.2_0_0)]">
                SOLD
              </span>
            </div>
          )}

          {/* Action menu for active listings */}
          {variant === "active" && (onEdit || onMarkSold) && (
            <div
              className="absolute right-2 top-2 z-20 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="secondary" className="size-7 bg-white/90 backdrop-blur-sm">
                    <DotsThreeVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <PencilSimple className="size-4" />
                      Edit Listing
                    </DropdownMenuItem>
                  )}
                  {onMarkSold && (
                    <DropdownMenuItem onClick={onMarkSold}>
                      <CheckCircle className="size-4" />
                      Mark as Sold
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                      <Trash className="size-4" />
                      Remove Listing
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Remove from saved button */}
          {variant === "saved" && onRemoveSaved && (
            <div
              className="absolute right-2 top-2 z-20 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Button
                size="icon"
                variant="secondary"
                className="size-7 bg-white/90 backdrop-blur-sm"
                onClick={onRemoveSaved}
              >
                <Heart className="size-4 text-primary" weight="fill" />
              </Button>
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="text-lg font-bold leading-tight text-[oklch(0.585_0.144_55)]">
            ₱{price.toLocaleString()}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-[2lh] text-sm font-medium text-[oklch(0.2_0_0)]">
            {title}
          </h3>
          <p className="mt-1.5 text-xs text-[oklch(0.5_0_0)]">
            {variant === "sold" && dateSold ? `Sold ${dateSold}` : timePosted} · {condition}
          </p>
        </div>
      </article>
    </Link>
  );
}
