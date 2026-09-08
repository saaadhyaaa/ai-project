"use client";

import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { createMicroGoal } from "@/lib/api";

interface SuggestionCardProps {
  suggestion: string;
  onClick: (text: string) => void;
  disabled?: boolean;
}

export function SuggestionCard({
  suggestion,
  onClick,
  disabled = false,
}: SuggestionCardProps) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddGoal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (added || loading) return;

    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split("T")[0];
      await createMicroGoal({
        goal_text: suggestion,
        goal_date: todayStr,
        source: "chatbot",
      });
      setAdded(true);
    } catch (err) {
      console.error("Failed to add suggestion as micro goal:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center rounded-full bg-[#ffeff8] border border-[#d6c1c5]/60 overflow-hidden shadow-xs hover:border-[#d98fa3] transition-all">
      <button
        type="button"
        onClick={() => onClick(suggestion)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#8a4b5e] hover:text-[#6e3446] hover:bg-[#fee0f5] transition-colors disabled:opacity-50 cursor-pointer text-left"
      >
        <span className="text-xs leading-none">✦</span>
        <span>{suggestion}</span>
      </button>

      <button
        type="button"
        onClick={handleAddGoal}
        disabled={disabled || loading}
        title={added ? "Added to Today's Micro Goals" : "Add to Today's Micro Goals"}
        className={`px-2.5 py-1.5 text-[11px] font-bold border-l border-[#d6c1c5]/50 flex items-center gap-1 transition-colors cursor-pointer ${
          added
            ? "bg-emerald-100 text-emerald-800"
            : "text-[#76546b] hover:bg-[#fee0f5] hover:text-[#8a4b5e]"
        }`}
      >
        {added ? (
          <>
            <Check className="w-3 h-3 text-emerald-700" />
            <span className="hidden sm:inline">Added</span>
          </>
        ) : (
          <>
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">Goal</span>
          </>
        )}
      </button>
    </div>
  );
}
