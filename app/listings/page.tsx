import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ListingCard, ListingCardSkeleton } from "@/components/listing-card";
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
import { parseCurrencyInput } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ListingsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
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
  const categoryParam = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const categories = categoryParam
    ? categoryParam.split(",").map((c) => c.trim()).filter(Boolean)
    : undefined;
  const conditionParam = typeof searchParams.condition === "string" ? searchParams.condition : undefined;
  const conditions = conditionParam
    ? conditionParam.split(",").map((c) => c.trim()).filter(Boolean)
    : undefined;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const minPrice = typeof searchParams.min === "string" ? parseCurrencyInput(searchParams.min) : null;
  const maxPrice = typeof searchParams.max === "string" ? parseCurrencyInput(searchParams.max) : null;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "newest";

  const sortMap: Record<string, ListingFilters["sortBy"]> = {
    newest: "newest",
    "price-low": "price-low",
    "price-high": "price-high",
  };

  const filters: ListingFilters = {
    search,
    categories,
    conditions,
    minPrice: minPrice !== null && minPrice > 0 ? minPrice : undefined,
    maxPrice: maxPrice !== null && maxPrice > 0 ? maxPrice : undefined,
    sortBy: sortMap[sort] ?? "newest",
    page: isNaN(page) ? 1 : page,
    pageSize: 12,
  };

  const hasActiveFilters = !!(categoryParam || conditionParam || search || minPrice || maxPrice);

  const { listings, total, totalPages } = await getListings(filters);

  return (
    <>
      {/* Result count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {total === 0
          ? "No listings yet"
          : listings.length < total
            ? `Showing ${listings.length} of ${total} listings`
            : `${total} ${total === 1 ? "item" : "items"} listings`}
      </p>

      {listings.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                slug={listing.slug ?? listing.id}
                title={listing.title}
                price={listing.price}
                category={listing.category}
                condition={formatCondition(listing.condition)}
                sellerName={getSellerName(listing)}
                sellerAvatar={listing.seller?.avatar_url ?? ""}
                timePosted={formatTimeAgo(listing.created_at)}
                createdAt={listing.created_at}
                updatedAt={listing.updated_at}
                imageUrl={getCoverImage(listing)}
                priority={index < 4}
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            All Listings
          </h1>
        </div>

        {/* Top Controls — quieter, data is the hero */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Suspense fallback={null}>
            <ListingsMobileFiltersSheet />
          </Suspense>

          <div className="ml-auto flex items-center text-sm">
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>
        </div>

        {/* Active Filter Badges */}
        <div className="mb-3">
          <Suspense fallback={null}>
            <ActiveFilterBadges />
          </Suspense>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
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
