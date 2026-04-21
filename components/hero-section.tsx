"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass, Storefront, Tag } from "@phosphor-icons/react";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="relative overflow-hidden bg-card py-16 md:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 size-96 rounded-full bg-primary/5" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-primary/5" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Storefront className="size-4 text-primary" weight="fill" />
            Exclusive for PSU Community
          </div>

          {/* Heading */}
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Buy or Sell within{" "}
            <span className="text-primary">PSU Campus</span>
          </h1>

          {/* Subtext */}
          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            The official marketplace of Palawan State University. Connect with
            fellow students and faculty to buy, sell, and trade safely on
            campus.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mb-8 flex max-w-xl items-center gap-2 rounded-xl border bg-background p-2 shadow-sm">
            <div className="flex flex-1 items-center gap-2 px-3">
              <MagnifyingGlass className="size-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground md:text-base"
              />
            </div>
            <Button size="lg" className="hidden sm:flex">
              Search
            </Button>
            <Button size="icon-lg" className="sm:hidden">
              <MagnifyingGlass className="size-5" />
            </Button>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/listings">
                <MagnifyingGlass className="size-4" />
                Browse Listings
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/listings/new">
                <Tag className="size-4" />
                Post a Listing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
