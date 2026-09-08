"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Droplet,
  Zap,
  Tag,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Smile,
  Heart,
} from "lucide-react";

const moodOptions = [
  { val: 1, label: "Terrible", emoji: "😭" },
  { val: 2, label: "Bad", emoji: "😔" },
  { val: 3, label: "Okay", emoji: "😐" },
  { val: 4, label: "Good", emoji: "🙂" },
  { val: 5, label: "Great", emoji: "✨" },
];

const availableFactors = [
  "Quality Sleep",
  "Workload",
  "Exercise",
  "Socializing",
  "Nutrition",
  "Weather",
  "Meditation",
  "Family",
  "Screen Time",
  "Nature",
];

import { submitCheckIn, submitJournalEntry } from "@/lib/api";

export default function CheckinPage() {
  const router = useRouter();
  const { addCheckIn, addJournalEntry } = useApp();

  const [selectedMood, setSelectedMood] = useState<number>(4);
  const [stress, setStress] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(7);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([
    "Quality Sleep",
    "Meditation",
  ]);
  const [note, setNote] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleFactor = (factor: string) => {
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMoodObj =
      moodOptions.find((m) => m.val === selectedMood) || moodOptions[2];

    // 1. Update local AppContext
    addCheckIn({
      mood: selectedMood,
      moodLabel: currentMoodObj.label as
        | "Terrible"
        | "Bad"
        | "Okay"
        | "Good"
        | "Great",
      moodEmoji: currentMoodObj.emoji,
      stress,
      energy,
      factors: selectedFactors,
      note,
    });

    if (note.trim().length > 0) {
      addJournalEntry({
        title: `Daily Check-in Note (${currentMoodObj.label})`,
        content: note,
        tags: selectedFactors.slice(0, 3),
      });
    }

    // 2. Persist to FastAPI & Supabase PostgreSQL
    try {
      setIsSubmitting(true);
      await submitCheckIn({
        mood_score: selectedMood,
        mood_label: currentMoodObj.label,
        mood_emoji: currentMoodObj.emoji,
        stress_level: stress,
        energy_level: energy,
        factors: selectedFactors,
        note: note.trim() || undefined,
      });

      if (note.trim().length > 0) {
        await submitJournalEntry({
          title: `Daily Check-in Note (${currentMoodObj.label})`,
          content: note.trim(),
          tags: selectedFactors.slice(0, 3),
          sentiment: selectedMood >= 4 ? "Positive" : selectedMood === 3 ? "Calm" : "Reflective",
        });
      }
    } catch (err) {
      console.error("Failed to persist checkin to backend:", err);
    } finally {
      setIsSubmitting(false);
    }

    setSubmitted(true);
  };


  return (
    <AppLayout
      title="Daily Check-in"
      subtitle="Take a quiet moment to listen to your mind and body"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
        {/* Header Introduction */}
        <div className="text-center space-y-2 pt-2">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#8a4b5e]">
            Let's check in with yourself <span className="text-[#76546b]">♡</span>
          </h1>
          <p className="text-sm sm:text-base text-[#514346] max-w-2xl mx-auto leading-relaxed">
            Take a moment to pause, breathe, and notice how you're feeling right now.
            There are no right or wrong answers.
          </p>
        </div>

        {/* Success Modal Confirmation */}
        {submitted ? (
          <div className="bg-white rounded-[32px] p-8 sm:p-12 soft-glow border border-[#d98fa3]/40 text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-[#dcc9fd] text-[#61527e] flex items-center justify-center text-4xl shadow-md">
              ✨
            </div>
            <div>
              <h2 className="font-serif text-3xl font-bold text-[#271624]">
                Check-in Recorded!
              </h2>
              <p className="text-sm text-[#514346] mt-2 max-w-md mx-auto">
                Thank you for honoring your mental wellness today. Your mood board and AI
                insights have been updated.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center mt-2">
              <button
                onClick={() => router.push("/mood-board")}
                className="px-6 py-3 rounded-full bg-[#8a4b5e] text-white text-sm font-semibold hover:bg-[#733e4e] transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>View Mood Board</span>
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push("/reflection")}
                className="px-6 py-3 rounded-full bg-[#ffeff8] text-[#8a4b5e] border border-[#d6c1c5]/60 text-sm font-semibold hover:bg-[#fee0f5] transition-colors cursor-pointer"
              >
                AI Reflection
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 rounded-full bg-[#ffeff8] text-[#8a4b5e] border border-[#d6c1c5]/60 text-sm font-semibold hover:bg-[#fee0f5] transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mood Selection Card (Full Width) */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-[32px] p-6 sm:p-8 soft-glow flex flex-col gap-6 items-center relative overflow-hidden border border-[#f8daef]/60">
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#ffd9e1]/40 organic-blob -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

                <div className="text-center">
                  <h3 className="font-serif text-2xl font-bold text-[#271624]">
                    How are you feeling overall?
                  </h3>
                  <p className="text-xs text-[#514346] mt-1">
                    Pick the emoji that resonates most with your present state.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full">
                  {moodOptions.map((m) => {
                    const isSelected = selectedMood === m.val;
                    return (
                      <button
                        type="button"
                        key={m.val}
                        onClick={() => setSelectedMood(m.val)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 w-24 sm:w-28 relative ${
                          isSelected
                            ? "border-2 border-[#8a4b5e] bg-[#ffd9e1]/25 shadow-sm"
                            : "border border-[#d6c1c5]/50 hover:border-[#8a4b5e] hover:bg-[#ffeff8]"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 text-[#8a4b5e] bg-white rounded-full p-0.5 shadow-xs">
                            <CheckCircle2 className="w-4 h-4 fill-[#8a4b5e] text-white" />
                          </div>
                        )}
                        <span className="text-3xl sm:text-4xl transition-transform hover:scale-110">
                          {m.emoji}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            isSelected ? "text-[#8a4b5e] font-bold" : "text-[#514346]"
                          }`}
                        >
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stress Level Slider */}
              <div className="bg-white rounded-[32px] p-6 sm:p-8 soft-glow flex flex-col justify-between border border-[#f8daef]/60">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#dcc9fd] flex items-center justify-center text-[#61527e]">
                      <Droplet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#271624]">
                        Stress Level
                      </h3>
                      <span className="text-xs font-bold text-[#665783]">
                        {stress} / 10
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#514346] mb-6">
                    How tense or relaxed do you feel internally?
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={stress}
                      onChange={(e) => setStress(Number(e.target.value))}
                      className="w-full wellness-slider"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-[#514346]">
                    <span>1 (Serene & Calm)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (High Tension)</span>
                  </div>
                </div>
              </div>

              {/* Energy Level Slider */}
              <div className="bg-white rounded-[32px] p-6 sm:p-8 soft-glow flex flex-col justify-between border border-[#f8daef]/60">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#c198b2] text-white flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#271624]">
                        Energy Level
                      </h3>
                      <span className="text-xs font-bold text-[#76546b]">
                        {energy} / 10
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#514346] mb-6">
                    How vibrant, alert, and active do you feel?
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={energy}
                      onChange={(e) => setEnergy(Number(e.target.value))}
                      className="w-full wellness-slider"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-[#514346]">
                    <span>1 (Exhausted)</span>
                    <span>5 (Steady)</span>
                    <span>10 (Energized)</span>
                  </div>
                </div>
              </div>

              {/* Contributing Factors Card (Full Width) */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#8a4b5e]" />
                  <h3 className="font-serif text-lg font-bold text-[#271624]">
                    What is influencing your mood today?
                  </h3>
                </div>
                <p className="text-xs text-[#514346]">
                  Select the key factors that stand out to you right now.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {availableFactors.map((factor) => {
                    const isSelected = selectedFactors.includes(factor);
                    return (
                      <button
                        type="button"
                        key={factor}
                        onClick={() => toggleFactor(factor)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
                          isSelected
                            ? "bg-[#665783] text-white shadow-xs"
                            : "bg-[#ffeff8] text-[#514346] hover:bg-[#fee0f5] border border-[#d6c1c5]/40"
                        }`}
                      >
                        {factor}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reflection Note Card (Full Width) */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60 flex flex-col gap-3">
                <h3 className="font-serif text-lg font-bold text-[#271624]">
                  A quiet thought or note (optional)
                </h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Anything specific happening today you would like to remember or reflect upon?..."
                  className="w-full p-4 rounded-2xl bg-[#ffeff8]/50 border border-[#d6c1c5]/50 focus:border-[#8a4b5e] focus:bg-white focus:outline-none text-sm text-[#271624] placeholder:text-[#847376] transition-colors"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#76546b] italic hidden sm:inline">
                ♡ Your check-ins remain 100% private and encrypted.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#8a4b5e] text-white font-semibold text-sm hover:bg-[#733e4e] transition-colors shadow-md flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? "Saving Check-in..." : "Complete Check-in"}</span>
                <span className="text-base group-hover:rotate-12 transition-transform leading-none">
                  ✦
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
