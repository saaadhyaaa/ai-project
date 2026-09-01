"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  TrendingUp,
  Smile,
  Droplet,
  Zap,
  ArrowUp,
  ArrowDown,
  Calendar,
  Sparkles,
  Sun,
  Moon,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function TrendsPage() {
  const { checkIns, timeframe, setTimeframe, stats } = useApp();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const moodPoints = [
    { day: "Mon", score: 6.0, emoji: "😐", label: "Okay", note: "Busy meetings" },
    { day: "Tue", score: 7.5, emoji: "🙂", label: "Good", note: "Morning walk" },
    { day: "Wed", score: 4.5, emoji: "😔", label: "Low", note: "Deadline pressure" },
    { day: "Thu", score: 8.8, emoji: "✨", label: "Great", note: "Milestone achieved" },
    { day: "Fri", score: 8.0, emoji: "🙂", label: "Good", note: "Team celebration" },
    { day: "Sat", score: 7.0, emoji: "🙂", label: "Good", note: "Restful weekend" },
    { day: "Sun", score: 7.8, emoji: "✨", label: "Great", note: "Intentional journal" },
  ];

  return (
    <AppLayout
      title="Insights & Trends"
      subtitle="Track your emotional patterns, triggers, and wellness trajectories over time"
    >
      <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto">
        {/* Page Top Header with Timeframe Filter */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#8a4b5e]">
              Your Emotional Journey
            </h1>
            <p className="text-xs sm:text-sm text-[#514346] mt-1">
              Observing long-term balance and recurring emotional patterns.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#514346]">Timeframe:</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as "7" | "14" | "30")}
              className="bg-white border border-[#d6c1c5]/60 rounded-full px-4 py-2 text-xs font-semibold text-[#271624] focus:outline-none focus:border-[#8a4b5e] shadow-xs cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
        </section>

        {/* 3 Overview KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Mood KPI */}
          <div className="bg-white rounded-[28px] p-6 soft-glow border border-[#f8daef]/60 flex flex-col justify-between hover:border-[#d98fa3]/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#8a4b5e]">
                <Smile className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold">Average Mood</h3>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold">
                <ArrowUp className="w-3 h-3" />
                <span>+{stats.moodDelta}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-serif text-4xl font-bold text-[#271624]">
                {stats.avgMood}
              </span>
              <span className="text-xs text-[#847376] font-medium">/ 10</span>
            </div>
            <p className="text-[11px] text-[#514346] mt-2">
              Consistently higher on days with nature walks.
            </p>
          </div>

          {/* Stress KPI */}
          <div className="bg-white rounded-[28px] p-6 soft-glow border border-[#f8daef]/60 flex flex-col justify-between hover:border-[#d98fa3]/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#665783]">
                <Droplet className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold">Stress Index</h3>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold">
                <ArrowDown className="w-3 h-3" />
                <span>{stats.stressDelta}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-serif text-4xl font-bold text-[#271624]">
                {stats.avgStress}
              </span>
              <span className="text-xs text-[#847376] font-medium">/ 10</span>
            </div>
            <p className="text-[11px] text-[#514346] mt-2">
              Reduced tension noted following evening check-ins.
            </p>
          </div>

          {/* Energy KPI */}
          <div className="bg-white rounded-[28px] p-6 soft-glow border border-[#f8daef]/60 flex flex-col justify-between hover:border-[#d98fa3]/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#76546b]">
                <Zap className="w-5 h-5" />
                <h3 className="font-serif text-lg font-bold">Vitality & Energy</h3>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold">
                <ArrowUp className="w-3 h-3" />
                <span>+{stats.energyDelta}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-serif text-4xl font-bold text-[#271624]">
                {stats.avgEnergy}
              </span>
              <span className="text-xs text-[#847376] font-medium">/ 10</span>
            </div>
            <p className="text-[11px] text-[#514346] mt-2">
              Elevated vitality sustained through restful sleep.
            </p>
          </div>
        </section>

        {/* Main Interactive Mood Trajectory Chart */}
        <section className="bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#271624]">
                Weekly Mood Trajectory
              </h2>
              <p className="text-xs text-[#514346] mt-0.5">
                Daily emotional progression based on check-in scores
              </p>
            </div>
            <span className="text-xs font-semibold text-[#8a4b5e] bg-[#ffeff8] px-3 py-1 rounded-full">
              Stable & Upward
            </span>
          </div>

          {/* SVG Smooth Curve Graph */}
          <div className="relative h-64 w-full pt-8 pb-4">
            <svg
              className="w-full h-48 overflow-visible"
              viewBox="0 0 700 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d98fa3" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#d98fa3" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path
                d="M 50 120 C 120 70, 180 160, 250 145 C 320 130, 380 30, 450 40 C 520 50, 580 80, 650 60 L 650 190 L 50 190 Z"
                fill="url(#curveGradient)"
              />

              {/* Smooth Stroke Line */}
              <path
                d="M 50 120 C 120 70, 180 160, 250 145 C 320 130, 380 30, 450 40 C 520 50, 580 80, 650 60"
                fill="none"
                stroke="#8a4b5e"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Reference Gridlines */}
              <line x1="50" y1="50" x2="650" y2="50" stroke="#f8daef" strokeDasharray="4 4" />
              <line x1="50" y1="110" x2="650" y2="110" stroke="#f8daef" strokeDasharray="4 4" />
              <line x1="50" y1="170" x2="650" y2="170" stroke="#f8daef" strokeDasharray="4 4" />
            </svg>

            {/* Interactive Data Points */}
            <div className="absolute inset-0 flex justify-between px-6 sm:px-12 items-end pb-2 pointer-events-auto">
              {moodPoints.map((point, index) => {
                const isHovered = hoveredPoint === index;
                return (
                  <div
                    key={point.day}
                    onMouseEnter={() => setHoveredPoint(index)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="flex flex-col items-center gap-2 relative group cursor-pointer"
                  >
                    {/* Tooltip popup */}
                    {isHovered && (
                      <div className="absolute -top-20 bg-[#271624] text-white p-2.5 rounded-xl text-center z-30 shadow-xl min-w-[110px] animate-in fade-in zoom-in-95">
                        <div className="text-xs font-bold">
                          {point.emoji} {point.label} ({point.score}/10)
                        </div>
                        <div className="text-[10px] text-[#ffd9e1] mt-0.5">
                          {point.note}
                        </div>
                      </div>
                    )}

                    {/* Point Dot */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md transition-transform ${
                        isHovered
                          ? "bg-[#665783] scale-150 ring-4 ring-[#dcc9fd]"
                          : "bg-[#8a4b5e] hover:scale-125"
                      }`}
                    />
                    <span className="text-xs font-bold text-[#514346]">
                      {point.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pattern Observations Grid */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-[#8a4b5e]">
            Pattern Observations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#ffeff8] rounded-2xl p-5 border border-[#d6c1c5]/40 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#665783]">
                <Clock className="w-4 h-4" />
                <h4 className="font-serif font-bold text-sm text-[#271624]">
                  Midweek Dip & Recovery
                </h4>
              </div>
              <p className="text-xs text-[#514346] leading-relaxed">
                Wednesday check-ins show brief stress spikes that reliably subside once you
                take a short evening walk.
              </p>
            </div>

            <div className="bg-[#fee0f5] rounded-2xl p-5 border border-[#d6c1c5]/40 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#8a4b5e]">
                <Sun className="w-4 h-4" />
                <h4 className="font-serif font-bold text-sm text-[#271624]">
                  Morning Journaling Boost
                </h4>
              </div>
              <p className="text-xs text-[#514346] leading-relaxed">
                Days beginning with a 5-minute journal entry correlate with 22% higher
                perceived focus and emotional clarity.
              </p>
            </div>

            <div className="bg-[#ffe7f7] rounded-2xl p-5 border border-[#d6c1c5]/40 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#76546b]">
                <Moon className="w-4 h-4" />
                <h4 className="font-serif font-bold text-sm text-[#271624]">
                  Weekend Equilibrium
                </h4>
              </div>
              <p className="text-xs text-[#514346] leading-relaxed">
                Your mood ratings remain steady and rejuvenating over Saturday and Sunday
                downtime.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Sections: Feelings Logged & AI Insights Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Feelings Frequency Pills (6 cols) */}
          <section className="lg:col-span-6 bg-white rounded-[28px] p-6 soft-glow border border-[#f8daef]/60 flex flex-col gap-4">
            <h3 className="font-serif text-xl font-bold text-[#271624]">
              Feelings You've Logged
            </h3>
            <p className="text-xs text-[#514346]">
              Frequency distribution across the current timeframe.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                { tag: "Calm", count: 12, bg: "bg-[#dcc9fd] text-[#61527e]" },
                { tag: "Grateful", count: 9, bg: "bg-[#ffd9e1] text-[#8a4b5e]" },
                { tag: "Joyful", count: 8, bg: "bg-[#ffe7f7] text-[#76546b]" },
                { tag: "Tired", count: 7, bg: "bg-[#f8daef] text-[#514346]" },
                { tag: "Motivated", count: 6, bg: "bg-[#ffd7ef] text-[#76546b]" },
                { tag: "Hopeful", count: 5, bg: "bg-[#dcc9fd]/60 text-[#61527e]" },
                { tag: "Overwhelmed", count: 4, bg: "bg-[#ffdad6] text-[#ba1a1a]" },
              ].map((item) => (
                <span
                  key={item.tag}
                  className={`px-4 py-2 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-xs ${item.bg}`}
                >
                  <span>{item.tag}</span>
                  <span className="opacity-70 text-[11px]">({item.count})</span>
                </span>
              ))}
            </div>
          </section>

          {/* AI Pattern Synthesis CTA (6 cols) */}
          <section className="lg:col-span-6 bg-[#ebddff] rounded-[28px] p-6 border border-[#d1bef1] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-[#665783]">
              <Sparkles className="w-20 h-20" />
            </div>

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-[#61527e] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pattern Synthesis</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#21133c]">
                Ready to explore guided reflections?
              </h3>
              <p className="text-xs text-[#4e3f6a] leading-relaxed">
                Connect your trend observations to actionable mindfulness exercises and
                in-depth AI-guided inquiries.
              </p>
            </div>

            <div className="pt-4 relative z-10">
              <Link
                href="/reflection"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#665783] text-white text-xs font-semibold hover:bg-[#52446d] transition-colors shadow-sm"
              >
                <span>Go to AI Reflection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
