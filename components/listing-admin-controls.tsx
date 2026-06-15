"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwise, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  adminRestoreListing,
  adminTakedownListing,
} from "@/lib/actions/admin";

type Action = "restore" | "takedown";

export function ListingAdminControls({
  listingId,
  isDelisted,
}: {
  listingId: string;
  isDelisted: boolean;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm === "restore") {
        await adminRestoreListing(listingId);
        toast.success("Listing restored.");
      } else {
        if (!reason.trim()) { toast.error("A reason is required."); setBusy(false); return; }
        await adminTakedownListing(listingId, reason.trim());
        toast.success("Listing permanently taken down.");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
      setConfirm(null);
      setReason("");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isDelisted && (
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setConfirm("restore")}>
          <ArrowCounterClockwise className="size-4" /> Restore
        </Button>
      )}
      <button
        onClick={() => setConfirm("takedown")}
        className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-primary"
      >
        <Warning className="size-3.5" />
        Take down this listing as admin
      </button>

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) { setConfirm(null); setReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "restore" && "Restore this listing?"}
              {confirm === "takedown" && "Permanently take down this listing?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "restore" && "It will become visible to everyone again. The seller is notified."}
              {confirm === "takedown" && "This permanently removes the listing for everyone, including the seller. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirm === "takedown" && (
            <div className="space-y-1.5">
              <Textarea
                placeholder="Reason for takedown (required, sent to the seller)…"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 300))}
                rows={3}
                maxLength={300}
              />
              <p className={`text-right text-xs ${reason.length >= 300 ? "text-destructive" : "text-muted-foreground"}`}>
                {reason.length}/300
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); run(); }}
              disabled={busy || (confirm === "takedown" && !reason.trim())}
              className={confirm === "takedown" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirm === "restore" && "Restore"}
              {confirm === "takedown" && "Take Down"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
