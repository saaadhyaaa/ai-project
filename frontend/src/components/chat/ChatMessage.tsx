"use client";

import { MessageData } from "@/lib/api";
import { SuggestionCard } from "./SuggestionCard";
import { ProviderCard } from "./ProviderCard";
import { ShieldAlert, Sparkles, HelpCircle } from "lucide-react";

interface ChatMessageProps {
  message: MessageData;
  onSelectSuggestion?: (suggestion: string) => void;
  disabledSuggestions?: boolean;
}

export function ChatMessage({
  message,
  onSelectSuggestion,
  disabledSuggestions = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isHighRisk = message.safety_level === "HIGH_RISK";
  const isConcerning = message.safety_level === "CONCERNING";

  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 max-w-2xl ml-auto">
        <div className="flex flex-col items-end space-y-1">
          <div className="bg-[#8a4b5e] text-white px-5 py-3.5 rounded-[22px] rounded-tr-xs shadow-xs text-sm leading-relaxed whitespace-pre-wrap max-w-xl">
            {message.content}
          </div>
          {formattedTime && (
            <span className="text-[10px] text-[#847376] pr-1">
              {formattedTime}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3.5 max-w-3xl mr-auto">
      {/* Assistant Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8a4b5e] to-[#d98fa3] flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          spa
        </span>
      </div>

      {/* Message Content Bubble */}
      <div className="flex-1 space-y-3">
        <div
          className={`p-5 rounded-[24px] rounded-tl-xs border transition-all ${
            isHighRisk
              ? "bg-[#ffdad6]/70 border-[#ba1a1a]/40 text-[#410002]"
              : isConcerning
              ? "bg-[#fee0f5]/80 border-[#d98fa3]/40 text-[#271624]"
              : "bg-white border-[#f8daef]/80 soft-glow text-[#271624]"
          }`}
        >
          {/* High-Risk Header Badge */}
          {isHighRisk && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#ba1a1a] mb-2 pb-2 border-b border-[#ba1a1a]/20">
              <ShieldAlert className="w-4 h-4" />
              <span>Immediate Support & Care</span>
            </div>
          )}

          {/* Assistant Text Body */}
          <div className="text-sm leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
            {message.content}
          </div>

          {/* Follow-up question if available */}
          {message.follow_up_question && (
            <div className="mt-3 pt-3 border-t border-[#ffe7f7] flex items-start gap-2 text-xs italic text-[#665783] font-medium">
              <HelpCircle className="w-3.5 h-3.5 mt-0.5 text-[#8a4b5e] shrink-0" />
              <span>{message.follow_up_question}</span>
            </div>
          )}
        </div>

        {/* Grounded Provider Cards List */}
        {message.providers && message.providers.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#665783]">
              <Sparkles className="w-3.5 h-3.5 text-[#8a4b5e]" />
              <span>Grounded Care Providers & Facilities</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {message.providers.map((p, idx) => (
                <ProviderCard key={p.place_id || p.name + idx} provider={p} />
              ))}
            </div>
          </div>
        )}

        {/* Suggestion Chips */}
        {message.suggestions && message.suggestions.length > 0 && onSelectSuggestion && (
          <div className="flex flex-wrap gap-2 pt-1">
            {message.suggestions.map((s, idx) => (
              <SuggestionCard
                key={s + idx}
                suggestion={s}
                onClick={onSelectSuggestion}
                disabled={disabledSuggestions}
              />
            ))}
          </div>
        )}

        {formattedTime && (
          <div className="text-[10px] text-[#847376] pl-1">
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
}
