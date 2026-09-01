"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CheckInRecord {
  id: string;
  date: string;
  dayName: string;
  mood: number; // 1: Terrible, 2: Bad, 3: Okay, 4: Good, 5: Great
  moodLabel: "Terrible" | "Bad" | "Okay" | "Good" | "Great";
  moodEmoji: string;
  stress: number; // 1 - 10
  energy: number; // 1 - 10
  factors: string[];
  note?: string;
}

export interface JournalRecord {
  id: string;
  title: string;
  content: string;
  date: string;
  timeAgo: string;
  tags: string[];
  sentiment: "Positive" | "Reflective" | "Tired" | "Calm" | "Anxious";
  aiInsights?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface AppContextType {
  userName: string;
  checkIns: CheckInRecord[];
  journalEntries: JournalRecord[];
  notifications: NotificationItem[];
  timeframe: "7" | "14" | "30";
  setTimeframe: (t: "7" | "14" | "30") => void;
  addCheckIn: (data: Omit<CheckInRecord, "id" | "date" | "dayName">) => void;
  addJournalEntry: (data: { title: string; content: string; tags: string[] }) => string;
  deleteJournalEntry: (id: string) => void;
  markNotificationRead: (id: string) => void;
  stats: {
    avgMood: number;
    avgStress: number;
    avgEnergy: number;
    streakDays: number;
    moodDelta: number;
    stressDelta: number;
    energyDelta: number;
  };
}

const defaultCheckIns: CheckInRecord[] = [
  {
    id: "ci-1",
    date: "2026-08-26",
    dayName: "Mon",
    mood: 3,
    moodLabel: "Okay",
    moodEmoji: "😐",
    stress: 6,
    energy: 5,
    factors: ["Work", "Sleep"],
    note: "Busy start of the week with meetings.",
  },
  {
    id: "ci-2",
    date: "2026-08-27",
    dayName: "Tue",
    mood: 4,
    moodLabel: "Good",
    moodEmoji: "🙂",
    stress: 5,
    energy: 7,
    factors: ["Exercise", "Focus"],
    note: "Went for a morning walk in the park.",
  },
  {
    id: "ci-3",
    date: "2026-08-28",
    dayName: "Wed",
    mood: 2,
    moodLabel: "Bad",
    moodEmoji: "😔",
    stress: 7,
    energy: 4,
    factors: ["Workload", "Fatigue"],
    note: "Felt a bit overwhelmed with deadlines.",
  },
  {
    id: "ci-4",
    date: "2026-08-29",
    dayName: "Thu",
    mood: 5,
    moodLabel: "Great",
    moodEmoji: "✨",
    stress: 3,
    energy: 8,
    factors: ["Social", "Accomplishment"],
    note: "Wrapped up the big milestone project!",
  },
  {
    id: "ci-5",
    date: "2026-08-30",
    dayName: "Fri",
    mood: 4,
    moodLabel: "Good",
    moodEmoji: "🙂",
    stress: 4,
    energy: 7,
    factors: ["Friends", "Relaxation"],
    note: "Nice dinner with close friends.",
  },
  {
    id: "ci-6",
    date: "2026-08-31",
    dayName: "Sat",
    mood: 3,
    moodLabel: "Okay",
    moodEmoji: "😐",
    stress: 3,
    energy: 6,
    factors: ["Family", "Rest"],
    note: "Quiet restful Saturday afternoon.",
  },
  {
    id: "ci-7",
    date: "2026-09-01",
    dayName: "Sun",
    mood: 4,
    moodLabel: "Good",
    moodEmoji: "🙂",
    stress: 4,
    energy: 7,
    factors: ["Mindfulness", "Reading"],
    note: "Taking time to journal and set intentions.",
  },
];

const defaultJournalEntries: JournalRecord[] = [
  {
    id: "j-1",
    title: "Finding stillness amidst a busy week",
    content:
      "Today I realized that even when my schedule is packed with deadlines, taking five deep breaths before each meeting completely transforms my anxiety. I want to keep practicing this micro-grounding habit.",
    date: "Sept 1, 2026",
    timeAgo: "2 hours ago",
    tags: ["Calm", "Grateful", "Motivated"],
    sentiment: "Calm",
    aiInsights:
      "MindEase noticed themes of proactive boundary setting and mindfulness coping mechanisms in this reflection.",
  },
  {
    id: "j-2",
    title: "Reflections on walking in nature",
    content:
      "The morning air was crisp and refreshing. Stepping away from screens allowed my thoughts to untangle naturally. Grateful for the quiet moments before the rush begins.",
    date: "Aug 30, 2026",
    timeAgo: "2 days ago",
    tags: ["Happy", "Grateful"],
    sentiment: "Positive",
    aiInsights:
      "Time in green spaces strongly correlates with your reported energy boosts across your weekly logs.",
  },
  {
    id: "j-3",
    title: "Navigating Wednesday's fatigue",
    content:
      "Wednesday felt unusually heavy. I struggled with focus and felt overwhelmed by pending tasks. Reminding myself that it is okay to rest and ask for support when needed.",
    date: "Aug 28, 2026",
    timeAgo: "4 days ago",
    tags: ["Tired", "Overwhelmed"],
    sentiment: "Reflective",
    aiInsights:
      "Acknowledging fatigue without self-criticism is a powerful emotional resilience milestone.",
  },
];

const defaultNotifications: NotificationItem[] = [
  {
    id: "n-1",
    title: "Daily Check-in Reminder",
    message: "Take 60 seconds to notice how your mind and body feel right now ♡",
    time: "10 mins ago",
    read: false,
  },
  {
    id: "n-2",
    title: "Weekly Mood Pattern Ready",
    message: "Your emotional trend report for this week is ready to view in Trends.",
    time: "3 hours ago",
    read: false,
  },
  {
    id: "n-3",
    title: "Mindfulness Suggestion",
    message: "Try a 3-minute box breathing session to ease your midday transition.",
    time: "Yesterday",
    read: true,
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userName] = useState("Alex");
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(defaultCheckIns);
  const [journalEntries, setJournalEntries] = useState<JournalRecord[]>(defaultJournalEntries);
  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications);
  const [timeframe, setTimeframe] = useState<"7" | "14" | "30">("7");

