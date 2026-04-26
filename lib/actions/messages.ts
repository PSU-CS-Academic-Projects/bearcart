"use server";

import { createClient } from "@/lib/supabase-server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationWithDetails {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  listing: {
    id: string;
    title: string;
    price: number;
    status: string;
    listing_images: { image_url: string; is_cover: boolean }[];
  } | null;
  buyer: { id: string; full_name: string; avatar_url: string | null; role: string };
  seller: { id: string; full_name: string; avatar_url: string | null; role: string };
  unreadCount?: number;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ─── GET CONVERSATIONS ────────────────────────────────────────────────────────

export async function getConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id, listing_id, buyer_id, seller_id, last_message, last_message_at, created_at,
      listing:listings ( id, title, price, status, listing_images ( image_url, is_cover ) ),
      buyer:users!conversations_buyer_id_fkey ( id, full_name, avatar_url, role ),
      seller:users!conversations_seller_id_fkey ( id, full_name, avatar_url, role )
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Failed to fetch conversations: ${error.message}`);

  const conversations = data ?? [];

  // Get unread counts in parallel
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      return { ...conv, unreadCount: count ?? 0 };
    })
  );

  return { conversations: enriched as ConversationWithDetails[], currentUserId: user.id };
}

// ─── GET OR CREATE CONVERSATION ───────────────────────────────────────────────

export async function getOrCreateConversation(listingId: string, sellerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === sellerId) throw new Error("Cannot message yourself");

  // Check if conversation already exists
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (existing) return existing.id;

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return newConv.id;
}

// ─── GET MESSAGES ─────────────────────────────────────────────────────────────

export async function getMessages(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch messages: ${error.message}`);

  // Mark unread messages as read
  await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  return { messages: (data ?? []) as MessageRow[], currentUserId: user.id };
}

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message cannot be empty");

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to send message: ${error.message}`);

  // Update conversation last_message
  await supabase
    .from("conversations")
    .update({ last_message: trimmed, last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return message as MessageRow;
}

// ─── UNREAD COUNT ─────────────────────────────────────────────────────────────

export async function getUnreadMessageCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: convos } = await supabase
    .from("conversations")
    .select("id")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  if (!convos || convos.length === 0) return 0;

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", convos.map(c => c.id))
    .neq("sender_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}
