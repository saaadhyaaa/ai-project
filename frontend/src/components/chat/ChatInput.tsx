"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, MapPin } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onRequestLocationSearch: () => void;
  isLoading: boolean;
}

export function ChatInput({
  onSendMessage,
  onRequestLocationSearch,
  isLoading,
}: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickActions = [
    { label: "Talk to me", prompt: "I just need someone to talk to right now." },
    { label: "Calm me down", prompt: "I'm feeling anxious and need help calming down." },
    { label: "Help me understand what I'm feeling", prompt: "Can you help me understand what I'm feeling right now?" },
    { label: "Help me reflect", prompt: "Help me reflect on how my week has been going." },
    { label: "Help me make a plan", prompt: "I feel overwhelmed with tasks. Can you help me make a small, manageable plan?" },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [inputText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Quick Action Pills Scrollbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={onRequestLocationSearch}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ebddff] text-[#61527e] hover:bg-[#dcc9fd] text-xs font-semibold whitespace-nowrap transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Find Therapist Near Me</span>
        </button>

        {quickActions.map((qa) => (
          <button
            key={qa.label}
            type="button"
            onClick={() => onSendMessage(qa.prompt)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#ffeff8] border border-[#d6c1c5]/50 text-xs font-semibold text-[#514346] hover:text-[#8a4b5e] whitespace-nowrap transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-[#d98fa3]" />
            <span>{qa.label}</span>
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-[24px] border border-[#d6c1c5]/60 shadow-[0px_4px_20px_rgba(73,53,69,0.06)] focus-within:border-[#8a4b5e] focus-within:ring-2 focus-within:ring-[#8a4b5e]/20 transition-all p-2 sm:p-2.5 flex items-end gap-2"
      >
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share what's on your mind... (Shift+Enter for new line)"
          rows={1}
          maxLength={2000}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm text-[#271624] placeholder:text-[#847376] px-3 py-1.5 max-h-36 min-h-[38px] leading-relaxed disabled:opacity-60"
        />

        <div className="flex items-center gap-1.5 shrink-0 pb-0.5 pr-0.5">
          {inputText.length > 1500 && (
            <span className="text-[10px] font-mono text-[#847376] pr-1">
              {inputText.length}/2000
            </span>
          )}

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-[#8a4b5e] text-white flex items-center justify-center hover:bg-[#733e4e] transition-all disabled:opacity-40 disabled:hover:bg-[#8a4b5e] active:scale-95 shadow-sm cursor-pointer"
            aria-label="Send Message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
