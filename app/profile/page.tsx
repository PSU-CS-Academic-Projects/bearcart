import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileTabs } from "@/components/profile-tabs";
import { createClient } from "@/lib/supabase-server";
import { getOwnProfile, getProfileStats } from "@/lib/actions/profile";
import { getListingsBySeller } from "@/lib/actions/listings";
import { getSavedListings } from "@/lib/actions/saved";

export const metadata = {
  title: "My Profile — PalMart",
};

export default async function ProfilePage() {
  // ── Auth Gate ───────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?returnTo=/profile");

  // ── Fetch Data ──────────────────────────────────────────────────────────
  const [profile, stats, activeListings, soldListings, savedData] = await Promise.all([
    getOwnProfile(),
    getProfileStats(user.id),
    getListingsBySeller(user.id, "available"),
    getListingsBySeller(user.id, "sold"),
    getSavedListings(),
  ]);

  if (!profile) redirect("/auth/login?returnTo=/profile");

  // Transform saved listings to match expected shape
  const savedListings = (savedData ?? [])
    .filter((s) => s.listing)
    .map((s) => {
      const listing = s.listing as unknown as {
        id: string; title: string; price: number; category: string;
        condition: string; status: string; created_at: string;
        listing_images: { image_url: string; is_cover: boolean; order: number }[];
      };
      return listing;
    })
    .filter((l) => l.status === "available");

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <ProfileHeader
          profile={profile}
          stats={stats}
          isOwn
        />

        <div className="mx-auto max-w-5xl px-4 pb-8">
          <ProfileTabs
            variant="own"
            activeListings={activeListings}
            soldListings={soldListings}
            savedListings={savedListings}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
