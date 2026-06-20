"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CaretLeft, CaretRight, ShoppingBag, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toStorageUrl } from "@/lib/storage-url";
import { createPortal } from "react-dom";

interface PhotoGalleryProps {
  photos: string[];
  alt: string;
}

export function PhotoGallery({ photos, alt }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = photos?.length ?? 0;

  // Lightbox keyboard controls: Escape closes, ←/→ navigate.
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowLeft") setActiveIndex((p) => (p === 0 ? total - 1 : p - 1));
      else if (e.key === "ArrowRight") setActiveIndex((p) => (p === total - 1 ? 0 : p + 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, total]);

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
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="View image full screen"
        >
          <Image
            src={toStorageUrl(photos[activeIndex])}
            alt={`${alt} - Photo ${activeIndex + 1}`}
            fill
            unoptimized
            className="object-contain"
            priority
          />
        </button>

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
              src={toStorageUrl(photo)}
              alt={`${alt} thumbnail ${index + 1}`}
              fill
              unoptimized
              className="object-contain"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen lightbox */}
      {lightboxOpen && createPortal (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            type="button"
            aria-label="Close image"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
            >
              <CaretLeft className="size-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={toStorageUrl(photos[activeIndex])}
              alt={`${alt} - Photo ${activeIndex + 1} of ${photos.length}`}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
            >
              <CaretRight className="size-6" />
            </button>
          )}

          {/* Dots + counter */}
          {photos.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to image ${i + 1}`}
                    aria-current={i === activeIndex}
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      i === activeIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium tabular-nums text-white/90">
                {activeIndex + 1} / {photos.length}
              </span>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
