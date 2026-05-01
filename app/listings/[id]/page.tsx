import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PhotoGallery } from "@/components/photo-gallery";
import { SellerInfoCard } from "@/components/seller-info-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { MeetupInfo } from "@/components/meetup-info";
import { ListingActions } from "@/components/listing-actions";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Flag,
  Eye,
  Handshake,
  Tag,
  Warning,
  PencilSimple,
  MapPin,
} from "@phosphor-icons/react/dist/ssr";
import { getListingById, getRelatedListings } from "@/lib/actions/listings";
import { isListingSaved } from "@/lib/actions/saved";
import { createClient } from "@/lib/supabase-server";
import {
  formatTimeAgo,
  formatCondition,
} from "@/lib/listing-helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Condition Badge Colors ───────────────────────────────────────────────────

const conditionColors: Record<string, string> = {
  new: "bg-green-50 text-green-800 ring-green-200",
  like_new: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  good: "bg-sky-50 text-sky-800 ring-sky-200",
  fair: "bg-amber-50 text-amber-800 ring-amber-200",
  poor: "bg-red-50 text-red-800 ring-red-200",
};

function formatCasualCondition(condition: string) {
  const label = formatCondition(condition);
  if (condition === "new") return "Brand new";
  if (condition === "like_new") return "Like new";
  return `${label} condition`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch listing data
  const listing = await getListingById(id);
  if (!listing) notFound();

  // Check if listing is unavailable (sold or deleted)
  const isUnavailable = listing.status === "sold" || listing.status === "deleted";

  // Get current user (auth check for save/message buttons)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user has saved this listing
  const saved = user ? await isListingSaved(id) : false;

  // Fetch related listings from same seller
  const related = listing.seller
    ? await getRelatedListings(id, listing.seller.id)
    : [];

  // Build photo array sorted by order
  const photos = (listing.listing_images ?? [])
    .sort((a, b) => a.order - b.order)
    .map((img) => img.image_url);

  const seller = listing.seller;
  const displayTitle = listing.title?.trim() || "Untitled listing";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Listings", href: "/listings" },
              { label: displayTitle },
            ]}
          />

          {/* Unavailable Banner */}
          {isUnavailable && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Warning className="size-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">
                  This listing is no longer available
                </p>
                <p className="text-sm text-amber-600">
                  {listing.status === "sold"
                    ? "This item has already been sold."
                    : "This listing has been removed."}
                </p>
              </div>
            </div>
          )}

          <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:grid lg:grid-cols-[minmax(0,55fr)_minmax(360px,45fr)] lg:gap-8 lg:p-6">
            <div>
              <div className="lg:sticky lg:top-24">
                <PhotoGallery photos={photos} alt={displayTitle} />
              </div>
            </div>

            <div className="mt-5 flex w-full max-w-[540px] flex-col gap-4 justify-self-start lg:mt-0">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary/80">
                    PSU campus listing
                  </p>
                  <h1 className="text-balance text-2xl font-bold leading-[1.12] tracking-[-0.02em] text-foreground sm:text-[2.05rem]">
                    {displayTitle}
                  </h1>
                </div>

                <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
                  <p className="text-5xl font-black leading-none tracking-[-0.055em] text-primary sm:text-[3.65rem]">
                    ₱{listing.price.toLocaleString()}
                  </p>
                  {listing.is_negotiable && (
                    <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                      <Handshake className="size-4" />
                      open to tawad
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      "rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ring-inset " +
                      (conditionColors[listing.condition] ??
                        "bg-gray-50 text-gray-800 ring-gray-200")
                    }
                  >
                    {formatCasualCondition(listing.condition)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2.5 py-1 text-sm font-semibold"
                  >
                    in {listing.category}
                  </Badge>

                  {listing.status === "sold" && (
                    <Badge className="rounded-full bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                      Sold
                    </Badge>
                  )}
                  {listing.status === "reserved" && (
                    <Badge className="rounded-full bg-yellow-50 px-2.5 py-1 text-sm font-semibold text-yellow-700 ring-1 ring-inset ring-yellow-200">
                      Reserved
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    Posted {formatTimeAgo(listing.created_at)}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Eye className="size-4" />
                    {(listing.views_count ?? 0).toLocaleString()} views
                  </span>

                  {listing.updated_at &&
                    listing.created_at &&
                    Math.abs(
                      new Date(listing.updated_at).getTime() -
                        new Date(listing.created_at).getTime()
                    ) > 60000 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <PencilSimple className="size-3.5" />
                        Updated {formatTimeAgo(listing.updated_at)}
                      </span>
                    )}
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-2.5 py-1.5 text-sm font-semibold text-foreground">
                  <span className="flex size-6 items-center justify-center rounded-full bg-card text-primary">
                    <MapPin className="size-4 text-primary" />
                  </span>
                  Campus pickup at PSU
                </div>

                <div className="rounded-2xl bg-secondary/45 px-4 py-3.5">
                  <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-primary/80">
                    Seller&apos;s note
                  </h2>
                  <p className="mt-1.5 whitespace-pre-line text-[0.95rem] leading-6 text-foreground/80">
                    {listing.description ?? "No description provided."}
                  </p>
                </div>

                {listing.tags && listing.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <Tag className="size-4" />
                      Tags
                    </span>
                    {listing.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/listings?search=${encodeURIComponent(tag)}`}
                      >
                        <Badge
                          variant="outline"
                          className="cursor-pointer rounded-full bg-card px-3 py-1 font-medium hover:bg-accent"
                        >
                          #{tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {!isUnavailable && (
                <ListingActions
                  listingId={listing.id}
                  sellerId={listing.seller_id}
                  currentUserId={user?.id ?? null}
                  initialSaved={saved}
                />
              )}

              {seller && <SellerInfoCard seller={seller} />}

              <MeetupInfo />

              <button className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-destructive">
                <Flag className="size-4" />
                Report this listing
              </button>
            </div>
          </section>

          {/* More from this Seller */}
          {related.length > 0 && (
            <section className="mt-12 border-t pt-10">
              <h2 className="mb-6 text-xl font-bold text-foreground">
                More from this Seller
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {related.map((r) => {
                  const imgs = r.listing_images as {
                    image_url: string;
                    is_cover: boolean;
                    order: number;
                  }[];
                  const rawSeller = r.seller as unknown;
                  const s = (Array.isArray(rawSeller)
                    ? rawSeller[0]
                    : rawSeller) as
                    | {
                        full_name: string | null;
                        avatar_url: string | null;
                      }
                    | null
                    | undefined;
                  const cover =
                    imgs?.find((i) => i.is_cover)?.image_url ??
                    imgs?.[0]?.image_url ??
                    "";
                  return (
                    <ListingCard
                      key={r.id as string}
                      id={r.id as string}
                      title={r.title as string}
                      price={r.price as number}
                      category={r.category as string}
                      condition={formatCondition(r.condition as string)}
                      sellerName={s?.full_name ?? "PSU Student"}
                      sellerAvatar={s?.avatar_url ?? ""}
                      timePosted={formatTimeAgo(r.created_at as string)}
                      imageUrl={cover}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Spacer for mobile sticky bottom bar */}
      {!isUnavailable && <div className="h-16 lg:hidden" />}

      <Footer />
    </div>
  );
}
