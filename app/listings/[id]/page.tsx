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
import { Button } from "@/components/ui/button";
import {
  Clock,
  Flag,
  Eye,
  Handshake,
  Tag,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import { getListingById, getRelatedListings } from "@/lib/actions/listings";
import { isListingSaved } from "@/lib/actions/saved";
import { createClient } from "@/lib/supabase-server";
import {
  formatTimeAgo,
  formatCondition,
  getCoverImage,
  getSellerName,
} from "@/lib/listing-helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Condition Badge Colors ───────────────────────────────────────────────────

const conditionColors: Record<string, string> = {
  new: "bg-green-100 text-green-800",
  like_new: "bg-emerald-100 text-emerald-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-amber-100 text-amber-800",
  poor: "bg-red-100 text-red-800",
};

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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Listings", href: "/listings" },
              { label: listing.title },
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

          {/* Main Layout: Photo + Details */}
          <div className="mt-6 grid gap-8 lg:grid-cols-5">
            {/* Photo Gallery */}
            <div className="lg:col-span-3">
              <PhotoGallery photos={photos} alt={listing.title} />
            </div>

            {/* Listing Details Sidebar */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Title, Price & Meta */}
              <div>
                <h1 className="text-2xl font-bold text-foreground text-balance">
                  {listing.title}
                </h1>

                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-primary">
                    ₱{listing.price.toLocaleString()}
                  </p>
                  {listing.is_negotiable && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-green-300 bg-green-50 text-green-700"
                    >
                      <Handshake className="size-3.5" />
                      Negotiable
                    </Badge>
                  )}
                </div>

                {/* Meta Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      conditionColors[listing.condition] ??
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {formatCondition(listing.condition)}
                  </Badge>
                  <Badge variant="secondary">{listing.category}</Badge>

                  {/* Status badge for sold/reserved */}
                  {listing.status === "sold" && (
                    <Badge className="bg-red-100 text-red-700">Sold</Badge>
                  )}
                  {listing.status === "reserved" && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      Reserved
                    </Badge>
                  )}

                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    Posted {formatTimeAgo(listing.created_at)}
                  </span>
                </div>

                {/* Views count */}
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="size-3.5" />
                  {(listing.views_count ?? 0).toLocaleString()} views
                </div>
              </div>

              {/* Action Buttons (client component) */}
              {!isUnavailable && (
                <ListingActions
                  listingId={listing.id}
                  sellerId={listing.seller_id}
                  currentUserId={user?.id ?? null}
                  initialSaved={saved}
                />
              )}

              {/* Seller Info Card */}
              {seller && <SellerInfoCard seller={seller} />}

              {/* Meetup Info */}
              <MeetupInfo />

              {/* Description */}
              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Description
                </h2>
                <p className="max-w-[65ch] whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {listing.description ?? "No description provided."}
                </p>
              </div>

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Tag className="size-4" />
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag) => (
                      <Link key={tag} href={`/listings?search=${encodeURIComponent(tag)}`}>
                        <Badge
                          variant="outline"
                          className="cursor-pointer transition-colors hover:bg-accent"
                        >
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Report */}
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive">
                <Flag className="size-4" />
                Report this listing
              </button>
            </div>
          </div>

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
                  const s = r.seller as {
                    full_name: string;
                    avatar_url: string | null;
                  };
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
