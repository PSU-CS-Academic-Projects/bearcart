"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConversationList, type Conversation } from "@/components/conversation-list";
import { ChatWindow, type Message, type PendingImage } from "@/components/chat-window";
import {
  getMessages,
  getArchivedConversations,
  sendMessage as sendMessageAction,
  uploadMessageImage,
  archiveConversation,
  unarchiveConversation,
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
    imageUrl: msg.image_url ?? null,
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
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [archivedLoaded, setArchivedLoaded] = useState(false);
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
        // Tell navbar to refetch the unread message count
        window.dispatchEvent(new CustomEvent("bearcart:messages-read"));
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
          const preview =
            newMsg.image_url && newMsg.content
              ? `📷 ${newMsg.content}`
              : newMsg.image_url
                ? "📷 Photo"
                : newMsg.content;
          const updatedLastMessage = { text: preview, timestamp: new Date(newMsg.created_at), isFromMe: false };

          // Auto-unarchive if message arrives in an archived conversation
          const isArchived = archivedConversations.some((c) => c.id === selectedConversationId);
          if (isArchived) {
            const target = archivedConversations.find((c) => c.id === selectedConversationId);
            setArchivedConversations((prev) => prev.filter((c) => c.id !== selectedConversationId));
            if (target) {
              setConversations((prev) => [{ ...target, lastMessage: updatedLastMessage }, ...prev]);
            }
            setActiveTab("active");
            unarchiveConversation(selectedConversationId).catch(() => {});
          } else {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === selectedConversationId
                  ? { ...c, lastMessage: updatedLastMessage }
                  : c
              )
            );
          }
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
    // Clear unread badge in whichever list holds this conversation
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    setArchivedConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    try {
      const { messages: msgs } = await getMessages(id);
      setMessages((prev) => ({
        ...prev,
        [id]: msgs.map((m) => mapMessage(m, currentUserId)),
      }));
      // Tell navbar to refetch the unread message count
      window.dispatchEvent(new CustomEvent("bearcart:messages-read"));
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
    window.history.replaceState(null, "", `/messages?conversation=${id}`);
  };

  // ── Send message ───────────────────────────────────────────────────

  const handleSendMessage = async (text: string, image: PendingImage | null) => {
    if (!selectedConversationId) return;
    if (!text && !image) return;

    const convId = selectedConversationId;
    setSending(true);

    // Optimistic skeleton for image-bearing messages
    const placeholderId = image ? `pending-${crypto.randomUUID()}` : null;
    if (placeholderId && image) {
      const placeholder: Message = {
        id: placeholderId,
        text,
        imageUrl: image.dataUrl,
        timestamp: new Date(),
        isFromMe: true,
        isRead: false,
        type: "text",
      };
      setMessages((prev) => ({
        ...prev,
        [convId]: [...(prev[convId] || []), placeholder],
      }));
    }

    try {
      let imageUrl: string | null = null;
      if (image) {
        imageUrl = await uploadMessageImage(convId, image.dataUrl);
      }

      const newMsg = await sendMessageAction(convId, text, imageUrl);
      const mapped = mapMessage(newMsg, currentUserId);

      setMessages((prev) => ({
        ...prev,
        [convId]: [
          ...(prev[convId] || []).filter((m) => m.id !== placeholderId),
          mapped,
        ],
      }));

      const preview = imageUrl && text ? `📷 ${text}` : imageUrl ? "📷 Photo" : text;
      const updatedLastMessage = { text: preview, timestamp: new Date(), isFromMe: true };

      // Auto-unarchive if this conversation is currently archived
      const isArchived = archivedConversations.some((c) => c.id === convId);
      if (isArchived) {
        const target = archivedConversations.find((c) => c.id === convId);
        setArchivedConversations((prev) => prev.filter((c) => c.id !== convId));
        if (target) {
          setConversations((prev) => [{ ...target, lastMessage: updatedLastMessage }, ...prev]);
        }
        setActiveTab("active");
        unarchiveConversation(convId).catch(() => {});
      } else {
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === convId ? { ...c, lastMessage: updatedLastMessage } : c
          );
          const idx = updated.findIndex((c) => c.id === convId);
          if (idx > 0) {
            const [conv] = updated.splice(idx, 1);
            updated.unshift(conv);
          }
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      if (placeholderId) {
        setMessages((prev) => ({
          ...prev,
          [convId]: (prev[convId] || []).filter((m) => m.id !== placeholderId),
        }));
      }
      toast.error(
        image
          ? "Failed to send image. Please try again."
          : "Failed to send message. Please try again."
      );
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

  // ── Tab change ─────────────────────────────────────────────────────

  const handleTabChange = async (tab: "active" | "archived") => {
    setActiveTab(tab);
    setSelectedConversationId(null);
    setShowChatOnMobile(false);
    if (tab === "archived" && !archivedLoaded) {
      try {
        const { conversations: archived } = await getArchivedConversations();
        setArchivedConversations(archived.map((c) => mapConversation(c, currentUserId)));
        setArchivedLoaded(true);
      } catch (err) {
        console.error("Failed to load archived conversations:", err);
      }
    }
  };

  // ── Archive / unarchive ────────────────────────────────────────────

  const handleArchive = async (id: string, archive: boolean) => {
    if (archive) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
        setShowChatOnMobile(false);
      }
      archiveConversation(id).catch(() => {
        // Re-add on failure — simplest recovery is a reload
      });
    } else {
      const target = archivedConversations.find((c) => c.id === id);
      setArchivedConversations((prev) => prev.filter((c) => c.id !== id));
      if (target) {
        setConversations((prev) => [target, ...prev]);
      }
      unarchiveConversation(id).catch(() => {});
    }
  };

  const selectedConversation =
    conversations.find((c) => c.id === selectedConversationId) ||
    archivedConversations.find((c) => c.id === selectedConversationId) ||
    null;

  return (
    <main className="flex flex-1 overflow-hidden">
      {/* Left Column — Conversation List */}
      <div
        className={`h-full w-full border-r bg-card md:block md:w-80 lg:w-96 ${
          showChatOnMobile ? "hidden" : "block"
        }`}
      >
        <ConversationList
          conversations={activeTab === "archived" ? archivedConversations : conversations}
          selectedId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onArchive={handleArchive}
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
