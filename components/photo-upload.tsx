"use client";

import { useCallback, useState, useRef } from "react";
import { CloudArrowUp, X, Star, DotsSixVertical } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Magic byte detection ─────────────────────────────────────────────────────
// Reads the first 12 bytes of a file and returns the actual MIME type.
// This catches files renamed with a different extension (e.g. a GIF saved as .jpg).

function detectMimeFromBytes(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buf = new Uint8Array(e.target!.result as ArrayBuffer);
      // JPEG: FF D8 FF
      if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return resolve("image/jpeg");
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return resolve("image/png");
      // WebP: RIFF????WEBP
      if (
        buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
      ) return resolve("image/webp");
      resolve(null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  error?: string;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  error,
  disabled = false,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File validation ───────────────────────────────────────────────────────

  const validateAndProcessFiles = useCallback(
    async (files: File[]) => {
      setFileError(null);
      const errors: string[] = [];
      const validFiles: File[] = [];

      for (const file of files) {
        // Extension check
        const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          errors.push(`"${file.name}" — Only JPG, PNG, and WEBP files are allowed`);
          continue;
        }

        // Magic byte check — catches files renamed with a wrong extension
        const actualType = await detectMimeFromBytes(file);
        if (!actualType || !ALLOWED_TYPES.includes(actualType)) {
          errors.push(`"${file.name}" — Only JPG, PNG, and WEBP files are allowed`);
          continue;
        }

        // Size check
        if (file.size > MAX_FILE_SIZE) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
          errors.push(`"${file.name}" is ${sizeMB} MB — max 5 MB per photo`);
          continue;
        }

        validFiles.push(file);
      }

      const remainingSlots = maxPhotos - photos.length;
      if (validFiles.length > remainingSlots) {
        errors.push(`Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} allowed`);
      }

      if (errors.length > 0) {
        setFileError(errors.join(". "));
      }

      const filesToProcess = validFiles.slice(0, remainingSlots);
      const newPhotos = [...photos];

      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newPhotos.push(result);
          if (newPhotos.length === photos.length + filesToProcess.length) {
            onPhotosChange([...newPhotos]);
          }
        };
        reader.readAsDataURL(file);
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [photos, maxPhotos, onPhotosChange]
  );

  // ── Drag & drop zone ─────────────────────────────────────────────────────

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
      if (disabled) return;
      validateAndProcessFiles(Array.from(e.dataTransfer.files));
    },
    [disabled, validateAndProcessFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndProcessFiles(Array.from(e.target.files));
    }
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
    setFileError(null);
  };

  // ── Drag to reorder ───────────────────────────────────────────────────────

  const handleThumbDragStart = (index: number) => setDragIndex(index);

  const handleThumbDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const handleThumbDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const next = [...photos];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dragOverIndex, 0, moved);
      onPhotosChange(next);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const displayError = fileError || error;
  const isMaxReached = photos.length >= maxPhotos;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          disabled && "pointer-events-none opacity-50",
          isDragging
            ? "border-primary bg-primary/5"
            : displayError
              ? "border-destructive bg-destructive/5"
              : "border-border hover:border-primary hover:bg-muted/50",
          isMaxReached && !disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileInput}
          className="sr-only"
          disabled={isMaxReached || disabled}
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
          Accepts JPG, PNG, WEBP. Max 5 MB per photo.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {photos.length} / {maxPhotos} photos uploaded
        </p>
      </label>

      {/* Inline error */}
      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}

      {/* Photo Previews — draggable to reorder */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((photo, index) => (
            <div
              key={`${index}-${photo.slice(-20)}`}
              draggable={!disabled}
              onDragStart={() => handleThumbDragStart(index)}
              onDragOver={(e) => handleThumbDragOver(e, index)}
              onDragEnd={handleThumbDragEnd}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all",
                dragIndex === index && "opacity-40",
                dragOverIndex === index && dragIndex !== index && "ring-2 ring-primary",
                !disabled && "cursor-grab active:cursor-grabbing"
              )}
            >
              <img
                src={photo}
                alt={`Upload ${index + 1}`}
                className="size-full object-cover"
                draggable={false}
              />
              {index === 0 && (
                <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                  <Star className="size-3" />
                  Cover
                </div>
              )}
              {!disabled && (
                <div className="absolute bottom-1 left-1 flex size-6 items-center justify-center rounded bg-foreground/60 text-background opacity-0 transition-opacity group-hover:opacity-100">
                  <DotsSixVertical className="size-4" />
                </div>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 transition-opacity hover:bg-foreground group-hover:opacity-100"
                >
                  <X className="size-4" />
                  <span className="sr-only">Remove photo</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Drag photos to reorder. First photo is the cover.
        </p>
      )}
    </div>
  );
}
