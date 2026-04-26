"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ConversationList, type Conversation } from "@/components/conversation-list";
import { ChatWindow, type Message } from "@/components/chat-window";
import {
  getConversations,
  getMessages,
  getOrCreateConversation,
  sendMessage as sendMessageAction,
  type ConversationWithDetails,
  type MessageRow,
} from "@/lib/actions/messages";
import { supabase } from "@/lib/supabase";

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapConversation(
  conv: ConversationWithDetails,
  currentUserId: string
): Conversation {
  const isCurrentBuyer = conv.buyer_id === currentUserId;
  const otherUser = isCurrentBuyer
    ? (conv.seller as { id: string; full_name: string; avatar_url: string | null; role: string })
    : (conv.buyer as { id: string; full_name: string; avatar_url: string | null; role: string });

  const listing = conv.listing as {
    id: string; title: string; price: number; status: string;
    listing_images: { image_url: string; is_cover: boolean }[];
  } | null;

  const coverImg = listing?.listing_images?.find((i) => i.is_cover)?.image_url
    ?? listing?.listing_images?.[0]?.image_url ?? "";

  return {
    id: conv.id,
    otherUser: {
      id: otherUser.id,
      name: otherUser.full_name,
      avatar: otherUser.avatar_url ?? "",
      role: otherUser.role === "faculty" ? "Faculty" : "Student",
      isOnline: false,
    },
    listing: listing
      ? {
          id: listing.id,
          title: listing.title,
          thumbnail: coverImg,
          price: listing.price,
          status: listing.status,
        }
      : undefined,
    lastMessage: conv.last_message
      ? {
          text: conv.last_message,
          timestamp: new Date(conv.last_message_at ?? conv.created_at),
          isFromMe: false,
        }
      : {
          text: "Start a conversation",
          timestamp: new Date(conv.created_at),
          isFromMe: false,
        },
    unreadCount: conv.unreadCount ?? 0,
  };
}

function mapMessage(msg: MessageRow, currentUserId: string): Message {
  return {
    id: msg.id,
    text: msg.content,
    timestamp: new Date(msg.created_at),
    isFromMe: msg.sender_id === currentUserId,
    isRead: msg.is_read,
    type: "text",
  };
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Track the current realtime channel so we can unsubscribe
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load conversations ─────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const { conversations: convos, currentUserId: uid } = await getConversations();
      setCurrentUserId(uid);
      setConversations(convos.map((c) => mapConversation(c, uid)));
      return { convos, uid };
    } catch (err) {
      console.error("Failed to load conversations:", err);
      return null;
    }
  }, []);

  // ── Initial load + URL param handling ──────────────────────────────

  useEffect(() => {
    const init = async () => {
      const result = await loadConversations();
      if (!result) { setLoading(false); return; }

      const { convos, uid } = result;

      // Handle ?conversation=[id]
      const conversationParam = searchParams.get("conversation");
      if (conversationParam) {
        if (convos.some((c) => c.id === conversationParam)) {
          setSelectedConversationId(conversationParam);
          setShowChatOnMobile(true);
          const { messages: msgs } = await getMessages(conversationParam);
          setMessages((prev) => ({ ...prev, [conversationParam]: msgs.map((m) => mapMessage(m, uid)) }));
        }
        setLoading(false);
        return;
      }

      // Handle ?listing=[id]&seller=[id]
      const listingParam = searchParams.get("listing");
      const sellerParam = searchParams.get("seller");
      if (listingParam && sellerParam) {
        try {
          const convId = await getOrCreateConversation(listingParam, sellerParam);
          // Redirect to clean URL
          router.replace(`/messages?conversation=${convId}`);
          return; // Will re-mount with conversation param
        } catch (err) {
          console.error("Failed to create conversation:", err);
        }
      }

      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Realtime subscription ──────────────────────────────────────────

  useEffect(() => {
    if (!selectedConversationId || !currentUserId) return;

    // Unsubscribe from previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          // Skip if this is a message we sent (already in state)
          if (newMsg.sender_id === currentUserId) return;

          const mapped = mapMessage(newMsg, currentUserId);
          setMessages((prev) => ({
            ...prev,
            [selectedConversationId]: [
              ...(prev[selectedConversationId] || []),
              mapped,
            ],
          }));

          // Update conversation list
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversationId
                ? {
                    ...c,
                    lastMessage: {
                      text: newMsg.content,
                      timestamp: new Date(newMsg.created_at),
                      isFromMe: false,
                    },
                  }
                : c
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as MessageRow;
          // Update read receipts
          setMessages((prev) => ({
            ...prev,
            [selectedConversationId]: (prev[selectedConversationId] || []).map((m) =>
              m.id === updatedMsg.id ? { ...m, isRead: updatedMsg.is_read } : m
            ),
          }));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, currentUserId]);

  // ── Select conversation ────────────────────────────────────────────

  const handleSelectConversation = async (id: string) => {
    setSelectedConversationId(id);
    setShowChatOnMobile(true);

    // Clear unread badge
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );

    // Load messages
    try {
      const { messages: msgs } = await getMessages(id);
      setMessages((prev) => ({
        ...prev,
        [id]: msgs.map((m) => mapMessage(m, currentUserId)),
      }));
    } catch (err) {
      console.error("Failed to load messages:", err);
    }

    // Update URL without navigation
    window.history.replaceState(null, "", `/messages?conversation=${id}`);
  };

  // ── Send message ───────────────────────────────────────────────────

  const handleSendMessage = async (text: string) => {
    if (!selectedConversationId) return;
    setSending(true);
    try {
      const newMsg = await sendMessageAction(selectedConversationId, text);
      const mapped = mapMessage(newMsg, currentUserId);
      setMessages((prev) => ({
        ...prev,
        [selectedConversationId]: [
          ...(prev[selectedConversationId] || []),
          mapped,
        ],
      }));

      // Update conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? {
                ...c,
                lastMessage: {
                  text,
                  timestamp: new Date(),
                  isFromMe: true,
                },
              }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // ── Back handler (mobile) ──────────────────────────────────────────

  const handleBack = () => {
    setShowChatOnMobile(false);
    setSelectedConversationId(null);
    window.history.replaceState(null, "", "/messages");
  };

  const selectedConversation =
    conversations.find((c) => c.id === selectedConversationId) || null;

  // ── Loading state ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 overflow-hidden">
        {/* Left Column — Conversation List */}
        <div
          className={`h-full w-full border-r bg-card md:block md:w-80 lg:w-96 ${
            showChatOnMobile ? "hidden" : "block"
          }`}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right Column — Chat Window */}
        <div
          className={`h-full flex-1 ${
            showChatOnMobile ? "block" : "hidden md:block"
          }`}
        >
          <ChatWindow
            conversation={selectedConversation}
            messages={
              selectedConversationId
                ? messages[selectedConversationId] || []
                : []
            }
            onSendMessage={handleSendMessage}
            onBack={handleBack}
            showBackButton={showChatOnMobile}
            sending={sending}
          />
        </div>
      </main>
    </div>
  );
}

// ─── Page Export ───────────────────────────────────────────────────────────────

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col">
          <Navbar />
          <div className="flex flex-1 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
