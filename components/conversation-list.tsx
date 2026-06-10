"use client";

import {
  ChatCircle,
  MagnifyingGlass,
  ShoppingBag,
  DotsThreeVertical,
  Archive,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    role: "Student" | "Faculty";
    isOnline: boolean;
  };
  listing?: {
    id: string;
    title: string;
    thumbnail: string;
    price: number;
    status: string;
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
  activeTab: "active" | "archived";
  onTabChange: (tab: "active" | "archived") => void;
  onArchive: (id: string, archive: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function formatTime(date: Date): string {
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConversationList({
  conversations,
  selectedId,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onArchive,
}: ConversationListProps) {
  const filteredConversations = conversations.filter(
    (c) =>
      c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.listing?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Empty state (no conversations at all, on active tab) ─────────────
  if (conversations.length === 0 && activeTab === "active") {
    return (
      <div className="flex h-full flex-col">
        <ListHeader
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <ChatCircle className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            No messages yet
          </h3>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            Browse listings to find something you like and message the seller.
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
      <ListHeader
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {activeTab === "archived" ? (
              <>
                <Archive className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No archived conversations</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No conversations match your search.
              </p>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onSelect={onSelectConversation}
              activeTab={activeTab}
              onArchive={onArchive}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── List Header ──────────────────────────────────────────────────────────────

function ListHeader({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: "active" | "archived";
  onTabChange: (tab: "active" | "archived") => void;
}) {
  return (
    <div className="border-b">
      <div className="px-4 pt-4 pb-3">
        <h1 className="mb-3 text-xl font-bold text-foreground">Messages</h1>
        {/* Tabs */}
        <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => onTabChange("active")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => onTabChange("archived")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === "archived"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Archived
          </button>
        </div>
        {/* Search */}
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
    </div>
  );
}

// ─── Conversation Item ────────────────────────────────────────────────────────

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  activeTab,
  onArchive,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  activeTab: "active" | "archived";
  onArchive: (id: string, archive: boolean) => void;
}) {
  return (
    <div className="group relative">
      <button
        onClick={() => onSelect(conversation.id)}
        className={`flex w-full items-start gap-3 border-b p-4 pr-10 text-left transition-colors hover:bg-accent ${
          isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
        }`}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="relative size-12 overflow-hidden rounded-full bg-muted">
            {conversation.otherUser.avatar ? (
              <Image
                src={conversation.otherUser.avatar}
                alt={conversation.otherUser.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-primary text-primary-foreground">
                <span className="text-sm font-bold">
                  {getInitials(conversation.otherUser.name)}
                </span>
              </div>
            )}
          </div>
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

          {/* Listing context */}
          {conversation.listing && (
            <div className="mt-0.5 flex items-center gap-2">
              {conversation.listing.thumbnail ? (
                <Image
                  src={conversation.listing.thumbnail}
                  alt={conversation.listing.title}
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                  <ShoppingBag className="size-5 text-muted-foreground/60" />
                </div>
              )}
              <span className="truncate text-xs text-muted-foreground">
                {conversation.listing.title}
              </span>
            </div>
          )}

          {/* Last message + unread badge */}
          <div className="mt-1 flex items-center justify-between gap-2">
            <p
              className={`truncate text-sm ${
                conversation.unreadCount > 0
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
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

      {/* Three-dots menu */}
      <div className="absolute right-2 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex size-7 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100"
              aria-label="Conversation options"
            >
              <DotsThreeVertical className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {activeTab === "active" ? (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(conversation.id, true);
                }}
              >
                <Archive className="size-4" />
                Archive
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(conversation.id, false);
                }}
              >
                <ArrowCounterClockwise className="size-4" />
                Unarchive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
