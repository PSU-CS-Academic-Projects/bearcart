"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Footer } from "@/components/footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { PhotoUpload } from "@/components/photo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { createRequest, type RequestUrgency } from "@/lib/actions/requests";
import {
  formatCurrencyInput,
  parseCurrencyInput,
  shouldBlockCurrencyKey,
} from "@/lib/currency";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "Books", label: "Books" },
  { value: "Electronics", label: "Electronics" },
  { value: "Clothing", label: "Clothing" },
  { value: "Food", label: "Food" },
  { value: "School Supplies", label: "School Supplies" },
  { value: "Services", label: "Services" },
  { value: "Others", label: "Others" },
];

const URGENCIES: { value: RequestUrgency; label: string }[] = [
  { value: "not_urgent", label: "Flexible" },
  { value: "moderate", label: "Need Soon" },
  { value: "urgent", label: "Urgent" },
];

const TITLE_MAX = 100;
const DESC_MAX = 500;
const MAX_PHOTOS = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormErrors {
  title?: string;
  category?: string;
  description?: string;
  budget?: string;
  urgency?: string;
}

// ─── Field IDs for focus-on-error ─────────────────────────────────────────────

const FIELD_IDS: Record<keyof FormErrors, string> = {
  title: "req-title-section",
  category: "req-category-section",
  description: "req-desc-section",
  budget: "req-budget-section",
  urgency: "req-urgency-section",
};

// ─── Char Counter ─────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function PostRequestForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [urgency, setUrgency] = useState<RequestUrgency>("not_urgent");
  const [errors, setErrors] = useState<FormErrors>({});

  const focusFirstError = useCallback((errorKeys: string[]) => {
    const order: (keyof FormErrors)[] = ["title", "category", "description", "budget", "urgency"];
    for (const key of order) {
      if (errorKeys.includes(key)) {
        const el = document.getElementById(FIELD_IDS[key]);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          const input = el.querySelector("input, textarea, button, [tabindex]");
          if (input instanceof HTMLElement) input.focus();
          return;
        }
      }
    }
  }, []);

  const validate = useCallback((): FormErrors => {
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
    return next;
  }, [title, category, description, budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setTimeout(() => focusFirstError(Object.keys(validationErrors)), 50);
      return;
    }

    setSubmitting(true);
    try {
      const budgetNum = parseCurrencyInput(budget);
      await createRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        budget_min: budgetNum,
        budget_max: null,
        is_negotiable: negotiable,
        urgency,
        photos,
      });
      toast.success("Request posted successfully!");
      router.push("/requests");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to post request";
      toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* Breadcrumb + Header */}
          <div className="mb-8">
            <Breadcrumb
              items={[
                { label: "Requests", href: "/requests" },
                { label: "New" },
              ]}
            />
            <h1 className="mt-4 text-2xl font-bold text-foreground">Post a Request</h1>
            <p className="text-muted-foreground">Tell the community what you&apos;re looking for</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photos (optional) */}
            <section className="space-y-3">
              <div>
                <Label>Photos (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Add a photo to help sellers identify what you need
                </p>
              </div>
              <PhotoUpload
                photos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={MAX_PHOTOS}
                disabled={submitting}
              />
            </section>

            <div className="h-px bg-border" />

            {/* Title */}
            <div id="req-title-section" className="space-y-2">
              <Label htmlFor="req-title">
                What are you looking for? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="req-title"
                placeholder="e.g. Calculus Textbook 10th Edition by James Stewart"
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
            <div id="req-category-section" className="space-y-2">
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
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            {/* Description */}
            <div id="req-desc-section" className="space-y-2">
              <Label htmlFor="req-desc">Add more details (optional)</Label>
              <Textarea
                id="req-desc"
                placeholder="Describe exactly what you need — edition, color, size, condition you'll accept, etc."
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
            <div id="req-budget-section" className="space-y-2">
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
                  id="post-negotiable"
                  checked={negotiable}
                  onCheckedChange={(c) => setNegotiable(c as boolean)}
                  disabled={submitting}
                />
                <Label htmlFor="post-negotiable" className="text-sm font-normal">Price is negotiable</Label>
              </div>
              {errors.budget && (
                <p className="text-sm text-destructive">{errors.budget}</p>
              )}
            </div>

            {/* Urgency */}
            <div id="req-urgency-section" className="space-y-2">
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

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <SpinnerGap className="size-4 animate-spin" />
                  Posting your request...
                </>
              ) : (
                <>
                  <PaperPlaneTilt className="size-4" />
                  Post Request
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
