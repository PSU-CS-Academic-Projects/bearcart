import { Button } from "@/components/ui/button";
import { MagnifyingGlass, Trash } from "@phosphor-icons/react/dist/ssr";

interface EmptyStateProps {
  onClearFilters?: () => void;
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
        <MagnifyingGlass className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        No listings found
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        We couldn&apos;t find any listings matching your filters. Try adjusting your
        search criteria or clear all filters.
      </p>
      <Button variant="outline" onClick={onClearFilters}>
        <Trash className="size-4" />
        Clear Filters
      </Button>
    </div>
  );
}
