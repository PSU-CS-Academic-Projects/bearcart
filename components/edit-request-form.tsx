"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Footer } from "@/components/footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { PhotoUpload } from "@/components/photo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  FloppyDisk,
  SpinnerGap,
  X,
  Check,
  XCircle,
  Trash,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  updateRequest,
  markRequestFulfilled,
  closeRequest,
  deleteRequest,
  type RequestRow,
  type RequestUrgency,
} from "@/lib/actions/requests";
import {
  formatCurrencyInput,
  parseCurrencyInput,
  shouldBlockCurrencyKey,
} from "@/lib/currency";

const CATEGORIES = [
  "Accessories",
  "Electronics",
  "Clothing",
  "Food",
  "School Supplies",
  "Services",
  "Others",
];

const URGENCIES: { value: RequestUrgency; label: string }[] = [
  { value: "not_urgent", label: "Flexible" },
  { value: "moderate", label: "Need Soon" },
  { value: "urgent", label: "Urgent" },
];

const TITLE_MAX = 100;
const DESC_MAX = 500;
const MAX_PHOTOS = 3;

interface ExistingImage {
  id: string;
  url: string;
}

interface FormErrors {
  title?: string;
  category?: string;
  description?: string;
  budget?: string;
}

function CharCounter({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  return (
    <span
      className={cn(
        "text-xs",
        ratio > 0.8 ? "text-destructive font-medium" : "text-muted-foreground"
      )}
    >
      {current} / {max} characters
    </span>
  );
}

interface EditRequestFormProps {
  request: RequestRow;
}

export function EditRequestForm({ request }: EditRequestFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"fulfilled" | "closed" | "delete" | null>(null);

  // Existing photos: stored with id + url so we can mark for deletion
  const initialExisting: ExistingImage[] = (request.request_images ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((img) => ({ id: img.id, url: img.image_url }));

  // photos = full ordered list (existing http URLs + new base64 data URLs)
  const [photos, setPhotos] = useState<string[]>(initialExisting.map((img) => img.url));
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  // url → id map for existing images, so removals can be reported by id
  const [imageIdMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialExisting.forEach((img) => { map[img.url] = img.id; });
    return map;
  });

  const [title, setTitle] = useState(request.title);
  const [category, setCategory] = useState(request.category);
  const [description, setDescription] = useState(request.description ?? "");
  const [budget, setBudget] = useState(
    request.budget_min !== null && request.budget_min > 0
      ? formatCurrencyInput(String(request.budget_min))
      : ""
  );
  const [negotiable, setNegotiable] = useState(request.is_negotiable ?? false);
  const [urgency, setUrgency] = useState<RequestUrgency>(request.urgency);
  const [errors, setErrors] = useState<FormErrors>({});

  const totalPhotos = photos.length;

  const handlePhotosChange = (updated: string[]) => {
    // Existing photos dropped from the list get reported for deletion by id.
    const removed = photos.filter((p) => p.startsWith("http") && !updated.includes(p));
    removed.forEach((url) => {
      const id = imageIdMap[url];
      if (id) setRemovedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    });
    setPhotos(updated);
  };

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!title.trim()) next.title = "Tell us what you're looking for";
    else if (title.length > TITLE_MAX) next.title = `Title must be ${TITLE_MAX} characters or less`;
    if (!category) next.category = "Please select a category";
    if (description.length > DESC_MAX) {
      next.description = `Description must be ${DESC_MAX} characters or less`;
    }
    const budgetNum = parseCurrencyInput(budget);
    if (budgetNum !== null && budgetNum < 1) next.budget = "Budget must be at least ₱1";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [title, category, description, budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const budgetNum = parseCurrencyInput(budget);
      await updateRequest({
        requestId: request.id,
        title: title.trim(),
        description: description.trim(),
        category,
        budget_min: budgetNum,
        budget_max: null,
        is_negotiable: negotiable,
        urgency,
        orderedPhotos: photos,
        removedImageIds: removedIds,
      });
      toast.success("Request updated!");
      router.push("/requests");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update request";
      toast.error(message);
      setSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setSubmitting(true);
    try {
      if (confirmAction === "fulfilled") {
        await markRequestFulfilled(request.id);
        toast.success("Request marked as fulfilled!");
      } else if (confirmAction === "closed") {
        await closeRequest(request.id);
        toast.success("Request closed");
      } else if (confirmAction === "delete") {
        await deleteRequest(request.id);
        toast.success("Request deleted");
      }
      router.push("/profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
      setSubmitting(false);
      setConfirmAction(null);
    }
  };

  const confirmConfig: Record<
    "fulfilled" | "closed" | "delete",
    { title: string; description: string; cta: string }
  > = {
    fulfilled: {
      title: "Mark as fulfilled?",
      description: "This will mark the request as completed and remove it from the public list.",
      cta: "Mark as Fulfilled",
    },
    closed: {
      title: "Close this request?",
      description: "This will close the request without marking it as fulfilled.",
      cta: "Close Request",
    },
    delete: {
      title: "Delete this request?",
      description: "This action cannot be undone. The request will be permanently removed.",
      cta: "Yes, Delete",
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-8">
            <Breadcrumb
              items={[
                { label: "Requests", href: "/requests" },
                { label: "Edit" },
              ]}
            />
            <h1 className="mt-4 text-2xl font-bold text-foreground">Edit Request</h1>
            <p className="text-muted-foreground">Update your request details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Status actions — top of form, same position as Mark as Sold in listing edit */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setConfirmAction("fulfilled")}
              >
                <Check className="size-4 text-emerald-600" />
                Mark as Fulfilled
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setConfirmAction("closed")}
              >
                <XCircle className="size-4 text-muted-foreground" />
                Close Request
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setConfirmAction("delete")}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="size-4" />
                Delete Request
              </Button>
            </div>

            <div className="h-px bg-border" />

            {/* Photos */}
            <section className="space-y-3">
              <div>
                <Label>Photos (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Up to {MAX_PHOTOS} photos. {totalPhotos} of {MAX_PHOTOS} used.
                </p>
              </div>

              <PhotoUpload
                photos={photos}
                onPhotosChange={handlePhotosChange}
                maxPhotos={MAX_PHOTOS}
                disabled={submitting}
              />
            </section>

            <div className="h-px bg-border" />

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-req-title">
                What are you looking for? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-req-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                disabled={submitting}
                className={cn(errors.title && "border-destructive")}
              />
              <div className="flex justify-between">
                {errors.title ? (
                  <p className="text-sm text-destructive">{errors.title}</p>
                ) : (
                  <span />
                )}
                <CharCounter current={title.length} max={TITLE_MAX} />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory} disabled={submitting}>
                <SelectTrigger
                  className={cn("w-full", errors.category && "border-destructive")}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-req-desc">Add more details (optional)</Label>
              <Textarea
                id="edit-req-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={DESC_MAX}
                rows={4}
                disabled={submitting}
                className={cn(errors.description && "border-destructive")}
              />
              <div className="flex justify-between">
                {errors.description ? (
                  <p className="text-sm text-destructive">{errors.description}</p>
                ) : (
                  <span />
                )}
                <CharCounter current={description.length} max={DESC_MAX} />
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label>Budget (optional)</Label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 500"
                  value={budget}
                  onKeyDown={(e) => {
                    if (e.ctrlKey || e.metaKey || e.altKey) return;
                    if (
                      shouldBlockCurrencyKey(
                        e.key,
                        e.currentTarget.value,
                        e.currentTarget.selectionStart,
                        e.currentTarget.selectionEnd
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setBudget(formatCurrencyInput(e.target.value))}
                  disabled={submitting}
                  className={cn("pl-7", errors.budget && "border-destructive")}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-negotiable"
                  checked={negotiable}
                  onCheckedChange={(c) => setNegotiable(c as boolean)}
                  disabled={submitting}
                />
                <Label htmlFor="edit-negotiable" className="text-sm font-normal">Price is negotiable</Label>
              </div>
              {errors.budget && (
                <p className="text-sm text-destructive">{errors.budget}</p>
              )}
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label>
                Urgency <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {URGENCIES.map((u) => {
                  const active = urgency === u.value;
                  return (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setUrgency(u.value)}
                      disabled={submitting}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground transition-colors",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-accent/50",
                        submitting && "opacity-50"
                      )}
                    >
                      <span className={cn(
                        "size-2.5 rounded-full border-2",
                        active ? "border-primary bg-primary" : "border-gray-300 bg-transparent"
                      )} />
                      {u.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Action Buttons */}
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link href="/requests">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={submitting}>
                    <X className="size-4" />
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? (
                    <>
                      <SpinnerGap className="size-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <FloppyDisk className="size-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </section>
          </form>
        </div>
      </main>
      <Footer />

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(o) => { if (!o) setConfirmAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction && confirmConfig[confirmAction].title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction && confirmConfig[confirmAction].description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={submitting}>
              {confirmAction && confirmConfig[confirmAction].cta}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
