import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PhotoGallery } from "@/components/photo-gallery";
import { SellerInfoCard } from "@/components/seller-info-card";
import { Breadcrumb } from "@/components/breadcrumb";
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
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Listings", href: "/listings" },
              { label: displayTitle },
            ]}
          />

          {/* Unavailable Banner */}
          {isUnavailable && (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <Warning className="size-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  This listing is no longer available
                </p>
                <p className="text-xs text-amber-600">
                  {listing.status === "sold"
                    ? "This item has already been sold."
                    : "This listing has been removed."}
                </p>
              </div>
            </div>
          )}

          <section className="mt-4 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4 lg:grid lg:grid-cols-[minmax(0,55fr)_minmax(340px,45fr)] lg:gap-6">
            <div>
              <div className="max-w-[560px] lg:sticky lg:top-20">
                <PhotoGallery photos={photos} alt={displayTitle} />
              </div>
            </div>

            <div className="mt-4 flex w-full max-w-[500px] flex-col gap-3 justify-self-start lg:mt-0">
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary/80">
                    PSU campus listing
                  </p>
                  <h1 className="text-balance text-xl font-semibold leading-[1.18] tracking-[-0.015em] text-foreground sm:text-2xl">
                    {displayTitle}
                  </h1>
                </div>

                <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1.5">
                  <p className="text-4xl font-bold leading-none tracking-[-0.04em] text-primary sm:text-[2.9rem]">
                    ₱{listing.price.toLocaleString()}
                  </p>
                  {listing.is_negotiable && (
                    <span className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">
                      <Handshake className="size-3.5" />
                      open to tawad
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset " +
                      (conditionColors[listing.condition] ??
                        "bg-gray-50 text-gray-800 ring-gray-200")
                    }
                  >
                    {formatCasualCondition(listing.condition)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  >
                    in {listing.category}
                  </Badge>

                  {listing.status === "sold" && (
                    <Badge className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                      Sold
                    </Badge>
                  )}
                  {listing.status === "reserved" && (
                    <Badge className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-700 ring-1 ring-inset ring-yellow-200">
                      Reserved
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    Posted {formatTimeAgo(listing.created_at)}
                  </span>

                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {(listing.views_count ?? 0).toLocaleString()} views
                  </span>

                  {listing.updated_at &&
                    listing.created_at &&
                    Math.abs(
                      new Date(listing.updated_at).getTime() -
                        new Date(listing.created_at).getTime()
                    ) > 60000 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <PencilSimple className="size-3" />
                        Updated {formatTimeAgo(listing.updated_at)}
                      </span>
                    )}
                </div>
                <div className="rounded-xl bg-secondary/45 px-3 py-2.5">
                  <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-primary/80">
                    Seller&apos;s note
                  </h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-5 text-foreground/80">
                    {listing.description ?? "No description provided."}
                  </p>
                </div>

                {listing.tags && listing.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                      <Tag className="size-3.5" />
                      Tags
                    </span>
                    {listing.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/listings?search=${encodeURIComponent(tag)}`}
                      >
                        <Badge
                          variant="outline"
                          className="cursor-pointer rounded-full bg-card px-2 py-0.5 font-medium hover:bg-accent"
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

              <button className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-destructive">
                <Flag className="size-3.5" />
                Report this listing
              </button>
            </div>
          </section>

          {/* More from this Seller */}
          {related.length > 0 && (
            <section className="mt-8 border-t pt-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
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
