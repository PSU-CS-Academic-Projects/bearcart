import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  TagIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

export function HeroSection() {
  return (
    <section className="relative border-b-4 border-foreground bg-[#FFF9F2] py-16 md:py-24">
      <div className="relative mx-auto max-w-3xl px-4 flex flex-col items-start text-left">
        <div className="mb-8 inline-flex -rotate-2 items-center gap-2 rounded-md border-2 border-foreground bg-[#FFD166] px-4 py-2 text-sm font-bold text-foreground shadow-[4px_4px_0_var(--foreground)]">
          <CheckCircleIcon className="size-5" weight="bold" />
          PSU email verified sellers
        </div>

        <h1 className="mb-6 text-balance text-5xl font-black uppercase tracking-tight text-foreground md:text-6xl lg:text-7xl leading-[0.9]">
          The PSU<br/>Campus Market
        </h1>

        <p className="mb-10 text-pretty text-2xl font-bold text-foreground/80 border-l-4 border-primary pl-4">
          From textbooks to gadgets —<br/>find it from a fellow <span className="text-primary italic">Palaweño</span>.
        </p>

        <div className="flex flex-col items-center justify-start gap-4 sm:flex-row w-full sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold transition-all border-2 border-foreground bg-primary text-primary-foreground shadow-[4px_4px_0_var(--foreground)] -translate-x-[2px] -translate-y-[2px] active:translate-x-0 active:translate-y-0 active:shadow-none rounded-lg">
            <Link href="/listings">
              <MagnifyingGlassIcon className="size-5 mr-2" weight="bold" />
              Browse Listings
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold transition-all border-2 border-foreground bg-white text-foreground shadow-[4px_4px_0_var(--foreground)] -translate-x-[2px] -translate-y-[2px] active:translate-x-0 active:translate-y-0 active:shadow-none rounded-lg">
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
