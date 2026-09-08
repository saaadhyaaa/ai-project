"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Droplet,
  Zap,
  Target,
  RefreshCw,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { WeeklyMoodResponseData, regenerateWeekSummary } from "@/lib/api";

interface WeeklySummaryCardProps {
  weeklyData: WeeklyMoodResponseData | null;
  startDate: string; // YYYY-MM-DD (Monday)
  loading: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onRefresh: () => void;
}

export function WeeklySummaryCard({
  weeklyData,
  startDate,
  loading,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onRefresh,
}: WeeklySummaryCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formattedRange = React.useMemo(() => {
    if (!weeklyData?.start_date || !weeklyData?.end_date) return "";
    const [sy, sm, sd] = weeklyData.start_date.split("-").map(Number);
    const [ey, em, ed] = weeklyData.end_date.split("-").map(Number);
    const startObj = new Date(sy, sm - 1, sd);
    const endObj = new Date(ey, em - 1, ed);

    const sStr = startObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const eStr = endObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${sStr} – ${eStr}`;
  }, [weeklyData]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setErrorMsg(null);
      await regenerateWeekSummary(startDate);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to refresh weekly summary");
    } finally {
      setIsRefreshing(false);
    }
  };

  const metrics = weeklyData?.metrics;
  const microGoals = weeklyData?.micro_goals;
  const hasData = (metrics?.checkin_count || 0) > 0 || (metrics?.journal_count || 0) > 0;

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/80 flex flex-col gap-6">
      {/* Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#ffe7f7]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8a4b5e] uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly Emotional Synthesis</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#271624] mt-0.5">
            {formattedRange || "Selected Week"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCurrentWeek}
            className="px-3.5 py-1.5 rounded-full bg-[#ffeff8] hover:bg-[#fee0f5] border border-[#d6c1c5]/50 text-xs font-bold text-[#8a4b5e] transition-colors cursor-pointer active:scale-95"
          >
            Current Week
          </button>
          <div className="flex items-center gap-1 bg-[#ffeff8] p-1 rounded-full border border-[#d6c1c5]/40">
            <button
              type="button"
              onClick={onPrevWeek}
              aria-label="Previous Week"
              className="p-1.5 rounded-full hover:bg-white text-[#514346] hover:text-[#271624] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              aria-label="Next Week"
              className="p-1.5 rounded-full hover:bg-white text-[#514346] hover:text-[#271624] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-[#ffdad6]/70 border border-[#ba1a1a]/30 text-xs text-[#93000a] flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs underline font-semibold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#8a4b5e] border-t-transparent animate-spin" />
          <p className="text-xs text-[#514346]">Calculating weekly metrics...</p>
        </div>
      ) : !hasData ? (
        /* Empty State */
        <div className="p-8 rounded-3xl bg-[#fff7f9] border border-dashed border-[#d6c1c5]/70 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#dcc9fd] text-[#61527e] flex items-center justify-center text-xl shadow-xs">
            🌱
          </div>
          <div>
            <h4 className="font-serif text-lg font-bold text-[#271624]">
              Your week is still unfolding
            </h4>
            <p className="text-xs text-[#514346] mt-1 max-w-md leading-relaxed">
              Nothing logged yet for this week. Your first check-in or journal entry will start building your personal emotional picture!
            </p>
          </div>
        </div>
      ) : (
        /* Populated Weekly Insights */
        <div className="flex flex-col gap-6">
          {/* Key Metrics Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#fff7f9] p-4 rounded-2xl border border-[#d6c1c5]/40 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-[#8a4b5e] tracking-wider">
                Average Mood
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-bold text-[#271624]">
                  {metrics?.average_mood !== null && metrics?.average_mood !== undefined
                    ? metrics.average_mood
                    : "—"}
                </span>
                <span className="text-[11px] text-[#847376]">/ 5</span>
              </div>
            </div>

            <div className="bg-[#fff7f9] p-4 rounded-2xl border border-[#d6c1c5]/40 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-[#665783] tracking-wider">
                Average Stress
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-bold text-[#271624]">
                  {metrics?.average_stress !== null && metrics?.average_stress !== undefined
                    ? metrics.average_stress
                    : "—"}
                </span>
                <span className="text-[11px] text-[#847376]">/ 10</span>
              </div>
            </div>

            <div className="bg-[#fff7f9] p-4 rounded-2xl border border-[#d6c1c5]/40 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-[#76546b] tracking-wider">
                Average Energy
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-bold text-[#271624]">
                  {metrics?.average_energy !== null && metrics?.average_energy !== undefined
                    ? metrics.average_energy
                    : "—"}
                </span>
                <span className="text-[11px] text-[#847376]">/ 10</span>
              </div>
            </div>

            <div className="bg-[#fff7f9] p-4 rounded-2xl border border-[#d6c1c5]/40 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Micro Goals
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-bold text-[#271624]">
                  {microGoals?.completed || 0}
                </span>
                <span className="text-[11px] text-[#847376]">
                  / {microGoals?.total || 0} done
                </span>
              </div>
            </div>
          </div>

          {/* Life Factors & Emotion Tag Chips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyData?.common_factors && weeklyData.common_factors.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#fff7f9] border border-[#d6c1c5]/30 flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a4b5e]">
                  Recurring Life Influences
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {weeklyData.common_factors.map((factor) => (
                    <span
                      key={factor}
                      className="px-3 py-1 rounded-full bg-white text-xs font-semibold text-[#514346] border border-[#d6c1c5]/40 shadow-xs"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {weeklyData?.common_emotions && weeklyData.common_emotions.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#fff7f9] border border-[#d6c1c5]/30 flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#61527e]">
                  Frequent Emotional States
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {weeklyData.common_emotions.map((emotion) => (
                    <span
                      key={emotion}
                      className="px-3 py-1 rounded-full bg-white text-xs font-semibold text-[#61527e] border border-[#d6c1c5]/40 shadow-xs"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Narrative Weekly Reflection Card */}
          {weeklyData?.summary && (
            <div className="bg-[#ebddff]/50 rounded-2xl p-6 border border-[#d1bef1] flex flex-col gap-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#61527e]">
                  <Sparkles className="w-5 h-5 text-[#8a4b5e]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    MindEase Weekly Reflection
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Regenerate weekly reflection"
                  className="p-1 rounded-full hover:bg-white text-[#61527e] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <p className="text-sm text-[#21133c] leading-relaxed font-sans font-medium">
                {weeklyData.summary}
              </p>

              {/* Highlights & Patterns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#d1bef1]/60">
                {weeklyData.highlights && weeklyData.highlights.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#61527e] uppercase tracking-wider block">
                      Notable Strengths:
                    </span>
                    <ul className="space-y-1 text-xs text-[#352554]">
                      {weeklyData.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#8a4b5e] leading-none mt-0.5">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {weeklyData.patterns && weeklyData.patterns.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#61527e] uppercase tracking-wider block">
                      Observed Patterns:
                    </span>
                    <ul className="space-y-1 text-xs text-[#352554]">
                      {weeklyData.patterns.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#61527e] leading-none mt-0.5">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Gentle Focus */}
              {weeklyData.gentle_focus && (
                <div className="p-3 rounded-xl bg-white/80 border border-[#d1bef1]/80 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#8a4b5e] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8a4b5e] block">
                      Gentle Focus Ahead
                    </span>
                    <p className="text-xs text-[#21133c] font-medium mt-0.5">
                      {weeklyData.gentle_focus}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
