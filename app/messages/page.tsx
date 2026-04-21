"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import {
  ConversationList,
  type Conversation,
} from "@/components/conversation-list";
import { ChatWindow, type Message } from "@/components/chat-window";

// Placeholder conversations data
const placeholderConversations: Conversation[] = [
  {
    id: "1",
    otherUser: {
      name: "Maria Santos",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      role: "Student",
      isOnline: true,
    },
    listing: {
      id: "1",
      title: "Calculus Textbook 9th Edition",
      thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&h=100&fit=crop",
      price: 450,
    },
    lastMessage: {
      text: "Great! See you tomorrow at the library then!",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      isFromMe: false,
    },
    unreadCount: 2,
  },
  {
    id: "2",
    otherUser: {
      name: "Juan Dela Cruz",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      role: "Student",
      isOnline: false,
    },
    listing: {
      id: "2",
      title: "HP Laptop 14 inches",
      thumbnail: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop",
      price: 15000,
    },
    lastMessage: {
      text: "Is the laptop still available?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      isFromMe: true,
    },
    unreadCount: 0,
  },
  {
    id: "3",
    otherUser: {
      name: "Prof. Garcia",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      role: "Faculty",
      isOnline: true,
    },
    listing: {
      id: "3",
      title: "Scientific Calculator Casio fx-991ES",
      thumbnail: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=100&h=100&fit=crop",
      price: 800,
    },
    lastMessage: {
      text: "I can meet you at the Engineering Building lobby",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      isFromMe: false,
    },
    unreadCount: 1,
  },
  {
    id: "4",
    otherUser: {
      name: "Ana Reyes",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      role: "Student",
      isOnline: false,
    },
    listing: {
      id: "4",
      title: "University PE Uniform Set",
      thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop",
      price: 350,
    },
    lastMessage: {
      text: "Thanks for the purchase! Hope it fits well.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      isFromMe: false,
    },
    unreadCount: 0,
  },
  {
    id: "5",
    otherUser: {
      name: "Miguel Torres",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      role: "Student",
      isOnline: true,
    },
    listing: {
      id: "5",
      title: "Architecture Drawing Board A1",
      thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100&h=100&fit=crop",
      price: 1200,
    },
    lastMessage: {
      text: "Can you do 1000 pesos? I can pick it up today.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      isFromMe: true,
    },
    unreadCount: 0,
  },
];

// Placeholder messages for conversation 1
const messagesForConversation1: Message[] = [
  {
    id: "m1",
    text: "Hi! I'm interested in your Calculus textbook. Is it still available?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isFromMe: true,
    isRead: true,
    type: "text",
  },
  {
    id: "m2",
    text: "Yes, it's still available! It's in great condition, barely used.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.9),
    isFromMe: false,
    isRead: true,
    type: "text",
  },
  {
    id: "m3",
    text: "That's perfect! Can we meet somewhere on campus to do the exchange?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.8),
    isFromMe: true,
    isRead: true,
    type: "text",
  },
  {
    id: "m4",
    text: "Sure! How about the PSU Main Library? I'm usually there in the afternoons.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.7),
    isFromMe: false,
    isRead: true,
    type: "text",
  },
  {
    id: "m5",
    text: "That works for me! Would tomorrow at 3 PM be okay?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    isFromMe: true,
    isRead: true,
    type: "text",
  },
  {
    id: "m6",
    text: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    isFromMe: false,
    isRead: true,
    type: "meetup",
    meetup: {
      location: "PSU Main Library, 1st Floor Lobby",
      date: "Tomorrow, April 22",
      time: "3:00 PM",
      status: "pending",
    },
  },
  {
    id: "m7",
    text: "I've set up the meetup details above. Please confirm if this works for you!",
    timestamp: new Date(Date.now() - 1000 * 60 * 55),
    isFromMe: false,
    isRead: true,
    type: "text",
  },
  {
    id: "m8",
    text: "Looks perfect! I'll confirm the meetup now.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isFromMe: true,
    isRead: true,
    type: "text",
  },
  {
    id: "m9",
    text: "Great! See you tomorrow at the library then!",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    isFromMe: false,
    isRead: false,
    type: "text",
  },
  {
    id: "m10",
    text: "Don't forget to bring exact change if possible 😊",
    timestamp: new Date(Date.now() - 1000 * 60 * 14),
    isFromMe: false,
    isRead: false,
    type: "text",
  },
];

// Placeholder messages for other conversations
const messagesForConversation2: Message[] = [
  {
    id: "m1",
    text: "Hello! I saw your listing for the HP Laptop. Is it still available?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isFromMe: true,
    isRead: true,
    type: "text",
  },
  {
    id: "m2",
    text: "Hi! Yes, it's still available. Are you interested?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    isFromMe: false,
    isRead: true,
    type: "text",
  },
  {
    id: "m3",
    text: "Is the laptop still available?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    isFromMe: true,
    isRead: false,
    type: "text",
  },
];

const messagesForConversation3: Message[] = [
  {
    id: "m1",
    text: "Good day, Prof! I'm interested in the calculator you posted.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
    isFromMe: true,
    isRead: true,
    type: "text",
  },
  {
    id: "m2",
    text: "Hello! Yes, it's the Casio fx-991ES Plus. Very useful for engineering students.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25),
    isFromMe: false,
    isRead: true,
    type: "text",
  },
  {
    id: "m3",
    text: "That's exactly what I need! Where can we meet?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.5),
    isFromMe: true,
    isRead: true,
    type: "text",
  },
  {
    id: "m4",
    text: "I can meet you at the Engineering Building lobby",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isFromMe: false,
    isRead: false,
    type: "text",
  },
];

const allMessages: Record<string, Message[]> = {
  "1": messagesForConversation1,
  "2": messagesForConversation2,
  "3": messagesForConversation3,
  "4": [],
  "5": [],
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(
    placeholderConversations
  );
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(allMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const selectedConversation =
    conversations.find((c) => c.id === selectedConversationId) || null;

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setShowChatOnMobile(true);

    // Mark messages as read
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleBack = () => {
    setShowChatOnMobile(false);
  };

  const handleSendMessage = (text: string) => {
    if (!selectedConversationId) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      text,
      timestamp: new Date(),
      isFromMe: true,
      isRead: false,
      type: "text",
    };

    setMessages((prev) => ({
      ...prev,
      [selectedConversationId]: [
        ...(prev[selectedConversationId] || []),
        newMessage,
      ],
    }));

    // Update last message in conversation list
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
  };

  return (
    <div className="flex h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 overflow-hidden">
        {/* Conversation List - Desktop always visible, Mobile conditional */}
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

        {/* Chat Window - Desktop always visible, Mobile conditional */}
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
          />
        </div>
      </main>
    </div>
  );
}
