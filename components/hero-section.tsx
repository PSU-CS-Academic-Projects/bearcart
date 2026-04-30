import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlass,
  Storefront,
  Tag,
  Book,
  Desktop,
  TShirt,
  Hamburger,
  GraduationCap,
  Wrench,
  DotsThree,
} from "@phosphor-icons/react/dist/ssr";

const CATEGORY_CHIPS = [
  { name: "Books", icon: Book },
  { name: "Electronics", icon: Desktop },
  { name: "Clothing", icon: TShirt },
  { name: "Food", icon: Hamburger },
  { name: "School Supplies", icon: GraduationCap },
  { name: "Services", icon: Wrench },
  { name: "Others", icon: DotsThree },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-card py-16 md:py-24">
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Storefront className="size-4 text-primary" />
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

          {/* CTA Buttons */}
          <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

          {/* Category quick-links */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORY_CHIPS.map(({ name, icon: Icon }) => (
              <Link
                key={name}
                href={`/listings?category=${encodeURIComponent(name)}`}
                className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-accent hover:text-primary"
              >
                <Icon className="size-3.5" />
                {name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
