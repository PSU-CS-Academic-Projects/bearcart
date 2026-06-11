import { Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Plus, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import {
  RequestsFiltersSidebar,
  RequestsMobileFiltersSheet,
  RequestActiveFilterBadges,
} from "@/components/requests-filters";
import { RequestRow, RequestRowSkeleton } from "@/components/request-row";
import { Pagination } from "@/components/pagination";
import { getRequests, type RequestFilters } from "@/lib/actions/requests";
import { createClient } from "@/lib/supabase-server";
import { parseCurrencyInput } from "@/lib/currency";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RequestsListSkeleton() {
  return (
    <div className="rounded-xl border bg-card">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={i > 0 ? "border-t" : ""}>
          <RequestRowSkeleton />
        </div>
      ))}
    </div>
  );
}

// ─── Server Data ──────────────────────────────────────────────────────────────

async function RequestsList({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  // Parse URL params
  const categoryParam = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const categories = categoryParam
    ? categoryParam.split(",").map((c) => c.trim()).filter(Boolean)
    : undefined;

  const urgencyParam = typeof searchParams.urgency === "string" ? searchParams.urgency : undefined;
  const urgencies = urgencyParam
    ? urgencyParam.split(",").map((u) => u.trim()).filter(Boolean)
    : undefined;

  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;
  const minBudget = typeof searchParams.min === "string" ? parseCurrencyInput(searchParams.min) : null;
  const maxBudget = typeof searchParams.max === "string" ? parseCurrencyInput(searchParams.max) : null;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;

  const filters: RequestFilters = {
    search,
    categories,
    urgencies,
    minBudget: minBudget !== null && minBudget > 0 ? minBudget : undefined,
    maxBudget: maxBudget !== null && maxBudget > 0 ? maxBudget : undefined,
    page: isNaN(page) ? 1 : page,
    pageSize: 12,
  };

  const hasActiveFilters = !!(categoryParam || urgencyParam || search || minBudget || maxBudget);

  const { requests, total, totalPages } = await getRequests(filters);

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {total === 0
          ? "No requests found"
          : requests.length < total
            ? `Showing ${requests.length} of ${total} request${total !== 1 ? "s" : ""}`
            : `${total} request${total !== 1 ? "s" : ""}`}
      </p>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <MagnifyingGlass className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {hasActiveFilters ? "No requests match your filters" : "No requests yet"}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your filters to see more requests"
              : "Be the first to post what you're looking for"}
          </p>
          {hasActiveFilters ? (
            <Button asChild variant="outline">
              <Link href="/requests">Clear filters</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/requests/new">
                <Plus className="size-4" />
                Post a Request
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-card">
            {requests.map((request, idx) => (
              <div key={request.id} className={idx > 0 ? "border-t" : ""}>
                <RequestRow request={request} currentUserId={currentUserId} />
              </div>
            ))}
          </div>

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

export const metadata = {
  title: "Requests — BearCart",
};

export default async function RequestsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  // Auth check (for showing the Post button) — public page, no redirect
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Requests
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Help PSU students and faculty find what they need
            </p>
          </div>
          {isLoggedIn && (
            <Button asChild>
              <Link href="/requests/new">
                <Plus className="size-4" />
                Post a Request
              </Link>
            </Button>
          )}
        </div>

        {/* Top Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <RequestsMobileFiltersSheet />
        </div>

        {/* Active Filter Badges */}
        <div className="mb-4">
          <Suspense fallback={null}>
            <RequestActiveFilterBadges />
          </Suspense>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          <Suspense fallback={null}>
            <RequestsFiltersSidebar className="hidden w-64 shrink-0 lg:block" />
          </Suspense>

          <div className="min-w-0 flex-1">
            <Suspense fallback={<RequestsListSkeleton />}>
              <RequestsList searchParams={resolvedParams} />
            </Suspense>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
