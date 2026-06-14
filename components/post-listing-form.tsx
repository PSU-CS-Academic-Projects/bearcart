"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { PhotoUpload } from "@/components/photo-upload";
import { ConditionSelector } from "@/components/condition-selector";
import { ListingTypeSelector } from "@/components/listing-type-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Camera, ListBullets, Eye, PaperPlaneTilt, CaretLeft, CaretRight,
  SpinnerGap,
} from "@phosphor-icons/react";
import { useIsMobile } from "@/hooks/use-mobile";
import { createListing } from "@/lib/actions/listings";
import {
  formatCurrencyInput,
  formatPeso,
  parseCurrencyInput,
  shouldBlockCurrencyKey,
} from "@/lib/currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const categories = [
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "food", label: "Food" },
  { value: "supplies", label: "School Supplies" },
  { value: "services", label: "Services" },
  { value: "others", label: "Others" },
];


const TITLE_MAX = 100;
const DESC_MAX = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  photos: string[];
  title: string;
  category: string;
  condition: string;
  listingType: string;
  price: string;
  negotiable: boolean;
  description: string;
}

interface FormErrors {
  photos?: string;
  title?: string;
  category?: string;
  condition?: string;
  listingType?: string;
  price?: string;
  description?: string;
}

const steps = [
  { id: 1, label: "Photos", icon: Camera },
  { id: 2, label: "Details", icon: ListBullets },
  { id: 3, label: "Review", icon: Eye },
];

// ─── Field IDs for focus-on-error ─────────────────────────────────────────────

const FIELD_IDS: Record<keyof FormErrors, string> = {
  photos: "photo-upload-zone",
  title: "desktop-title",
  category: "desktop-category",
  condition: "desktop-condition",
  listingType: "desktop-listing-type",
  price: "desktop-price",
  description: "desktop-description",
};

// ─── Character Counter ────────────────────────────────────────────────────────

