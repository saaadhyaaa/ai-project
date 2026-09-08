"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MoodCalendar } from "@/components/mood-board/MoodCalendar";
import { DateDetailPanel } from "@/components/mood-board/DateDetailPanel";
import { WeeklySummaryCard } from "@/components/mood-board/WeeklySummaryCard";
import {
  fetchMonthMoodBoard,
  fetchDayMoodDetail,
  fetchWeekMoodBoard,
  MonthMoodDayData,
  DayDetailResponseData,
  WeeklyMoodResponseData,
} from "@/lib/api";

function getLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMondayOfWeek(d: Date): string {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  date.setDate(diff);
  return getLocalDateString(date);
}

export default function MoodBoardPage() {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(getMondayOfWeek(now));

  const [monthDays, setMonthDays] = useState<MonthMoodDayData[]>([]);
  const [monthLoading, setMonthLoading] = useState<boolean>(true);

  const [dayDetail, setDayDetail] = useState<DayDetailResponseData | null>(null);
  const [dayLoading, setDayLoading] = useState<boolean>(true);

  const [weeklyData, setWeeklyData] = useState<WeeklyMoodResponseData | null>(null);
  const [weekLoading, setWeekLoading] = useState<boolean>(true);

  // Load Month Mood Data
  const loadMonthData = useCallback(async (y: number, m: number) => {
    try {
      setMonthLoading(true);
      const data = await fetchMonthMoodBoard(y, m);
      setMonthDays(data.days);
    } catch (err) {
      console.error("Error loading month mood board:", err);
    } finally {
      setMonthLoading(false);
    }
  }, []);

  // Load Day Detail Data
  const loadDayDetail = useCallback(async (dateStr: string) => {
    try {
      setDayLoading(true);
      const data = await fetchDayMoodDetail(dateStr);
      setDayDetail(data);
    } catch (err) {
      console.error("Error loading day detail:", err);
    } finally {
      setDayLoading(false);
    }
  }, []);

  // Load Week Data
  const loadWeekData = useCallback(async (startStr: string) => {
    try {
      setWeekLoading(true);
      const data = await fetchWeekMoodBoard(startStr);
      setWeeklyData(data);
    } catch (err) {
      console.error("Error loading week mood board:", err);
    } finally {
      setWeekLoading(false);
    }
  }, []);

  // Trigger initial & dynamic fetches
  useEffect(() => {
    loadMonthData(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadMonthData]);

  useEffect(() => {
    loadDayDetail(selectedDate);
  }, [selectedDate, loadDayDetail]);

  useEffect(() => {
    loadWeekData(selectedWeekStart);
  }, [selectedWeekStart, loadWeekData]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((prev) => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((prev) => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDate(todayStr);
    setSelectedWeekStart(getMondayOfWeek(today));
  };

  // Date selection
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    setSelectedWeekStart(getMondayOfWeek(dateObj));
  };

  // Week navigation
  const handlePrevWeek = () => {
    const [y, m, d] = selectedWeekStart.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d - 7);
    setSelectedWeekStart(getLocalDateString(dateObj));
  };

  const handleNextWeek = () => {
    const [y, m, d] = selectedWeekStart.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d + 7);
    setSelectedWeekStart(getLocalDateString(dateObj));
  };

  const handleCurrentWeek = () => {
    setSelectedWeekStart(getMondayOfWeek(new Date()));
  };

  const refreshAll = () => {
    loadMonthData(currentYear, currentMonth);
    loadDayDetail(selectedDate);
    loadWeekData(selectedWeekStart);
  };

  return (
    <AppLayout
      title="Mood Board"
      subtitle="Reflect on your emotional patterns, daily moments, and bite-sized wellness goals"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-12">
        {/* Page Header */}
        <div className="pt-2">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#8a4b5e] leading-tight">
            Your Emotional Landscape <span className="text-[#76546b]">♡</span>
          </h1>
          <p className="text-sm sm:text-base text-[#514346] mt-2 font-sans max-w-2xl leading-relaxed">
            Understand how your moods, daily habits, and micro actions connect over time.
          </p>
        </div>

        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Calendar + Weekly Synthesis) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <MoodCalendar
              year={currentYear}
              month={currentMonth}
              selectedDate={selectedDate}
              daysData={monthDays}
              onSelectDate={handleSelectDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
            />

            <WeeklySummaryCard
              weeklyData={weeklyData}
              startDate={selectedWeekStart}
              loading={weekLoading}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onCurrentWeek={handleCurrentWeek}
              onRefresh={refreshAll}
            />
          </div>

          {/* Right Column (Day Details + Micro Goals) */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-20">
            <DateDetailPanel
              selectedDate={selectedDate}
              dayDetail={dayDetail}
              loading={dayLoading}
              onRefresh={refreshAll}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
