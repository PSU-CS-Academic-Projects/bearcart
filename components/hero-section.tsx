import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  TagIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-card py-14 md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.06] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          {/* Trust badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <CheckCircleIcon weight="fill" className="size-4" />
            PSU email verified sellers
          </div>

          {/* Heading */}
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Buy or sell within{" "}
            <span className="text-primary">PSU Campus</span>
          </h1>

          {/* Subtext */}
          <p className="mb-8 text-pretty text-lg text-muted-foreground">
            No shipping, no strangers. Trade textbooks, gadgets, and more with
            verified PSU students and faculty — just meet on campus.
          </p>

          {/* CTA Buttons */}
          <div className="mb-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/listings">
                <MagnifyingGlassIcon className="size-4" />
                Browse Listings
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/listings/new">
                <TagIcon className="size-4" />
                Post a Listing
              </Link>
            </Button>
          </div>

          {/* Looking For callout */}
          <p className="text-sm text-muted-foreground">
            Can&apos;t find what you need?{" "}
            <Link
              href="/requests"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Post a request
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
