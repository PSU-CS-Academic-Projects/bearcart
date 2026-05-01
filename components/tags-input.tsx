"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagsInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxTagLength?: number;
  disabled?: boolean;
}

export function TagsInput({
  tags,
  onTagsChange,
  placeholder = "Add tags and press Enter",
  maxTags = 5,
  maxTagLength = 20,
  disabled = false,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addTag = (rawTag: string) => {
    setError(null);
    const tag = rawTag.trim().toLowerCase();

    if (!tag) {
      setInputValue("");
      return;
    }
    if (tag.length > maxTagLength) {
      setError(`Tags must be ${maxTagLength} characters or less`);
      return;
    }
    if (tags.includes(tag)) {
      setError(`"${tag}" is already added`);
      setInputValue("");
      return;
    }
    if (tags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      setInputValue("");
      return;
    }

    onTagsChange([...tags, tag]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    setError(null);
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 shadow-xs transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="size-3" />
                <span className="sr-only">Remove {tag}</span>
              </button>
            )}
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setError(null);
            setInputValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={tags.length >= maxTags || disabled}
          maxLength={maxTagLength + 1}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Press Enter or comma to add a tag
          </p>
        )}
        <span
          className={cn(
            "text-xs",
            tags.length >= maxTags ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {tags.length} / {maxTags} tags
        </span>
      </div>
    </div>
  );
}
