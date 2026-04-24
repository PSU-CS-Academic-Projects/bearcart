import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass, Trash } from "@phosphor-icons/react/dist/ssr";

interface EmptyStateProps {
  /** If true, shows "clear filters" CTA. Otherwise shows "browse listings". */
  hasFilters?: boolean;
}

export function EmptyState({ hasFilters = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <MagnifyingGlass className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {hasFilters ? "No listings match your filters" : "No listings found"}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your search criteria or clear all filters to see everything."
          : "We couldn\u0027t find any listings right now. Check back later!"}
      </p>
      {hasFilters && (
        <Button asChild variant="outline">
          <Link href="/listings">
            <Trash className="size-4" />
            Clear Filters
          </Link>
        </Button>
      )}
    </div>
  );
}
