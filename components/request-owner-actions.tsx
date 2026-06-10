"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { PencilSimple, Check, XCircle } from "@phosphor-icons/react";
import { markRequestFulfilled, closeRequest } from "@/lib/actions/requests";
import { toast } from "sonner";

interface RequestOwnerActionsProps {
  requestId: string;
}

export function RequestOwnerActions({ requestId }: RequestOwnerActionsProps) {
  const router = useRouter();
  const [action, setAction] = useState<"fulfilled" | "closed" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!action) return;
    setLoading(true);
    try {
      if (action === "fulfilled") {
        await markRequestFulfilled(requestId);
        toast.success("Request marked as fulfilled!");
      } else {
        await closeRequest(requestId);
        toast.success("Request closed.");
      }
      router.push("/requests");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={() => router.push(`/requests/${requestId}/edit`)}
        >
          <PencilSimple className="size-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={() => setAction("fulfilled")}
        >
          <Check className="size-3.5 text-primary" />
          Fulfilled
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={() => setAction("closed")}
        >
          <XCircle className="size-3.5 text-muted-foreground" />
          Close
        </Button>
      </div>

      <AlertDialog open={!!action} onOpenChange={(o) => { if (!o) setAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "fulfilled" ? "Mark as fulfilled?" : "Close this request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "fulfilled"
                ? "This marks the request as completed. It will be removed from the public list."
                : "This closes the request without marking it as fulfilled."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {action === "fulfilled" ? "Mark as Fulfilled" : "Close Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
