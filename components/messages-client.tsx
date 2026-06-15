"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConversationList, type Conversation } from "@/components/conversation-list";
import { ChatWindow, type Message, type PendingImage } from "@/components/chat-window";
import {
  getMessages,
  getConversationById,
  getArchivedConversations,
  sendMessage as sendMessageAction,
  uploadMessageImage,
  archiveConversation,
  unarchiveConversation,
  deleteMessage as deleteMessageAction,
  markConversationRead,
  type ConversationWithDetails,
  type MessageRow,
} from "@/lib/actions/messages";
import { supabase } from "@/lib/supabase";
import { updateListingStatus } from "@/lib/actions/listings";
import { MarkAsSoldDialog } from "@/components/mark-as-sold-dialog";

// ─── Mappers ──────────────────────────────────────────────────────────────────

/** Build the conversation-list preview from raw conversation fields. */
function buildPreview(
  lastMessage: string | null,
  lastMessageAt: string | null,
  createdAt: string,
  lastMessageSenderId: string | null,
  currentUserId: string
): Conversation["lastMessage"] {
  if (!lastMessage) {
    return { text: "Start a conversation", timestamp: new Date(createdAt), isFromMe: false };
  }
  const isLastMsgFromMe = lastMessageSenderId === currentUserId;
  const isDeletedPreview = lastMessage === "Message deleted";
  return {
    // "Message deleted" reads as "You deleted a message" for the actor — skip the "You:" prefix
    text: isDeletedPreview && isLastMsgFromMe ? "You deleted a message" : lastMessage,
    timestamp: new Date(lastMessageAt ?? createdAt),
    isFromMe: isLastMsgFromMe && !isDeletedPreview,
  };
}

/** Sort conversations by most-recent activity (descending). */
function sortByRecent(list: Conversation[]): Conversation[] {
  return [...list].sort(
    (a, b) => b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
  );
}

