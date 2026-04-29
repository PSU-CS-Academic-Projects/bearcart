"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tag, ShoppingCart, BookmarkSimple, Storefront, Package,
  MagnifyingGlass, Star, User,
} from "@phosphor-icons/react";
import { ProfileListingCard } from "@/components/profile-listing-card";
import { updateListingStatus } from "@/lib/actions/listings";
import { removeSavedListing } from "@/lib/actions/saved";
import { formatTimeAgo, formatCondition } from "@/lib/listing-helpers";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  created_at: string;
  listing_images: { image_url: string; is_cover: boolean; order: number }[];
}

interface SavedRow extends ListingRow {
  seller_name?: string;
  seller_avatar?: string;
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface OwnProfileTabsProps {
  variant: "own";
  activeListings: ListingRow[];
  soldListings: ListingRow[];
  savedListings: SavedRow[];
}

interface PublicProfileTabsProps {
  variant: "public";
  activeListings: ListingRow[];
  reviews: ReviewRow[];
}

type ProfileTabsProps = OwnProfileTabsProps | PublicProfileTabsProps;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCoverImage(listing: ListingRow): string {
  const cover = listing.listing_images?.find((img) => img.is_cover);
  return cover?.image_url ?? listing.listing_images?.[0]?.image_url ?? "";
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-4 ${i <= rating ? "text-amber-500" : "text-muted-foreground/30"}`}
          weight={i <= rating ? "fill" : "regular"}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileTabs(props: ProfileTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(props.variant === "own" ? "active" : "listings");
  const [markSoldId, setMarkSoldId] = useState<string | null>(null);
  const [activeItems, setActiveItems] = useState(props.activeListings);
  const [soldItems, setSoldItems] = useState(props.variant === "own" ? (props as OwnProfileTabsProps).soldListings : []);
  const [savedItems, setSavedItems] = useState(props.variant === "own" ? (props as OwnProfileTabsProps).savedListings : []);

  // ── Mark as Sold ──────────────────────────────────────────────────────

  const handleMarkSold = async () => {
    if (!markSoldId) return;
    try {
      await updateListingStatus(markSoldId, "sold");
      const listing = activeItems.find((l) => l.id === markSoldId);
      if (listing) {
        setActiveItems((prev) => prev.filter((l) => l.id !== markSoldId));
        setSoldItems((prev) => [{ ...listing, status: "sold" }, ...prev]);
      }
      toast.success("Listing marked as sold!");
    } catch {
      toast.error("Failed to mark as sold");
    }
    setMarkSoldId(null);
  };

  // ── Remove Saved ──────────────────────────────────────────────────────

  const handleRemoveSaved = async (listingId: string) => {
    try {
      await removeSavedListing(listingId);
      setSavedItems((prev) => prev.filter((l) => l.id !== listingId));
      toast.success("Removed from saved!");
    } catch {
      toast.error("Failed to remove saved listing");
    }
  };

  // ── Listing Grid ──────────────────────────────────────────────────────

  const renderGrid = (
    listings: ListingRow[],
    variant: "active" | "sold" | "saved"
  ) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing) => (
        <ProfileListingCard
          key={listing.id}
          id={listing.id}
          title={listing.title}
          price={listing.price}
          category={listing.category}
          condition={formatCondition(listing.condition)}
          timePosted={formatTimeAgo(listing.created_at)}
          imageUrl={getCoverImage(listing)}
          variant={variant}
          onEdit={variant === "active" ? () => router.push(`/listings/${listing.id}/edit`) : undefined}
          onMarkSold={variant === "active" ? () => setMarkSoldId(listing.id) : undefined}
          onDelete={undefined}
          onRemoveSaved={variant === "saved" ? () => handleRemoveSaved(listing.id) : undefined}
        />
      ))}
    </div>
  );

  // ── Empty States ──────────────────────────────────────────────────────

  const emptyActive = (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <Storefront className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">No active listings</h3>
      <p className="mb-4 text-sm text-muted-foreground">Start selling by posting your first listing</p>
      {props.variant === "own" && (
        <Button asChild>
          <Link href="/listings/new">
            <Tag className="size-4" />
            Post a Listing
          </Link>
        </Button>
      )}
    </Card>
  );

  const emptySold = (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <Package className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">No sold items yet</h3>
      <p className="text-sm text-muted-foreground">Items you sell will appear here</p>
    </Card>
  );

  const emptySaved = (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <BookmarkSimple className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">No saved listings</h3>
      <p className="mb-4 text-sm text-muted-foreground">Save listings you&apos;re interested in to view them later</p>
      <Button asChild variant="outline">
        <Link href="/listings">
          <MagnifyingGlass className="size-4" />
          Browse Listings
        </Link>
      </Button>
    </Card>
  );

  const emptyReviews = (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <Star className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">No reviews yet</h3>
      <p className="text-sm text-muted-foreground">Reviews from buyers will appear here</p>
    </Card>
  );

  // ── Reviews List ──────────────────────────────────────────────────────

  const renderReviews = (reviews: ReviewRow[]) => (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
              {review.reviewer.avatar_url ? (
                <Image
                  src={review.reviewer.avatar_url}
                  alt={review.reviewer.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="size-full p-2 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {review.reviewer.full_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(review.created_at)}
                </span>
              </div>
              <StarRating rating={review.rating} />
              {review.comment && (
                <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // ─── OWN PROFILE TABS ──────────────────────────────────────────────────

  if (props.variant === "own") {
    return (
      <>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="active" className="gap-2">
              <Tag className="size-4" />
              Active ({activeItems.length})
            </TabsTrigger>
            <TabsTrigger value="sold" className="gap-2">
              <ShoppingCart className="size-4" />
              Sold ({soldItems.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <BookmarkSimple className="size-4" />
              Saved ({savedItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeItems.length > 0 ? renderGrid(activeItems, "active") : emptyActive}
          </TabsContent>

          <TabsContent value="sold" className="mt-6">
            {soldItems.length > 0 ? renderGrid(soldItems, "sold") : emptySold}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {savedItems.length > 0 ? renderGrid(savedItems, "saved") : emptySaved}
          </TabsContent>
        </Tabs>

        {/* Mark as Sold Confirmation */}
        <AlertDialog open={!!markSoldId} onOpenChange={(o) => { if (!o) setMarkSoldId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Sold?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this listing as sold? This will hide it from the marketplace.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleMarkSold}>
                Yes, Mark as Sold
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ─── PUBLIC PROFILE TABS ────────────────────────────────────────────────

  const { reviews } = props as PublicProfileTabsProps;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full justify-start">
        <TabsTrigger value="listings" className="gap-2">
          <Tag className="size-4" />
          Active Listings ({activeItems.length})
        </TabsTrigger>
        <TabsTrigger value="reviews" className="gap-2">
          <Star className="size-4" />
          Reviews ({reviews.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="listings" className="mt-6">
        {activeItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {activeItems.map((listing) => (
              <ProfileListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price}
                category={listing.category}
                condition={formatCondition(listing.condition)}
                timePosted={formatTimeAgo(listing.created_at)}
                imageUrl={getCoverImage(listing)}
                variant="active"
              />
            ))}
          </div>
        ) : emptyActive}
      </TabsContent>

      <TabsContent value="reviews" className="mt-6">
        {reviews.length > 0 ? renderReviews(reviews) : emptyReviews}
      </TabsContent>
    </Tabs>
  );
}
