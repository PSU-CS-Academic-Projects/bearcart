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
  MagnifyingGlass, Star, User, Plus, PencilSimple, XCircle, Check,
} from "@phosphor-icons/react";
import { ProfileListingCard } from "@/components/profile-listing-card";
import { RequestRow } from "@/components/request-row";
import { updateListingStatus, deleteListing } from "@/lib/actions/listings";
import { removeSavedListing } from "@/lib/actions/saved";
import {
  markRequestFulfilled,
  closeRequest,
  type RequestRow as RequestRowType,
} from "@/lib/actions/requests";
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

// Reviews type removed
interface OwnProfileTabsProps {
  variant: "own";
  activeListings: ListingRow[];
  soldListings: ListingRow[];
  savedListings: SavedRow[];
  ownRequests: RequestRowType[];
  currentUserId: string;
}

interface PublicProfileTabsProps {
  variant: "public";
  activeListings: ListingRow[];
  requests: RequestRowType[];
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeItems, setActiveItems] = useState(props.activeListings);
  const [soldItems, setSoldItems] = useState(props.variant === "own" ? (props as OwnProfileTabsProps).soldListings : []);
  const [savedItems, setSavedItems] = useState(props.variant === "own" ? (props as OwnProfileTabsProps).savedListings : []);
  const [requestItems, setRequestItems] = useState<RequestRowType[]>(
    props.variant === "own" ? (props as OwnProfileTabsProps).ownRequests : []
  );
  const [requestAction, setRequestAction] = useState<{
    id: string;
    type: "fulfilled" | "closed";
  } | null>(null);
  const ownUserId = props.variant === "own" ? (props as OwnProfileTabsProps).currentUserId : "";

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

  // ── Delete Listing ────────────────────────────────────────────────────

  const handleDeleteListing = async () => {
    if (!deleteId) return;
    try {
      await deleteListing(deleteId);
      setActiveItems((prev) => prev.filter((l) => l.id !== deleteId));
      toast.success("Listing removed!");
    } catch {
      toast.error("Failed to remove listing");
    }
    setDeleteId(null);
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

  // ── Request Status Action ─────────────────────────────────────────────

  const handleRequestAction = async () => {
    if (!requestAction) return;
    const { id, type } = requestAction;
    try {
      if (type === "fulfilled") {
        await markRequestFulfilled(id);
        setRequestItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "fulfilled" } : r))
        );
        toast.success("Request marked as fulfilled!");
      } else {
        await closeRequest(id);
        setRequestItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "closed" } : r))
        );
        toast.success("Request closed");
      }
    } catch {
      toast.error("Action failed");
    }
    setRequestAction(null);
  };

  const requestStatusBadge = (status: RequestRowType["status"]) => {
    const styles: Record<RequestRowType["status"], string> = {
      open: "bg-emerald-100 text-emerald-800",
      fulfilled: "bg-blue-100 text-blue-800",
      closed: "bg-muted text-muted-foreground",
    };
    const labels: Record<RequestRowType["status"], string> = {
      open: "Open",
      fulfilled: "Fulfilled",
      closed: "Closed",
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
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
          onDelete={variant === "active" ? () => setDeleteId(listing.id) : undefined}
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


  // ─── OWN PROFILE TABS ──────────────────────────────────────────────────

  if (props.variant === "own") {
    return (
      <>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="active" className="gap-2">
              <Tag className="size-4" />
              Active ({activeItems.length})
            </TabsTrigger>
            <TabsTrigger value="sold" className="gap-2">
              <ShoppingCart className="size-4" />
              Sold ({soldItems.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <MagnifyingGlass className="size-4" />
              Requests ({requestItems.length})
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

          <TabsContent value="requests" className="mt-6">
            {requestItems.length > 0 ? (
              <div className="overflow-hidden rounded-xl border bg-card">
                {requestItems.map((req, idx) => (
                  <div key={req.id} className={idx > 0 ? "border-t" : ""}>
                    <RequestRow
                      request={req}
                      currentUserId={ownUserId}
                      rightAction={
                        <div className="flex flex-wrap items-center gap-2">
                          {requestStatusBadge(req.status)}
                          {req.status === "open" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5"
                                onClick={() => router.push(`/requests/${req.id}/edit`)}
                              >
                                <PencilSimple className="size-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5"
                                onClick={() => setRequestAction({ id: req.id, type: "fulfilled" })}
                              >
                                <Check className="size-3.5 text-emerald-600" />
                                Fulfilled
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5"
                                onClick={() => setRequestAction({ id: req.id, type: "closed" })}
                              >
                                <XCircle className="size-3.5 text-muted-foreground" />
                                Close
                              </Button>
                            </>
                          )}
                        </div>
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                  <MagnifyingGlass className="size-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">No requests posted yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Post what you&apos;re looking for and let sellers find you
                </p>
                <Button asChild>
                  <Link href="/requests/new">
                    <Plus className="size-4" />
                    Post a Request
                  </Link>
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {savedItems.length > 0 ? renderGrid(savedItems, "saved") : emptySaved}
          </TabsContent>
        </Tabs>

        {/* Request Action Confirmation */}
        <AlertDialog open={!!requestAction} onOpenChange={(o) => { if (!o) setRequestAction(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {requestAction?.type === "fulfilled"
                  ? "Mark as fulfilled?"
                  : "Close this request?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {requestAction?.type === "fulfilled"
                  ? "This marks the request as completed. Sellers will no longer see it as open."
                  : "This closes the request without marking it as fulfilled."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRequestAction}>
                {requestAction?.type === "fulfilled" ? "Mark as Fulfilled" : "Close Request"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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

        {/* Delete Listing Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Listing?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the listing and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteListing}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Yes, Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ─── PUBLIC PROFILE TABS ────────────────────────────────────────────────

  const { requests } = props as PublicProfileTabsProps;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full justify-start">
        <TabsTrigger value="listings" className="gap-2">
          <Tag className="size-4" />
          Active Listings ({activeItems.length})
        </TabsTrigger>
        <TabsTrigger value="requests" className="gap-2">
          <MagnifyingGlass className="size-4" />
          Looking For ({requests.length})
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

      <TabsContent value="requests" className="mt-6">
        {requests.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card">
            {requests.map((req, idx) => (
              <div key={req.id} className={idx > 0 ? "border-t" : ""}>
                <RequestRow request={req} currentUserId={null} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <MagnifyingGlass className="size-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No requests posted</h3>
            <p className="text-sm text-muted-foreground">This user isn't currently looking for anything</p>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
