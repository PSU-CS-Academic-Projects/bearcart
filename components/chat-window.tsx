"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  PaperPlaneTilt,
  PaperclipHorizontal,
  X,
  Check,
  Checks,
  ChatCircleDots,
  SpinnerGap,
  WarningCircle,
  ShoppingBag,
} from "@phosphor-icons/react";
import type { Conversation } from "./conversation-list";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  text: string;
  imageUrl: string | null;
  timestamp: Date;
  isFromMe: boolean;
  isRead: boolean;
  type: "text";
}

export interface PendingImage {
  dataUrl: string;
  filename: string;
}

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (text: string, image: PendingImage | null) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  sending?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateSeparator(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function shouldShowDateSeparator(
  current: Message,
  previous: Message | null
): boolean {
  if (!previous) return true;
  const currentDate = new Date(current.timestamp).toDateString();
  const previousDate = new Date(previous.timestamp).toDateString();
  return currentDate !== previousDate;
}

function getListingStatusBadge(status: string) {
  switch (status) {
    case "sold":
      return <Badge className="bg-green-600 text-white">Sold</Badge>;
    case "reserved":
      return <Badge className="bg-amber-500 text-white">Reserved</Badge>;
    case "deleted":
      return <Badge variant="destructive">Deleted</Badge>;
    default:
      return <Badge variant="secondary">Available</Badge>;
  }
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatWindow({
  conversation,
  messages,
  onSendMessage,
  onBack,
  showBackButton = false,
  sending = false,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Lightbox: close on Escape
  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

  const canSend =
    !sending && (inputValue.trim().length > 0 || pendingImage !== null);

  const handleSend = () => {
    if (!canSend) return;
    onSendMessage(inputValue.trim(), pendingImage);
    setInputValue("");
    setPendingImage(null);
    setImageError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePickFile = () => {
    setImageError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only JPG, PNG, WEBP, or GIF images are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError("Image must be 5MB or smaller.");
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      setPendingImage({ dataUrl, filename: file.name });
      setImageError(null);
    } catch {
      setImageError("Failed to read image. Please try again.");
    }
    e.target.value = "";
  };

  const handleClearPendingImage = () => {
    setPendingImage(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Empty state (no conversation selected) ──────────────────────────

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-6 text-center">
        <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
          <ChatCircleDots className="size-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Select a conversation to start messaging
        </h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Choose a conversation from the list or browse listings to message a seller.
        </p>
      </div>
    );
  }

  const listing = conversation.listing;
  const isListingGone = listing?.status === "deleted";

  return (
    <div className="flex h-full flex-col">
      {/* ── Chat Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back</span>
          </Button>
        )}

        {/* Other user avatar */}
        <Link href={`/profile/${conversation.otherUser.id}`} className="relative shrink-0">
          <div className="relative size-10 overflow-hidden rounded-full bg-muted">
            {conversation.otherUser.avatar ? (
              <Image
                src={conversation.otherUser.avatar}
                alt={conversation.otherUser.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-primary text-primary-foreground">
                <span className="text-xs font-bold">
                  {getInitials(conversation.otherUser.name)}
                </span>
              </div>
            )}
          </div>
          {/* Offline indicator (gray dot) */}
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-muted-foreground/40" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${conversation.otherUser.id}`}
              className="font-semibold text-foreground hover:underline"
            >
              {conversation.otherUser.name}
            </Link>
            <Badge variant="secondary" className="text-xs">
              PSU {conversation.otherUser.role}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">Offline</span>
        </div>
      </div>

      {/* ── Listing Context Card ─────────────────────────────────── */}
      {listing && (
        <div className="border-b bg-accent/50 px-4 py-3">
          {isListingGone ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <WarningCircle className="size-4 shrink-0" />
              This listing is no longer available
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {listing.thumbnail ? (
                <Image
                  src={listing.thumbnail}
                  alt={listing.title}
                  width={56}
                  height={56}
                  className="size-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ShoppingBag className="size-6 text-muted-foreground/60" />
                  </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {listing.title}
                </p>
                <p className="text-sm font-semibold text-primary">
                  ₱{listing.price.toLocaleString()}
                </p>
                <div className="mt-1">
                  {getListingStatusBadge(listing.status)}
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href={`/listings/${listing.id}`}>View Listing</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Messages Area ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Send a message to get started!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {messages.map((message, index) => {
              const hasImage = !!message.imageUrl;
              const hasText = message.text.length > 0;
              const isPlaceholder = message.id.startsWith("pending-");

              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {shouldShowDateSeparator(message, messages[index - 1] || null) && (
                    <div className="my-4 flex items-center justify-center">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {formatDateSeparator(message.timestamp)}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`mb-1 flex ${message.isFromMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[75%] flex-col gap-1 sm:max-w-xs ${
                        hasText
                          ? `rounded-2xl px-4 py-2 ${
                              message.isFromMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`
                          : ""
                      }`}
                    >
                      {/* Image */}
                      {hasImage && (
                        <button
                          type="button"
                          onClick={() => !isPlaceholder && setLightboxUrl(message.imageUrl)}
                          className={`relative w-full overflow-hidden rounded-lg ${
                            hasText ? "" : ""
                          }`}
                          aria-label="Open image"
                          disabled={isPlaceholder}
                        >
                          {isPlaceholder ? (
                            <div className="flex aspect-square w-[200px] max-w-full items-center justify-center bg-muted">
                              <SpinnerGap className="size-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={message.imageUrl ?? ""}
                              alt="Sent image"
                              className="block h-auto w-full max-w-[200px] object-cover transition-opacity hover:opacity-90 sm:max-w-[200px]"
                              loading="lazy"
                            />
                          )}
                        </button>
                      )}

                      {/* Text */}
                      {hasText && (
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {message.text}
                        </p>
                      )}

                      {/* Time / read marker */}
                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] ${
                          hasText
                            ? message.isFromMe
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                            : "rounded-full bg-background/80 px-2 py-0.5 text-muted-foreground backdrop-blur"
                        }`}
                      >
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {message.isFromMe &&
                          (message.isRead ? (
                            <Checks className="size-3.5" />
                          ) : (
                            <Check className="size-3.5" />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Pending Image Preview ───────────────────────────────── */}
      {(pendingImage || imageError) && (
        <div className="border-t bg-card px-4 pt-3">
          {imageError && (
            <p className="mb-2 text-xs text-destructive">{imageError}</p>
          )}
          {pendingImage && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage.dataUrl}
                alt="Pending attachment"
                className="h-24 w-24 rounded-lg border object-cover"
              />
              <button
                type="button"
                onClick={handleClearPendingImage}
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground text-background shadow-md transition hover:bg-foreground/80"
                aria-label="Remove image"
              >
                <X className="size-3.5" weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Message Input ────────────────────────────────────────── */}
      <div className="border-t bg-card p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePickFile}
            disabled={sending}
            aria-label="Attach image"
          >
            <PaperclipHorizontal className="size-5" />
          </Button>
          <div className="flex flex-1 items-end rounded-lg border bg-background px-3">
            <textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="max-h-[120px] min-h-[40px] w-full resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className={canSend ? "" : "bg-muted text-muted-foreground"}
            aria-label="Send message"
          >
            {sending ? (
              <SpinnerGap className="size-5 animate-spin" />
            ) : (
              <PaperPlaneTilt className="size-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>

      {/* ── Lightbox ────────────────────────────────────────────── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxUrl(null);
            }}
            aria-label="Close"
          >
            <X className="size-5" weight="bold" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
