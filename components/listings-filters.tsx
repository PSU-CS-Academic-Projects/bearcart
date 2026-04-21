"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  Package,
  Wrench,
  DotsThree,
  Faders,
  MagnifyingGlass,
  Trash,
} from "@phosphor-icons/react";

const categories = [
  { name: "Books", icon: Book },
  { name: "Electronics", icon: Desktop },
  { name: "Clothing", icon: TShirt },
  { name: "Food", icon: Hamburger },
  { name: "Supplies", icon: Package },
  { name: "Services", icon: Wrench },
  { name: "Others", icon: DotsThree },
];

const conditions = ["New", "Like New", "Good", "Fair"];

interface ListingsFiltersProps {
  className?: string;
  onClearFilters?: () => void;
}

function FiltersContent({ onClearFilters }: { onClearFilters?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setPriceRange([0, 10000]);
    setMinPrice("");
    setMaxPrice("");
    setSelectedConditions([]);
    onClearFilters?.();
  };

  const handleMinPriceChange = (value: string) => {
    setMinPrice(value);
    const num = parseInt(value) || 0;
    setPriceRange([num, priceRange[1]]);
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPrice(value);
    const num = parseInt(value) || 10000;
    setPriceRange([priceRange[0], num]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Search</h3>
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3">
          <MagnifyingGlass className="size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Categories</h3>
        <div className="flex flex-col gap-1">
          {categories.map(({ name, icon: Icon }) => (
            <div key={name} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${name}`}
                checked={selectedCategories.includes(name)}
                onCheckedChange={() => toggleCategory(name)}
              />
              <Label
                htmlFor={`cat-${name}`}
                className="flex cursor-pointer items-center gap-2 text-sm font-normal"
              >
                <Icon className="size-4 text-muted-foreground" />
                {name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Listing Type */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Listing Type</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="for-sale-listing" defaultChecked />
          <Label htmlFor="for-sale-listing" className="cursor-pointer text-sm font-normal">
            For Sale
          </Label>
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Condition</h3>
        <div className="flex flex-col gap-2">
          {conditions.map((condition) => (
            <div key={condition} className="flex items-center gap-2">
              <Checkbox
                id={`cond-${condition}`}
                checked={selectedConditions.includes(condition)}
                onCheckedChange={() => toggleCondition(condition)}
              />
              <Label
                htmlFor={`cond-${condition}`}
                className="cursor-pointer text-sm font-normal"
              >
                {condition}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Price Range</h3>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={10000}
            step={100}
            className="mb-4"
          />
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="min-price" className="sr-only">Min price</Label>
              <Input
                id="min-price"
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => handleMinPriceChange(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="flex-1">
              <Label htmlFor="max-price" className="sr-only">Max price</Label>
              <Input
                id="max-price"
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}
          </p>
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="mt-2"
        onClick={handleClearAll}
      >
        <Trash className="size-4" />
        Clear All Filters
      </Button>
    </div>
  );
}

export function ListingsFiltersSidebar({ className, onClearFilters }: ListingsFiltersProps) {
  return (
    <aside className={className}>
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
          <Faders className="size-5" />
          Filters
        </h2>
        <FiltersContent onClearFilters={onClearFilters} />
      </div>
    </aside>
  );
}

export function ListingsMobileFiltersSheet({ onClearFilters }: ListingsFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
          <FiltersContent onClearFilters={onClearFilters} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
