"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Sparkles,
  Wind,
  Footprints,
  HeartHandshake,
} from "lucide-react";

import { MicroGoalsWidget } from "@/components/mood-board/MicroGoalsWidget";

import { submitCheckIn } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { userName, checkIns, journalEntries, addCheckIn, stats } = useApp();

  const handleQuickMood = async (
    moodValue: number,
    moodLabel: "Terrible" | "Bad" | "Okay" | "Good" | "Great",
    moodEmoji: string
  ) => {
    addCheckIn({
      mood: moodValue,
      moodLabel,
      moodEmoji,
      stress: 4,
      energy: 7,
      factors: ["Mindfulness"],
      note: "Logged from quick dashboard mood picker.",
    });

    try {
      await submitCheckIn({
        mood_score: moodValue,
        mood_label: moodLabel,
        mood_emoji: moodEmoji,
        stress_level: 4,
        energy_level: 7,
        factors: ["Mindfulness"],
        note: "Logged from quick dashboard mood picker.",
      });
    } catch (err) {
      console.error("Failed to submit quick checkin:", err);
    }

    router.push("/checkin");
  };


  const latestJournal = journalEntries[0];

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        {/* Welcome Greeting Header */}
        <div className="pt-2">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#8a4b5e] leading-tight">
            Good morning, {userName} <span className="text-[#76546b]">♡</span>
          </h1>
          <p className="text-base sm:text-lg text-[#514346] mt-2 font-sans">
            Take a moment to check in with yourself.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Left Main (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Daily Check-in Hero Card (Primary Contextual Action) */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#d98fa3]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#271624] mb-2">
                  How are you feeling today? <span className="text-[#76546b]">♡</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#514346] mb-6">
                  Select your current emotional state or dive into the full check-in flow.
                </p>

                {/* Mood Selectors */}
                <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-8 w-full max-w-xl">
                  {[
                    { val: 1, label: "Very Low", emoji: "😭" },
                    { val: 2, label: "Low", emoji: "😔" },
                    { val: 3, label: "Okay", emoji: "😐" },
                    { val: 4, label: "Good", emoji: "🙂" },
                    { val: 5, label: "Great", emoji: "✨" },
                  ].map((m) => (
                    <button
                      key={m.label}
                      onClick={() =>
                        handleQuickMood(
                          m.val,
                          m.label as "Terrible" | "Bad" | "Okay" | "Good" | "Great",
                          m.emoji
                        )
                      }
                      className="flex flex-col items-center gap-2 p-2 sm:p-3 rounded-2xl hover:bg-[#ffeff8] border border-transparent hover:border-[#d98fa3]/40 transition-all group active:scale-95 cursor-pointer"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#ffe7f7] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-xs">
                        {m.emoji}
                      </div>
                      <span className="text-xs font-semibold text-[#514346]">
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>

                <Link
                  href="/checkin"
                  className="bg-[#8a4b5e] text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-[#733e4e] transition-colors shadow-md flex items-center gap-2 group"
                >
                  <span>Start today's check-in</span>
                  <span className="text-base leading-none group-hover:rotate-12 transition-transform">
                    ✦
                  </span>
                </Link>
              </div>
            </section>

            {/* This Week in Feelings Bar Chart (Informative) */}
            <section className="bg-white rounded-[28px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60">
              <div className="mb-6">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#271624]">
                  Your week in feelings
                </h3>
                <p className="text-xs text-[#514346] mt-0.5">
                  Mood levels recorded across the last 7 days
                </p>
              </div>

              {/* Bar visualization */}
              {checkIns.length === 0 ? (
                <div className="h-48 w-full flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[#ffeff8]/50 border border-dashed border-[#d6c1c5]/60">
                  <p className="font-serif text-base font-semibold text-[#271624]">
                    No check-ins recorded yet <span className="text-[#76546b]">♡</span>
                  </p>
                  <p className="text-xs text-[#514346] max-w-sm mt-1">
                    Select a mood above or start today's check-in to see your weekly emotional progression!
                  </p>
                </div>
              ) : (
                <div className="h-48 w-full flex items-end justify-between gap-2 px-2 pt-6">
                  {checkIns.slice(-7).map((ci) => {
                    const heightPercent = ci.mood * 20; // 20% to 100%
                    const getBarColor = (mood: number) => {
                      if (mood >= 4) return "bg-[#d98fa3] hover:bg-[#8a4b5e]";
                      if (mood === 3) return "bg-[#dcc9fd] hover:bg-[#665783]";
                      return "bg-[#fee0f5] hover:bg-[#dcc9fd]";
                    };

                    return (
                      <div
                        key={ci.id}
                        className="w-full flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                      >
                        <div className="relative w-full flex justify-center h-full items-end">
                          {/* Tooltip */}
                          <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-[#271624] text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-md">
                            {ci.moodEmoji} {ci.moodLabel} ({ci.mood}/5)
                          </div>
                          {/* Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-8 sm:w-12 rounded-t-xl transition-all duration-300 shadow-xs ${getBarColor(
                              ci.mood
                            )}`}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#514346]">
                          {ci.dayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Well-being Suggestions */}
            <section>
              <h3 className="font-serif text-xl font-bold text-[#271624] mb-4 pl-1">
                Little things for you <span className="text-[#76546b]">♡</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl soft-glow flex flex-col gap-3 border border-[#f8daef]/60">
                  <div className="w-11 h-11 rounded-full bg-[#dcc9fd] flex items-center justify-center text-[#61527e]">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#271624]">
                      Mindful Breathing
                    </h4>
                    <p className="text-xs text-[#514346] mt-1 leading-relaxed">
                      3-minute 4-7-8 relaxing breath cycle to reduce cortisol.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl soft-glow flex flex-col gap-3 border border-[#f8daef]/60">
                  <div className="w-11 h-11 rounded-full bg-[#fee0f5] flex items-center justify-center text-[#8a4b5e]">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#271624]">
                      10-Minute Walk
                    </h4>
                    <p className="text-xs text-[#514346] mt-1 leading-relaxed">
                      Gentle stroll to reset focus and stimulate positive endorphins.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl soft-glow flex flex-col gap-3 border border-[#f8daef]/60">
                  <div className="w-11 h-11 rounded-full bg-[#ffe7f7] flex items-center justify-center text-[#76546b]">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#271624]">
                      Gratitude Note
                    </h4>
                    <p className="text-xs text-[#514346] mt-1 leading-relaxed">
                      Note down three simple moments you appreciate today.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Column 2: Right Sidebar Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* AI Reflection Observation Card (Informative) */}
            <div className="bg-[#ebddff] rounded-[28px] p-6 flex flex-col gap-3 relative overflow-hidden border border-[#d1bef1]">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#d1bef1] rounded-full opacity-60 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-[#61527e] mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Mindful Insight
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#21133c] leading-snug">
                  Mindful Routine Noticed <span className="text-[#76546b]">✦</span>
                </h3>
                <p className="text-xs text-[#4e3f6a] mt-2 leading-relaxed">
                  MindEase noticed themes of proactive mindfulness and healthy routine building across your recent logs.
                </p>
              </div>
            </div>

            {/* Today's Micro Goals Widget */}
            <MicroGoalsWidget />

            {/* Recent Reflections Card (Informative) */}
            <div className="bg-white rounded-[28px] p-6 soft-glow border border-[#f8daef]/60 flex flex-col gap-4">
              <h3 className="font-serif text-lg font-bold text-[#271624]">
                Recent Reflection
              </h3>


              {latestJournal ? (
                <div className="p-4 rounded-2xl bg-[#ffeff8] border border-[#d6c1c5]/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-[#514346]">
                    <span className="font-bold text-[#8a4b5e]">
                      {latestJournal.date}
                    </span>
                    <span>{latestJournal.timeAgo}</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#271624] leading-snug">
                    {latestJournal.title}
                  </h4>
                  <p className="text-xs text-[#514346] line-clamp-3 leading-relaxed">
                    {latestJournal.content}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {latestJournal.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-semibold text-[#76546b] border border-[#d6c1c5]/50"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#514346]">No reflections yet.</p>
              )}
            </div>

            {/* Quick Metrics Snapshot */}
            <div className="bg-white rounded-[28px] p-6 soft-glow border border-[#f8daef]/60 flex flex-col gap-4">
              <h3 className="font-serif text-lg font-bold text-[#271624]">
                Wellness Snapshot
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-[#ffeff8]">
                  <p className="text-[10px] uppercase font-bold text-[#8a4b5e]">
                    Mood
                  </p>
                  <p className="font-serif text-xl font-bold text-[#271624] mt-1">
                    {stats.avgMood}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    +{stats.moodDelta}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#fee0f5]">
                  <p className="text-[10px] uppercase font-bold text-[#665783]">
                    Stress
                  </p>
                  <p className="font-serif text-xl font-bold text-[#271624] mt-1">
                    {stats.avgStress}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {stats.stressDelta}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#ffe7f7]">
                  <p className="text-[10px] uppercase font-bold text-[#76546b]">
                    Energy
                  </p>
                  <p className="font-serif text-xl font-bold text-[#271624] mt-1">
                    {stats.avgEnergy}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    +{stats.energyDelta}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
