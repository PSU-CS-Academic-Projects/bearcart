"use client";

import { useCallback, useState } from "react";
import { CloudArrowUp, Image as ImageIcon, X, Star } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  error?: string;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  error,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [photos, maxPhotos]
  );

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(
      (file) => file.type === "image/jpeg" || file.type === "image/png"
    );
    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = imageFiles.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPhotosChange([...photos, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : error
              ? "border-destructive bg-destructive/5"
              : "border-border hover:border-primary hover:bg-muted/50",
          photos.length >= maxPhotos && "pointer-events-none opacity-50"
        )}
      >
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={handleFileInput}
          className="sr-only"
          disabled={photos.length >= maxPhotos}
        />
        <CloudArrowUp
          className={cn(
            "mb-3 size-12",
            isDragging ? "text-primary" : "text-muted-foreground"
          )}
        />
        <p className="mb-1 text-sm font-medium text-foreground">
          Drag photos here or click to upload
        </p>
        <p className="text-xs text-muted-foreground">
          Accepts JPG, PNG. Max {maxPhotos} photos.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {photos.length} / {maxPhotos} photos uploaded
        </p>
      </label>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <img
                src={photo}
                alt={`Upload ${index + 1}`}
                className="size-full object-cover"
              />
              {/* Cover Photo Badge */}
              {index === 0 && (
                <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                  <Star className="size-3" weight="fill" />
                  Cover
                </div>
              )}
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 transition-opacity hover:bg-foreground group-hover:opacity-100"
              >
                <X className="size-4" />
                <span className="sr-only">Remove photo</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
