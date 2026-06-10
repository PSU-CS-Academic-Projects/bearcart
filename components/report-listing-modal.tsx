"use client";

import { useState } from "react";
import { Flag } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const REASONS = [
  "Fake or misleading",
  "Inappropriate content",
  "Spam",
  "Other",
] as const;

export function ReportListingModal() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    setOpen(false);
    setReason("");
    setDetails("");
    toast.success("Thank you, we'll review this listing.");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-destructive"
      >
        <Flag className="size-3.5" />
        Report this listing
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report this listing</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Reason</Label>
              <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                {REASONS.map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <RadioGroupItem value={r} id={`reason-${r}`} />
                    <Label htmlFor={`reason-${r}`} className="font-normal">{r}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-details">Additional details <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="report-details"
                placeholder="Describe the issue..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!reason} onClick={handleSubmit}>Submit Report</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
