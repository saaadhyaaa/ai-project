"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fff7f9] text-[#271624] flex relative selection:bg-[#d98fa3] selection:text-[#5e283a]">
      {/* Ambient background decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#fee0f5]/40 organic-blob -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-[#dcc9fd]/30 organic-blob-2 translate-y-1/4 blur-3xl" />
        <div className="absolute top-1/2 left-0 w-[350px] h-[350px] bg-[#ffd7ef]/30 organic-blob -translate-x-1/3 blur-3xl" />
      </div>

      {/* Persistent Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 relative z-10">
        <TopHeader
          onOpenMobile={() => setMobileOpen(true)}
          title={title}
          subtitle={subtitle}
        />
        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
