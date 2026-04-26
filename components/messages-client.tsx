"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConversationList, type Conversation } from "@/components/conversation-list";
import { ChatWindow, type Message } from "@/components/chat-window";
import {
  getMessages,
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
      ? { id: listing.id, title: listing.title, thumbnail: coverImg, price: listing.price, status: listing.status }
      : undefined,
    lastMessage: conv.last_message
      ? { text: conv.last_message, timestamp: new Date(conv.last_message_at ?? conv.created_at), isFromMe: false }
      : { text: "Start a conversation", timestamp: new Date(conv.created_at), isFromMe: false },
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessagesClientProps {
  currentUserId: string;
  initialConversations: ConversationWithDetails[];
  initialConversationId: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MessagesClient({
  currentUserId,
  initialConversations,
  initialConversationId,
}: MessagesClientProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(
    initialConversations.map((c) => mapConversation(c, currentUserId))
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [sending, setSending] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load initial conversation from URL ───────────────────────────────

  useEffect(() => {
    if (!initialConversationId) return;

    const load = async () => {
      setSelectedConversationId(initialConversationId);
      setShowChatOnMobile(true);
      setConversations((prev) =>
        prev.map((c) => (c.id === initialConversationId ? { ...c, unreadCount: 0 } : c))
      );
      try {
        const { messages: msgs } = await getMessages(initialConversationId);
        setMessages((prev) => ({
          ...prev,
          [initialConversationId]: msgs.map((m) => mapMessage(m, currentUserId)),
        }));
      } catch (err) {
        console.error("Failed to load initial messages:", err);
      }
    };

    load();
  }, [initialConversationId, currentUserId]);

  // ── Realtime subscription ──────────────────────────────────────────

  useEffect(() => {
    if (!selectedConversationId) return;

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
          if (newMsg.sender_id === currentUserId) return; // Skip own messages

          const mapped = mapMessage(newMsg, currentUserId);
          setMessages((prev) => ({
            ...prev,
            [selectedConversationId]: [...(prev[selectedConversationId] || []), mapped],
          }));
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConversationId
                ? { ...c, lastMessage: { text: newMsg.content, timestamp: new Date(newMsg.created_at), isFromMe: false } }
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
    return () => { supabase.removeChannel(channel); };
  }, [selectedConversationId, currentUserId]);

  // ── Select conversation ────────────────────────────────────────────

  const handleSelectConversation = async (id: string) => {
    setSelectedConversationId(id);
    setShowChatOnMobile(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    try {
      const { messages: msgs } = await getMessages(id);
      setMessages((prev) => ({
        ...prev,
        [id]: msgs.map((m) => mapMessage(m, currentUserId)),
      }));
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
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
        [selectedConversationId]: [...(prev[selectedConversationId] || []), mapped],
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? { ...c, lastMessage: { text, timestamp: new Date(), isFromMe: true } }
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

  return (
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
          messages={selectedConversationId ? messages[selectedConversationId] || [] : []}
          onSendMessage={handleSendMessage}
          onBack={handleBack}
          showBackButton={showChatOnMobile}
          sending={sending}
        />
      </div>
    </main>
  );
}
