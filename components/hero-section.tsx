import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HandbagIcon,
  LaptopIcon,
  TShirtIcon,
  HamburgerIcon,
  BackpackIcon,
  WrenchIcon,
  DotsThreeIcon, } from "@phosphor-icons/react/dist/ssr";

export function HeroSection() {
  return (
    <section className="w-full min-h-[calc(100vh-64px)] flex items-center justify-center bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-16">

          <div className="flex-1 min-w-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4 leading-[1.15]">
              The campus marketplace for PalSU Bearcats.
            </h1>
            <p className="text-base text-gray-500 mb-8 leading-relaxed max-w-md">
              Buy and sell within the PalSU community - meet safely on campus, no shipping, no hassle. Need something? Post a request and let your fellow Bearcats find it.
            </p>
            <div className="flex flex-wrap gap-3 mb-7">
              <a
                href="/listings"
                className="inline-flex items-center justify-center h-11 px-6 bg-[#C85F00] hover:bg-[#a64e00] text-white font-semibold rounded-lg text-sm shadow-sm transition-colors"
              >
                Browse listings
              </a>
              <a
                href="/listings/new"
                className="inline-flex items-center justify-center h-11 px-6 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg text-sm transition-colors"
              >
                Sell an item
              </a>
              <a
                href="/requests/new"
                className="inline-flex items-center justify-center h-11 px-6 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg text-sm transition-colors"
              >
                Post a request
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-primary">
                  <path d="M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Verified PalSU accounts
              </span>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-primary">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                Campus meetups
              </span>
            </div>
          </div>

          {/* Right: category grid */}
          <div className="w-full md:w-52 shrink-0">
            <p className="text-xs font-bold text-[#C85F00] uppercase tracking-widest block mb-5">
              Browse by category
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a href="/listings?category=Accessories" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <HandbagIcon className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors" />
                <span className="text-xs font-semibold text-gray-800 leading-tight">Accessories</span>
              </a>
              <a href="/listings?category=electronics" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <LaptopIcon className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors" />
                <span className="text-xs font-semibold text-gray-800 leading-tight">Electronics</span>
              </a>
              <a href="/listings?category=clothing" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <TShirtIcon className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors" />
                <span className="text-xs font-semibold text-gray-800 leading-tight">Clothing</span>
              </a>
              <a href="/listings?category=food" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <HamburgerIcon className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors" />
                <span className="text-xs font-semibold text-gray-800 leading-tight">Food</span>
              </a>
              <a href="/listings?category=supplies" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <BackpackIcon className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors" />
                <span className="text-xs font-semibold text-gray-800 leading-tight">School Supplies</span>
              </a>
              <a href="/listings?category=services" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <WrenchIcon className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors" />
                <span className="text-xs font-semibold text-gray-800 leading-tight">Services</span>
              </a>
              <a href="/listings?category=others" className="group col-span-2 flex flex-row items-center gap-2.5 px-3 py-2.5 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <DotsThreeIcon className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors" />
                <span className="text-xs font-semibold text-gray-800">Others</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
