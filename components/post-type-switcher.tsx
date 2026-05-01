"use client";

import { useState } from "react";
import { ListBullets, MagnifyingGlass } from "@phosphor-icons/react";
import { PostListingForm } from "@/components/post-listing-form";
import { PostRequestForm } from "@/components/post-request-form";
import { cn } from "@/lib/utils";

type PostType = "listing" | "request";

const options: {
  value: PostType;
  label: string;
  description: string;
  icon: typeof ListBullets;
}[] = [
  {
    value: "listing",
    label: "Post a Listing",
    description: "Sell or trade something you have",
    icon: ListBullets,
  },
  {
    value: "request",
    label: "Post a Request",
    description: "Ask the community for what you need",
    icon: MagnifyingGlass,
  },
];

interface PostTypeSwitcherProps {
  initialType?: PostType;
}

export function PostTypeSwitcher({ initialType = "listing" }: PostTypeSwitcherProps) {
  const [postType, setPostType] = useState<PostType>(initialType);
  const ActiveForm = postType === "listing" ? PostListingForm : PostRequestForm;

  return (
    <>
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5">
          <div className="max-w-2xl">
            <h1 className="text-lg font-semibold text-foreground">Create a post</h1>
            <p className="text-sm text-muted-foreground">
              Choose whether you are offering something or looking for something.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Post type">
            {options.map((option) => {
              const Icon = option.icon;
              const active = postType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPostType(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-20 min-w-0 items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && "border-primary bg-primary/10 ring-1 ring-primary"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary",
                      active && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-semibold leading-tight text-foreground">
                      {option.label}
                    </span>
                    <span
                      className={cn(
                        "whitespace-normal text-xs font-normal leading-snug text-muted-foreground",
                        active && "text-foreground/80"
                      )}
                    >
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ActiveForm />
    </>
  );
}
