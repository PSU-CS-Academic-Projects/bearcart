"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ListingCard } from "@/components/listing-card";
import {
  ListingsFiltersSidebar,
  ListingsMobileFiltersSheet,
} from "@/components/listings-filters";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SquaresFour, List } from "@phosphor-icons/react";

// 12 realistic placeholder listings
const listings = [
  {
    id: 1,
    title: "Introduction to Psychology Textbook (10th Ed)",
    price: 450,
    category: "Books",
    condition: "Good",
    sellerName: "Maria Santos",
    sellerAvatar: "",
    timePosted: "2 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Casio Scientific Calculator FX-991ES",
    price: 850,
    category: "Electronics",
    condition: "Like New",
    sellerName: "Juan Dela Cruz",
    sellerAvatar: "",
    timePosted: "5 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    title: "PSU College Uniform Set (Medium)",
    price: 600,
    category: "Clothing",
    condition: "New",
    sellerName: "Anna Reyes",
    sellerAvatar: "",
    timePosted: "1 day ago",
    imageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    title: "Homemade Chicken Empanadas (Pack of 10)",
    price: 150,
    category: "Food",
    condition: "New",
    sellerName: "Lola Caring",
    sellerAvatar: "",
    timePosted: "3 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Engineering Drawing Set with Case",
    price: 320,
    category: "Supplies",
    condition: "Good",
    sellerName: "Mark Rivera",
    sellerAvatar: "",
    timePosted: "12 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Thesis Editing and Proofreading Service",
    price: 500,
    category: "Services",
    condition: "New",
    sellerName: "Prof. Garcia",
    sellerAvatar: "",
    timePosted: "6 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=400&fit=crop",
  },
  {
    id: 7,
    title: "Portable USB Fan for Hot Classrooms",
    price: 180,
    category: "Electronics",
    condition: "New",
    sellerName: "Rico Mendoza",
    sellerAvatar: "",
    timePosted: "8 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=400&h=400&fit=crop",
  },
  {
    id: 8,
    title: "Accounting Principles Book Bundle (3 books)",
    price: 1200,
    category: "Books",
    condition: "Fair",
    sellerName: "Lisa Tan",
    sellerAvatar: "",
    timePosted: "2 days ago",
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop",
  },
  {
    id: 9,
    title: "Lab Gown White (Large Size)",
    price: 350,
    category: "Clothing",
    condition: "Like New",
    sellerName: "Carlo Bautista",
    sellerAvatar: "",
    timePosted: "4 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=400&fit=crop",
  },
  {
    id: 10,
    title: "Fresh Buko Juice and Snacks Bundle",
    price: 80,
    category: "Food",
    condition: "New",
    sellerName: "Mang Tomas",
    sellerAvatar: "",
    timePosted: "1 hour ago",
    imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=400&fit=crop",
  },
  {
    id: 11,
    title: "HP Laptop Charger 65W Universal",
    price: 650,
    category: "Electronics",
    condition: "Good",
    sellerName: "Kris Aquino",
    sellerAvatar: "",
    timePosted: "1 day ago",
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=400&fit=crop",
  },
  {
    id: 12,
    title: "Art Materials Bundle (Paint, Brushes, Canvas)",
    price: 780,
    category: "Supplies",
    condition: "New",
    sellerName: "Andrea Cruz",
    sellerAvatar: "",
    timePosted: "7 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop",
  },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "recent", label: "Most Recent" },
];

export default function ListingsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showEmpty, setShowEmpty] = useState(false);

  const handleClearFilters = () => {
    setShowEmpty(false);
  };

  const totalListings = showEmpty ? 0 : listings.length;
  const displayedListings = showEmpty ? [] : listings;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            All Listings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Showing {totalListings} listings
          </p>
        </div>

        {/* Top Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <ListingsMobileFiltersSheet onClearFilters={handleClearFilters} />

          <div className="flex items-center gap-3 ml-auto">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="hidden items-center gap-1 rounded-lg border p-1 sm:flex">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => setViewMode("grid")}
              >
                <SquaresFour className="size-4" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="size-8"
                onClick={() => setViewMode("list")}
              >
                <List className="size-4" />
                <span className="sr-only">List view</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar - Desktop only */}
          <ListingsFiltersSidebar
            className="hidden w-64 shrink-0 lg:block"
            onClearFilters={handleClearFilters}
          />

          {/* Listings */}
          <div className="flex-1">
            {displayedListings.length === 0 ? (
              <EmptyState onClearFilters={handleClearFilters} />
            ) : (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                      : "flex flex-col gap-4"
                  }
                >
                  {displayedListings.map((listing) => (
                    <Link key={listing.id} href={`/listings/${listing.id}`}>
                      <ListingCard
                        title={listing.title}
                        price={listing.price}
                        category={listing.category}
                        condition={listing.condition}
                        sellerName={listing.sellerName}
                        sellerAvatar={listing.sellerAvatar}
                        timePosted={listing.timePosted}
                        imageUrl={listing.imageUrl}
                      />
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={5}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
