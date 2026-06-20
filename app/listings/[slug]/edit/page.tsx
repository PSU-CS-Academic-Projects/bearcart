import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EditListingForm } from "@/components/edit-listing-form";
import { createClient } from "@/lib/supabase-server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditListingPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?returnTo=/listings/${slug}/edit`);
  }

  // Accept either a slug or a legacy UUID
  const col = UUID_RE.test(slug) ? "id" : "slug";
  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      `
      id, slug, seller_id, title, description, price, is_negotiable,
      category, condition, status, tags, views_count,
      created_at, updated_at,
      listing_images ( id, image_url, is_cover, order )
    `
    )
    .eq(col, slug)
    .maybeSingle();

  if (error?.message?.includes("invalid input syntax") || !listing) {
    notFound();
  }

  // UUID backward-compat: redirect to canonical slug URL
  if (UUID_RE.test(slug) && listing.slug) {
    redirect(`/listings/${listing.slug}/edit`);
  }

  if (listing.seller_id !== user.id) {
    redirect(`/listings/${listing.slug}`);
  }

  if (listing.status === "sold" || listing.status === "deleted") {
    redirect(`/listings/${listing.slug}`);
  }

  // ── Sort images by order ──────────────────────────────────────────────
  const sortedImages = (listing.listing_images ?? []).sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  );

  return (
    <>
      <Navbar />
      <EditListingForm
        listing={{
          id: listing.id,
          slug: listing.slug,
          title: listing.title,
          description: listing.description ?? "",
          price: listing.price,
          is_negotiable: listing.is_negotiable,
          category: listing.category,
          condition: listing.condition,
          status: listing.status,
          images: sortedImages.map((img: { id: string; image_url: string; is_cover: boolean; order: number }) => ({
            id: img.id,
            url: img.image_url,
            isCover: img.is_cover,
            order: img.order,
          })),
        }}
      />
    </>
  );
}
