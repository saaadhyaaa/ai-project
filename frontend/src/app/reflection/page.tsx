"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Sparkles,
  Heart,
  Compass,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Volume2,
} from "lucide-react";

export default function ReflectionPage() {
  const { journalEntries, addJournalEntry } = useApp();

  const [promptAnswer, setPromptAnswer] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(
    "What boundary helped you feel most protected this week?"
  );
  const [promptSaved, setPromptSaved] = useState(false);

  // Breathing exercise state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">(
    "Inhale"
  );
  const [breathTimer, setBreathTimer] = useState(4);

  // Audio ambient sound
  const [activeSound, setActiveSound] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev <= 1) {
            if (breathPhase === "Inhale") {
              setBreathPhase("Hold");
              return 7;
            } else if (breathPhase === "Hold") {
              setBreathPhase("Exhale");
              return 8;
            } else {
              setBreathPhase("Inhale");
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive, breathPhase]);

  const handleSavePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptAnswer.trim()) return;

    addJournalEntry({
      title: `AI Reflection: ${selectedPrompt.slice(0, 35)}...`,
      content: `Prompt: ${selectedPrompt}\n\nReflection: ${promptAnswer}`,
      tags: ["AI Reflection", "Calm", "Grateful"],
    });

    setPromptAnswer("");
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 3500);
  };

  return (
    <AppLayout
      title="AI Reflection & Insights"
      subtitle="Supportive synthesis and mindful inquiry tailored to your journey"
    >
      <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto">
        {/* Header Introduction */}
        <div className="text-center sm:text-left flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ebddff] text-[#61527e] text-xs font-bold self-center sm:self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Guided Reflection</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#8a4b5e]">
            Let's reflect a little deeper <span className="text-[#665783]">✦</span>
          </h1>
          <p className="text-sm sm:text-base text-[#514346] max-w-2xl leading-relaxed">
            MindEase looked at the reflections and check-ins you chose to share and
            identified meaningful themes for your emotional balance.
          </p>
        </div>

        {/* Core Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Key Theme Synthesis Card (Full Width / 12 cols) */}
          <section className="md:col-span-12 bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#dcc9fd]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs font-bold text-[#665783] uppercase tracking-wider">
                  Primary Theme Observed
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#271624]">
                  Micro-Grounding Amidst High Demand
                </h2>
                <p className="text-xs sm:text-sm text-[#514346] leading-relaxed">
                  Your recent reflections show a strong natural inclination toward intentional
                  breathing and nature walks. You effectively reduce midday tension when you
                  give yourself permission to pause for even 3 minutes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#ffeff8] border border-[#d6c1c5]/40 flex flex-col gap-2 shrink-0 min-w-[200px]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8a4b5e]">
                  <Heart className="w-4 h-4" />
                  <span>Emotional Resilience</span>
                </div>
                <div className="text-2xl font-serif font-bold text-[#271624]">
                  High Growth
                </div>
                <p className="text-[11px] text-[#514346]">
                  Steady self-compassion index
                </p>
              </div>
            </div>
          </section>

          {/* Emotional Balance Breakdown (6 cols) */}
          <section className="md:col-span-6 bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-5 h-5 text-[#8a4b5e]" />
                <h3 className="font-serif text-xl font-bold text-[#271624]">
                  Emotional Balance Spectrum
                </h3>
              </div>
              <p className="text-xs text-[#514346] mb-6">
                Relative indicators synthesized from your latest check-ins.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#271624]">Self-Compassion</span>
                  <span className="text-[#8a4b5e]">85%</span>
                </div>
                <div className="h-3 w-full bg-[#ffeff8] rounded-full overflow-hidden">
                  <div className="h-full bg-[#8a4b5e] rounded-full w-[85%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#271624]">Clarity & Groundedness</span>
                  <span className="text-[#665783]">75%</span>
                </div>
                <div className="h-3 w-full bg-[#ffeff8] rounded-full overflow-hidden">
                  <div className="h-full bg-[#665783] rounded-full w-[75%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#271624]">Energy Recovery Rate</span>
                  <span className="text-[#76546b]">68%</span>
                </div>
                <div className="h-3 w-full bg-[#ffeff8] rounded-full overflow-hidden">
                  <div className="h-full bg-[#76546b] rounded-full w-[68%]" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#ffe7f7] text-[11px] text-[#847376] italic">
              AI-generated for self-reflection and personal awareness.
            </div>
          </section>

          {/* Guided Breathing Grounding Exercise (6 cols) */}
          <section className="md:col-span-6 bg-gradient-to-br from-[#ffeff8] to-[#fee0f5] rounded-[32px] p-6 sm:p-8 soft-glow border border-[#d6c1c5]/50 flex flex-col items-center text-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#8a4b5e] uppercase tracking-wider">
                Interactive Grounding
              </span>
              <h3 className="font-serif text-xl font-bold text-[#271624] mt-1">
                4-7-8 Relaxing Breath
              </h3>
              <p className="text-xs text-[#514346] mt-1">
                Inhale quietly through nose (4s), hold (7s), exhale fully (8s).
              </p>
            </div>

            {/* Breathing Circle Visual */}
            <div className="relative my-6 flex items-center justify-center">
              <div
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-1000 ${
                  breathingActive
                    ? breathPhase === "Inhale"
                      ? "scale-125 bg-[#d98fa3]/40 shadow-lg shadow-[#d98fa3]/30"
                      : breathPhase === "Hold"
                      ? "scale-125 bg-[#dcc9fd]/60 ring-4 ring-[#665783]"
                      : "scale-90 bg-[#ffe7f7]"
                    : "bg-white shadow-md"
                }`}
              >
                <span className="font-serif text-lg font-bold text-[#271624]">
                  {breathingActive ? breathPhase : "Ready"}
                </span>
                <span className="text-xs font-mono font-bold text-[#8a4b5e]">
                  {breathingActive ? `${breathTimer}s` : "Start"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setBreathingActive(!breathingActive);
                  if (!breathingActive) {
                    setBreathPhase("Inhale");
                    setBreathTimer(4);
                  }
                }}
                className="px-6 py-2.5 rounded-full bg-[#8a4b5e] text-white text-xs font-semibold hover:bg-[#733e4e] transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {breathingActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Begin Breathing</span>
                  </>
                )}
              </button>

              {breathingActive && (
                <button
                  onClick={() => {
                    setBreathingActive(false);
                    setBreathPhase("Inhale");
                    setBreathTimer(4);
                  }}
                  className="p-2.5 rounded-full bg-white text-[#514346] hover:bg-[#fee0f5] transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </section>

          {/* Thoughtful Prompts Exploration (12 cols) */}
          <section className="md:col-span-12 bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#271624]">
                  Thoughtful Prompts for You
                </h3>
                <p className="text-xs text-[#514346] mt-0.5">
                  Select an inquiry below and record your thoughts directly into your journal.
                </p>
              </div>

              {promptSaved && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved to Journal!</span>
                </span>
              )}
            </div>

            {/* Prompt Selector Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                "What boundary helped you feel most protected this week?",
                "Where can you invite 5 minutes of stillness tomorrow?",
                "What is one expectation you can gently let go of right now?",
              ].map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => setSelectedPrompt(prompt)}
                  className={`p-4 rounded-2xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    selectedPrompt === prompt
                      ? "bg-[#665783] text-white shadow-sm"
                      : "bg-[#ffeff8] text-[#514346] hover:bg-[#fee0f5] border border-[#d6c1c5]/40"
                  }`}
                >
                  <span className="block font-serif text-sm mb-1 text-[#ffd7ef]">
                    Prompt
                  </span>
                  {prompt}
                </button>
              ))}
            </div>

            {/* Answer Form */}
            <form onSubmit={handleSavePrompt} className="flex flex-col gap-3">
              <div className="p-4 rounded-2xl bg-[#fff7f9] border border-[#d6c1c5]/50">
                <p className="text-xs font-bold text-[#8a4b5e] mb-2 font-serif">
                  {selectedPrompt}
                </p>
                <textarea
                  value={promptAnswer}
                  onChange={(e) => setPromptAnswer(e.target.value)}
                  placeholder="Reflect on this prompt here..."
                  rows={4}
                  className="w-full bg-transparent border-none resize-none focus:outline-none text-xs sm:text-sm text-[#271624] placeholder:text-[#847376]"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={!promptAnswer.trim()}
                  className="px-6 py-2.5 rounded-full bg-[#8a4b5e] text-white text-xs font-semibold hover:bg-[#733e4e] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Save to Journal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </section>

          {/* Calming Ambient Soundscapes Widget (12 cols) */}
          <section className="md:col-span-12 bg-[#ffeff8] rounded-3xl p-6 border border-[#d6c1c5]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#dcc9fd] flex items-center justify-center text-[#61527e]">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-[#271624]">
                  Calming Focus Soundscapes
                </h4>
                <p className="text-xs text-[#514346]">
                  Gentle frequencies to accompany your mindful reflection.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Gentle Rain", "Ocean Swell", "Forest Birds", "Singing Bowls"].map(
                (sound) => (
                  <button
                    key={sound}
                    onClick={() =>
                      setActiveSound(activeSound === sound ? null : sound)
                    }
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeSound === sound
                        ? "bg-[#8a4b5e] text-white shadow-xs"
                        : "bg-white text-[#514346] border border-[#d6c1c5]/50 hover:bg-[#fee0f5]"
                    }`}
                  >
                    {activeSound === sound ? "Playing: " : ""}
                    {sound}
                  </button>
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
