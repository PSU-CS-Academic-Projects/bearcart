import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  TagIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

export function HeroSection() {
  return (



    <section className="relative overflow-hidden border-b bg-[#FAFAF8] py-16 lg:py-0">
      <div className="relative mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:min-h-[550px]">

        <div className="z-10 flex flex-col items-start text-left lg:py-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider text-background">
            <CheckCircleIcon className="size-4 text-primary" weight="fill" />
            Verified PSU Sellers Only
          </div>

          <h1 className="mb-6 text-balance text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-[4.5rem]">
            The PSU<br />
            <span className="relative inline-block text-primary">
              Campus Market
              <svg className="absolute -bottom-1 -left-2 h-4 w-[110%] text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="mb-8 max-w-md text-pretty text-lg font-medium leading-relaxed text-muted-foreground">
            From textbooks to gadgets — find it from a fellow Palaweño. Local, safe, and built for students.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="h-14 w-full rounded-xl px-8 text-lg sm:w-auto">
              <Link href="/listings">
                <MagnifyingGlassIcon className="mr-2 size-5" weight="bold" />
                Browse Listings
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-14 w-full rounded-xl border-2 border-transparent bg-black/5 px-8 text-lg text-foreground hover:border-border hover:bg-black/10 sm:w-auto">
              <Link href="/listings/new">
                Post a Listing
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative hidden h-full w-full min-h-[400px] lg:block">
          <div
            className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-30"
            style={{
              backgroundImage: "radial-gradient(var(--primary) 2px, transparent 2px)",
              backgroundSize: "24px 24px",
              WebkitMaskImage: "radial-gradient(black, transparent 70%)",
            }}
          />

          <div className="absolute right-[15%] top-[15%] z-10 flex h-64 w-52 rotate-6 transform flex-col rounded-2xl border border-border/50 bg-card p-4 shadow-xl transition-transform hover:rotate-0 hover:scale-105">
            <div className="mb-4 flex h-32 w-full items-center justify-center rounded-xl border border-border/50 bg-muted">
              <TagIcon className="size-8 text-muted-foreground/30" />
            </div>
            <div className="mb-2 h-4 w-3/4 rounded bg-muted"></div>
            <div className="h-4 w-1/2 rounded bg-primary/20"></div>
          </div>

          <div className="absolute bottom-[15%] left-[10%] z-20 -rotate-3 transform rounded-2xl border border-border/50 bg-card p-4 shadow-lg transition-transform hover:rotate-0 hover:scale-105 w-60">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/20">
                <CheckCircleIcon className="size-5 text-primary" weight="fill" />
              </div>
              <div>
                <div className="mb-1.5 h-3 w-20 rounded bg-muted"></div>
                <div className="h-2 w-12 rounded bg-muted"></div>
              </div>
            </div>
            <div className="flex w-full items-center justify-center rounded-lg bg-primary/10 py-2.5 text-sm font-bold text-primary">
              ₱2,500 Listed Today
            </div>
          </div>
        </div>

      </div>
    </section>



  );
}
