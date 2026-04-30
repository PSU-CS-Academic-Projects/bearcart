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
      style={{ backgroundImage: "radial-gradient(#ddd 2px, transparent 2px)", backgroundSize: "20px 20px" }}
    >
      <div className="w-full max-w-4xl flex flex-col items-center relative bg-white border-[3px] border-black p-8 md:p-12 shadow-[8px_8px_0_var(--primary)] -rotate-1">
        <div className="absolute -top-6 -right-6 bg-primary text-primary-foreground font-black uppercase text-xl px-4 py-2 transform rotate-6 border-2 border-black shadow-[4px_4px_0_#000]">
          PSU Only!
        </div>
        <div className="absolute -bottom-5 -left-5 bg-white border-2 border-black px-3 py-1 font-bold transform -rotate-3 text-sm shadow-[2px_2px_0_#000] flex items-center gap-1">
          <CheckCircleIcon weight="fill" className="text-primary" /> Verified
        </div>

        <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter text-black mb-6 mt-4 mix-blend-multiply">
          The Campus
          <br />
          <span className="inline-block transform -rotate-1 bg-black text-white px-4 py-1 mt-2">Market</span>
        </h1>

        <p className="text-xl font-bold text-black/80 max-w-xl mb-10 leading-snug">
          Trade textbooks, gadgets &amp; more. No shipping, no strangers. Meet on campus.
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
