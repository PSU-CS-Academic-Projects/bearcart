"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PhotoGallery } from "@/components/photo-gallery";
import { SellerInfoCard } from "@/components/seller-info-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { MeetupInfo } from "@/components/meetup-info";
import { ListingCard } from "@/components/listing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatCircle, Heart, ShareNetwork, Flag, Clock } from "@phosphor-icons/react";
import { getListingById, getRelatedListings } from "@/lib/actions/listings";
import { toggleSaveListing, isListingSaved } from "@/lib/actions/saved";
import { getOrCreateConversation } from "@/lib/actions/messages";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

function getTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

function formatCondition(c: string) {
  return c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

const conditionColors: Record<string, string> = {
  new: "bg-green-100 text-green-800",
  like_new: "bg-emerald-100 text-emerald-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-amber-100 text-amber-800",
  poor: "bg-red-100 text-red-800",
};

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState<Awaited<ReturnType<typeof getListingById>> | null>(null);
  const [related, setRelated] = useState<Awaited<ReturnType<typeof getRelatedListings>>>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [listingData, session] = await Promise.all([
          getListingById(id),
          supabase.auth.getSession(),
        ]);
        setListing(listingData);
        setIsLoggedIn(!!session.data.session?.user);

        if (session.data.session?.user) {
          const saved = await isListingSaved(id);
          setIsSaved(saved);
        }

        const seller = listingData.seller as { id: string };
        const relatedData = await getRelatedListings(id, seller.id);
        setRelated(relatedData);
      } catch (err) {
        console.error("Failed to load listing:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!isLoggedIn) { toast.error("Please log in to save listings"); return; }
    try {
      const saved = await toggleSaveListing(id);
      setIsSaved(saved);
      toast.success(saved ? "Listing saved!" : "Listing removed from saved");
    } catch { toast.error("Failed to save listing"); }
  };

  const handleMessage = async () => {
    if (!isLoggedIn || !listing) return;
    try {
      const seller = listing.seller as { id: string };
      const conversationId = await getOrCreateConversation(listing.id, seller.id);
      router.push(`/messages?c=${conversationId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start conversation");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center"><p>Listing not found.</p></div>
        <Footer />
      </div>
    );
  }

  const seller = listing.seller as { id: string; full_name: string; avatar_url: string | null; role: string; college: string | null; created_at: string };
  const photos = (listing.listing_images ?? []).sort((a, b) => a.order - b.order).map((img) => img.image_url);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Breadcrumb items={[{ label: "Listings", href: "/listings" }, { label: listing.title }]} />
          <div className="mt-6 grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <PhotoGallery photos={photos.length > 0 ? photos : ["https://placehold.co/800x800?text=No+Image"]} alt={listing.title} />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground text-balance">{listing.title}</h1>
                <p className="mt-2 text-3xl font-bold text-primary">₱{listing.price.toLocaleString()}{listing.is_negotiable && <span className="ml-2 text-base font-normal text-muted-foreground">(Negotiable)</span>}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge className={conditionColors[listing.condition] ?? "bg-gray-100 text-gray-800"}>{formatCondition(listing.condition)}</Badge>
                  <Badge variant="secondary">{listing.category}</Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="size-4" />Posted {getTimeAgo(listing.created_at)}</span>
                </div>
              </div>
              <div className="hidden flex-col gap-3 lg:flex">
                {isLoggedIn ? (
                  <Button size="lg" className="w-full" onClick={handleMessage}><ChatCircle className="size-5" />Message Seller</Button>
                ) : (
                  <Button size="lg" className="w-full" onClick={() => toast.error("Please log in to message seller")}><ChatCircle className="size-5" />Login to Message Seller</Button>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleSave}><Heart className="size-4" weight={isSaved ? "fill" : "regular"} />{isSaved ? "Saved" : "Save"}</Button>
                  <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}><ShareNetwork className="size-4" />Share</Button>
                </div>
              </div>
              <SellerInfoCard seller={{ id: seller.id, name: seller.full_name, avatar: seller.avatar_url ?? "", role: seller.role as "student" | "faculty", memberSince: new Date(seller.created_at).getFullYear().toString(), totalListings: 0, rating: 0 }} />
              <MeetupInfo />
              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">Description</h2>
                <p className="whitespace-pre-line text-muted-foreground">{listing.description ?? "No description provided."}</p>
              </div>
              {listing.tags && listing.tags.length > 0 && (
                <div><h2 className="mb-3 text-lg font-semibold text-foreground">Tags</h2><div className="flex flex-wrap gap-2">{listing.tags.map((tag) => (<Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent">{tag}</Badge>))}</div></div>
              )}
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"><Flag className="size-4" />Report this listing</button>
            </div>
          </div>
          {related.length > 0 && (
            <section className="mt-12 border-t pt-10">
              <h2 className="mb-6 text-xl font-bold text-foreground">More from this Seller</h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {related.map((r: Record<string, unknown>) => {
                  const imgs = r.listing_images as { image_url: string; is_cover: boolean }[];
                  const s = r.seller as { full_name: string; avatar_url: string | null };
                  const cover = imgs?.find(i => i.is_cover)?.image_url ?? imgs?.[0]?.image_url ?? "";
                  return (
                    <Link key={r.id as string} href={`/listings/${r.id}`}>
                      <ListingCard title={r.title as string} price={r.price as number} category={r.category as string} condition={formatCondition(r.condition as string)} sellerName={s?.full_name ?? ""} sellerAvatar={s?.avatar_url ?? ""} timePosted={getTimeAgo(r.created_at as string)} imageUrl={cover} />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
      <div className="sticky bottom-0 border-t bg-card p-4 lg:hidden">
        <div className="flex gap-3">
          <Button variant="outline" size="icon" onClick={handleSave} className="shrink-0"><Heart className="size-5" weight={isSaved ? "fill" : "regular"} /></Button>
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}><ShareNetwork className="size-5" /></Button>
          {isLoggedIn ? (
            <Button size="lg" className="flex-1" onClick={handleMessage}><ChatCircle className="size-5" />Message Seller</Button>
          ) : (
            <Button size="lg" className="flex-1" onClick={() => toast.error("Please log in")}><ChatCircle className="size-5" />Login to Message</Button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
