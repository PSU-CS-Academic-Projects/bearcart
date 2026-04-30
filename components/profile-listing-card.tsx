"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  DotsThreeVertical,
  PencilSimple,
  Trash,
  CheckCircle,
  Heart,
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
    <Card className="group relative overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Sold overlay */}
      {variant === "sold" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/60">
          <Badge className="bg-emerald-100 px-4 py-2 text-lg font-bold text-emerald-800">
            SOLD
          </Badge>
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Badges overlay */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <Badge className="bg-primary text-primary-foreground">{category}</Badge>
          <Badge variant="secondary">{condition}</Badge>
        </div>

        {/* Action menu for active listings — only shown when handlers are provided */}
        {variant === "active" && (onEdit || onMarkSold || onDelete) && (
          <div className="absolute right-2 top-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-8 bg-background/90 backdrop-blur-sm"
                >
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
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="size-4" />
                    Delete Listing
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Remove from saved button */}
        {variant === "saved" && (
          <div className="absolute right-2 top-2">
            <Button
              size="icon"
              variant="secondary"
              className="size-8 bg-background/90 backdrop-blur-sm"
              onClick={onRemoveSaved}
            >
              <Heart className="size-4 text-primary" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        {/* Title and Price */}
        <div>
          <h3 className="line-clamp-2 font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-1 text-lg font-bold text-primary">
            ₱{price.toLocaleString()}
          </p>
        </div>

        {/* Time info */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {variant === "sold" && dateSold ? `Sold ${dateSold}` : timePosted}
        </div>
      </div>
    </Card>
  );
}
