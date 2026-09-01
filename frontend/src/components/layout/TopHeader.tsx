"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Menu, Bell, Calendar, Sparkles, Check } from "lucide-react";

interface TopHeaderProps {
  onOpenMobile?: () => void;
  title?: string;
  subtitle?: string;
}

export function TopHeader({ onOpenMobile, title, subtitle }: TopHeaderProps) {
  const { userName, notifications, markNotificationRead, stats } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 bg-[#fff7f9]/80 backdrop-blur-md border-b border-[#d6c1c5]/30 px-4 md:px-10 py-3 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Header info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 rounded-full hover:bg-[#fee0f5] text-[#271624] transition-colors"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title ? (
          <div>
            <h2 className="font-serif text-xl md:text-2xl font-bold text-[#8a4b5e] leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#514346] hidden sm:block">{subtitle}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 bg-[#dcc9fd] text-[#61527e] rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{stats.streakDays} Day Check-in Streak</span>
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 relative">
        {/* Date chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffeff8] border border-[#d6c1c5]/40 text-xs text-[#514346] font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#8a4b5e]" />
          <span>{todayFormatted}</span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-white border border-[#d6c1c5]/40 soft-glow flex items-center justify-center text-[#514346] hover:bg-[#fee0f5] hover:text-[#8a4b5e] transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#d6c1c5]/50 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#ffe7f7]">
                <h4 className="font-serif font-bold text-sm text-[#271624]">
                  Gentle Reminders
                </h4>
                <span className="text-xs text-[#8a4b5e] font-semibold">
                  {unreadCount} unread
                </span>
              </div>

              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                      n.read
                        ? "bg-[#fff7f9] border-[#ffe7f7] text-[#514346]"
                        : "bg-[#fee0f5]/60 border-[#d98fa3]/40 text-[#271624]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-[#847376]">{n.time}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-10 h-10 rounded-full bg-[#ffd9e1] border-2 border-white shadow-sm flex items-center justify-center text-[#8a4b5e] font-serif font-bold text-sm">
            {userName[0]}
          </div>
        </div>
      </div>
    </header>
  );
}
