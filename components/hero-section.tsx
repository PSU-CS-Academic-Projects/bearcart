import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  TagIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

export function HeroSection() {
  return (
    <section className="w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center mb-6">
            <span className="text-sm font-bold text-[#C85F00] uppercase tracking-widest">
              BearCart
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-[1.15]">
            The campus marketplace for PSU students.
          </h1>

          <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-xl">
            Buy and sell textbooks, electronics, and more. Zero shipping, no strangers. Meet on campus with verified classmates.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 bg-[#C85F00] hover:bg-[#a64e00] text-white font-semibold rounded-lg text-base shadow-sm w-full sm:w-auto transition-colors"
            >
              <Link href="/listings">
                <MagnifyingGlassIcon weight="bold" className="size-5 mr-2.5" />
                Browse
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-8 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-semibold rounded-lg text-base w-full sm:w-auto transition-colors"
            >
              <Link href="/listings/new">
                <TagIcon weight="bold" className="size-5 mr-2.5" />
                Sell Item
              </Link>
            </Button>
          </div>

          <div className="inline-flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5 bg-gray-50/80 border border-gray-100 rounded-xl text-sm font-medium text-gray-700">
            <span className="flex items-center gap-2">
              <ShieldCheckIcon weight="fill" className="size-5 text-green-600" />
              Verified PSU accounts
            </span>
            <div className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block"></div>
            <span className="flex items-center gap-2">
              <MapPinIcon weight="fill" className="size-5 text-gray-400" />
              Campus meetups only
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