function mapConversation(
  conv: ConversationWithDetails,
  currentUserId: string
): Conversation {
  const isCurrentBuyer = conv.buyer_id === currentUserId;
  const otherUser = isCurrentBuyer
    ? (conv.seller as { id: string; slug?: string; full_name: string; avatar_url: string | null; role: string })
    : (conv.buyer as { id: string; slug?: string; full_name: string; avatar_url: string | null; role: string });

  const listing = conv.listing as {
    id: string; slug?: string; title: string; price: number; status: string;
    listing_images: { image_url: string; is_cover: boolean }[];
  } | null;

  const coverImg = listing?.listing_images?.find((i) => i.is_cover)?.image_url
    ?? listing?.listing_images?.[0]?.image_url ?? "";

  return {
    id: conv.id,
    iAmSeller: !isCurrentBuyer,
    otherUser: {
      id: otherUser.id,
      slug: otherUser.slug,
      name: otherUser.full_name,
      avatar: otherUser.avatar_url ?? "",
      role: otherUser.role === "faculty" ? "Faculty" : "Student",
      isOnline: false,
    },
    listing: listing
      ? { id: listing.id, slug: listing.slug, title: listing.title, thumbnail: coverImg, price: listing.price, status: listing.status }
      : undefined,
    lastMessage: buildPreview(
      conv.last_message,
      conv.last_message_at,
      conv.created_at,
      conv.last_message_sender_id,
      currentUserId
    ),
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
    isDeleted: !!msg.deleted_at,
    deletedAt: msg.deleted_at ? new Date(msg.deleted_at) : null,
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
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [markSoldListingId, setMarkSoldListingId] = useState<string | null>(null);

  // Refs mirror state so the single persistent realtime channel reads fresh
  // values inside its handlers without re-subscribing on every change.
  const selectedConversationIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<Conversation[]>(conversations);
  const archivedConversationsRef = useRef<Conversation[]>(archivedConversations);

  useEffect(() => { selectedConversationIdRef.current = selectedConversationId; }, [selectedConversationId]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { archivedConversationsRef.current = archivedConversations; }, [archivedConversations]);

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

  // ── Realtime: single persistent user-level data channel ─────────────
  // One channel for the whole session (keyed on the user, not the open
  // conversation) so it is never torn down when switching conversations.
  // RLS scopes every event to conversations the user participates in.

  useEffect(() => {
    const bumpUnread = (list: Conversation[], convId: string) =>
      list.map((c) => (c.id === convId ? { ...c, unreadCount: c.unreadCount + 1 } : c));

    const channel = supabase
      .channel(`messages-realtime:${currentUserId}`)
      // ── New message in any of my conversations ───────────────────────
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          if (newMsg.sender_id === currentUserId) return; // own messages handled optimistically

          const convId = newMsg.conversation_id;
          const mapped = mapMessage(newMsg, currentUserId);
          const isOpen = selectedConversationIdRef.current === convId;

          // (point 2) keep the cache of already-opened conversations live
          setMessages((prev) => {
            if (!prev[convId]) return prev; // never opened — first open will fetch
            if (prev[convId].some((m) => m.id === mapped.id)) return prev; // dedupe
            return { ...prev, [convId]: [...prev[convId], mapped] };
          });

          if (isOpen) {
            // Viewing it now → mark read instead of bumping the badge
            markConversationRead(convId).catch(() => {});
            window.dispatchEvent(new CustomEvent("bearcart:messages-read"));
          } else {
            setConversations((prev) => bumpUnread(prev, convId));
            setArchivedConversations((prev) => bumpUnread(prev, convId));
          }

          // Auto-unarchive when a message lands in an archived conversation
          const archivedTarget = archivedConversationsRef.current.find((c) => c.id === convId);
          if (archivedTarget) {
            setArchivedConversations((prev) => prev.filter((c) => c.id !== convId));
            setConversations((prev) =>
              sortByRecent([archivedTarget, ...prev.filter((c) => c.id !== convId)])
            );
            unarchiveConversation(convId).catch(() => {});
          }

          // Brand-new conversation we don't know about yet → hydrate it
          const known =
            conversationsRef.current.some((c) => c.id === convId) ||
            archivedConversationsRef.current.some((c) => c.id === convId);
          if (!known) {
            getConversationById(convId)
              .then((conv) => {
                if (!conv) return;
                setConversations((prev) =>
                  prev.some((c) => c.id === convId)
                    ? prev
                    : sortByRecent([mapConversation(conv, currentUserId), ...prev])
                );
              })
              .catch(() => {});
          }
        }
      )
      // ── Message updated (read receipt / soft delete) ─────────────────
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updatedMsg = payload.new as MessageRow;
          const convId = updatedMsg.conversation_id;
          const isNowDeleted = !!updatedMsg.deleted_at;

          setMessages((prev) => {
            const convMsgs = prev[convId];
            if (!convMsgs) return prev;
            return {
              ...prev,
              [convId]: convMsgs.map((m) =>
                m.id === updatedMsg.id
                  ? {
                      ...m,
                      isRead: updatedMsg.is_read,
                      isDeleted: isNowDeleted,
                      deletedAt: updatedMsg.deleted_at ? new Date(updatedMsg.deleted_at) : m.deletedAt,
                    }
                  : m
              ),
            };
          });
        }
      )
      // ── Conversation row changed (last message, order, archive) ──────
      // Uses the live state inside the setters (not the ref) so the
      // unreadCount incremented by bumpUnread is never overwritten.
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const row = payload.new as {
            id: string; buyer_id: string; seller_id: string;
            last_message: string | null; last_message_at: string | null;
            last_message_sender_id: string | null; created_at: string;
            archived_by_buyer: boolean; archived_by_seller: boolean;
          };
          const convId = row.id;
          const preview = buildPreview(
            row.last_message, row.last_message_at, row.created_at,
            row.last_message_sender_id, currentUserId
          );
          const myArchived = row.buyer_id === currentUserId ? row.archived_by_buyer : row.archived_by_seller;

          if (myArchived) {
            // Move to archived list — read unreadCount from live active state
            setConversations((prev) => {
              const match = prev.find((c) => c.id === convId);
              if (!match) return prev; // already not in active list
              setArchivedConversations((arch) =>
                sortByRecent([{ ...match, lastMessage: preview }, ...arch.filter((c) => c.id !== convId)])
              );
              return prev.filter((c) => c.id !== convId);
            });
          } else {
            // Update preview in-place, preserving live unreadCount
            setArchivedConversations((prev) => prev.filter((c) => c.id !== convId));
            setConversations((prev) => {
              const match = prev.find((c) => c.id === convId);
              if (!match) {
                // Could be coming from archived — fall back to ref
                const fromArchived = archivedConversationsRef.current.find((c) => c.id === convId);
                if (!fromArchived) return prev;
                return sortByRecent([{ ...fromArchived, lastMessage: preview }, ...prev]);
              }
              // Preserve the live unreadCount (not the stale ref value)
              return sortByRecent([{ ...match, lastMessage: preview }, ...prev.filter((c) => c.id !== convId)]);
            });
          }
        }
      )
      // ── Brand-new conversation created with me as a participant ──────
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          const convId = (payload.new as { id: string }).id;
          if (
            conversationsRef.current.some((c) => c.id === convId) ||
            archivedConversationsRef.current.some((c) => c.id === convId)
          ) return;
          getConversationById(convId)
            .then((conv) => {
              if (!conv) return;
              setConversations((prev) =>
                prev.some((c) => c.id === convId)
                  ? prev
                  : sortByRecent([mapConversation(conv, currentUserId), ...prev])
              );
            })
            .catch(() => {});
        }
      )
      // ── Listing status changed (e.g. marked as sold) ────────────────
      // Keeps both parties' listing preview in sync without a re-fetch.
      // Only patches the status field so thumbnail/title/id are never lost.
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "listings" },
        (payload) => {
          const updated = payload.new as { id: string; status: string };
          const patchStatus = (convs: Conversation[]) =>
            convs.map((c) =>
              c.listing?.id === updated.id
                ? { ...c, listing: { ...c.listing!, status: updated.status } }
                : c
            );
          setConversations(patchStatus);
          setArchivedConversations(patchStatus);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  // ── Realtime Presence: who is currently on the messages page ────────

  useEffect(() => {
    const presence = supabase.channel("online-users", {
      config: { presence: { key: currentUserId } },
    });

    presence
      .on("presence", { event: "sync" }, () => {
        setOnlineUserIds(new Set(Object.keys(presence.presenceState())));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presence.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(presence); };
  }, [currentUserId]);

  // ── Select conversation ────────────────────────────────────────────

  const handleSelectConversation = async (id: string) => {
    setSelectedConversationId(id);
    setShowChatOnMobile(true);
    // Clear unread badge in whichever list holds this conversation
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    setArchivedConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    window.history.replaceState(null, "", `/messages?conversation=${id}`);

    // (point 2) If the realtime channel already keeps a live cache for this
    // conversation, show it instantly with no re-fetch — just mark it read.
    if (messages[id]) {
      markConversationRead(id).catch(() => {});
      window.dispatchEvent(new CustomEvent("bearcart:messages-read"));
      return;
    }

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
        isDeleted: false,
        deletedAt: null,
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
        err instanceof Error
          ? err.message
          : image
          ? "Failed to send image. Please try again."
          : "Failed to send message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  // ── Delete message ─────────────────────────────────────────────────

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedConversationId) return;
    const convId = selectedConversationId;
    const convMessages = messages[convId] || [];
    const isLastMessage =
      convMessages.length > 0 &&
      convMessages[convMessages.length - 1].id === messageId;

    // Optimistic update — mark message deleted
    setMessages((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) =>
        m.id === messageId ? { ...m, isDeleted: true, deletedAt: new Date() } : m
      ),
    }));

    // Update conversation preview if this was the last message
    if (isLastMessage) {
      const updatePreview = (list: Conversation[]) =>
        list.map((c) =>
          c.id === convId
            ? { ...c, lastMessage: { ...c.lastMessage, text: "You deleted a message" } }
            : c
        );
      setConversations(updatePreview);
      setArchivedConversations(updatePreview);
    }

    try {
      await deleteMessageAction(messageId);
    } catch {
      // Roll back message state
      setMessages((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).map((m) =>
          m.id === messageId ? { ...m, isDeleted: false, deletedAt: null } : m
        ),
      }));
      toast.error("Failed to delete message. Please try again.");
    }
  };

  // ── Mark as Sold (from chat) ───────────────────────────────────────

  const handleMarkSoldFromChat = async () => {
    if (!markSoldListingId) return;
    const listingId = markSoldListingId;
    await updateListingStatus(listingId, "sold");
    const bump = (convs: Conversation[]) =>
      convs.map((c) =>
        c.listing?.id === listingId
          ? { ...c, listing: { ...c.listing!, status: "sold" } }
          : c
      );
    setConversations(bump);
    setArchivedConversations(bump);
    toast.success("Listing marked as sold!");
    setMarkSoldListingId(null);
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
          isOtherUserOnline={
            selectedConversation ? onlineUserIds.has(selectedConversation.otherUser.id) : false
          }
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onBack={handleBack}
          showBackButton={showChatOnMobile}
          sending={sending}
          onMarkAsSold={
            selectedConversation?.iAmSeller && selectedConversation.listing?.status === "available"
              ? () => setMarkSoldListingId(selectedConversation.listing!.id)
              : undefined
          }
        />
        <MarkAsSoldDialog
          open={!!markSoldListingId}
          onOpenChange={(o) => { if (!o) setMarkSoldListingId(null); }}
          listingId={markSoldListingId ?? ""}
          onConfirm={handleMarkSoldFromChat}
          showBuyerSelector={false}
        />
      </div>
    </main>
  );
}
