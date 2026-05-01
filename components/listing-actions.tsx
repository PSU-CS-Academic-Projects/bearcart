"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookmarkSimple, ChatCircle, ShareNetwork, PencilSimple } from "@phosphor-icons/react";
import { toggleSaveListing } from "@/lib/actions/saved";
import { getOrCreateConversation } from "@/lib/actions/messages";
import { toast } from "sonner";

interface ListingActionsProps {
  listingId: string;
  sellerId: string;
  /** The currently logged-in user's ID, or null if not logged in */
  currentUserId: string | null;
  /** Whether the current user has already saved this listing */
  initialSaved: boolean;
}

export function ListingActions({
  listingId,
  sellerId,
  currentUserId,
  initialSaved,
}: ListingActionsProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const isLoggedIn = !!currentUserId;
  const isOwnListing = currentUserId === sellerId;

  const handleSave = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?returnTo=/listings/${listingId}`);
      return;
    }
    // Optimistic update
    setIsSaved((prev) => !prev);
    startTransition(async () => {
      try {
        const saved = await toggleSaveListing(listingId);
        setIsSaved(saved);
        toast.success(saved ? "Listing saved!" : "Removed from saved");
      } catch {
        setIsSaved((prev) => !prev); // revert on error
        toast.error("Failed to update saved status");
      }
    });
  };

  const handleMessage = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?returnTo=/listings/${listingId}`);
      return;
    }
    startTransition(async () => {
      try {
        const conversationId = await getOrCreateConversation(listingId, sellerId);
        router.push(`/messages?conversation=${conversationId}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to start conversation"
        );
      }
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  return (
    <>
      {/* Desktop Actions */}
      <div className="hidden flex-col gap-2 lg:flex">
        {isOwnListing ? (
          <Button className="h-9 w-full" asChild>
            <a href={`/listings/${listingId}/edit`}>
              <PencilSimple className="size-4" />
              Edit Listing
            </a>
          </Button>
        ) : (
          <Button
            className="h-9 w-full"
            onClick={handleMessage}
            disabled={isPending}
          >
            <ChatCircle className="size-4" />
            {isLoggedIn ? "Message Seller" : "Login to Message"}
          </Button>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-8 flex-1 text-xs"
            onClick={handleSave}
            disabled={isPending}
          >
            <BookmarkSimple
              className="size-4"
              weight={isSaved ? "fill" : "regular"}
            />
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button
            variant="outline"
            className="h-8 flex-1 text-xs"
            onClick={handleShare}
          >
            <ShareNetwork className="size-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card p-2.5 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={handleSave}
            disabled={isPending}
          >
            <BookmarkSimple
              className="size-5"
              weight={isSaved ? "fill" : "regular"}
            />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={handleShare}
          >
            <ShareNetwork className="size-5" />
          </Button>
          {isOwnListing ? (
            <Button className="h-9 flex-1" asChild>
              <a href={`/listings/${listingId}/edit`}>
                <PencilSimple className="size-4" />
                Edit Listing
              </a>
            </Button>
          ) : (
            <Button
              className="h-9 flex-1"
              onClick={handleMessage}
              disabled={isPending}
            >
              <ChatCircle className="size-4" />
              {isLoggedIn ? "Message Seller" : "Login to Message"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
