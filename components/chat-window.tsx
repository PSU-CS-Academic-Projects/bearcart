"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  PaperPlaneTilt,
  Paperclip,
  Smiley,
  MapPin,
  CalendarBlank,
  Clock,
  Check,
  Checks,
  ChatCircle,
} from "@phosphor-icons/react";
import type { Conversation } from "./conversation-list";

export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
  isRead: boolean;
  type: "text" | "meetup";
  meetup?: {
    location: string;
    date: string;
    time: string;
    status: "pending" | "confirmed" | "cancelled";
  };
}

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatWindow({
  conversation,
  messages,
  onSendMessage,
  onBack,
  showBackButton = false,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateSeparator = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };

  const shouldShowDateSeparator = (current: Message, previous: Message | null) => {
    if (!previous) return true;
    const currentDate = new Date(current.timestamp).toDateString();
    const previousDate = new Date(previous.timestamp).toDateString();
    return currentDate !== previousDate;
  };

  // Empty state
  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-6 text-center">
        <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
          <ChatCircle className="size-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Select a conversation
        </h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Choose a conversation from the list to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b bg-card p-4">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        <div className="relative shrink-0">
          <Image
            src={conversation.otherUser.avatar}
            alt={conversation.otherUser.name}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
          />
          {conversation.otherUser.isOnline && (
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-green-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {conversation.otherUser.name}
            </span>
            <Badge variant="secondary" className="text-xs">
              PSU {conversation.otherUser.role}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {conversation.otherUser.isOnline ? "Online" : "Offline"}
          </span>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={`/listings/${conversation.listing.id}`}>
            <Image
              src={conversation.listing.thumbnail}
              alt={conversation.listing.title}
              width={20}
              height={20}
              className="size-5 rounded object-cover"
            />
            View Listing
          </Link>
        </Button>
      </div>

      {/* Listing Context Card */}
      <div className="border-b bg-accent/50 p-4">
        <div className="flex items-center gap-3">
          <Image
            src={conversation.listing.thumbnail}
            alt={conversation.listing.title}
            width={56}
            height={56}
            className="size-14 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">
              {conversation.listing.title}
            </p>
            <p className="text-sm font-semibold text-primary">
              ₱{conversation.listing.price.toLocaleString()}
            </p>
            <Badge variant="secondary" className="mt-1 text-xs">
              Available
            </Badge>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/listings/${conversation.listing.id}`}>
              View Full Listing
            </Link>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <div key={message.id}>
              {/* Date Separator */}
              {shouldShowDateSeparator(message, messages[index - 1] || null) && (
                <div className="my-4 flex items-center justify-center">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {formatDateSeparator(message.timestamp)}
                  </span>
                </div>
              )}

              {/* Message */}
              {message.type === "meetup" && message.meetup ? (
                <div
                  className={`flex ${message.isFromMe ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-xs rounded-lg border bg-card p-4 shadow-sm">
                    <p className="mb-3 text-sm font-medium text-foreground">
                      Meetup Details
                    </p>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-4 text-primary" />
                        <span>{message.meetup.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarBlank className="size-4 text-primary" />
                        <span>{message.meetup.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4 text-primary" />
                        <span>{message.meetup.time}</span>
                      </div>
                    </div>
                    {message.meetup.status === "pending" && (
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="flex-1">
                          Confirm
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    )}
                    {message.meetup.status === "confirmed" && (
                      <Badge className="mt-3 bg-green-100 text-green-700">
                        Confirmed
                      </Badge>
                    )}
                    <p className="mt-2 text-right text-xs text-muted-foreground">
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex ${message.isFromMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-2 ${
                      message.isFromMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-xs ${
                        message.isFromMe
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span>{formatMessageTime(message.timestamp)}</span>
                      {message.isFromMe && (
                        message.isRead ? (
                          <Checks className="size-3.5" />
                        ) : (
                          <Check className="size-3.5" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t bg-card p-4">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="size-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <div className="flex flex-1 items-center rounded-lg border bg-background px-3">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button variant="ghost" size="icon" className="shrink-0">
              <Smiley className="size-5" />
              <span className="sr-only">Add emoji</span>
            </Button>
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={inputValue.trim() ? "" : "bg-muted text-muted-foreground"}
          >
            <PaperPlaneTilt className="size-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
