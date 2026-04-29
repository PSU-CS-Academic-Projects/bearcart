import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EditListingForm } from "@/components/edit-listing-form";
import { createClient } from "@/lib/supabase-server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Page (Server Component) ─────────────────────────────────────────────────

export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params;

  // ── Auth Gate ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?returnTo=/listings/${id}/edit`);
  }

  // ── Fetch Listing ─────────────────────────────────────────────────────
  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      `
      id, seller_id, title, description, price, is_negotiable,
      category, condition, status, tags, views_count,
      created_at, updated_at,
      listing_images ( id, image_url, is_cover, order )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error?.message?.includes("invalid input syntax") || !listing) {
    notFound();
  }

  // ── Ownership Check ───────────────────────────────────────────────────
  if (listing.seller_id !== user.id) {
    redirect(`/listings/${id}`);
  }

  // ── Status Check (can't edit sold/deleted) ────────────────────────────
  if (listing.status === "sold" || listing.status === "deleted") {
    redirect(`/listings/${id}`);
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
          title: listing.title,
          description: listing.description ?? "",
          price: listing.price,
          is_negotiable: listing.is_negotiable,
          category: listing.category,
          condition: listing.condition,
          status: listing.status,
          tags: listing.tags ?? [],
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
