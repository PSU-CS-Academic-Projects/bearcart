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
import { PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { createRequest, type RequestUrgency } from "@/lib/actions/requests";

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

const URGENCIES: { value: RequestUrgency; label: string; description: string; dot: string }[] = [
  { value: "not_urgent", label: "Flexible", description: "No rush, whenever", dot: "bg-emerald-500" },
  { value: "moderate", label: "Need Soon", description: "Within the next week", dot: "bg-amber-500" },
  { value: "urgent", label: "Urgent", description: "ASAP — exams or deadline", dot: "bg-red-500" },
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
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [urgency, setUrgency] = useState<RequestUrgency>("not_urgent");
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};

    if (!title.trim()) next.title = "Tell us what you're looking for";
    else if (title.length > TITLE_MAX) next.title = `Title must be ${TITLE_MAX} characters or less`;

    if (!category) next.category = "Please select a category";

    if (description.length > DESC_MAX) {
      next.description = `Description must be ${DESC_MAX} characters or less`;
    }

    const minNum = budgetMin ? parseFloat(budgetMin) : null;
    const maxNum = budgetMax ? parseFloat(budgetMax) : null;
    if (minNum !== null && minNum < 0) next.budget = "Minimum budget cannot be negative";
    else if (maxNum !== null && maxNum < 0) next.budget = "Maximum budget cannot be negative";
    else if (minNum !== null && maxNum !== null && minNum > maxNum) {
      next.budget = "Minimum must be less than or equal to maximum";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [title, category, description, budgetMin, budgetMax]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setSubmitting(true);
    try {
      const minNum = budgetMin ? parseFloat(budgetMin) : null;
      const maxNum = budgetMax ? parseFloat(budgetMax) : null;
      await createRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        budget_min: minNum,
        budget_max: maxNum,
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
                { label: "Looking For", href: "/requests" },
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
            <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Budget Range (optional)</Label>
              <p className="text-xs text-muted-foreground">Leave empty if flexible</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ₱
                    </span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="From"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      disabled={submitting}
                      className="pl-7"
                    />
                  </div>
                </div>
                <span className="text-muted-foreground">to</span>
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ₱
                    </span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="To"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      disabled={submitting}
                      className="pl-7"
                    />
                  </div>
                </div>
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
                        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent/50",
                        submitting && "opacity-50"
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span className={cn("size-2.5 rounded-full", u.dot)} />
                        {u.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {u.description}
                      </span>
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
            <p className="text-center text-xs text-muted-foreground">
              By posting you agree to Bearcart&apos;s community guidelines
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
