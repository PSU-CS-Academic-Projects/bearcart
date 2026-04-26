import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileTabs } from "@/components/profile-tabs";
import { createClient } from "@/lib/supabase-server";
import { getPublicProfile, getProfileStats, getUserReviews } from "@/lib/actions/profile";
import { getListingsBySeller } from "@/lib/actions/listings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) return { title: "User Not Found — PalMart" };
  return { title: `${profile.full_name} — PalMart` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── If viewing own profile, redirect to /profile ────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.id === id) redirect("/profile");

  // ── Fetch profile ──────────────────────────────────────────────────────
  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  // ── Fetch data ─────────────────────────────────────────────────────────
  const [stats, activeListings, reviews] = await Promise.all([
    getProfileStats(id),
    getListingsBySeller(id, "available"),
    getUserReviews(id),
  ]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <ProfileHeader
          profile={profile}
          stats={stats}
          isOwn={false}
        />

        <div className="mx-auto max-w-5xl px-4 pb-8">
          <ProfileTabs
            variant="public"
            activeListings={activeListings}
            reviews={reviews}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
