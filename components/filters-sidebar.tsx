"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BookIcon,
  DesktopIcon,
  TShirtIcon,
  HamburgerIcon,
  GraduationCapIcon,
  WrenchIcon,
  DotsThreeIcon,
  FadersIcon,
} from "@phosphor-icons/react";
import {
  formatCurrencyInput,
  parseCurrencyInput,
  shouldBlockCurrencyKey,
} from "@/lib/currency";

const CATEGORIES = [
  { name: "Books", icon: BookIcon },
  { name: "Electronics", icon: DesktopIcon },
  { name: "Clothing", icon: TShirtIcon },
  { name: "Food", icon: HamburgerIcon },
  { name: "School Supplies", icon: GraduationCapIcon },
  { name: "Services", icon: WrenchIcon },
  { name: "Others", icon: DotsThreeIcon },
];

const CONDITIONS = [
  { display: "New", value: "new" },
  { display: "Like New", value: "like_new" },
  { display: "Good", value: "good" },
  { display: "Fair", value: "fair" },
];

interface FiltersSidebarProps {
  className?: string;
}

function buildListingsUrl(
  cats: string[],
  conds: string[],
  min: string,
  max: string
): string {
  const params = new URLSearchParams();
  if (cats.length > 0) params.set("category", cats.join(","));
  if (conds.length > 0) params.set("condition", conds.join(","));
  const minValue = parseCurrencyInput(min);
  const maxValue = parseCurrencyInput(max);
  if (minValue !== null && minValue > 0) params.set("min", String(minValue));
  if (maxValue !== null && maxValue > 0) params.set("max", String(maxValue));
  const qs = params.toString();
  return qs ? `/listings?${qs}` : "/listings";
}

function FiltersContent() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const toggleCategory = (name: string) => {
    const next = selectedCategories.includes(name)
      ? selectedCategories.filter((c) => c !== name)
      : [...selectedCategories, name];
    setSelectedCategories(next);
    router.push(buildListingsUrl(next, selectedConditions, minPrice, maxPrice));
  };

  const toggleCondition = (value: string) => {
    const next = selectedConditions.includes(value)
      ? selectedConditions.filter((c) => c !== value)
      : [...selectedConditions, value];
    setSelectedConditions(next);
    router.push(buildListingsUrl(selectedCategories, next, minPrice, maxPrice));
  };

  const applyPrice = (min: string, max: string) => {
    setMinPrice(min);
    setMaxPrice(max);
    router.push(buildListingsUrl(selectedCategories, selectedConditions, min, max));
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedConditions([]);
    setMinPrice("");
    setMaxPrice("");
    router.push("/listings");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Categories */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Categories</h3>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => toggleCategory(name)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedCategories.includes(name)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              <Icon className="size-4" />
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Condition</h3>
        <div className="flex flex-col gap-2">
          {CONDITIONS.map(({ display, value }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`home-cond-${value}`}
                checked={selectedConditions.includes(value)}
                onCheckedChange={() => toggleCondition(value)}
              />
              <Label
                htmlFor={`home-cond-${value}`}
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
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="home-min-price" className="sr-only">Min price</Label>
            <Input
              id="home-min-price"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 500"
              value={minPrice}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (
                  shouldBlockCurrencyKey(
                    e.key,
                    e.currentTarget.value,
                    e.currentTarget.selectionStart,
                    e.currentTarget.selectionEnd
                  )
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setMinPrice(formatCurrencyInput(e.target.value))}
              onBlur={() => applyPrice(minPrice, maxPrice)}
              className="h-9 text-sm"
            />
          </div>
          <span className="text-muted-foreground">–</span>
          <div className="flex-1">
            <Label htmlFor="home-max-price" className="sr-only">Max price</Label>
            <Input
              id="home-max-price"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 500"
              value={maxPrice}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (
                  shouldBlockCurrencyKey(
                    e.key,
                    e.currentTarget.value,
                    e.currentTarget.selectionStart,
                    e.currentTarget.selectionEnd
                  )
                ) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setMaxPrice(formatCurrencyInput(e.target.value))}
              onBlur={() => applyPrice(minPrice, maxPrice)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="mt-2"
        onClick={clearAll}
      >
        Clear All Filters
      </Button>
    </div>
  );
}

export function FiltersSidebar({ className }: FiltersSidebarProps) {
  return (
    <aside className={className}>
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
          <FadersIcon className="size-5" />
          Filters
        </h2>
        <FiltersContent />
      </div>
    </aside>
  );
}

export function MobileFiltersSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <FadersIcon className="size-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FadersIcon className="size-5" />
            Filters
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FiltersContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
