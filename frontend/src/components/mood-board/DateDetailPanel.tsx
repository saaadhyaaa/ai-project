"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  Droplet,
  Tag,
  BookOpen,
  Plus,
  CheckCircle2,
  Circle,
  RefreshCw,
  Trash2,
  ArrowRight,
  Smile,
} from "lucide-react";
import {
  DayDetailResponseData,
  MicroGoalData,
  toggleMicroGoal,
  deleteMicroGoal,
  createMicroGoal,
  regenerateDaySummary,
} from "@/lib/api";

interface DateDetailPanelProps {
  selectedDate: string; // YYYY-MM-DD
  dayDetail: DayDetailResponseData | null;
  loading: boolean;
  onRefresh: () => void;
}

export function DateDetailPanel({
  selectedDate,
  dayDetail,
  loading,
  onRefresh,
}: DateDetailPanelProps) {
  const [newGoalText, setNewGoalText] = useState("");
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isRefreshingSummary, setIsRefreshingSummary] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formattedDate = React.useMemo(() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const handleToggleGoal = async (goal: MicroGoalData) => {
    try {
      await toggleMicroGoal(goal.id, !goal.completed);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update goal");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteMicroGoal(goalId);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete goal");
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    try {
      setIsAddingGoal(true);
      setErrorMessage(null);
      await createMicroGoal({
        goal_text: newGoalText.trim(),
        goal_date: selectedDate,
        source: "manual",
      });
      setNewGoalText("");
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add goal");
    } finally {
      setIsAddingGoal(false);
    }
  };

  const handleRegenerateSummary = async () => {
    try {
      setIsRefreshingSummary(true);
      setErrorMessage(null);
      await regenerateDaySummary(selectedDate);
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to refresh summary");
    } finally {
      setIsRefreshingSummary(false);
    }
  };

  const checkin = dayDetail?.checkin;
  const journals = dayDetail?.journals || [];
  const goals = dayDetail?.micro_goals || [];
  const summary = dayDetail?.daily_summary;

  const completedGoalsCount = goals.filter((g) => g.completed).length;

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/80 flex flex-col gap-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#ffe7f7]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a4b5e]">
            Daily Emotional Detail
          </span>
          <h3 className="font-serif text-2xl font-bold text-[#271624] mt-0.5">
            {formattedDate}
          </h3>
        </div>

        {checkin && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffeff8] border border-[#d6c1c5]/40 text-xs font-bold text-[#8a4b5e]">
            <span className="text-base leading-none">{checkin.mood_emoji || "✨"}</span>
            <span>{checkin.mood_label}</span>
            <span className="text-[#847376] font-normal">({checkin.mood_score}/5)</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-2xl bg-[#ffdad6]/70 border border-[#ba1a1a]/30 text-xs text-[#93000a] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs underline font-semibold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#8a4b5e] border-t-transparent animate-spin" />
          <p className="text-xs text-[#514346]">Loading day details...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Check-In Info Card */}
          {checkin ? (
            <div className="bg-[#fff7f9] rounded-2xl p-5 border border-[#d6c1c5]/40 flex flex-col gap-4">
              {/* Stress & Energy meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl soft-glow border border-[#ffe7f7] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#dcc9fd] text-[#61527e] flex items-center justify-center shrink-0">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#271624]">Stress Level</span>
                      <span className="font-bold text-[#61527e]">{checkin.stress_level} / 10</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#f8daef] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-[#665783] rounded-full"
                        style={{ width: `${checkin.stress_level * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl soft-glow border border-[#ffe7f7] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#fee0f5] text-[#8a4b5e] flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#271624]">Energy Level</span>
                      <span className="font-bold text-[#8a4b5e]">{checkin.energy_level} / 10</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#f8daef] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-[#8a4b5e] rounded-full"
                        style={{ width: `${checkin.energy_level * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Factors chips */}
              {checkin.factors && checkin.factors.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-[#76546b] uppercase tracking-wider block mb-1.5">
                    What affected you:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {checkin.factors.map((factor) => (
                      <span
                        key={factor}
                        className="px-3 py-1 rounded-full bg-white text-xs font-semibold text-[#514346] border border-[#d6c1c5]/50 shadow-xs"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Note */}
              {checkin.note && (
                <div className="pt-2 border-t border-[#ffe7f7]">
                  <span className="text-[11px] font-bold text-[#76546b] uppercase tracking-wider block mb-1">
                    Personal Note:
                  </span>
                  <p className="text-xs text-[#271624] italic bg-white p-3 rounded-xl border border-[#ffe7f7] leading-relaxed">
                    "{checkin.note}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[#ffeff8]/60 border border-dashed border-[#d6c1c5] text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ffd9e1] flex items-center justify-center text-[#8a4b5e]">
                <Smile className="w-5 h-5" />
              </div>
              <div>
                <p className="font-serif font-bold text-sm text-[#271624]">
                  No check-in recorded for this date
                </p>
                <p className="text-xs text-[#514346] mt-0.5 max-w-sm">
                  Honor your emotional journey by recording how you felt.
                </p>
              </div>
              <Link
                href="/checkin"
                className="px-5 py-2 rounded-full bg-[#8a4b5e] text-white text-xs font-bold hover:bg-[#733e4e] transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>Log Check-in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Daily Emotional Summary Card */}
          {summary && (
            <div className="bg-[#ebddff]/60 rounded-2xl p-5 border border-[#d1bef1]/80 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#61527e]">
                  <Sparkles className="w-4 h-4 text-[#8a4b5e]" />
                  <span>MindEase Emotional Reflection</span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateSummary}
                  disabled={isRefreshingSummary}
                  title="Refresh daily reflection"
                  className="p-1 rounded-full hover:bg-white text-[#61527e] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRefreshingSummary ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <p className="text-xs text-[#21133c] leading-relaxed font-sans font-medium">
                {summary}
              </p>
            </div>
          )}

          {/* Journal Reflections Preview */}
          {journals.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8a4b5e]">
                  <BookOpen className="w-4 h-4" />
                  <span>Journal Reflections ({journals.length})</span>
                </div>
                <Link
                  href="/journal"
                  className="text-xs font-bold text-[#8a4b5e] hover:underline"
                >
                  Open Journal →
                </Link>
              </div>

              <div className="space-y-2">
                {journals.map((j) => (
                  <div
                    key={j.id}
                    className="p-3.5 rounded-xl bg-[#ffeff8] border border-[#d6c1c5]/30 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#271624] truncate">
                        {j.title || "Daily Reflection"}
                      </span>
                      {j.sentiment && (
                        <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-semibold text-[#8a4b5e] border border-[#d6c1c5]/40">
                          {j.sentiment}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#514346] line-clamp-2 leading-relaxed">
                      "{j.preview}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Micro Goals Section */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[#ffe7f7]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif text-lg font-bold text-[#271624]">
                  Micro Goals
                </h4>
                <p className="text-xs text-[#514346]">
                  {goals.length === 0
                    ? "Bite-sized, achievable wellness actions for this day."
                    : `${completedGoalsCount} of ${goals.length} completed`}
                </p>
              </div>
            </div>

            {/* Goals List */}
            <div className="space-y-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`group flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                    goal.completed
                      ? "bg-[#ffeff8]/50 border-[#d6c1c5]/30 text-[#847376]"
                      : "bg-white border-[#f8daef] hover:border-[#d98fa3] text-[#271624] soft-glow"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleGoal(goal)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#8a4b5e] shrink-0 hover:scale-110 transition-transform" />
                    )}
                    <span
                      className={`text-xs font-semibold truncate ${
                        goal.completed ? "line-through text-[#847376]" : "text-[#271624]"
                      }`}
                    >
                      {goal.goal_text}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 pl-2">
                    {goal.source === "chatbot" && (
                      <span className="px-2 py-0.5 rounded-full bg-[#ebddff] text-[10px] font-bold text-[#61527e]">
                        AI Action
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-[#847376] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-all cursor-pointer"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Goal Input */}
            <form onSubmit={handleAddGoal} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="Add a small wellness action (e.g. 5-min walk)..."
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                maxLength={120}
                className="flex-1 px-4 py-2.5 rounded-full bg-[#ffeff8]/60 border border-[#d6c1c5]/50 text-xs text-[#271624] placeholder:text-[#847376] focus:outline-none focus:border-[#8a4b5e] focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={isAddingGoal || !newGoalText.trim()}
                className="px-4 py-2.5 rounded-full bg-[#8a4b5e] text-white text-xs font-bold hover:bg-[#733e4e] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
