import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  TagIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

export function HeroSection() {
  return (
    <section 
      className="relative overflow-hidden py-20 md:py-28 border-b-2 border-foreground/10 bg-[#FAFAF8]"
      style={{
        backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }}
    >
      <div className="relative mx-auto max-w-4xl px-4 flex flex-col items-center text-center">
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-foreground bg-white/80 shadow-sm -rotate-3">
          <CheckCircleIcon className="size-5 text-primary" weight="fill" />
          PSU email verified
        </div>

        <h1 className="mb-8 text-balance text-6xl font-black tracking-tight text-foreground md:text-7xl relative">
          The PSU Campus Market
          <svg className="absolute w-[200px] h-6 -bottom-3 left-1/2 -translate-x-1/2 text-primary" viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M5 15 Q 100 0 195 15" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/></svg>
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-pretty text-2xl font-bold text-foreground/80 font-serif italic">
          From textbooks to gadgets — find it from a fellow Palaweño.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-2 border-foreground shadow-[4px_4px_0_var(--foreground)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_var(--foreground)] transition-all">
            <Link href="/listings">
              <MagnifyingGlassIcon className="size-5 mr-2" weight="bold" />
              Browse Listings
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-2 border-foreground bg-white text-foreground shadow-[4px_4px_0_var(--foreground)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_var(--foreground)] transition-all">
            <Link href="/listings/new">
              <TagIcon className="size-5 mr-2" weight="bold" />
              Post a Listing
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
