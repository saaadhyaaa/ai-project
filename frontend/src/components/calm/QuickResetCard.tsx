"use client";

import React from "react";
import { Sparkles, Play, Clock, ShieldCheck, Heart } from "lucide-react";
import { BREATHING_EXERCISES, QUICK_RESET_CONFIG, BreathingExercise } from "./calm-config";

interface QuickResetCardProps {
  onStartReset: (exercise: BreathingExercise) => void;
}

export function QuickResetCard({ onStartReset }: QuickResetCardProps) {
  const deepBreathing =
    BREATHING_EXERCISES.find((e) => e.id === QUICK_RESET_CONFIG.exerciseId) ||
    BREATHING_EXERCISES[3];

  return (
    <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#fee0f5]/90 via-[#fff7f9] to-[#ebddff]/90 border border-[#d98fa3]/40 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
      {/* Decorative floating blur circles */}
      <div className="absolute top-0 right-1/4 w-40 h-40 bg-[#d98fa3]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-2 max-w-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#8a4b5e] text-xs font-bold shadow-2xs">
          <Clock className="w-3.5 h-3.5" />
          <span>Quick 2-Minute Reset</span>
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#271624]">
          Need a short pause right now?
        </h3>

        <p className="text-xs sm:text-sm text-[#514346] leading-relaxed">
          {QUICK_RESET_CONFIG.description} No complex setup required—just follow the gentle rhythm.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
        <button
          type="button"
          onClick={() => onStartReset(deepBreathing)}
          className="px-6 py-3.5 rounded-full bg-[#8a4b5e] hover:bg-[#733e4e] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2.5 group cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
          <span>Start 2-Minute Reset</span>
        </button>
      </div>
    </div>
  );
}
