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
    <section
      className="py-20 md:py-28 w-full flex flex-col items-center text-center px-4 bg-white"
      style={{ backgroundImage: "radial-gradient(oklch(0.85 0 0) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
    >
      <div className="w-full max-w-4xl flex flex-col items-center relative bg-white border-[3px] border-[oklch(0.2_0_0)] p-8 md:p-12 shadow-[8px_8px_0_oklch(0.585_0.144_55)] -rotate-1">
        <div className="absolute -top-6 -right-6 bg-[oklch(0.585_0.144_55)] text-white font-black uppercase text-lg px-4 py-2 rotate-6 border-2 border-[oklch(0.2_0_0)] shadow-[4px_4px_0_oklch(0.2_0_0)]">
          PSU Only!
        </div>
        <div className="absolute -bottom-5 -left-5 bg-white border-2 border-[oklch(0.2_0_0)] px-3 py-1 font-bold -rotate-3 text-sm shadow-[2px_2px_0_oklch(0.2_0_0)] flex items-center gap-1">
          <CheckCircleIcon weight="fill" className="text-[oklch(0.585_0.144_55)]" /> Verified
        </div>

        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-[oklch(0.2_0_0)] mb-4 mt-4">
          Bear
          <span className="inline-block -rotate-2 bg-[oklch(0.585_0.144_55)] text-white px-4 py-1">Cart</span>
        </h1>
        <p className="text-lg md:text-xl font-bold text-[oklch(0.2_0_0)]/70 uppercase tracking-wide mb-8">
          The PSU Campus Marketplace
        </p>

        <p className="text-base font-medium text-[oklch(0.35_0_0)] max-w-lg mb-10 leading-relaxed">
          Trade textbooks, gadgets &amp; more with verified students. No shipping, no strangers. Meet on campus.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Button asChild size="lg" className="h-14 px-8 text-lg bg-[oklch(0.585_0.144_55)] text-white hover:bg-[oklch(0.55_0.144_55)] w-full sm:w-auto rounded-none border-[3px] border-[oklch(0.2_0_0)] shadow-[4px_4px_0_oklch(0.2_0_0)] font-black uppercase">
            <Link href="/listings">
              <MagnifyingGlassIcon className="size-5 mr-2" weight="bold" /> Browse
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg bg-white text-[oklch(0.2_0_0)] hover:bg-[oklch(0.96_0.01_55)] w-full sm:w-auto rounded-none border-[3px] border-[oklch(0.2_0_0)] shadow-[4px_4px_0_oklch(0.2_0_0)] font-black uppercase">
            <Link href="/listings/new">
              <TagIcon className="size-5 mr-2" weight="bold" /> Sell Item
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
