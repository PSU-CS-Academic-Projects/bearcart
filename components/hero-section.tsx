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
    <section className="w-full min-h-[calc(100vh-64px)] flex items-center justify-center bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-16">

          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-[#C85F00] uppercase tracking-widest block mb-5">
              BearCart
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4 leading-[1.15]">
              The campus marketplace for PalSU students.
            </h1>
            <p className="text-base text-gray-500 mb-8 leading-relaxed max-w-md">
              Buy and sell textbooks, electronics, and more. Zero shipping, no strangers — meet on campus with verified classmates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-7">
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Browse by category
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a href="/listings?category=books" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span className="text-xs font-semibold text-gray-800 leading-tight">Books</span>
              </a>
              <a href="/listings?category=electronics" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                <span className="text-xs font-semibold text-gray-800 leading-tight">Electronics</span>
              </a>
              <a href="/listings?category=clothing" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors">
                  <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
                </svg>
                <span className="text-xs font-semibold text-gray-800 leading-tight">Clothing</span>
              </a>
              <a href="/listings?category=food" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                  <path d="M7 2v20" />
                  <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                </svg>
                <span className="text-xs font-semibold text-gray-800 leading-tight">Food</span>
              </a>
              <a href="/listings?category=supplies" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
                <span className="text-xs font-semibold text-gray-800 leading-tight">School Supplies</span>
              </a>
              <a href="/listings?category=services" className="group flex flex-col items-start gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span className="text-xs font-semibold text-gray-800 leading-tight">Services</span>
              </a>
              <a href="/listings?category=others" className="group col-span-2 flex flex-row items-center gap-2.5 px-3 py-2.5 bg-white border border-[#e8e8e8] rounded-lg hover:border-[#C85F00]/30 hover:bg-[#fef8f0] transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5 text-gray-600 group-hover:text-[#C85F00] transition-colors">
                  <circle cx="5" cy="12" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                </svg>
                <span className="text-xs font-semibold text-gray-800">Others</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
