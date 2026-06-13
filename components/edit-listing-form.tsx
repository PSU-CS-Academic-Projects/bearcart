"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { PhotoUpload } from "@/components/photo-upload";
import { ConditionSelector } from "@/components/condition-selector";
import { TagsInput } from "@/components/tags-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Camera,
  ListBullets,
  FloppyDisk,
  SpinnerGap,
  Trash,
  CheckCircle,
  X as XIcon,
} from "@phosphor-icons/react";

import { updateListing, updateListingStatus, deleteListing } from "@/lib/actions/listings";
import { MarkAsSoldDialog } from "@/components/mark-as-sold-dialog";
import {
  formatCurrencyInput,
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
  { value: "supplies", label: "Supplies" },
  { value: "services", label: "Services" },
  { value: "others", label: "Others" },
];


const TITLE_MAX = 100;
const DESC_MAX = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExistingImage {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
}

interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number;
  is_negotiable: boolean;
  category: string;
  condition: string;
  status: string;
  tags: string[];
  images: ExistingImage[];
}

interface FormData {
  title: string;
  category: string;
  condition: string;
  price: string;
  negotiable: boolean;
  description: string;
  tags: string[];
}

interface FormErrors {
  photos?: string;
  title?: string;
  category?: string;
  condition?: string;
  price?: string;
  description?: string;
}

interface EditListingFormProps {
  listing: ListingData;
}

// ─── Character Counter ────────────────────────────────────────────────────────

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

// ─── Condition Map (DB ↔ UI) ──────────────────────────────────────────────────

const conditionDbToUi: Record<string, string> = {
  new: "new",
  like_new: "like-new",
  good: "good",
  fair: "fair",
  poor: "poor",
};

const conditionUiToDb: Record<string, "new" | "like_new" | "good" | "fair" | "poor"> = {
  new: "new",
  "like-new": "like_new",
  good: "good",
  fair: "fair",
  poor: "poor",
};

