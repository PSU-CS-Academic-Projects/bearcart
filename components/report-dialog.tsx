"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  REPORT_REASONS,
  REPORT_DETAILS_MAX,
  type ReportTargetType,
} from "@/lib/actions/reports";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  /** Runs the actual report server action. */
  onConfirm: (reason: string, details: string) => Promise<void>;
}

export function ReportDialog({ open, onOpenChange, targetType, onConfirm }: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason("");
    setDetails("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(reason, details.trim());
      toast.success("Thank you. Our admins will review this report.");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Report this {targetType}</DialogTitle>
          <DialogDescription>
            Let us know what&rsquo;s wrong and our admins will review it.
            {targetType === "message" && " The reported message and its context may be reviewed by admins."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label>Reason</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <RadioGroupItem value={r} id={`report-reason-${r}`} />
                  <Label htmlFor={`report-reason-${r}`} className="font-normal">{r}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-dialog-details">
              Additional details <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="report-dialog-details"
              placeholder="Describe the issue..."
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, REPORT_DETAILS_MAX))}
              rows={3}
              maxLength={REPORT_DETAILS_MAX}
              className="break-words"
            />
            <p className={`text-right text-xs ${details.length >= REPORT_DETAILS_MAX ? "text-destructive" : "text-muted-foreground"}`}>
              {details.length}/{REPORT_DETAILS_MAX}
              {details.length >= REPORT_DETAILS_MAX && "  Character limit reached"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button disabled={!reason || submitting} onClick={handleSubmit}>
            {submitting ? "Submitting…" : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
