import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { MessagesClient } from "@/components/messages-client";
import { createClient } from "@/lib/supabase-server";
import {
  getConversations,
  type ConversationWithDetails,
} from "@/lib/actions/messages";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; listing?: string; seller?: string }>;
}) {
  // ── Auth gate ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?returnTo=/messages");

  const params = await searchParams;

  // ── Handle ?listing=&seller= → create/find conversation ────────────
  if (params.listing && params.seller) {
    if (params.seller === user.id) redirect("/messages"); // Can't message yourself

    // Find existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", params.listing)
      .eq("buyer_id", user.id)
      .eq("seller_id", params.seller)
      .maybeSingle();

    if (existing) {
      redirect(`/messages?conversation=${existing.id}`);
    } else {
      // Create new conversation
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ listing_id: params.listing, buyer_id: user.id, seller_id: params.seller })
        .select("id")
        .single();
      if (newConv) redirect(`/messages?conversation=${newConv.id}`);
    }
  }

  // ── Fetch initial conversations ──────────────────────────────────────
  let initialConversations: ConversationWithDetails[] = [];
  try {
    const { conversations } = await getConversations();
    initialConversations = conversations;
  } catch {
    // Fail silently — client will show empty state
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <MessagesClient
        currentUserId={user.id}
        initialConversations={initialConversations}
        initialConversationId={params.conversation ?? null}
      />
    </div>
  );
}
