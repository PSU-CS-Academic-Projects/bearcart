"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
} from "@phosphor-icons/react";

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
];

interface FiltersSidebarProps {
  className?: string;
}

function buildListingsUrl(
  cats: string[],
  conds: string[],
  price: [number, number]
): string {
  const params = new URLSearchParams();
  if (cats.length > 0) params.set("category", cats.join(","));
  if (conds.length > 0) params.set("condition", conds.join(","));
  if (price[0] > 0) params.set("min", String(price[0]));
  if (price[1] < 10000) params.set("max", String(price[1]));
  const qs = params.toString();
  return qs ? `/listings?${qs}` : "/listings";
}

function FiltersContent() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const toggleCategory = (name: string) => {
    const next = selectedCategories.includes(name)
      ? selectedCategories.filter((c) => c !== name)
      : [...selectedCategories, name];
    setSelectedCategories(next);
    router.push(buildListingsUrl(next, selectedConditions, priceRange));
  };

  const toggleCondition = (value: string) => {
    const next = selectedConditions.includes(value)
      ? selectedConditions.filter((c) => c !== value)
      : [...selectedConditions, value];
    setSelectedConditions(next);
    router.push(buildListingsUrl(selectedCategories, next, priceRange));
  };

  const applyPrice = () => {
    router.push(buildListingsUrl(selectedCategories, selectedConditions, priceRange));
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedConditions([]);
    setPriceRange([0, 10000]);
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

      {/* Price Range */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Price Range</h3>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
            min={0}
            max={10000}
            step={100}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>₱{priceRange[0].toLocaleString()}</span>
            <span>₱{priceRange[1].toLocaleString()}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={applyPrice}
        >
          Apply Price
        </Button>
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

      {/* Listing Type */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Listing Type</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="for-sale" defaultChecked />
          <Label htmlFor="for-sale" className="cursor-pointer text-sm font-normal">
            For Sale
          </Label>
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
          <Faders className="size-5" />
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
          <Faders className="size-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Faders className="size-5" />
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