// ─── Status Badge Colors ──────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-green-100 text-green-800" },
  reserved: { label: "Reserved", className: "bg-yellow-100 text-yellow-700" },
  sold: { label: "Sold", className: "bg-red-100 text-red-700" },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);
  const [markSoldOpen, setMarkSoldOpen] = useState(false);

  // ── Photo State ────────────────────────────────────────────────────────
  // photos = mix of existing URLs and new base64 strings, in display order
  const [photos, setPhotos] = useState<string[]>(
    listing.images.map((img) => img.url)
  );
  // Track which existing image IDs have been removed
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  // Keep a reference map from URL → image ID for existing images
  const [imageIdMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    listing.images.forEach((img) => { map[img.url] = img.id; });
    return map;
  });

  // ── Form State ─────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>({
    title: listing.title,
    category: listing.category.toLowerCase(),
    condition: conditionDbToUi[listing.condition] ?? listing.condition,
    price: formatCurrencyInput(listing.price.toString()),
    negotiable: listing.is_negotiable,
    description: listing.description,
    tags: listing.tags.filter((t) => !t.startsWith("meetup:")),
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Field Updaters ─────────────────────────────────────────────────────

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ── Photo handlers ─────────────────────────────────────────────────────

  const handlePhotosChange = (newPhotos: string[]) => {
    // Detect removed photos by comparing with current photos
    const removed = photos.filter((p) => !newPhotos.includes(p));
    for (const removedUrl of removed) {
      const imageId = imageIdMap[removedUrl];
      if (imageId && !removedImageIds.includes(imageId)) {
        setRemovedImageIds((prev) => [...prev, imageId]);
      }
    }
    setPhotos(newPhotos);
    if (errors.photos) {
      setErrors((prev) => ({ ...prev, photos: undefined }));
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (photos.length === 0) newErrors.photos = "Please upload at least one photo";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    else if (formData.title.length > TITLE_MAX) newErrors.title = `Title must be ${TITLE_MAX} characters or less`;
    if (!formData.category) newErrors.category = "Please select a category";
    if (!formData.condition) newErrors.condition = "Please select a condition";
    const priceNum = parseCurrencyInput(formData.price);
    if (priceNum === null) newErrors.price = "Price is required";
    else if (priceNum < 1) newErrors.price = "Price must be at least ₱1";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    else if (formData.description.length > DESC_MAX) newErrors.description = `Description must be ${DESC_MAX} characters or less`;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, photos]);

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      // Separate existing URLs from new base64 photos
      const existingPhotos = photos.filter((p) => p.startsWith("http"));
      const newPhotos = photos.filter((p) => p.startsWith("data:"));

      await updateListing({
        listingId: listing.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseCurrencyInput(formData.price) ?? 0,
        is_negotiable: formData.negotiable,
        category: formData.category,
        condition: conditionUiToDb[formData.condition] ?? "good",
        tags: formData.tags,
        existingPhotos,
        removedImageIds,
        newPhotos,
      });

      toast.success("Listing updated successfully");
      router.push(`/listings/${listing.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update listing";
      toast.error(message);
      setSubmitting(false);
    }
  };

  // ── Mark as Sold ───────────────────────────────────────────────────────

  const handleMarkSold = async (soldToUserId?: string) => {
    setMarkingSold(true);
    try {
      await updateListingStatus(listing.id, "sold", soldToUserId);
      toast.success("Listing marked as sold");
      router.push("/profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
      setMarkingSold(false);
    }
  };

  // ── Delete Listing ─────────────────────────────────────────────────────

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteListing(listing.id);
      toast.success("Listing deleted");
      router.push("/profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete listing";
      toast.error(message);
      setDeleting(false);
    }
  };

  // ── Shared Sections ────────────────────────────────────────────────────



  const photosSection = (
    <div id="photo-upload-zone">
      <PhotoUpload
        photos={photos}
        onPhotosChange={handlePhotosChange}
        error={errors.photos}
        disabled={submitting}
      />
    </div>
  );

  const detailsSection = (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="edit-title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="edit-title"
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
      <div className="space-y-2" id="edit-category">
        <Label>Category <span className="text-destructive">*</span></Label>
        <Select value={formData.category} onValueChange={(v: string) => updateField("category", v)} disabled={submitting}>
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
      <div className="space-y-2" id="edit-condition">
        <Label>Condition <span className="text-destructive">*</span></Label>
        <ConditionSelector value={formData.condition} onChange={(v) => updateField("condition", v)} error={errors.condition} />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="edit-price">Price <span className="text-destructive">*</span></Label>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
          <Input
            id="edit-price"
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
          <Checkbox id="edit-negotiable" checked={formData.negotiable} onCheckedChange={(c) => updateField("negotiable", c as boolean)} disabled={submitting} />
          <Label htmlFor="edit-negotiable" className="text-sm font-normal">Price is negotiable</Label>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="edit-description">Description <span className="text-destructive">*</span></Label>
        <Textarea
          id="edit-description"
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

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <TagsInput
          tags={formData.tags}
          onTagsChange={(tags) => updateField("tags", tags)}
          placeholder="Add tags and press Enter"
          maxTags={5}
          maxTagLength={20}
          disabled={submitting}
        />
      </div>
    </div>
  );

  const statusSection = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Listing Status</Label>
          <div className="flex items-center gap-2">
            <Badge className={statusConfig[listing.status]?.className ?? "bg-gray-100 text-gray-800"}>
              {statusConfig[listing.status]?.label ?? listing.status}
            </Badge>
          </div>
        </div>

        {listing.status === "available" && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={markingSold || submitting}
              onClick={() => setMarkSoldOpen(true)}
            >
              <CheckCircle className="size-4" />
              {markingSold ? "Updating…" : "Mark as Sold"}
            </Button>
            <MarkAsSoldDialog
              open={markSoldOpen}
              onOpenChange={setMarkSoldOpen}
              listingId={listing.id}
              onConfirm={handleMarkSold}
            />
          </>
        )}
      </div>
    </div>
  );

  const deleteSection = (
    <div className="space-y-4">
      <div className="h-px bg-border" />
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
          <p className="text-xs text-muted-foreground">Permanently remove this listing</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting || submitting}>
              <Trash className="size-4" />
              Delete Listing
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this listing?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. The listing will be permanently removed from the marketplace.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <><SpinnerGap className="size-4 animate-spin" /> Deleting...</>
                ) : (
                  "Yes, delete listing"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  // ── Desktop single-page layout ─────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-8">
            <Breadcrumb
              items={[
                { label: "Listings", href: "/listings" },
                { label: listing.title, href: `/listings/${listing.id}` },
                { label: "Edit" },
              ]}
            />
            <h1 className="mt-4 text-2xl font-bold text-foreground">Edit Listing</h1>
            <p className="text-muted-foreground">Update your listing details</p>
          </div>

          <form
            ref={formRef}
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="space-y-8"
          >
            {/* Status */}
            <section className="space-y-4">
              {statusSection}
            </section>
            <div className="h-px bg-border" />

            {/* Photos */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Camera className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Photos</h2>
              </div>
              {photosSection}
            </section>
            <div className="h-px bg-border" />

            {/* Details */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <ListBullets className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Listing Details</h2>
              </div>
              {detailsSection}
            </section>
            <div className="h-px bg-border" />

            {/* Action Buttons */}
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link href={`/listings/${listing.id}`}>
                  <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={submitting}>
                    <XIcon className="size-4" />
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
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

            {/* Delete Section */}
            {deleteSection}
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
