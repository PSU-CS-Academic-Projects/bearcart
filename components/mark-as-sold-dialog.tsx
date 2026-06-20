"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toStorageUrl } from "@/lib/storage-url";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SpinnerGap } from "@phosphor-icons/react";
import { getListingChatters } from "@/lib/actions/listings";

interface Chatter {
  id: string;
  name: string;
  avatar: string;
}

interface MarkAsSoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  /** Called with the selected buyer's user ID, or undefined if skipped. */
  onConfirm: (soldToUserId?: string) => Promise<void>;
  /** Set false when marking from inside a chat — skips the buyer selector. */
  showBuyerSelector?: boolean;
}

export function MarkAsSoldDialog({
  open,
  onOpenChange,
  listingId,
  onConfirm,
  showBuyerSelector = true,
}: MarkAsSoldDialogProps) {
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [loadingChatters, setLoadingChatters] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<string>("none");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedBuyer("none");
      setChatters([]);
      return;
    }
    if (!showBuyerSelector) return;

    setLoadingChatters(true);
    getListingChatters(listingId)
      .then(setChatters)
      .catch(() => setChatters([]))
      .finally(() => setLoadingChatters(false));
  }, [open, listingId, showBuyerSelector]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(selectedBuyer !== "none" ? selectedBuyer : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as Sold?</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this listing as sold? It will be hidden from the marketplace.
          </DialogDescription>
        </DialogHeader>

        {showBuyerSelector && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Who did you sell it to?{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </p>

            {loadingChatters ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SpinnerGap className="size-4 animate-spin" />
                Loading interested buyers…
              </div>
            ) : chatters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No interested buyers found.</p>
            ) : (
              <RadioGroup
                value={selectedBuyer}
                onValueChange={setSelectedBuyer}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="none" id="sold-buyer-none" />
                  <Label htmlFor="sold-buyer-none" className="font-normal text-muted-foreground">
                    Skip / not listed
                  </Label>
                </div>
                {chatters.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <RadioGroupItem value={c.id} id={`sold-buyer-${c.id}`} />
                    <Label
                      htmlFor={`sold-buyer-${c.id}`}
                      className="flex cursor-pointer items-center gap-2 font-normal"
                    >
                      {c.avatar ? (
                        <Image
                          src={toStorageUrl(c.avatar)}
                          alt={c.name}
                          width={24}
                          height={24}
                          unoptimized
                          className="size-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {c.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? (
              <>
                <SpinnerGap className="size-4 animate-spin" />
                Marking…
              </>
            ) : (
              "Yes, Mark as Sold"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
