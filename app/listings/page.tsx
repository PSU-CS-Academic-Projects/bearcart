import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ListingCard } from "@/components/listing-card";
import {
  ListingsFiltersSidebar,
  ListingsMobileFiltersSheet,
  ActiveFilterBadges,
} from "@/components/listings-filters";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { SortSelect } from "@/components/sort-select";
import { getListings, type ListingFilters } from "@/lib/actions/listings";
import {
  formatTimeAgo,
  getCoverImage,
  getSellerName,
  formatCondition,
} from "@/lib/listing-helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="flex flex-col gap-3 p-4">
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-6 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Server Data Fetcher ──────────────────────────────────────────────────────

async function ListingsGrid({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Parse URL params into ListingFilters
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const condition = typeof searchParams.condition === "string" ? searchParams.condition : undefined;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const minPrice = typeof searchParams.min === "string" ? parseInt(searchParams.min) : undefined;
  const maxPrice = typeof searchParams.max === "string" ? parseInt(searchParams.max) : undefined;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "newest";

  const sortMap: Record<string, ListingFilters["sortBy"]> = {
    newest: "newest",
    "price-low": "price-low",
    "price-high": "price-high",
  };

  const filters: ListingFilters = {
    search,
    category,
    condition,
    minPrice: minPrice && !isNaN(minPrice) ? minPrice : undefined,
    maxPrice: maxPrice && !isNaN(maxPrice) ? maxPrice : undefined,
    sortBy: sortMap[sort] ?? "newest",
    page: isNaN(page) ? 1 : page,
    pageSize: 12,
  };

  const hasActiveFilters = !!(category || condition || search || minPrice || maxPrice);

  const { listings, total, totalPages } = await getListings(filters);

  return (
    <>
      {/* Result count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {total === 0
          ? "No listings found"
          : listings.length < total
            ? `Showing ${listings.length} of ${total} listing${total !== 1 ? "s" : ""}`
            : `${total} listing${total !== 1 ? "s" : ""}`}
      </p>

      {listings.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={filters.page ?? 1}
                totalPages={totalPages}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ListingsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            All Listings
          </h1>
        </div>

        {/* Top Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <ListingsMobileFiltersSheet />

          <div className="ml-auto flex items-center gap-3">
            <SortSelect />
          </div>
        </div>

        {/* Active Filter Badges */}
        <div className="mb-4">
          <Suspense fallback={null}>
            <ActiveFilterBadges />
          </Suspense>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar - Desktop only */}
          <Suspense fallback={null}>
            <ListingsFiltersSidebar className="hidden w-64 shrink-0 lg:block" />
          </Suspense>

          {/* Listings */}
          <div className="flex-1">
            <Suspense fallback={<ListingsGridSkeleton />}>
              <ListingsGrid searchParams={resolvedParams} />
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
