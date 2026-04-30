import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { FiltersSidebar, MobileFiltersSheet } from "@/components/filters-sidebar";
import { getListings } from "@/lib/actions/listings";
import { formatTimeAgo, getCoverImage, getSellerName, formatCondition } from "@/lib/listing-helpers";
import { Storefront, Plus } from "@phosphor-icons/react/dist/ssr";

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-accent">
        <Storefront className="size-8 text-primary" />
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
            <h2 className="text-[2.25rem] font-black leading-none tracking-[-0.03em] text-foreground">Latest Listings</h2>
            <p className="mt-[5px] text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
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
