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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userName] = useState("Alex");
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [timeframe, setTimeframe] = useState<"7" | "14" | "30">("7");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCheckIns = localStorage.getItem("mindease_checkins");
      if (savedCheckIns) setCheckIns(JSON.parse(savedCheckIns));

      const savedJournals = localStorage.getItem("mindease_journals");
      if (savedJournals) setJournalEntries(JSON.parse(savedJournals));

      const savedNotifs = localStorage.getItem("mindease_notifications");
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
    } catch {
      // ignore JSON parse or storage errors
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("mindease_checkins", JSON.stringify(checkIns));
    } catch {}
  }, [checkIns, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("mindease_journals", JSON.stringify(journalEntries));
    } catch {}
  }, [journalEntries, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("mindease_notifications", JSON.stringify(notifications));
    } catch {}
  }, [notifications, isHydrated]);

  const addCheckIn = (data: Omit<CheckInRecord, "id" | "date" | "dayName">) => {
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const newRecord: CheckInRecord = {
      ...data,
      id: `ci-${Date.now()}`,
      date: today.toISOString().split("T")[0],
      dayName: days[today.getDay()],
    };
    setCheckIns((prev) => [...prev, newRecord]);
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

  // Compute dynamic stats from actual user check-ins
  const count = checkIns.length;
  const avgMood = count > 0 ? Number((checkIns.reduce((acc, c) => acc + c.mood * 2, 0) / count).toFixed(1)) : 0;
  const avgStress = count > 0 ? Number((checkIns.reduce((acc, c) => acc + c.stress, 0) / count).toFixed(1)) : 0;
  const avgEnergy = count > 0 ? Number((checkIns.reduce((acc, c) => acc + c.energy, 0) / count).toFixed(1)) : 0;
  const streakDays = count;
  const moodDelta = count > 1 ? Number((checkIns[count - 1].mood * 2 - checkIns[0].mood * 2).toFixed(1)) : 0;
  const stressDelta = count > 1 ? Number((checkIns[count - 1].stress - checkIns[0].stress).toFixed(1)) : 0;
  const energyDelta = count > 1 ? Number((checkIns[count - 1].energy - checkIns[0].energy).toFixed(1)) : 0;

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
