"use client";

import { useEffect, useState } from "react";
import { Flag } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { ReportDialog } from "@/components/report-dialog";
import { reportListing } from "@/lib/actions/reports";

export function ReportListingModal({
  listingId,
  posterId,
}: {
  listingId: string;
  posterId: string;
}) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  // Hide for guests and for the poster's own listing
  if (currentUserId === null || currentUserId === posterId) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-destructive"
      >
        <Flag className="size-3.5" />
        Report this listing
      </button>

      <ReportDialog
        open={open}
        onOpenChange={setOpen}
        targetType="listing"
        onConfirm={(reason, details) => reportListing(listingId, reason, details)}
      />
    </>
  );
}
