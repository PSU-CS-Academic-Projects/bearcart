"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MagnifyingGlass,
  List,
  ShoppingCart,
  User,
} from "@phosphor-icons/react";

const categories = [
  "All Categories",
  "Books",
  "Electronics",
  "Clothing",
  "Food",
  "Supplies",
  "Services",
  "Others",
];

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <ShoppingCart className="size-7 text-primary" weight="fill" />
          <span className="text-xl font-bold text-foreground">PalMart</span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden flex-1 items-center justify-center gap-2 px-8 md:flex">
          <div className="flex w-full max-w-xl items-center rounded-lg border bg-background">
            <div className="flex items-center border-r px-3">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="h-9 w-36 border-0 bg-transparent shadow-none focus:ring-0">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 items-center gap-2 px-3">
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
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Button size="sm" onClick={signInWithGoogle}>
            <User className="size-4" />
            Login with Google
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <List className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" weight="fill" />
                PalMart
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-4">
              {/* Mobile Search */}
              <div className="flex flex-col gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="h-px bg-border" />

              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-2">
                {categories.slice(1).map((category) => (
                  <Link
                    key={category}
                    href="#"
                    className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category}
                  </Link>
                ))}
              </nav>

              <div className="h-px bg-border" />

              {/* Mobile Auth */}
              <div className="flex flex-col gap-2">
                <Button className="w-full" onClick={() => { signInWithGoogle(); setMobileMenuOpen(false); }}>
                  <User className="size-4" />
                  Login with Google
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
