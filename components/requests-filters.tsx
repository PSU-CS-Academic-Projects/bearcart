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
  GraduationCap,
  Wrench,
  DotsThree,
  Faders,
  Trash,
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

const URGENCIES = [
  { display: "Flexible", value: "not_urgent" },
  { display: "Need Soon", value: "moderate" },
  { display: "Urgent", value: "urgent" },
];

const URGENCY_LABELS: Record<string, string> = {
  not_urgent: "Flexible",
  moderate: "Need Soon",
  urgent: "Urgent",
};

const BLOCKED_BUDGET_KEYS = ["e", "E", "-", "."];

function sanitizeBudget(value: string) {
  if (!value) return "";

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "";

  return String(Math.floor(numericValue));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useRequestFilterParams() {
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

  const urgencyParam = get("urgency");
  const urgencies: string[] = urgencyParam
    ? urgencyParam.split(",").map((u) => u.trim()).filter(Boolean)
    : [];

  const toggleUrgency = useCallback(
    (value: string) => {
      const next = urgencies.includes(value)
        ? urgencies.filter((u) => u !== value)
        : [...urgencies, value];
      set({ urgency: next.length > 0 ? next.join(",") : null });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [urgencies.join(","), set]
  );

  const removeUrgency = useCallback(
    (value: string) => {
      const next = urgencies.filter((u) => u !== value);
      set({ urgency: next.length > 0 ? next.join(",") : null });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [urgencies.join(","), set]
  );

  const search = get("search");
  const minBudget = get("min");
  const maxBudget = get("max");

  const hasActiveFilters = !!(
    categoryParam || urgencyParam || search || minBudget || maxBudget
  );

  return {
    set,
    clearAll,
    categories,
    toggleCategory,
    removeCategory,
    urgencies,
    toggleUrgency,
    removeUrgency,
    search,
    minBudget,
    maxBudget,
    hasActiveFilters,
  };
}

// ─── Active Filter Badges ─────────────────────────────────────────────────────

export function RequestActiveFilterBadges() {
  const {
    categories,
    removeCategory,
    urgencies,
    removeUrgency,
    search,
    minBudget,
    maxBudget,
    set,
    hasActiveFilters,
    clearAll,
  } = useRequestFilterParams();

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
      {urgencies.map((u) => (
        <Badge key={u} variant="secondary" className="gap-1 py-1 pl-2.5 pr-1.5">
          {URGENCY_LABELS[u] ?? u}
          <button
            onClick={() => removeUrgency(u)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {(minBudget || maxBudget) && (
        <Badge variant="secondary" className="gap-1 py-1 pl-2.5 pr-1.5">
          ₱{minBudget || "0"} – ₱{maxBudget || "∞"}
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

// ─── Filter Content ───────────────────────────────────────────────────────────

function FiltersContent() {
  const {
    categories,
    toggleCategory,
    urgencies,
    toggleUrgency,
    minBudget,
    maxBudget,
    set,
    clearAll,
    hasActiveFilters,
  } = useRequestFilterParams();

  return (
    <div className="flex flex-col gap-6">
      {/* Categories */}
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

      {/* Urgency */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Urgency</h3>
        <div className="flex flex-col gap-2">
          {URGENCIES.map(({ display, value }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`urg-${value}`}
                checked={urgencies.includes(value)}
                onCheckedChange={() => toggleUrgency(value)}
              />
              <Label
                htmlFor={`urg-${value}`}
                className="cursor-pointer text-sm font-normal"
              >
                {display}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Budget Range</h3>
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
              <Label htmlFor="req-min" className="sr-only">Min budget</Label>
              <Input
                id="req-min"
                name="min"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 500"
                defaultValue={minBudget}
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
              <Label htmlFor="req-max" className="sr-only">Max budget</Label>
              <Input
                id="req-max"
                name="max"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 500"
                defaultValue={maxBudget}
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
            Apply Budget
          </Button>
        </form>
      </div>

      {/* Clear */}
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

interface RequestsFiltersProps {
  className?: string;
}

export function RequestsFiltersSidebar({ className }: RequestsFiltersProps) {
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

export function RequestsMobileFiltersSheet() {
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
