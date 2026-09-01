"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Sparkles, X } from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
      active: pathname === "/dashboard" || pathname === "/",
    },
    {
      name: "Journal",
      href: "/journal",
      icon: "edit_note",
      active: pathname === "/journal",
    },
    {
      name: "Check-in",
      href: "/checkin",
      icon: "fact_check",
      active: pathname === "/checkin",
    },
    {
      name: "AI Reflection",
      href: "/reflection",
      icon: "auto_awesome",
      active: pathname === "/reflection",
    },
    {
      name: "Trends",
      href: "/trends",
      icon: "trending_up",
      active: pathname === "/trends",
    },
    {
      name: "Safety & Support",
      href: "/support",
      icon: "shield_with_heart",
      active: pathname === "/support",
    },
  ];

  const handleQuickCheckin = () => {
    if (onCloseMobile) onCloseMobile();
    router.push("/checkin");
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#fff7f9] border-r border-[#d6c1c5]/30 shadow-[0px_10px_30px_rgba(73,53,69,0.05)] z-50 flex flex-col p-4 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & User Header */}
        <div className="px-3 py-4 mb-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8a4b5e] to-[#d98fa3] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
            </div>
            <div>
              <h1 className="font-serif text-[22px] font-bold text-[#8a4b5e] leading-none tracking-tight">
                MindEase
              </h1>
              <p className="text-xs text-[#514346] mt-1 font-sans">Wellness Companion</p>
            </div>
          </Link>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-full hover:bg-[#fee0f5] text-[#514346]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Quick Check-in Button */}
        <div className="px-1 mb-4">
          <button
            onClick={handleQuickCheckin}
            className="w-full bg-[#8a4b5e] text-white py-3 px-4 rounded-full font-sans text-sm font-semibold hover:bg-[#733e4e] transition-all duration-200 active:scale-95 shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Quick Check-in</span>
            <span className="text-base group-hover:rotate-12 transition-transform leading-none">
              ✦
            </span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
                link.active
                  ? "bg-[#dcc9fd] text-[#61527e] shadow-sm font-bold"
                  : "text-[#514346] hover:bg-[#fee0f5] hover:text-[#271624]"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{
                  fontVariationSettings: link.active ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {link.icon}
              </span>
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom User Area */}
        <div className="mt-auto pt-4 border-t border-[#d6c1c5]/40 flex flex-col gap-1">
          <Link
            href="/support"
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-4 py-2.5 text-xs text-[#514346] hover:bg-[#fee0f5] rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">favorite</span>
            <span>24/7 Crisis Support</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#ffeff8] rounded-2xl mt-1">
            <div className="w-8 h-8 rounded-full bg-[#c198b2] text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#271624] truncate">Alex Morgan</p>
              <p className="text-[11px] text-[#514346] truncate">alex@mindease.ai</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
