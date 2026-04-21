"use client";

import { MagnifyingGlass, Storefront } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export interface Conversation {
  id: string;
  otherUser: {
    name: string;
    avatar: string;
    role: "Student" | "Faculty";
    isOnline: boolean;
  };
  listing: {
    id: string;
    title: string;
    thumbnail: string;
    price: number;
  };
  lastMessage: {
    text: string;
    timestamp: Date;
    isFromMe: boolean;
  };
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelectConversation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelectConversation,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  const filteredConversations = conversations.filter(
    (c) =>
      c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Storefront className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            No messages yet
          </h3>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            When you contact a seller or receive messages about your listings,
            they&apos;ll appear here.
          </p>
          <Button asChild>
            <Link href="/listings">Browse Listings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="mb-4 text-xl font-bold text-foreground">Messages</h1>
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3">
          <MagnifyingGlass className="size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No conversations match your search.
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`flex w-full items-start gap-3 border-b p-4 text-left transition-colors hover:bg-accent ${
                selectedId === conversation.id ? "bg-accent" : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <Image
                  src={conversation.otherUser.avatar}
                  alt={conversation.otherUser.name}
                  width={48}
                  height={48}
                  className="size-12 rounded-full object-cover"
                />
                {conversation.otherUser.isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-green-500" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-foreground">
                    {conversation.otherUser.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTime(conversation.lastMessage.timestamp)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Image
                    src={conversation.listing.thumbnail}
                    alt={conversation.listing.title}
                    width={24}
                    height={24}
                    className="size-6 shrink-0 rounded object-cover"
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    {conversation.listing.title}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-muted-foreground">
                    {conversation.lastMessage.isFromMe && (
                      <span className="text-muted-foreground">You: </span>
                    )}
                    {conversation.lastMessage.text}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
