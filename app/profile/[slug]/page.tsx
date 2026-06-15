import { notFound, redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileTabs } from "@/components/profile-tabs";
import { createClient } from "@/lib/supabase-server";
import { getPublicProfile, getPublicProfileBySlug, getProfileStats } from "@/lib/actions/profile";
import { getListingsBySeller } from "@/lib/actions/listings";
import { getRequestsByRequester } from "@/lib/actions/requests";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = UUID_RE.test(slug)
    ? await getPublicProfile(slug)
    : await getPublicProfileBySlug(slug);
  if (!profile) return { title: "User Not Found - BearCart" };
  return { title: `${profile.full_name} - BearCart` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // ── Auth gate — require PSU login (RA 10173 privacy protection) ────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?returnTo=/profile/${slug}`);

  // UUID backward-compat: look up profile by ID, then redirect to slug URL
  if (UUID_RE.test(slug)) {
    const p = await getPublicProfile(slug);
    if (p) redirect(`/profile/${p.slug}`);
    notFound();
  }

  // ── Fetch profile by slug ──────────────────────────────────────────────
  const profile = await getPublicProfileBySlug(slug);
  if (!profile) notFound();

  // ── If viewing own profile, redirect to /profile ────────────────────────
  if (user.id === profile.id) redirect("/profile");

  // ── Fetch data ─────────────────────────────────────────────────────────
  const [stats, activeListings, soldListings, requests] = await Promise.all([
    getProfileStats(profile.id),
    getListingsBySeller(profile.id, "available"),
    getListingsBySeller(profile.id, "sold"),
    getRequestsByRequester(profile.id, "open"),
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