  const addCheckIn = (data: Omit<CheckInRecord, "id" | "date" | "dayName">) => {
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const newRecord: CheckInRecord = {
      ...data,
      id: `ci-${Date.now()}`,
      date: today.toISOString().split("T")[0],
      dayName: days[today.getDay()],
    };
    setCheckIns((prev) => [...prev.slice(1), newRecord]);
  };

  const addJournalEntry = (data: { title: string; content: string; tags: string[] }) => {
    const id = `j-${Date.now()}`;
    const newEntry: JournalRecord = {
      id,
      title: data.title || "Daily Reflection",
      content: data.content,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timeAgo: "Just now",
      tags: data.tags.length > 0 ? data.tags : ["Calm"],
      sentiment: data.tags.includes("Overwhelmed") || data.tags.includes("Anxious") ? "Reflective" : "Calm",
      aiInsights: "MindEase identified gentle self-compassion and thoughtful reflection in your new entry.",
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
    return id;
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Compute stats
  const avgMood = 7.2;
  const avgStress = 5.0;
  const avgEnergy = 7.0;
  const streakDays = 7;
  const moodDelta = 0.8;
  const stressDelta = -0.2;
  const energyDelta = 1.1;

  return (
    <AppContext.Provider
      value={{
        userName,
        checkIns,
        journalEntries,
        notifications,
        timeframe,
        setTimeframe,
        addCheckIn,
        addJournalEntry,
        deleteJournalEntry,
        markNotificationRead,
        stats: {
          avgMood,
          avgStress,
          avgEnergy,
          streakDays,
          moodDelta,
          stressDelta,
          energyDelta,
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
