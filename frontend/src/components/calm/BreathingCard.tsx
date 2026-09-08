"use client";

import React from "react";
import { Play, Sparkles, Clock, CheckCircle } from "lucide-react";
import { BreathingExercise } from "./calm-config";

interface BreathingCardProps {
  exercise: BreathingExercise;
  onSelect: (exercise: BreathingExercise) => void;
}

export function BreathingCard({ exercise, onSelect }: BreathingCardProps) {
  return (
    <div
      className={`rounded-3xl p-6 bg-[#fff7f9] border border-[#d6c1c5]/40 hover:border-[#8a4b5e]/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative overflow-hidden`}
    >
      {/* Background Decorative Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#fee0f5]/40 to-transparent rounded-bl-full pointer-events-none" />

      <div>
        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${exercise.colorTheme.badgeBg} ${exercise.colorTheme.badgeText}`}
          >
            {exercise.name}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#847376]">
            <Clock className="w-3.5 h-3.5 text-[#8a4b5e]" />
            <span>
              ~{Math.max(1, Math.round((exercise.recommendedCycles * exercise.steps.reduce((a, b) => a + b.durationSeconds, 0)) / 60))} min
            </span>
          </div>
        </div>

        {/* Name & Tagline */}
        <h3 className="font-serif text-xl font-bold text-[#271624] group-hover:text-[#8a4b5e] transition-colors mb-1.5">
          {exercise.name}
        </h3>
        <p className="text-xs font-medium text-[#76546b] italic mb-3">
          "{exercise.tagline}"
        </p>

        {/* Description */}
        <p className="text-xs text-[#514346] leading-relaxed mb-4">
          {exercise.description}
        </p>

        {/* Pattern Summary Pills */}
        <div className="bg-white/80 rounded-2xl p-3 border border-[#d6c1c5]/30 mb-4">
          <div className="text-[10px] uppercase font-bold text-[#847376] tracking-wider mb-2">
            Rhythm & Pattern
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[#271624]">
            {exercise.steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <span className="px-2.5 py-1 rounded-lg bg-[#fff7f9] border border-[#d6c1c5]/40 text-[11px]">
                  {step.phase}: <strong className="text-[#8a4b5e]">{step.durationSeconds}s</strong>
                </span>
                {idx < exercise.steps.length - 1 && (
                  <span className="text-[#d6c1c5] font-bold text-[10px]">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-[#d6c1c5]/30 flex items-center justify-between">
        <span className="text-[11px] text-[#847376] font-medium">
          {exercise.recommendedCycles} mindful cycles
        </span>
        <button
          type="button"
          onClick={() => onSelect(exercise)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8a4b5e] hover:bg-[#733e4e] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Practice</span>
        </button>
      </div>
    </div>
  );
}