function CharCounter({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
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

// ─── Main Form Component ─────────────────────────────────────────────────────

export function PostListingForm() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const formRef = useRef<HTMLFormElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    photos: [], title: "", category: "", condition: "", listingType: "for-sale",
    price: "", negotiable: false, description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ── Field Updaters ──────────────────────────────────────────────────────

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (formData.photos.length === 0) newErrors.photos = "Please upload at least one photo";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    else if (formData.title.length > TITLE_MAX) newErrors.title = `Title must be ${TITLE_MAX} characters or less`;
    if (!formData.category) newErrors.category = "Please select a category";
    if (!formData.condition) newErrors.condition = "Please select a condition";
    if (!formData.listingType) newErrors.listingType = "Please select a listing type";
    if (formData.listingType === "for-sale") {
      const priceNum = parseCurrencyInput(formData.price);
      if (priceNum === null) newErrors.price = "Price is required";
      else if (priceNum < 1) newErrors.price = "Price must be at least ₱1";
    }
    if (!formData.description.trim()) newErrors.description = "Description is required";
    else if (formData.description.length > DESC_MAX) newErrors.description = `Description must be ${DESC_MAX} characters or less`;
    setErrors(newErrors);
    // Mark all as touched
    setTouched(Object.fromEntries(Object.keys(newErrors).map((k) => [k, true])));
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    if (step === 1 || step === 4) {
      if (formData.photos.length === 0) newErrors.photos = "Please upload at least one photo";
    }
    if (step === 2 || step === 4) {
      if (!formData.title.trim()) newErrors.title = "Title is required";
      else if (formData.title.length > TITLE_MAX) newErrors.title = `Title must be ${TITLE_MAX} characters or less`;
      if (!formData.category) newErrors.category = "Please select a category";
      if (!formData.condition) newErrors.condition = "Please select a condition";
      if (!formData.listingType) newErrors.listingType = "Please select a listing type";
      if (formData.listingType === "for-sale") {
        const priceNum = parseCurrencyInput(formData.price);
        if (priceNum === null) newErrors.price = "Price is required";
        else if (priceNum < 1) newErrors.price = "Price must be at least ₱1";
      }
      if (!formData.description.trim()) newErrors.description = "Description is required";
      else if (formData.description.length > DESC_MAX) newErrors.description = `Description must be ${DESC_MAX} characters or less`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Focus first error ─────────────────────────────────────────────────

  const focusFirstError = useCallback((errorKeys: string[]) => {
    // Priority order matches visual order on page
    const order: (keyof FormErrors)[] = ["photos", "title", "category", "condition", "listingType", "price", "description"];
    for (const key of order) {
      if (errorKeys.includes(key)) {
        const el = document.getElementById(FIELD_IDS[key]);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          if ("focus" in el && typeof el.focus === "function") el.focus();
          return;
        }
      }
    }
  }, []);

  // ── Step Navigation ───────────────────────────────────────────────────

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep((prev) => Math.min(prev + 1, 3)); };
  const handlePrev = () => { setCurrentStep((prev) => Math.max(prev - 1, 1)); };

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const isValid = validateAll();
    if (!isValid) {
      const errorKeys = Object.keys(errors).length > 0
        ? Object.keys(errors)
        : (() => {
            // Re-calculate since validateAll just ran
            const e: string[] = [];
            if (formData.photos.length === 0) e.push("photos");
            if (!formData.title.trim()) e.push("title");
            if (!formData.category) e.push("category");
            if (!formData.condition) e.push("condition");
            if (!formData.listingType) e.push("listingType");
            if (formData.listingType === "for-sale" && !parseCurrencyInput(formData.price)) e.push("price");
            if (!formData.description.trim()) e.push("description");
            return e;
          })();
      setTimeout(() => focusFirstError(errorKeys), 100);
      return;
    }

    setSubmitting(true);
    try {
      const conditionMap: Record<string, "new" | "like_new" | "good" | "fair" | "poor"> = {
        new: "new", "like-new": "like_new", good: "good", fair: "fair", poor: "poor",
      };

      const result = await createListing({
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseCurrencyInput(formData.price) ?? 0,
        is_negotiable: formData.negotiable,
        category: formData.category,
        condition: conditionMap[formData.condition] ?? "good",
        photos: formData.photos,
      });
      toast.success("Listing posted successfully!");
      router.push(`/listings/${result.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to post listing";
      // Check if it's a partial failure (listing created but images failed)
      if (message.includes("Failed to insert listing_images") || message.includes("photo")) {
        toast.warning("Listing posted but some photos failed to upload");
      } else {
        toast.error(message);
      }
      // Keep form data intact — do NOT reset
      setSubmitting(false);
    }
  };

  // ── Shared Sections ───────────────────────────────────────────────────

  const photosSection = (
    <div id="photo-upload-zone">
      <PhotoUpload
        photos={formData.photos}
        onPhotosChange={(photos) => updateField("photos", photos)}
        error={errors.photos}
        disabled={submitting}
      />
    </div>
  );

  const detailsSection = (
    <div className="space-y-6">

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="desktop-title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="desktop-title"
          placeholder="e.g. Calculus Textbook 10th Edition"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          maxLength={TITLE_MAX}
          disabled={submitting}
          className={cn(errors.title && "border-destructive")}
        />
        <div className="flex justify-between">
          {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : <span />}
          <CharCounter current={formData.title.length} max={TITLE_MAX} />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2" id="desktop-category">
        <Label>Category <span className="text-destructive">*</span></Label>
        <Select value={formData.category} onValueChange={(v) => updateField("category", v)} disabled={submitting}>
          <SelectTrigger className={cn("w-full", errors.category && "border-destructive")}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
      </div>

      {/* Condition */}
      <div className="space-y-2" id="desktop-condition">
        <Label>Condition <span className="text-destructive">*</span></Label>
        <ConditionSelector value={formData.condition} onChange={(v) => updateField("condition", v)} error={errors.condition} />
      </div>

      {/* Listing Type */}
      <div className="space-y-2" id="desktop-listing-type">
        <Label>Listing Type <span className="text-destructive">*</span></Label>
        <ListingTypeSelector value={formData.listingType} onChange={(v) => updateField("listingType", v)} error={errors.listingType} />
      </div>

      {/* Price */}
      {formData.listingType === "for-sale" && (
        <div className="space-y-2">
          <Label htmlFor="desktop-price">Price <span className="text-destructive">*</span></Label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
            <Input
              id="desktop-price"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 500"
              value={formData.price}
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
              onChange={(e) => updateField("price", formatCurrencyInput(e.target.value))}
              className={cn("pl-7", errors.price && "border-destructive")}
              disabled={submitting}
            />
          </div>
          {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
          <div className="flex items-center gap-2">
            <Checkbox id="desktop-negotiable" checked={formData.negotiable} onCheckedChange={(c) => updateField("negotiable", c as boolean)} disabled={submitting} />
            <Label htmlFor="desktop-negotiable" className="text-sm font-normal">Price is negotiable</Label>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="desktop-description">Description <span className="text-destructive">*</span></Label>
        <Textarea
          id="desktop-description"
          placeholder="Describe your item..."
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          maxLength={DESC_MAX}
          rows={5}
          disabled={submitting}
          className={cn(errors.description && "border-destructive")}
        />
        <div className="flex justify-between">
          {errors.description ? <p className="text-sm text-destructive">{errors.description}</p> : <span />}
          <CharCounter current={formData.description.length} max={DESC_MAX} />
        </div>
      </div>
    </div>
  );

  const reviewSection = (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review Your Listing</h2>
        <p className="text-sm text-muted-foreground">Make sure everything looks good before posting</p>
      </div>
      <div className="space-y-4 rounded-lg border bg-card p-4">
        {formData.photos.length > 0 && (
          <div className="aspect-video overflow-hidden rounded-lg">
            <img src={formData.photos[0]} alt="Listing cover" className="size-full object-cover" />
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{formData.title || "Untitled Listing"}</h3>
          <p className="text-xl font-bold text-primary">
            {formatPeso(parseCurrencyInput(formData.price) ?? 0)}
            {formData.negotiable && <span className="ml-2 text-sm font-normal text-muted-foreground">(Negotiable)</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {formData.category && <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">{categories.find((c) => c.value === formData.category)?.label}</span>}
            {formData.condition && <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">{formData.condition.charAt(0).toUpperCase() + formData.condition.slice(1).replace("-", " ")}</span>}
          </div>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{formData.description || "No description provided."}</p>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">By posting you agree to Bearcart&apos;s community guidelines</p>
    </div>
  );

  // ── Submit button content ─────────────────────────────────────────────

  const submitButton = (
    <Button
      type={isMobile ? "button" : "submit"}
      onClick={isMobile ? handleSubmit : undefined}
      disabled={submitting}
      className="flex-1 sm:flex-none"
    >
      {submitting ? (
        <>
          <SpinnerGap className="size-4 animate-spin" />
          Posting your listing...
        </>
      ) : (
        <>
          <PaperPlaneTilt className="size-4" />
          Post Listing
        </>
      )}
    </Button>
  );

  // ── Mobile: Multi-step form ───────────────────────────────────────────

  const progress = (currentStep / 3) * 100;

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1">
          {/* Mobile Progress */}
          <div className="sticky top-16 z-40 border-b bg-card px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isComplete = step.id < currentStep;
                return (
                  <button key={step.id} onClick={() => step.id < currentStep && setCurrentStep(step.id)} disabled={step.id > currentStep || submitting}
                    className={`flex flex-col items-center gap-1 ${isActive ? "text-primary" : isComplete ? "text-primary/70" : "text-muted-foreground"}`}>
                    <div className={`flex size-8 items-center justify-center rounded-full ${isActive ? "bg-primary text-primary-foreground" : isComplete ? "bg-primary/20 text-primary" : "bg-muted"}`}>
                      <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-medium">{step.label}</span>
                  </button>
                );
              })}
            </div>
            <Progress value={progress} className="h-1" />
          </div>

          <div className="p-4">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div><h2 className="text-lg font-semibold text-foreground">Add Photos</h2><p className="text-sm text-muted-foreground">Upload up to 5 photos of your item</p></div>
                {photosSection}
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div><h2 className="text-lg font-semibold text-foreground">Listing Details</h2><p className="text-sm text-muted-foreground">Fill in the details of your item</p></div>
                {detailsSection}
              </div>
            )}
            {currentStep === 3 && reviewSection}
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="sticky bottom-0 border-t bg-card p-4">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrev} className="flex-1" disabled={submitting}>
                  <CaretLeft className="size-4" />Back
                </Button>
              )}
              {currentStep < 3 ? (
                <Button onClick={handleNext} className="flex-1" disabled={submitting}>
                  Next<CaretRight className="size-4" />
                </Button>
              ) : (
                submitButton
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Desktop: Single page form ─────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-8">
            <Breadcrumb items={[{ label: "Post a Listing" }]} />
            <h1 className="mt-4 text-2xl font-bold text-foreground">Post a Listing</h1>
            <p className="text-muted-foreground">Fill in the details of your item</p>
          </div>

          <form
            ref={formRef}
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="space-y-8"
          >
            {/* Photos */}
            <section className="space-y-4">
              <div className="flex items-center gap-2"><Camera className="size-5 text-primary" /><h2 className="text-lg font-semibold text-foreground">Photos</h2></div>
              {photosSection}
            </section>
            <div className="h-px bg-border" />

            {/* Details */}
            <section className="space-y-6">
              <div className="flex items-center gap-2"><ListBullets className="size-5 text-primary" /><h2 className="text-lg font-semibold text-foreground">Listing Details</h2></div>
              {detailsSection}
            </section>
            <div className="h-px bg-border" />

            {/* Submit */}
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {submitButton}
              </div>
              <p className="text-center text-xs text-muted-foreground sm:text-right">By posting you agree to Bearcart&apos;s community guidelines</p>
            </section>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
