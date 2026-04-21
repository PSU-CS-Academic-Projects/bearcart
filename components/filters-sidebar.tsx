"use client";

import { useState } from "react";
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
  Package,
  Wrench,
  DotsThree,
  Faders,
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

interface FiltersSidebarProps {
  className?: string;
}

function FiltersContent() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
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

  return (
    <div className="flex flex-col gap-6">
      {/* Categories */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Categories</h3>
        <div className="flex flex-col gap-2">
          {categories.map(({ name, icon: Icon }) => (
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
            onValueChange={setPriceRange}
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
      </div>

      {/* Condition */}
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Condition</h3>
        <div className="flex flex-col gap-2">
          {conditions.map((condition) => (
            <div key={condition} className="flex items-center gap-2">
              <Checkbox
                id={condition}
                checked={selectedConditions.includes(condition)}
                onCheckedChange={() => toggleCondition(condition)}
              />
              <Label
                htmlFor={condition}
                className="cursor-pointer text-sm font-normal"
              >
                {condition}
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
        onClick={() => {
          setSelectedCategories([]);
          setPriceRange([0, 10000]);
          setSelectedConditions([]);
        }}
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
