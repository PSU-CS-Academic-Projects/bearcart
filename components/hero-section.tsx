import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  TagIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

export function HeroSection() {
  return (


    <div data-impeccable-variants="30303030" data-impeccable-variant-count="3" style={{ display: "contents" }}>
      {/* impeccable-variants-start 30303030 */}
      {/* Original */}
      <div data-impeccable-variant="original">
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
      </div>
      {/* Variants: insert below this line */}
      <style data-impeccable-css="30303030">{`
        @scope ([data-impeccable-variant="1"]) {
          :scope .v1-blob {
            opacity: calc(var(--p-blob-intensity, 0.5) * 2);
          }
        }
        @scope ([data-impeccable-variant="2"]) {
          :scope[data-p-button-style="chunky"] .v2-btn {
            border: 2px solid var(--foreground) !important;
            box-shadow: 4px 4px 0 var(--foreground) !important;
            transform: translate(-2px, -2px) !important;
            border-radius: 0.5rem !important;
            background-color: var(--primary) !important;
            color: var(--primary-foreground) !important;
          }
          :scope[data-p-button-style="chunky"] .v2-btn:active {
            box-shadow: 0px 0px 0 var(--foreground) !important;
            transform: translate(2px, 2px) !important;
          }
          :scope[data-p-button-style="chunky"] .v2-btn-outline {
            border: 2px solid var(--foreground) !important;
            box-shadow: 4px 4px 0 var(--foreground) !important;
            transform: translate(-2px, -2px) !important;
            border-radius: 0.5rem !important;
            background-color: #fff !important;
            color: var(--foreground) !important;
          }
          :scope[data-p-button-style="chunky"] .v2-btn-outline:active {
            box-shadow: 0px 0px 0 var(--foreground) !important;
            transform: translate(2px, 2px) !important;
          }
        }
        @scope ([data-impeccable-variant="3"]) {
          :scope[data-p-bg-color="warm"] .v3-bg {
            background-color: #FAFAF8;
          }
          :scope[data-p-bg-color="white"] .v3-bg {
            background-color: #FFFFFF;
          }
          :scope .v3-pattern {
            background-image: radial-gradient(var(--primary) 2px, transparent 2px);
            background-size: 24px 24px;
          }
        }
      `}</style>
      
      <div data-impeccable-variant="1" style={{ display: 'none' }} data-p-blob-intensity="0.5" data-impeccable-params='[
        {"id":"blob-intensity","kind":"range","min":0.1,"max":1,"step":0.1,"default":0.5,"label":"Glow Intensity"}
      ]'>
        <section className="relative overflow-hidden bg-[#FAFAF8] py-20 md:py-32 border-b">
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[80px] v1-blob" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[400px] h-[400px] rounded-full bg-[#EAB308]/20 blur-[60px] v1-blob" />
          
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 backdrop-blur-sm px-4 py-1.5 text-sm font-bold text-primary shadow-sm hover:rotate-[-2deg] transition-transform">
              <CheckCircleIcon className="size-5" weight="fill" />
              PSU email verified sellers
            </div>

            <h1 className="mb-6 text-balance text-6xl font-black tracking-tighter text-foreground md:text-7xl lg:text-8xl">
              The <span className="text-primary">PSU</span> Campus Market
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-pretty text-xl font-medium text-muted-foreground">
              From textbooks to gadgets — find it from a fellow Palaweño.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-full">
                <Link href="/listings">
                  <MagnifyingGlassIcon className="size-5 mr-2" weight="bold" />
                  Browse Listings
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-full border-2 border-border/80 bg-white/50 backdrop-blur-sm hover:bg-white/80 text-foreground">
                <Link href="/listings/new">
                  <TagIcon className="size-5 mr-2" weight="bold" />
                  Post a Listing
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div data-impeccable-variant="2" style={{ display: 'none' }} data-p-button-style="chunky" data-impeccable-params='[
        {"id":"button-style","kind":"steps","default":"chunky","label":"Button Style","options":[{"value":"modern","label":"Modern"},{"value":"chunky","label":"Chunky"}]}
      ]'>
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
              <Button asChild size="lg" className="v2-btn w-full sm:w-auto h-14 px-8 text-lg font-bold transition-all">
                <Link href="/listings">
                  <MagnifyingGlassIcon className="size-5 mr-2" weight="bold" />
                  Browse Listings
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="v2-btn-outline w-full sm:w-auto h-14 px-8 text-lg font-bold transition-all">
                <Link href="/listings/new">
                  <TagIcon className="size-5 mr-2" weight="bold" />
                  Post a Listing
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div data-impeccable-variant="3" style={{ display: 'none' }} data-p-bg-color="warm" data-impeccable-params='[
        {"id":"bg-color","kind":"steps","default":"warm","label":"Background","options":[{"value":"warm","label":"Warm"},{"value":"white","label":"White"}]}
      ]'>
        <section className="relative border-b overflow-hidden v3-bg py-16 lg:py-0">
          <div className="relative mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:min-h-[550px]">
            
            <div className="text-left flex flex-col items-start z-10 lg:py-16">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <CheckCircleIcon className="size-4 text-primary" weight="fill" />
                Verified PSU Sellers Only
              </div>

              <h1 className="mb-6 text-balance text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-[4.5rem] leading-[1.1]">
                The PSU<br />
                <span className="text-primary relative inline-block">
                  Campus Market
                  <svg className="absolute w-[110%] h-4 -bottom-1 -left-2 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
                </span>
              </h1>

              <p className="mb-8 max-w-md text-pretty text-lg font-medium text-muted-foreground leading-relaxed">
                From textbooks to gadgets — find it from a fellow Palaweño. Local, safe, and built for students.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row w-full sm:w-auto">
                <Button asChild size="lg" className="w-full sm:w-auto rounded-xl h-14 px-8 text-lg">
                  <Link href="/listings">
                    <MagnifyingGlassIcon className="size-5 mr-2" weight="bold" />
                    Browse Listings
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto rounded-xl h-14 px-8 text-lg border-2 border-transparent hover:border-border bg-black/5 hover:bg-black/10 text-foreground">
                  <Link href="/listings/new">
                    Post a Listing
                  </Link>
                </Button>
              </div>
            </div>

            <div className="hidden lg:block relative h-full w-full min-h-[400px]">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-30 v3-pattern mask-image:radial-gradient(black,transparent_70%)" style={{ WebkitMaskImage: "radial-gradient(black, transparent 70%)" }} />
               
               <div className="absolute top-[15%] right-[15%] w-52 h-64 bg-card rounded-2xl shadow-xl border border-border/50 rotate-6 transform transition-transform hover:rotate-0 hover:scale-105 flex flex-col p-4 z-10">
                  <div className="w-full h-32 bg-muted rounded-xl mb-4 border border-border/50 flex items-center justify-center">
                    <TagIcon className="size-8 text-muted-foreground/30" />
                  </div>
                  <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-primary/20 rounded"></div>
               </div>
               
               <div className="absolute bottom-[15%] left-[10%] w-60 h-auto bg-card rounded-2xl shadow-lg border border-border/50 -rotate-3 transform transition-transform hover:rotate-0 hover:scale-105 p-4 z-20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><CheckCircleIcon className="size-5 text-primary" weight="fill" /></div>
                    <div>
                      <div className="h-3 w-20 bg-muted rounded mb-1.5"></div>
                      <div className="h-2 w-12 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="w-full py-2.5 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-sm">₱2,500 Listed Today</div>
               </div>
            </div>

          </div>
        </section>
      </div>
      {/* impeccable-variants-end 30303030 */}
    </div>


  );
}
