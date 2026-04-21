"use client";

import { Tag } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const listingTypes = [
  {
    value: "for-sale",
    label: "For Sale",
    description: "Sell your item at a fixed price",
    icon: Tag,
  },
];

interface ListingTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ListingTypeSelector({
  value,
  onChange,
  error,
}: ListingTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3">
        {listingTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 text-left transition-colors",
                value === type.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : error
                    ? "border-destructive"
                    : "border-border hover:border-primary hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  value === type.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <span
                  className={cn(
                    "font-medium",
                    value === type.value ? "text-primary" : "text-foreground"
                  )}
                >
                  {type.label}
                </span>
                <p className="text-sm text-muted-foreground">
                  {type.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
