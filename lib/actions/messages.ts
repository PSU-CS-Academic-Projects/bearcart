"use server";

import { createClient } from "@/lib/supabase-server";
import { sendMessageNotificationEmail } from "@/lib/email";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationWithDetails {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  archived_by_buyer: boolean;
  archived_by_seller: boolean;
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
  image_url: string | null;
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
      archived_by_buyer, archived_by_seller,
      listing:listings ( id, title, price, status, listing_images ( image_url, is_cover ) ),
      buyer:users!conversations_buyer_id_fkey ( id, full_name, avatar_url, role ),
      seller:users!conversations_seller_id_fkey ( id, full_name, avatar_url, role )
    `)
    .or(`and(buyer_id.eq.${user.id},archived_by_buyer.eq.false),and(seller_id.eq.${user.id},archived_by_seller.eq.false)`)
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

  return { conversations: enriched as unknown as ConversationWithDetails[], currentUserId: user.id };
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

const NOTIFICATION_DELAY_MS = 60 * 1000;        // 1 minute — give recipient a chance to read first
const NOTIFICATION_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes — prevent email spam per conversation

export async function sendMessage(
  conversationId: string,
  content: string,
  imageUrl?: string | null,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = content.trim();
  const cleanImageUrl = imageUrl?.trim() || null;

  if (!trimmed && !cleanImageUrl) {
    throw new Error("Message cannot be empty");
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
      image_url: cleanImageUrl,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to send message: ${error.message}`);

  // Build conversation list preview
  let preview: string;
  if (cleanImageUrl && trimmed) preview = `📷 ${trimmed}`;
  else if (cleanImageUrl) preview = "📷 Photo";
  else preview = trimmed;

  await supabase
    .from("conversations")
    .update({ last_message: preview, last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  // ─── Email Notification (bidirectional, delayed, throttled) ───────────────
  //
  // Flow:
  //   1. Skip immediately if the message was somehow already read.
  //   2. Skip if this conversation was emailed in the last 30 minutes.
  //   3. Wait 1 minute — gives the recipient a chance to see it in-app.
  //   4. Re-fetch the message; if now read → skip.
  //   5. Determine the receiver (whoever ISN'T the sender) and email them.
  //   6. Stamp last_notified_at to start the cooldown window.
  //
  // Fire-and-forget: never block the message-send response on email work.
  const messageId = message.id;
  const senderId = user.id;
  const messagePreview =
    trimmed
      ? trimmed
      : cleanImageUrl
        ? "[Sent a photo]"
        : "[New message]";

  void (async () => {
    try {
      // ── Pre-flight cooldown check ────────────────────────────────────────
      const { data: convCooldown } = await supabase
        .from("conversations")
        .select("last_notified_at")
        .eq("id", conversationId)
        .single();

      if (convCooldown?.last_notified_at) {
        const elapsed = Date.now() - new Date(convCooldown.last_notified_at).getTime();
        if (elapsed < NOTIFICATION_COOLDOWN_MS) return;
      }

      // ── Wait 1 minute, then re-check is_read ─────────────────────────────
      await new Promise((resolve) => setTimeout(resolve, NOTIFICATION_DELAY_MS));

      const { data: freshMessage } = await supabase
        .from("messages")
        .select("is_read")
        .eq("id", messageId)
        .single();

      if (!freshMessage || freshMessage.is_read) return;

      // ── Re-check cooldown post-delay (someone else may have notified) ────
      // ── and fetch full sender/receiver/listing context ───────────────────
      const { data: conv } = await supabase
        .from("conversations")
        .select(`
          buyer_id, seller_id, last_notified_at,
          listing:listings ( title, price ),
          buyer:users!conversations_buyer_id_fkey ( id, first_name, full_name, email ),
          seller:users!conversations_seller_id_fkey ( id, first_name, full_name, email )
        `)
        .eq("id", conversationId)
        .single();

      if (!conv) return;

      if (conv.last_notified_at) {
        const elapsed = Date.now() - new Date(conv.last_notified_at).getTime();
        if (elapsed < NOTIFICATION_COOLDOWN_MS) return;
      }

      const buyer = conv.buyer as unknown as {
        id: string;
        first_name: string | null;
        full_name: string | null;
        email: string | null;
      } | null;
      const seller = conv.seller as unknown as {
        id: string;
        first_name: string | null;
        full_name: string | null;
        email: string | null;
      } | null;
      const listing = conv.listing as unknown as { title: string; price: number } | null;

      if (!buyer || !seller) return;

      // Bidirectional: receiver is whoever is NOT the sender
      const sender = senderId === buyer.id ? buyer : seller;
      const receiver = senderId === buyer.id ? seller : buyer;

      if (!receiver.email) return;

      const senderFull = sender.full_name?.trim() || "BearCart user";
      const senderFirst = sender.first_name?.trim() || senderFull.split(/\s+/)[0] || "BearCart user";
      const receiverFirst =
        receiver.first_name?.trim() ||
        receiver.full_name?.trim()?.split(/\s+/)[0] ||
        "there";

      // ── Send the email ───────────────────────────────────────────────────
      await sendMessageNotificationEmail({
        toEmail: receiver.email,
        receiverFirstName: receiverFirst,
        senderFullName: senderFull,
        senderFirstName: senderFirst,
        listingTitle: listing?.title ?? null,
        listingPrice: listing?.price ?? null,
        messagePreview,
        conversationId,
      });

      // ── Stamp cooldown ───────────────────────────────────────────────────
      await supabase
        .from("conversations")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", conversationId);
    } catch (err) {
      console.error("[sendMessage] Email notification error:", err);
    }
  })();

  return message as MessageRow;
}

// ─── UPLOAD MESSAGE IMAGE ─────────────────────────────────────────────────────

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadMessageImage(
  conversationId: string,
  base64Data: string,
): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify the user is a participant of this conversation
  const { data: conv } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .single();
  if (!conv) throw new Error("Conversation not found");
  if (conv.buyer_id !== user.id && conv.seller_id !== user.id) {
    throw new Error("Not a participant of this conversation");
  }

  // Parse the base64 data URL — accept jpeg, png, webp, gif
  const match = base64Data.match(/^data:(image\/(jpeg|png|webp|gif));base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format. Only JPG, PNG, WEBP, and GIF are allowed.");
  }
  const mimeType = match[1];
  const extension = match[2] === "jpeg" ? "jpg" : match[2];
  const rawBase64 = match[3];

  const binaryString = atob(rawBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  if (bytes.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image is larger than the 5MB limit.");
  }

  // Path: message-images/<conversation_id>/<message_uuid>/<filename>
  const messageUuid = crypto.randomUUID();
  const filename = `image.${extension}`;
  const filePath = `${conversationId}/${messageUuid}/${filename}`;

  const { error } = await supabase.storage
    .from("message-images")
    .upload(filePath, bytes, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("message-images")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// ─── ARCHIVE / UNARCHIVE CONVERSATION ────────────────────────────────────────

async function resolveArchiveField(
  supabaseClient: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  userId: string
): Promise<"archived_by_buyer" | "archived_by_seller"> {
  const { data: conv } = await supabaseClient
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .single();
  if (!conv) throw new Error("Conversation not found");
  if (conv.buyer_id !== userId && conv.seller_id !== userId) throw new Error("Not a participant");
  return conv.buyer_id === userId ? "archived_by_buyer" : "archived_by_seller";
}

export async function archiveConversation(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const field = await resolveArchiveField(supabase, conversationId, user.id);
  await supabase.from("conversations").update({ [field]: true }).eq("id", conversationId);
}

export async function unarchiveConversation(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const field = await resolveArchiveField(supabase, conversationId, user.id);
  await supabase.from("conversations").update({ [field]: false }).eq("id", conversationId);
}

export async function getArchivedConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id, listing_id, buyer_id, seller_id, last_message, last_message_at, created_at,
      archived_by_buyer, archived_by_seller,
      listing:listings ( id, title, price, status, listing_images ( image_url, is_cover ) ),
      buyer:users!conversations_buyer_id_fkey ( id, full_name, avatar_url, role ),
      seller:users!conversations_seller_id_fkey ( id, full_name, avatar_url, role )
    `)
    .or(`and(buyer_id.eq.${user.id},archived_by_buyer.eq.true),and(seller_id.eq.${user.id},archived_by_seller.eq.true)`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Failed to fetch archived conversations: ${error.message}`);

  const conversations = data ?? [];
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

  return { conversations: enriched as unknown as ConversationWithDetails[], currentUserId: user.id };
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
