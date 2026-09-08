"use client";

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
  return (
    <button
      type="button"
      onClick={() => onClick(suggestion)}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ffeff8] hover:bg-[#fee0f5] border border-[#d6c1c5]/50 text-xs font-semibold text-[#8a4b5e] hover:text-[#6e3446] transition-all hover:scale-102 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs text-left"
    >
      <span className="text-xs leading-none">✦</span>
      <span>{suggestion}</span>
    </button>
  );
}
