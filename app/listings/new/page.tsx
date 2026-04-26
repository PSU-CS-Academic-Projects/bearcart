import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PostListingForm } from "@/components/post-listing-form";

export default async function PostListingPage() {
  // ── Auth Gate — redirect unauthenticated users immediately ──────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?returnTo=/listings/new");
  }

  return <PostListingForm />;
}
