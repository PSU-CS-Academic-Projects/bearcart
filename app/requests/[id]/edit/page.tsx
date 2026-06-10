import { redirect, notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { EditRequestForm } from "@/components/edit-request-form";
import { createClient } from "@/lib/supabase-server";
import { getRequestById } from "@/lib/actions/requests";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Request — BearCart",
};

export default async function EditRequestPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?returnTo=/requests/${id}/edit`);
  }

  const request = await getRequestById(id);
  if (!request) notFound();

  // Only the requester may edit
  if (request.requester_id !== user.id) {
    redirect(`/requests/${id}`);
  }

  // Only "open" requests can be edited
  if (request.status !== "open") {
    redirect(`/requests/${id}`);
  }

  return (
    <>
      <Navbar />
      <EditRequestForm request={request} />
    </>
  );
}
