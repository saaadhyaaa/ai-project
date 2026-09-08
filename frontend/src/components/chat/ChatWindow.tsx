"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageData,
  ConversationSummaryData,
  sendChatMessage,
  fetchConversations,
  fetchConversation,
  deleteConversation,
} from "@/lib/api";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { LocationPermission } from "./LocationPermission";
import {
  Sparkles,
  RefreshCw,
  Trash2,
  PlusCircle,
  MessageCircleHeart,
  AlertCircle,
} from "lucide-react";

export function ChatWindow() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [conversations, setConversations] = useState<ConversationSummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showConvDrawer, setShowConvDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load previous conversations list on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await fetchConversations();
      setConversations(convs);
      if (!conversationId && convs.length > 0) {
        // Load latest conversation
        loadSpecificConversation(convs[0].id);
      }
    } catch {
      // Backend might be warming up or empty
    }
  };

  const loadSpecificConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const detail = await fetchConversation(id);
      setConversationId(detail.id);
      setMessages(detail.messages);
      setErrorMessage(null);
    } catch (e) {
      setErrorMessage("Could not load conversation history.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setErrorMessage(null);
    setShowConvDrawer(false);
  };

  const handleDeleteCurrentConversation = async () => {
    if (!conversationId) return;
    try {
      await deleteConversation(conversationId);
      handleStartNewConversation();
      loadConversations();
    } catch {
      setErrorMessage("Failed to delete conversation.");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (
    text: string,
    coords?: { lat: number; lng: number } | null,
    locationQuery?: string
  ) => {
    if (!text.trim() || isLoading) return;

    setErrorMessage(null);

    // Optimistic UI for user message
    const tempUserMsg: MessageData = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversationId || "new",
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: text,
        conversation_id: conversationId,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        location_query: locationQuery ?? null,
      });

      setConversationId(response.conversation_id);

      const assistantMsg: MessageData = {
        id: `asst-${Date.now()}`,
        conversation_id: response.conversation_id,
        role: "assistant",
        content: response.message,
        suggestions: response.suggestions,
        follow_up_question: response.follow_up_question,
        safety_level: response.safety_level,
        providers: response.providers,
        created_at: response.created_at,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      loadConversations();
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "I'm having trouble connecting right now. Please try again in a moment."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelected = (
    coords: { lat: number; lng: number } | null,
    query?: string
  ) => {
    setShowLocationPrompt(false);
    const promptText = query
      ? `Find therapists and counseling centers in ${query}`
      : "Find licensed therapists and mental health clinics near me";
    handleSendMessage(promptText, coords, query);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] max-w-5xl mx-auto bg-[#fff7f9] rounded-[32px] border border-[#f8daef]/80 soft-glow overflow-hidden relative">
      {/* Top Conversation Control Bar */}
      <div className="px-6 py-3.5 bg-white/70 backdrop-blur-md border-b border-[#ffe7f7] flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ffd9e1] flex items-center justify-center text-[#8a4b5e]">
            <MessageCircleHeart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-[#271624] leading-tight">
              MindEase Companion
            </h3>
            <p className="text-[11px] text-[#514346]">
              Private, grounded, and emotionally supportive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversations.length > 0 && (
            <button
              onClick={() => setShowConvDrawer(!showConvDrawer)}
              className="px-3 py-1.5 rounded-full bg-[#ffeff8] hover:bg-[#fee0f5] text-xs font-semibold text-[#8a4b5e] transition-colors cursor-pointer"
            >
              History ({conversations.length})
            </button>
          )}

          <button
            onClick={handleStartNewConversation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8a4b5e] text-white text-xs font-semibold hover:bg-[#733e4e] transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {conversationId && (
            <button
              onClick={handleDeleteCurrentConversation}
              className="p-1.5 rounded-full text-[#847376] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 transition-colors cursor-pointer"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* History Slide-down drawer */}
      {showConvDrawer && (
        <div className="bg-white border-b border-[#f8daef] p-4 z-20 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8a4b5e] uppercase tracking-wider">
              Previous Conversations
            </span>
            <button
              onClick={() => setShowConvDrawer(false)}
              className="text-xs text-[#847376] hover:text-[#271624]"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  loadSpecificConversation(c.id);
                  setShowConvDrawer(false);
                }}
                className={`p-3 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                  c.id === conversationId
                    ? "bg-[#ffeff8] border-[#8a4b5e] text-[#8a4b5e] font-bold"
                    : "bg-[#fff7f9] border-[#d6c1c5]/40 text-[#514346] hover:bg-[#fee0f5]"
                }`}
              >
                <div className="truncate font-semibold mb-0.5">
                  {c.last_message || "Chat session"}
                </div>
                <div className="text-[10px] text-[#847376]">
                  {new Date(c.updated_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        {messages.length === 0 ? (
          /* Empty State Welcome */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#8a4b5e] to-[#d98fa3] flex items-center justify-center text-white shadow-md">
              <span
                className="material-symbols-outlined text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                spa
              </span>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#8a4b5e]">
                How can I support you right now?
              </h2>
              <p className="text-xs sm:text-sm text-[#514346] mt-1.5 leading-relaxed">
                Whether you want to decompress after a stressful day, understand your emotions, or find practical grounding steps, I'm here.
              </p>
            </div>

            <div className="w-full pt-2 flex flex-col gap-2">
              {[
                "I've been feeling overwhelmed and need a moment to breathe.",
                "Can we reflect on why I feel so drained lately?",
                "Help me break down what I need to do next.",
                "Find mental health clinics and therapists near me.",
              ].map((starter) => (
                <button
                  key={starter}
                  onClick={() => {
                    if (starter.includes("therapist")) {
                      setShowLocationPrompt(true);
                    } else {
                      handleSendMessage(starter);
                    }
                  }}
                  className="p-3 rounded-2xl bg-white hover:bg-[#ffeff8] border border-[#d6c1c5]/40 text-xs font-semibold text-[#514346] hover:text-[#8a4b5e] transition-all hover:scale-101 active:scale-98 shadow-xs text-left cursor-pointer"
                >
                  <span className="text-[#8a4b5e] font-serif mr-1.5">✦</span>
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Messages */
          <>
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                onSelectSuggestion={(s) => handleSendMessage(s)}
                disabledSuggestions={isLoading}
              />
            ))}
          </>
        )}

        {/* Location Permission Prompt Modal/Card */}
        {showLocationPrompt && (
          <div className="max-w-xl mx-auto pt-2">
            <LocationPermission
              onLocationSelected={handleLocationSelected}
              onDismiss={() => setShowLocationPrompt(false)}
            />
          </div>
        )}

        {/* Loading State Animation */}
        {isLoading && (
          <div className="flex items-center gap-3 mr-auto max-w-md animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8a4b5e] to-[#d98fa3] flex items-center justify-center text-white shrink-0 shadow-xs">
              <span
                className="material-symbols-outlined text-[16px] animate-pulse"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                spa
              </span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white border border-[#f8daef] soft-glow flex items-center gap-2 text-xs text-[#514346] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#8a4b5e] animate-spin" />
              <span>MindEase is thinking...</span>
            </div>
          </div>
        )}

        {/* Error State Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 flex items-center justify-between gap-3 text-xs text-[#93000a]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => {
                const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                if (lastUserMsg) handleSendMessage(lastUserMsg.content);
              }}
              className="px-3 py-1 rounded-full bg-[#ba1a1a] text-white text-[11px] font-semibold hover:bg-[#93000a] shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 sm:p-5 bg-[#fff7f9]/90 backdrop-blur-md border-t border-[#ffe7f7] shrink-0 z-10">
        <ChatInput
          onSendMessage={(txt) => handleSendMessage(txt)}
          onRequestLocationSearch={() => setShowLocationPrompt(true)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
