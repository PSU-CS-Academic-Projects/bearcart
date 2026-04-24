import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { FiltersSidebar, MobileFiltersSheet } from "@/components/filters-sidebar";
import { getListings, type ListingWithImages } from "@/lib/actions/listings";
import { Storefront, Plus } from "@phosphor-icons/react/dist/ssr";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Postgres timestamp into a human-friendly relative string. */
function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Get the cover image URL from a listing's images array. */
function getCoverImage(listing: ListingWithImages): string {
  const cover = listing.listing_images?.find((img) => img.is_cover);
  return cover?.image_url ?? listing.listing_images?.[0]?.image_url ?? "/placeholder.svg";
}

/** Build the seller display name from the joined user record. */
function getSellerName(listing: ListingWithImages): string {
  const seller = listing.seller;
  if (!seller) return "Unknown seller";
  return seller.full_name ?? "PSU Student";
}

/** Format the condition value from the DB to a display-friendly label. */
function formatCondition(condition: string): string {
  const map: Record<string, string> = {
    new: "New",
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
  };
  return map[condition] ?? condition;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-accent">
        <Storefront className="size-8 text-primary" weight="duotone" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        No listings yet
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Be the first to post something for sale on campus. Your classmates are
        waiting!
      </p>
      <Button asChild>
        <Link href="/listings/new">
          <Plus className="size-4" />
          Post a Listing
        </Link>
      </Button>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export async function ListingsSection() {
  const { listings } = await getListings({ pageSize: 12 });

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Latest Listings</h2>
            <p className="text-muted-foreground">
              Discover what&apos;s available on campus
            </p>
          </div>
          <MobileFiltersSheet />
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <FiltersSidebar className="hidden w-64 shrink-0 lg:block" />

          {/* Listings Grid */}
          <div className="flex-1">
            {listings.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      price={listing.price}
                      category={listing.category}
                      condition={formatCondition(listing.condition)}
                      sellerName={getSellerName(listing)}
                      sellerAvatar={listing.seller?.avatar_url ?? ""}
                      timePosted={formatTimeAgo(listing.created_at)}
                      imageUrl={getCoverImage(listing)}
                    />
                  ))}
                </div>

                {/* View All */}
                <div className="mt-8 text-center">
                  <Button asChild variant="link">
                    <Link href="/listings">
                      View all listings →
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
