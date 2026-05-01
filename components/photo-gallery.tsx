"use client";

import { useState } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight, ShoppingBag } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
}

export function PhotoGallery({ photos, alt }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full">
        <div className="flex aspect-square items-center justify-center rounded-xl border border-border bg-muted">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ShoppingBag className="size-16" />
            <span className="text-sm">No photos available</span>
          </div>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary/40">
        <Image
          src={photos[activeIndex]}
          alt={`${alt} - Photo ${activeIndex + 1}`}
          fill
          className="object-contain"
          priority
        />

        {photos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 size-10 -translate-y-1/2 shadow-md"
              onClick={goToPrevious}
              aria-label="Previous photo"
            >
              <CaretLeft className="size-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 size-10 -translate-y-1/2 shadow-md"
              onClick={goToNext}
              aria-label="Next photo"
            >
              <CaretRight className="size-5" />
            </Button>
          </>
        )}

        <div className="absolute bottom-3 right-3 rounded-full bg-foreground/75 px-3 py-1 text-sm font-medium text-background">
          {activeIndex + 1} / {photos.length}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((photo, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "relative aspect-square w-16 shrink-0 overflow-hidden rounded-md border bg-card sm:w-[72px]",
              activeIndex === index
                ? "border-primary ring-2 ring-primary/35"
                : "border-border opacity-80 hover:opacity-100"
            )}
            aria-label={`View photo ${index + 1}`}
          >
            <Image
              src={photo}
              alt={`${alt} thumbnail ${index + 1}`}
              fill
              className="object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
