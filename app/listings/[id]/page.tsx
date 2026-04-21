"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PhotoGallery } from "@/components/photo-gallery";
import { SellerInfoCard } from "@/components/seller-info-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { MeetupInfo } from "@/components/meetup-info";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChatCircle,
  Heart,
  ShareNetwork,
  Flag,
  Clock,
} from "@phosphor-icons/react";

// Mock listing data
const listingData = {
  id: "1",
  title: "Calculus: Early Transcendentals 8th Edition by James Stewart",
  price: 850,
  condition: "Like New",
  category: "Books",
  description: `Selling my Calculus textbook from last semester. This is the 8th edition by James Stewart, widely used in most engineering and math courses.

The book is in excellent condition with no highlights or markings. All pages are intact and the binding is perfect. Comes with the original access code (unused).

Perfect for BS Math, BS Engineering, or any course that requires Calculus.

Reason for selling: Already passed the course and upgrading to a different textbook.`,
  tags: ["Textbook", "Math", "Engineering", "Calculus", "College"],
  postedTime: "2 hours ago",
  photos: [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1553729784-e91953dec042?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=800&fit=crop",
  ],
  seller: {
    id: "seller-1",
    name: "Maria Santos",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    role: "student" as const,
    memberSince: "2024",
    totalListings: 12,
    rating: 4.8,
  },
};

// Mock related listings
const relatedListings = [
  {
    id: "2",
    title: "Physics for Scientists and Engineers",
    price: 750,
    category: "Books",
    condition: "Good",
    sellerName: "Maria Santos",
    sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    timePosted: "1 day ago",
    imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop",
  },
  {
    id: "3",
    title: "Scientific Calculator FX-991ES",
    price: 1200,
    category: "Electronics",
    condition: "Like New",
    sellerName: "Maria Santos",
    sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    timePosted: "3 days ago",
    imageUrl: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=400&h=400&fit=crop",
  },
  {
    id: "4",
    title: "Engineering Drawing Set",
    price: 450,
    category: "Supplies",
    condition: "New",
    sellerName: "Maria Santos",
    sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    timePosted: "5 days ago",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop",
  },
  {
    id: "5",
    title: "Organic Chemistry Textbook",
    price: 600,
    category: "Books",
    condition: "Good",
    sellerName: "Maria Santos",
    sellerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    timePosted: "1 week ago",
    imageUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=400&fit=crop",
  },
];

export default function ListingDetailPage() {
  const [isSaved, setIsSaved] = useState(false);
  const isLoggedIn = false; // Mock authentication state

  const conditionColors: Record<string, string> = {
    New: "bg-green-100 text-green-800",
    "Like New": "bg-emerald-100 text-emerald-800",
    Good: "bg-blue-100 text-blue-800",
    Fair: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Listings", href: "/listings" },
              { label: listingData.title },
            ]}
          />

          {/* Main Content */}
          <div className="mt-6 grid gap-8 lg:grid-cols-5">
            {/* Left Column - Photos */}
            <div className="lg:col-span-3">
              <PhotoGallery
                photos={listingData.photos}
                alt={listingData.title}
              />
            </div>

            {/* Right Column - Details */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Title and Price */}
              <div>
                <h1 className="text-2xl font-bold text-foreground text-balance">
                  {listingData.title}
                </h1>
                <p className="mt-2 text-3xl font-bold text-primary">
                  ₱{listingData.price.toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge className={conditionColors[listingData.condition]}>
                    {listingData.condition}
                  </Badge>
                  <Badge variant="secondary">{listingData.category}</Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    Posted {listingData.postedTime}
                  </span>
                </div>
              </div>

              {/* Action Buttons - Desktop */}
              <div className="hidden flex-col gap-3 lg:flex">
                {isLoggedIn ? (
                  <Button size="lg" className="w-full">
                    <ChatCircle className="size-5" />
                    Message Seller
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" asChild>
                    <Link href="/login">
                      <ChatCircle className="size-5" />
                      Login to Message Seller
                    </Link>
                  </Button>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsSaved(!isSaved)}
                  >
                    <Heart
                      className="size-4"
                      weight={isSaved ? "fill" : "regular"}
                    />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ShareNetwork className="size-4" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Seller Info Card */}
              <SellerInfoCard seller={listingData.seller} />

              {/* Meetup Info */}
              <MeetupInfo />

              {/* Description */}
              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Description
                </h2>
                <p className="whitespace-pre-line text-muted-foreground">
                  {listingData.description}
                </p>
              </div>

              {/* Tags */}
              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {listingData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Report Link */}
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive">
                <Flag className="size-4" />
                Report this listing
              </button>
            </div>
          </div>

          {/* Related Listings */}
          <section className="mt-12 border-t pt-10">
            <h2 className="mb-6 text-xl font-bold text-foreground">
              More from this Seller
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {relatedListings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <ListingCard {...listing} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Sticky Action Buttons */}
      <div className="sticky bottom-0 border-t bg-card p-4 lg:hidden">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSaved(!isSaved)}
            className="shrink-0"
          >
            <Heart
              className="size-5"
              weight={isSaved ? "fill" : "regular"}
            />
            <span className="sr-only">{isSaved ? "Unsave" : "Save"}</span>
          </Button>
          <Button variant="outline" size="icon" className="shrink-0">
            <ShareNetwork className="size-5" />
            <span className="sr-only">Share</span>
          </Button>
          {isLoggedIn ? (
            <Button size="lg" className="flex-1">
              <ChatCircle className="size-5" />
              Message Seller
            </Button>
          ) : (
            <Button size="lg" className="flex-1" asChild>
              <Link href="/login">
                <ChatCircle className="size-5" />
                Login to Message
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
