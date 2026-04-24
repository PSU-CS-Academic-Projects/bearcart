"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ConversationList, type Conversation } from "@/components/conversation-list";
import { ChatWindow, type Message } from "@/components/chat-window";
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageAction,
  type ConversationWithDetails,
  type MessageRow,
} from "@/lib/actions/messages";

function mapConversation(conv: ConversationWithDetails, currentUserId: string): Conversation {
  const isCurrentBuyer = conv.buyer_id === currentUserId;
  const otherUser = isCurrentBuyer
    ? conv.seller as { id: string; full_name: string; avatar_url: string | null; role: string }
    : conv.buyer as { id: string; full_name: string; avatar_url: string | null; role: string };
  
  const listing = conv.listing as { id: string; title: string; price: number; listing_images: { image_url: string; is_cover: boolean }[] } | null;
  const coverImg = listing?.listing_images?.find((i) => i.is_cover)?.image_url ?? listing?.listing_images?.[0]?.image_url ?? "";

  return {
    id: conv.id,
    otherUser: {
      name: otherUser.full_name,
      avatar: otherUser.avatar_url ?? "",
      role: otherUser.role === "faculty" ? "Faculty" : "Student",
      isOnline: false,
    },
    listing: listing ? { id: listing.id, title: listing.title, thumbnail: coverImg, price: listing.price } : undefined,
    lastMessage: conv.last_message ? {
      text: conv.last_message,
      timestamp: new Date(conv.last_message_at ?? conv.created_at),
      isFromMe: false,
    } : { text: "Start a conversation", timestamp: new Date(conv.created_at), isFromMe: false },
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

function MessagesContent() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const { conversations: convos, currentUserId: uid } = await getConversations();
      setCurrentUserId(uid);
      setConversations(convos.map((c) => mapConversation(c, uid)));

      // Auto-select conversation from URL param
      const cParam = searchParams.get("c");
      if (cParam && convos.some((c) => c.id === cParam)) {
        setSelectedConversationId(cParam);
        setShowChatOnMobile(true);
        const { messages: msgs } = await getMessages(cParam);
        setMessages((prev) => ({ ...prev, [cParam]: msgs.map((m) => mapMessage(m, uid)) }));
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const handleSelectConversation = async (id: string) => {
    setSelectedConversationId(id);
    setShowChatOnMobile(true);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));

    try {
      const { messages: msgs } = await getMessages(id);
      setMessages((prev) => ({ ...prev, [id]: msgs.map((m) => mapMessage(m, currentUserId)) }));
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleBack = () => { setShowChatOnMobile(false); };

  const handleSendMessage = async (text: string) => {
    if (!selectedConversationId) return;
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
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

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

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 overflow-hidden">
        <div className={`h-full w-full border-r bg-card md:block md:w-80 lg:w-96 ${showChatOnMobile ? "hidden" : "block"}`}>
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        <div className={`h-full flex-1 ${showChatOnMobile ? "block" : "hidden md:block"}`}>
          <ChatWindow
            conversation={selectedConversation}
            messages={selectedConversationId ? messages[selectedConversationId] || [] : []}
            onSendMessage={handleSendMessage}
            onBack={handleBack}
            showBackButton={showChatOnMobile}
          />
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen flex-col"><Navbar /><div className="flex flex-1 items-center justify-center"><div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
