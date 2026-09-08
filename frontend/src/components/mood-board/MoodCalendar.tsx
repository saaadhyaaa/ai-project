"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, CheckCircle2 } from "lucide-react";
import { MonthMoodDayData } from "@/lib/api";

interface MoodCalendarProps {
  year: number;
  month: number; // 1-12
  selectedDate: string; // YYYY-MM-DD
  daysData: MonthMoodDayData[];
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MoodCalendar({
  year,
  month,
  selectedDate,
  daysData,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: MoodCalendarProps) {
  const todayStr = React.useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Build a map of date string -> MonthMoodDayData
  const daysMap = React.useMemo(() => {
    const map = new Map<string, MonthMoodDayData>();
    daysData.forEach((d) => map.set(d.date, d));
    return map;
  }, [daysData]);

  // First day of current month (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  // Adjust so Monday is 0 and Sunday is 6
  const startOffset = (firstDayIndex + 6) % 7;

  // Number of days in current month
  const totalDays = new Date(year, month, 0).getDate();

  const getMoodBadge = (moodScore?: number | null) => {
    switch (moodScore) {
      case 5:
        return {
          bg: "bg-[#8a4b5e] text-white",
          label: "Great",
          emoji: "✨",
          dot: "bg-[#8a4b5e]",
          glow: "shadow-[0_0_10px_rgba(138,75,94,0.3)]",
        };
      case 4:
        return {
          bg: "bg-[#d98fa3] text-white",
          label: "Good",
          emoji: "🙂",
          dot: "bg-[#d98fa3]",
          glow: "shadow-[0_0_8px_rgba(217,143,163,0.3)]",
        };
      case 3:
        return {
          bg: "bg-[#dcc9fd] text-[#61527e]",
          label: "Okay",
          emoji: "😐",
          dot: "bg-[#61527e]",
          glow: "shadow-[0_0_8px_rgba(220,201,253,0.3)]",
        };
      case 2:
        return {
          bg: "bg-[#ffd7ef] text-[#76546b]",
          label: "Bad",
          emoji: "😔",
          dot: "bg-[#76546b]",
          glow: "shadow-[0_0_8px_rgba(255,215,239,0.3)]",
        };
      case 1:
        return {
          bg: "bg-[#61527e] text-white",
          label: "Terrible",
          emoji: "😭",
          dot: "bg-[#61527e]",
          glow: "shadow-[0_0_8px_rgba(97,82,126,0.3)]",
        };
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/80 flex flex-col gap-6">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8a4b5e] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Monthly Emotional Journey</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#271624] mt-1">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToday}
            className="px-3.5 py-1.5 rounded-full bg-[#ffeff8] hover:bg-[#fee0f5] border border-[#d6c1c5]/50 text-xs font-bold text-[#8a4b5e] transition-colors cursor-pointer active:scale-95"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-[#ffeff8] p-1 rounded-full border border-[#d6c1c5]/40">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Previous Month"
              className="p-1.5 rounded-full hover:bg-white text-[#514346] hover:text-[#271624] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Next Month"
              className="p-1.5 rounded-full hover:bg-white text-[#514346] hover:text-[#271624] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mood Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-2 border-b border-[#ffe7f7] text-[11px] text-[#514346]">
        <span className="font-semibold text-[#8a4b5e]">Mood Scale:</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8a4b5e]" />
            <span>Great</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d98fa3]" />
            <span>Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dcc9fd]" />
            <span>Okay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd7ef]" />
            <span>Bad</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#61527e]" />
            <span>Very Low</span>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold text-[#76546b]">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Leading empty cells */}
        {Array.from({ length: startOffset }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="h-14 sm:h-20 rounded-2xl bg-transparent opacity-20 pointer-events-none"
          />
        ))}

        {/* Day cells */}
        {Array.from({ length: totalDays }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const dayData = daysMap.get(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;
          const badge = getMoodBadge(dayData?.mood_score);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`h-16 sm:h-22 rounded-2xl p-1.5 sm:p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer text-left relative active:scale-95 group ${
                isSelected
                  ? "border-2 border-[#8a4b5e] bg-[#ffd9e1]/30 shadow-md ring-2 ring-[#8a4b5e]/20"
                  : isToday
                  ? "border border-[#8a4b5e]/60 bg-[#fff5f8] hover:bg-[#fee0f5]/60"
                  : "border border-[#d6c1c5]/30 hover:border-[#d98fa3] bg-[#fffafb] hover:bg-[#ffeff8]"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    isSelected
                      ? "text-[#8a4b5e] font-extrabold"
                      : isToday
                      ? "text-[#8a4b5e]"
                      : "text-[#271624]"
                  }`}
                >
                  {dayNum}
                </span>

                {isToday && (
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full bg-[#8a4b5e] text-white text-[9px] font-bold">
                    Today
                  </span>
                )}
              </div>

              {/* Mood Badge / Status */}
              <div className="mt-auto flex flex-col gap-1 w-full">
                {badge ? (
                  <div
                    className={`flex items-center justify-center gap-1 px-1.5 py-0.5 sm:py-1 rounded-xl text-[11px] font-bold ${badge.bg} ${badge.glow} transition-transform group-hover:scale-102`}
                  >
                    <span className="text-xs sm:text-sm leading-none">
                      {dayData?.mood_emoji || badge.emoji}
                    </span>
                    <span className="hidden md:inline truncate">{badge.label}</span>
                  </div>
                ) : (
                  <div className="h-5 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d6c1c5]/40" />
                  </div>
                )}

                {/* Sub-Indicators (Journal & Goals) */}
                <div className="flex items-center gap-1 justify-center sm:justify-start">
                  {dayData?.has_journal && (
                    <span
                      title={`${dayData.journal_count} journal reflection${dayData.journal_count > 1 ? "s" : ""}`}
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#665783]"
                    />
                  )}
                  {dayData && dayData.goal_count > 0 && (
                    <span
                      title={`${dayData.completed_goal_count}/${dayData.goal_count} goals completed`}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                        dayData.completed_goal_count === dayData.goal_count
                          ? "bg-emerald-600"
                          : "bg-[#d98fa3]"
                      }`}
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
