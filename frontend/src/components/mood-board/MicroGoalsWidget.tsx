"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Plus, ArrowRight, Target } from "lucide-react";
import {
  MicroGoalData,
  fetchMicroGoals,
  toggleMicroGoal,
  createMicroGoal,
} from "@/lib/api";

export function MicroGoalsWidget() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [goals, setGoals] = useState<MicroGoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMicroGoals(todayStr);
      setGoals(data.goals);
    } catch (err) {
      console.error("Error loading micro goals for widget:", err);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleToggle = async (goal: MicroGoalData) => {
    try {
      // Optimistic update
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, completed: !g.completed } : g))
      );
      await toggleMicroGoal(goal.id, !goal.completed);
    } catch (err) {
      console.error("Failed to toggle goal:", err);
      loadGoals();
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      setIsAdding(true);
      const newGoal = await createMicroGoal({
        goal_text: newText.trim(),
        goal_date: todayStr,
        source: "manual",
      });
      setGoals((prev) => [...prev, newGoal]);
      setNewText("");
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const progressPercent = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

  return (
    <div className="bg-white rounded-[28px] p-6 soft-glow border border-[#f8daef]/60 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffd9e1] flex items-center justify-center text-[#8a4b5e]">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#271624]">
              Today's Micro Goals
            </h3>
            <span className="text-[11px] text-[#514346]">
              {goals.length === 0
                ? "Small achievable wellness steps"
                : `${completedCount} of ${goals.length} completed`}
            </span>
          </div>
        </div>

        <Link
          href="/mood-board"
          className="text-xs font-bold text-[#8a4b5e] hover:underline flex items-center gap-1"
        >
          <span>Mood Board</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress Bar */}
      {goals.length > 0 && (
        <div className="w-full h-1.5 bg-[#ffeff8] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#d98fa3] to-[#8a4b5e] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Goals Checklist */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-[#847376] py-2 text-center">Loading goals...</p>
        ) : goals.length === 0 ? (
          <p className="text-xs text-[#514346] py-2 italic text-center bg-[#fff7f9] p-3 rounded-xl border border-[#ffe7f7]">
            No goals yet today. Add a small step below or ask your AI Companion!
          </p>
        ) : (
          goals.slice(0, 4).map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => handleToggle(goal)}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                goal.completed
                  ? "bg-[#ffeff8]/40 border-[#d6c1c5]/30 text-[#847376]"
                  : "bg-[#fffafb] border-[#ffe7f7] hover:border-[#d98fa3] text-[#271624]"
              }`}
            >
              {goal.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 fill-emerald-100" />
              ) : (
                <Circle className="w-4 h-4 text-[#8a4b5e] shrink-0" />
              )}
              <span
                className={`text-xs font-semibold truncate flex-1 ${
                  goal.completed ? "line-through text-[#847376]" : "text-[#271624]"
                }`}
              >
                {goal.goal_text}
              </span>
              {goal.source === "chatbot" && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#ebddff] text-[#61527e]">
                  AI
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Inline Quick Add */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1 border-t border-[#ffe7f7]">
        <input
          type="text"
          placeholder="Add a small goal (e.g. 5-min pause)..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          maxLength={80}
          className="flex-1 px-3 py-1.5 rounded-full bg-[#ffeff8]/70 border border-[#d6c1c5]/40 text-xs text-[#271624] placeholder:text-[#847376] focus:outline-none focus:border-[#8a4b5e]"
        />
        <button
          type="submit"
          disabled={isAdding || !newText.trim()}
          className="px-3 py-1.5 rounded-full bg-[#8a4b5e] text-white text-xs font-bold hover:bg-[#733e4e] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
}
