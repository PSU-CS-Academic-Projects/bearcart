"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Book,
  Desktop,
  TShirt,
  Hamburger,
  Package,
  Wrench,
  DotsThree,
  Faders,
  Trash,
  GraduationCap,
  X,
} from "@phosphor-icons/react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Books", icon: Book },
  { name: "Electronics", icon: Desktop },
  { name: "Clothing", icon: TShirt },
  { name: "Food", icon: Hamburger },
  { name: "School Supplies", icon: GraduationCap },
  { name: "Services", icon: Wrench },
  { name: "Others", icon: DotsThree },
];

const CONDITIONS = [
  { display: "New", value: "new" },
  { display: "Like New", value: "like_new" },
  { display: "Good", value: "good" },
  { display: "Fair", value: "fair" },
  { display: "Poor", value: "poor" },
];

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

const BLOCKED_BUDGET_KEYS = ["e", "E", "-", "."];

function sanitizeBudget(value: string) {
  if (!value) return "";

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "";

  return String(Math.floor(numericValue));
}

// ─── Hook: URL Param Filters ──────────────────────────────────────────────────

function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = useCallback(
    (key: string) => searchParams.get(key) ?? "",
    [searchParams]
  );

  const set = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // Multi-category: stored as comma-separated in ?category=
  const categoryParam = get("category");
  const categories: string[] = categoryParam
    ? categoryParam.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const toggleCategory = useCallback(
    (name: string) => {
      const next = categories.includes(name)
        ? categories.filter((c) => c !== name)
        : [...categories, name];
      set({ category: next.length > 0 ? next.join(",") : null });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories.join(","), set]
  );

  const removeCategory = useCallback(
    (name: string) => {
      const next = categories.filter((c) => c !== name);
      set({ category: next.length > 0 ? next.join(",") : null });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories.join(","), set]
  );

  const conditionParam = get("condition");
  const conditions: string[] = conditionParam
    ? conditionParam.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const toggleCondition = useCallback(
    (value: string) => {
      const next = conditions.includes(value)
        ? conditions.filter((c) => c !== value)
        : [...conditions, value];
      set({ condition: next.length > 0 ? next.join(",") : null });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conditions.join(","), set]
  );

  const removeCondition = useCallback(
    (value: string) => {
      const next = conditions.filter((c) => c !== value);
      set({ condition: next.length > 0 ? next.join(",") : null });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conditions.join(","), set]
  );

  const search = get("search");
  const minPrice = get("min");
  const maxPrice = get("max");

  const hasActiveFilters = !!(categoryParam || conditionParam || search || minPrice || maxPrice);

  return {
    get,
    set,
    clearAll,
    categories,
    toggleCategory,
    removeCategory,
    conditions,
    toggleCondition,
    removeCondition,
    search,
    minPrice,
    maxPrice,
    hasActiveFilters,
  };
}

// ─── Active Filter Badges ─────────────────────────────────────────────────────

export function ActiveFilterBadges() {
  const {
    categories,
    removeCategory,
    conditions,
    removeCondition,
    search,
    minPrice,
    maxPrice,
    set,
    hasActiveFilters,
    clearAll,
  } = useFilterParams();

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {search && (
        <Badge variant="secondary" className="gap-1 py-1 pl-2.5 pr-1.5">
          Search: &quot;{search}&quot;
          <button
            onClick={() => set({ search: null })}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
      {categories.map((cat) => (
        <Badge key={cat} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1.5">
          {cat}
          <button
            onClick={() => removeCategory(cat)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {conditions.map((cond) => (
        <Badge key={cond} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1.5">
          {CONDITION_LABELS[cond] ?? cond}
          <button
            onClick={() => removeCondition(cond)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {(minPrice || maxPrice) && (
        <Badge variant="secondary" className="gap-1 py-1 pl-2.5 pr-1.5">
          ₱{minPrice || "0"} – ₱{maxPrice || "∞"}
          <button
            onClick={() => set({ min: null, max: null })}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      )}
      <button
        onClick={clearAll}
        className="text-xs font-medium text-primary hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

// ─── Filter Content (shared between sidebar and sheet) ────────────────────────

function FiltersContent() {
  const {
    categories,
    toggleCategory,
    conditions,
    toggleCondition,
    minPrice,
    maxPrice,
    set,
    clearAll,
    hasActiveFilters,
  } = useFilterParams();

  return (
    <div className="flex flex-col gap-6">
      {/* Categories — multi-select */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Categories</h3>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map(({ name, icon: Icon }) => {
            const active = categories.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggleCategory(name)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="size-4" />
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Condition</h3>
        <div className="flex flex-col gap-2">
          {CONDITIONS.map(({ display, value }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`cond-${value}`}
                checked={conditions.includes(value)}
                onCheckedChange={() => toggleCondition(value)}
              />
              <Label
                htmlFor={`cond-${value}`}
                className="cursor-pointer text-sm font-normal"
              >
                {display}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Price Range</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const min = fd.get("min") as string;
            const max = fd.get("max") as string;
            set({
              min: min && parseInt(min) > 0 ? min : null,
              max: max && parseInt(max) > 0 ? max : null,
            });
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="min-price" className="sr-only">Min price</Label>
              <Input
                id="min-price"
                name="min"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 500"
                defaultValue={minPrice}
                onKeyDown={(e) => {
                  if (BLOCKED_BUDGET_KEYS.includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => {
                  e.currentTarget.value = sanitizeBudget(e.currentTarget.value);
                }}
                className="h-9 text-sm"
              />
            </div>
            <span className="text-muted-foreground">–</span>
            <div className="flex-1">
              <Label htmlFor="max-price" className="sr-only">Max price</Label>
              <Input
                id="max-price"
                name="max"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 500"
                defaultValue={maxPrice}
                onKeyDown={(e) => {
                  if (BLOCKED_BUDGET_KEYS.includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => {
                  e.currentTarget.value = sanitizeBudget(e.currentTarget.value);
                }}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Apply Price
          </Button>
        </form>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" className="mt-2" onClick={clearAll}>
          <Trash className="size-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

interface ListingsFiltersProps {
  className?: string;
}

export function ListingsFiltersSidebar({ className }: ListingsFiltersProps) {
  return (
    <aside className={className}>
      <div className="sticky top-24 rounded-xl border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
          <Faders className="size-5" />
          Filters
        </h2>
        <FiltersContent />
      </div>
    </aside>
  );
}

// ─── Mobile Sheet ─────────────────────────────────────────────────────────────

export function ListingsMobileFiltersSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <Faders className="size-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Faders className="size-5" />
            Filters
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 pb-6">
          <FiltersContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
