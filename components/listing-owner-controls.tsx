"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteListing } from "@/lib/actions/listings";

/**
 * Self-service removal for the listing's owner — shown on the detail page in the
 * same spot the admin take-down control occupies for other people's listings.
 * Works for any owner, including admins viewing their own listing.
 */
export function ListingOwnerControls({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      await deleteListing(listingId);
      toast.success("Listing removed.");
      router.push("/profile");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove listing.");
      setBusy(false);
      setConfirm(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => setConfirm(true)}
        className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-destructive"
      >
        <Trash className="size-3.5" />
        Remove my listing
      </button>

      <AlertDialog open={confirm} onOpenChange={(o) => { if (!o) setConfirm(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your listing from the marketplace. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); run(); }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
