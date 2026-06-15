import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EditRequestForm } from "@/components/edit-request-form";
import { createClient } from "@/lib/supabase-server";
import { getRequestById } from "@/lib/actions/requests";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRequestPage({ params }: PageProps) {
  const { id } = await params;

  // ── Auth Gate ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?returnTo=/requests/${id}/edit`);
  }

  // ── Fetch Request ─────────────────────────────────────────────────────
  const request = await getRequestById(id);
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
