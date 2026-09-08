"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  BREATHING_EXERCISES,
  BreathingExercise as BreathingExerciseType,
} from "@/components/calm/calm-config";
import { BreathingCard } from "@/components/calm/BreathingCard";
import { BreathingExercise } from "@/components/calm/BreathingExercise";
import { SoundPlayer } from "@/components/calm/SoundPlayer";
import { QuickResetCard } from "@/components/calm/QuickResetCard";
import { Sparkles, Wind, Waves, Heart, ShieldCheck } from "lucide-react";

function CalmPageContent() {
  const searchParams = useSearchParams();
  const [activeExercise, setActiveExercise] =
    useState<BreathingExerciseType | null>(null);

  // Check URL query parameters (e.g., ?exercise=478 or ?exercise=box)
  useEffect(() => {
    const exerciseParam = searchParams.get("exercise");
    if (exerciseParam) {
      const matched = BREATHING_EXERCISES.find(
        (e) =>
          e.queryParam.toLowerCase() === exerciseParam.toLowerCase() ||
          e.id.toLowerCase() === exerciseParam.toLowerCase()
      );
      if (matched) {
        setActiveExercise(matched);
      }
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-10 pb-16 max-w-6xl mx-auto">
      {/* Hero Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-[#d6c1c5]/30">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fee0f5] text-[#8a4b5e] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wellness & Restoration Toolkit</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#271624] tracking-tight">
            Calm & Reset
          </h1>

          <p className="text-sm sm:text-base text-[#514346] max-w-2xl leading-relaxed">
            Take a moment for yourself. Choose a breathing exercise or ambient soundscape to help you slow down, regulate your nervous system, and feel more grounded.
          </p>
        </div>

        {/* Gentle non-clinical reminder pill */}
        <div className="bg-[#fff7f9] px-4 py-2.5 rounded-2xl border border-[#d6c1c5]/40 flex items-center gap-2 text-xs text-[#76546b] font-medium shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#8a4b5e] shrink-0" />
          <span>Self-paced • Non-medical • Always in control</span>
        </div>
      </div>

      {/* 1. Today's Quick 2-Minute Reset */}
      <section aria-labelledby="quick-reset-heading">
        <QuickResetCard onStartReset={(exercise) => setActiveExercise(exercise)} />
      </section>

      {/* 2. Interactive Breathing Practices Gallery */}
      <section aria-labelledby="breathing-practices-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h2
              id="breathing-practices-heading"
              className="font-serif text-2xl sm:text-3xl font-bold text-[#271624]"
            >
              Breathing Practices
            </h2>
            <p className="text-xs sm:text-sm text-[#514346] mt-0.5">
              Choose a practice based on what your mind and body need right now.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#8a4b5e]">
            {BREATHING_EXERCISES.length} practices available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BREATHING_EXERCISES.map((exercise) => (
            <BreathingCard
              key={exercise.id}
              exercise={exercise}
              onSelect={(ex) => setActiveExercise(ex)}
            />
          ))}
        </div>
      </section>

      {/* 3. Calming Ambient Soundscapes */}
      <section aria-labelledby="soundscapes-heading">
        <SoundPlayer />
      </section>

      {/* Interactive Modal when exercise is selected */}
      {activeExercise && (
        <BreathingExercise
          exercise={activeExercise}
          onClose={() => setActiveExercise(null)}
          onSelectAnother={() => setActiveExercise(null)}
        />
      )}
    </div>
  );
}

export default function CalmPage() {
  return (
    <AppLayout
      title="Calm & Reset"
      subtitle="Take a quiet moment to regulate, breathe, and ground yourself"
    >
      <Suspense fallback={<div className="p-8 text-center text-sm text-[#847376]">Loading Calm & Reset...</div>}>
        <CalmPageContent />
      </Suspense>
    </AppLayout>
  );
}
