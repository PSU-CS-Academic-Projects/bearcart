"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { PhotoUpload } from "@/components/photo-upload";
import { ConditionSelector } from "@/components/condition-selector";
import { ListingTypeSelector } from "@/components/listing-type-selector";
import { TagsInput } from "@/components/tags-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  ListBullets,
  MapPin,
  Eye,
  PaperPlaneTilt,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { useIsMobile } from "@/hooks/use-mobile";

const categories = [
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "food", label: "Food" },
  { value: "supplies", label: "Supplies" },
  { value: "services", label: "Services" },
  { value: "others", label: "Others" },
];

const meetupLocations = [
  "Library",
  "Cafeteria",
  "Main Building Lobby",
  "Covered Court",
  "Department Office",
];

const weekDays = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
];

interface FormData {
  photos: string[];
  title: string;
  category: string;
  condition: string;
  listingType: string;
  price: string;
  negotiable: boolean;
  description: string;
  tags: string[];
  meetupLocations: string[];
  availableDays: string[];
  timeFrom: string;
  timeTo: string;
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
  { id: 3, label: "Meetup", icon: MapPin },
  { id: 4, label: "Review", icon: Eye },
];

export default function PostListingPage() {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    photos: [],
    title: "",
    category: "",
    condition: "",
    listingType: "for-sale",
    price: "",
    negotiable: false,
    description: "",
    tags: [],
    meetupLocations: [],
    availableDays: [],
    timeFrom: "09:00",
    timeTo: "17:00",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    // Clear error when field is updated
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleArrayField = <K extends keyof FormData>(
    field: K,
    value: string
  ) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    updateField(field, newArray as FormData[K]);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1 || step === 4) {
      if (formData.photos.length === 0) {
        newErrors.photos = "Please upload at least one photo";
      }
    }

    if (step === 2 || step === 4) {
      if (!formData.title.trim()) {
        newErrors.title = "Title is required";
      } else if (formData.title.length > 100) {
        newErrors.title = "Title must be 100 characters or less";
      }

      if (!formData.category) {
        newErrors.category = "Please select a category";
      }

      if (!formData.condition) {
        newErrors.condition = "Please select a condition";
      }

      if (!formData.listingType) {
        newErrors.listingType = "Please select a listing type";
      }

      if (formData.listingType === "for-sale" && !formData.price) {
        newErrors.price = "Price is required";
      }

      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      } else if (formData.description.length > 500) {
        newErrors.description = "Description must be 500 characters or less";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(4)) {
      // Submit logic would go here
      alert("Listing posted successfully!");
    }
  };

  const isFormValid = useMemo(() => {
    return (
      formData.photos.length > 0 &&
      formData.title.trim() &&
      formData.title.length <= 100 &&
      formData.category &&
      formData.condition &&
      formData.listingType &&
      (formData.listingType !== "for-sale" || formData.price) &&
      formData.description.trim() &&
      formData.description.length <= 500
    );
  }, [formData]);

  const progress = (currentStep / 4) * 100;

  // Mobile: Multi-step form
  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        <main className="flex-1">
          {/* Mobile Progress */}
          <div className="sticky top-16 z-40 border-b bg-card px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isComplete = step.id < currentStep;
                return (
                  <button
                    key={step.id}
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                    disabled={step.id > currentStep}
                    className={`flex flex-col items-center gap-1 ${
                      isActive
                        ? "text-primary"
                        : isComplete
                          ? "text-primary/70"
                          : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex size-8 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isComplete
                            ? "bg-primary/20 text-primary"
                            : "bg-muted"
                      }`}
                    >
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
            {/* Step 1: Photos */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Add Photos
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Upload up to 5 photos of your item
                  </p>
                </div>
                <PhotoUpload
                  photos={formData.photos}
                  onPhotosChange={(photos) => updateField("photos", photos)}
                  error={errors.photos}
                />
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Listing Details
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Fill in the details of your item
                  </p>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Calculus Textbook 10th Edition"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    maxLength={100}
                    aria-invalid={!!errors.title}
                  />
                  <div className="flex justify-between">
                    {errors.title ? (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formData.title.length}/100
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => updateField("category", value)}
                  >
                    <SelectTrigger aria-invalid={!!errors.category}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
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

                {/* Condition */}
                <div className="space-y-2">
                  <Label>
                    Condition <span className="text-destructive">*</span>
                  </Label>
                  <ConditionSelector
                    value={formData.condition}
                    onChange={(value) => updateField("condition", value)}
                    error={errors.condition}
                  />
                </div>

                {/* Listing Type */}
                <div className="space-y-2">
                  <Label>
                    Listing Type <span className="text-destructive">*</span>
                  </Label>
                  <ListingTypeSelector
                    value={formData.listingType}
                    onChange={(value) => updateField("listingType", value)}
                    error={errors.listingType}
                  />
                </div>

                {/* Price */}
                {formData.listingType === "for-sale" && (
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Price <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₱
                      </span>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => updateField("price", e.target.value)}
                        className="pl-7"
                        aria-invalid={!!errors.price}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-destructive">{errors.price}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="negotiable"
                        checked={formData.negotiable}
                        onCheckedChange={(checked) =>
                          updateField("negotiable", checked as boolean)
                        }
                      />
                      <Label htmlFor="negotiable" className="text-sm font-normal">
                        Price is negotiable
                      </Label>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item — condition details, reason for selling, etc."
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    maxLength={500}
                    rows={4}
                    aria-invalid={!!errors.description}
                  />
                  <div className="flex justify-between">
                    {errors.description ? (
                      <p className="text-sm text-destructive">
                        {errors.description}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formData.description.length}/500
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagsInput
                    tags={formData.tags}
                    onTagsChange={(tags) => updateField("tags", tags)}
                    placeholder="e.g. textbook, math, engineering"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Meetup Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Meetup Preferences
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Set your preferred meetup spots and schedule
                  </p>
                </div>

                {/* Meetup Locations */}
                <div className="space-y-3">
                  <Label>Preferred Meetup Spots</Label>
                  <div className="space-y-2">
                    {meetupLocations.map((location) => (
                      <div key={location} className="flex items-center gap-2">
                        <Checkbox
                          id={`location-${location}`}
                          checked={formData.meetupLocations.includes(location)}
                          onCheckedChange={() =>
                            toggleArrayField("meetupLocations", location)
                          }
                        />
                        <Label
                          htmlFor={`location-${location}`}
                          className="text-sm font-normal"
                        >
                          {location}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Days */}
                <div className="space-y-3">
                  <Label>Available Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() =>
                          toggleArrayField("availableDays", day.value)
                        }
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          formData.availableDays.includes(day.value)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary hover:bg-muted"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Range */}
                <div className="space-y-3">
                  <Label>Available Time</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label htmlFor="timeFrom" className="sr-only">
                        From
                      </Label>
                      <Input
                        id="timeFrom"
                        type="time"
                        value={formData.timeFrom}
                        onChange={(e) => updateField("timeFrom", e.target.value)}
                      />
                    </div>
                    <span className="text-muted-foreground">to</span>
                    <div className="flex-1">
                      <Label htmlFor="timeTo" className="sr-only">
                        To
                      </Label>
                      <Input
                        id="timeTo"
                        type="time"
                        value={formData.timeTo}
                        onChange={(e) => updateField("timeTo", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Review Your Listing
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Make sure everything looks good before posting
                  </p>
                </div>

                {/* Preview Card */}
                <div className="space-y-4 rounded-lg border bg-card p-4">
                  {/* Photos Preview */}
                  {formData.photos.length > 0 && (
                    <div className="aspect-video overflow-hidden rounded-lg">
                      <img
                        src={formData.photos[0]}
                        alt="Listing cover"
                        className="size-full object-cover"
                      />
                    </div>
                  )}

                  {/* Details Preview */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {formData.title || "Untitled Listing"}
                    </h3>
                    <p className="text-xl font-bold text-primary">
                      ₱{formData.price || "0"}
                      {formData.negotiable && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          (Negotiable)
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.category && (
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                          {categories.find((c) => c.value === formData.category)
                            ?.label || formData.category}
                        </span>
                      )}
                      {formData.condition && (
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                          {formData.condition.charAt(0).toUpperCase() +
                            formData.condition.slice(1).replace("-", " ")}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {formData.description || "No description provided."}
                    </p>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Meetup Preview */}
                  {(formData.meetupLocations.length > 0 ||
                    formData.availableDays.length > 0) && (
                    <div className="border-t pt-4">
                      <h4 className="mb-2 text-sm font-medium text-foreground">
                        Meetup Preferences
                      </h4>
                      {formData.meetupLocations.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Locations:</span>{" "}
                          {formData.meetupLocations.join(", ")}
                        </p>
                      )}
                      {formData.availableDays.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Days:</span>{" "}
                          {formData.availableDays
                            .map(
                              (d) =>
                                weekDays.find((wd) => wd.value === d)?.label
                            )
                            .join(", ")}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Time:</span>{" "}
                        {formData.timeFrom} - {formData.timeTo}
                      </p>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <p className="text-center text-xs text-muted-foreground">
                  By posting you agree to PalMart&apos;s community guidelines
                </p>
              </div>
            )}
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="sticky bottom-0 border-t bg-card p-4">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  <CaretLeft className="size-4" />
                  Back
                </Button>
              )}
              {currentStep < 4 ? (
                <Button onClick={handleNext} className="flex-1">
                  Next
                  <CaretRight className="size-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className="flex-1"
                >
                  <PaperPlaneTilt className="size-4" />
                  Post Listing
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Desktop: Single page form
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Breadcrumb items={[{ label: "Post a Listing" }]} />
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              Post a Listing
            </h1>
            <p className="text-muted-foreground">
              Fill in the details of your item
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-8"
          >
            {/* Photo Upload Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Camera className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Photos
                </h2>
              </div>
              <PhotoUpload
                photos={formData.photos}
                onPhotosChange={(photos) => updateField("photos", photos)}
                error={touched.photos ? errors.photos : undefined}
              />
            </section>

            <div className="h-px bg-border" />

            {/* Listing Details Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <ListBullets className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Listing Details
                </h2>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="desktop-title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="desktop-title"
                  placeholder="e.g. Calculus Textbook 10th Edition"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  maxLength={100}
                  aria-invalid={touched.title && !!errors.title}
                />
                <div className="flex justify-between">
                  {touched.title && errors.title ? (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formData.title.length}/100
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateField("category", value)}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={touched.category && !!errors.category}
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.category && errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label>
                  Condition <span className="text-destructive">*</span>
                </Label>
                <ConditionSelector
                  value={formData.condition}
                  onChange={(value) => updateField("condition", value)}
                  error={touched.condition ? errors.condition : undefined}
                />
              </div>

              {/* Listing Type */}
              <div className="space-y-2">
                <Label>
                  Listing Type <span className="text-destructive">*</span>
                </Label>
                <ListingTypeSelector
                  value={formData.listingType}
                  onChange={(value) => updateField("listingType", value)}
                  error={touched.listingType ? errors.listingType : undefined}
                />
              </div>

              {/* Price */}
              {formData.listingType === "for-sale" && (
                <div className="space-y-2">
                  <Label htmlFor="desktop-price">
                    Price <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ₱
                    </span>
                    <Input
                      id="desktop-price"
                      type="number"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      className="pl-7"
                      aria-invalid={touched.price && !!errors.price}
                    />
                  </div>
                  {touched.price && errors.price && (
                    <p className="text-sm text-destructive">{errors.price}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="desktop-negotiable"
                      checked={formData.negotiable}
                      onCheckedChange={(checked) =>
                        updateField("negotiable", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="desktop-negotiable"
                      className="text-sm font-normal"
                    >
                      Price is negotiable
                    </Label>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="desktop-description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="desktop-description"
                  placeholder="Describe your item — condition details, reason for selling, etc."
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  maxLength={500}
                  rows={5}
                  aria-invalid={touched.description && !!errors.description}
                />
                <div className="flex justify-between">
                  {touched.description && errors.description ? (
                    <p className="text-sm text-destructive">
                      {errors.description}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagsInput
                  tags={formData.tags}
                  onTagsChange={(tags) => updateField("tags", tags)}
                  placeholder="e.g. textbook, math, engineering"
                />
              </div>
            </section>

            <div className="h-px bg-border" />

            {/* Meetup Preferences Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Meetup Preferences
                </h2>
              </div>

              {/* Meetup Locations */}
              <div className="space-y-3">
                <Label>Preferred Meetup Spots</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {meetupLocations.map((location) => (
                    <div key={location} className="flex items-center gap-2">
                      <Checkbox
                        id={`desktop-location-${location}`}
                        checked={formData.meetupLocations.includes(location)}
                        onCheckedChange={() =>
                          toggleArrayField("meetupLocations", location)
                        }
                      />
                      <Label
                        htmlFor={`desktop-location-${location}`}
                        className="text-sm font-normal"
                      >
                        {location}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Days */}
              <div className="space-y-3">
                <Label>Available Days</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() =>
                        toggleArrayField("availableDays", day.value)
                      }
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        formData.availableDays.includes(day.value)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary hover:bg-muted"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="space-y-3">
                <Label>Available Time</Label>
                <div className="flex max-w-sm items-center gap-3">
                  <div className="flex-1">
                    <Label htmlFor="desktop-timeFrom" className="sr-only">
                      From
                    </Label>
                    <Input
                      id="desktop-timeFrom"
                      type="time"
                      value={formData.timeFrom}
                      onChange={(e) => updateField("timeFrom", e.target.value)}
                    />
                  </div>
                  <span className="text-muted-foreground">to</span>
                  <div className="flex-1">
                    <Label htmlFor="desktop-timeTo" className="sr-only">
                      To
                    </Label>
                    <Input
                      id="desktop-timeTo"
                      type="time"
                      value={formData.timeTo}
                      onChange={(e) => updateField("timeTo", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-border" />

            {/* Submit Section */}
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline">
                  <Eye className="size-4" />
                  Preview
                </Button>
                <Button type="submit" disabled={!isFormValid}>
                  <PaperPlaneTilt className="size-4" />
                  Post Listing
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground sm:text-right">
                By posting you agree to PalMart&apos;s community guidelines
              </p>
            </section>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
