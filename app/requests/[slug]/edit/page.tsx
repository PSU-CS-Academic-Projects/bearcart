import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EditRequestForm } from "@/components/edit-request-form";
import { createClient } from "@/lib/supabase-server";
import { getRequestById, getRequestBySlug } from "@/lib/actions/requests";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditRequestPage({ params }: PageProps) {
  const { slug } = await params;

  // ── Auth Gate ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?returnTo=/requests/${slug}/edit`);
  }

  // ── Fetch Request (slug-first; redirect legacy UUID URLs) ─────────────
  if (UUID_RE.test(slug)) {
    const byId = await getRequestById(slug);
    if (byId) redirect(`/requests/${byId.slug}/edit`);
    notFound();
  }

  const request = await getRequestBySlug(slug);
  if (!request) notFound();

  // ── Ownership Check ───────────────────────────────────────────────────
  if (request.requester_id !== user.id) {
    redirect("/requests");
  }

  // ── Status Check (only open requests are editable) ────────────────────
  if (request.status !== "open") {
    redirect("/requests");
  }

  return (
    <>
      <Navbar />
      <EditRequestForm request={request} />
    </>
  );
}
