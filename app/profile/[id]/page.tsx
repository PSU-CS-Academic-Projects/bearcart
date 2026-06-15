import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileTabs } from "@/components/profile-tabs";
import { createClient } from "@/lib/supabase-server";
import { getPublicProfile, getProfileStats } from "@/lib/actions/profile";
import { getListingsBySeller } from "@/lib/actions/listings";
import { getRequestsByRequester } from "@/lib/actions/requests";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) return { title: "User Not Found - BearCart" };
  return { title: `${profile.full_name} - BearCart` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── Auth gate — require PSU login (RA 10173 privacy protection) ────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?returnTo=/profile/${id}`);

  // ── If viewing own profile, redirect to /profile ────────────────────────
  if (user.id === id) redirect("/profile");

  // ── Fetch profile ──────────────────────────────────────────────────────
  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  // ── Fetch data ─────────────────────────────────────────────────────────
  const [stats, activeListings, soldListings, requests] = await Promise.all([
    getProfileStats(id),
    getListingsBySeller(id, "available"),
    getListingsBySeller(id, "sold"),
    getRequestsByRequester(id, "open"),
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
            soldListings={soldListings}
            requests={requests}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
