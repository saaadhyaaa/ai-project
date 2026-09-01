"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  ShieldAlert,
  PhoneCall,
  MessageSquare,
  Heart,
  ExternalLink,
  Eye,
  Hand,
  Volume2,
  Smile,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function SupportPage() {
  const [groundingStep, setGroundingStep] = useState(0);

  const groundingSteps = [
    {
      count: "5",
      icon: Eye,
      title: "5 Things You Can See",
      desc: "Look around you. Notice five distinct objects, colors, or textures in your room.",
    },
    {
      count: "4",
      icon: Hand,
      title: "4 Things You Can Touch",
      desc: "Feel the surface beneath your feet, the fabric of your clothes, or a smooth desk.",
    },
    {
      count: "3",
      icon: Volume2,
      title: "3 Things You Can Hear",
      desc: "Listen closely. Can you hear the distant hum of traffic, gentle birds, or your breath?",
    },
    {
      count: "2",
      icon: Smile,
      title: "2 Things You Can Smell",
      desc: "Breathe in deeply. Notice any nearby scent, fresh air, or essential oils.",
    },
    {
      count: "1",
      icon: Heart,
      title: "1 Good Thing About Yourself",
      desc: "Remind yourself of your strength, your kindness, or simply that you are trying.",
    },
  ];

  return (
    <AppLayout
      title="Support & Crisis Safety"
      subtitle="Immediate 24/7 resources, grounding tools, and compassionate guidance"
    >
      <div className="flex flex-col gap-8 pb-12 max-w-4xl mx-auto">
        {/* Urgent Crisis Alert Banner */}
        <section className="bg-[#ffdad6] border-2 border-[#ba1a1a]/30 rounded-[28px] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#ba1a1a] text-white rounded-2xl shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#93000a]">
                Need immediate help? You are not alone.
              </h2>
              <p className="text-xs sm:text-sm text-[#514346] mt-1 leading-relaxed">
                If you or someone you know is in distress or having thoughts of self-harm,
                support is free, confidential, and available 24/7.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
            <a
              href="tel:988"
              className="px-6 py-3 rounded-full bg-[#ba1a1a] text-white font-semibold text-xs sm:text-sm hover:bg-[#93000a] transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 988</span>
            </a>
            <a
              href="sms:741741"
              className="px-6 py-3 rounded-full bg-white text-[#ba1a1a] border border-[#ba1a1a]/40 font-semibold text-xs sm:text-sm hover:bg-[#fff7f9] transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Text HOME to 741741</span>
            </a>
          </div>
        </section>

        {/* 5-4-3-2-1 Interactive Grounding Exercise */}
        <section className="bg-white rounded-[32px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#8a4b5e] uppercase tracking-wider">
                Emergency Grounding Tool
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#271624] mt-0.5">
                5-4-3-2-1 Sensory Reset
              </h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#ffeff8] text-[#8a4b5e]">
              Step {groundingStep + 1} of 5
            </span>
          </div>

          {/* Current Step Display */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#fff7f9] border border-[#d6c1c5]/40 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-[#dcc9fd] text-[#61527e] flex items-center justify-center text-2xl font-serif font-bold shrink-0">
              {groundingSteps[groundingStep].count}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-serif text-xl font-bold text-[#271624]">
                {groundingSteps[groundingStep].title}
              </h4>
              <p className="text-sm text-[#514346] mt-1 leading-relaxed">
                {groundingSteps[groundingStep].desc}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setGroundingStep((prev) => Math.max(0, prev - 1))}
              disabled={groundingStep === 0}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#514346] hover:bg-[#fee0f5] transition-colors disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>

            <button
              onClick={() =>
                setGroundingStep((prev) =>
                  prev < groundingSteps.length - 1 ? prev + 1 : 0
                )
              }
              className="px-6 py-2.5 rounded-full bg-[#8a4b5e] text-white text-xs font-semibold hover:bg-[#733e4e] transition-colors shadow-sm cursor-pointer"
            >
              {groundingStep === groundingSteps.length - 1
                ? "Restart Grounding"
                : "Next Step →"}
            </button>
          </div>
        </section>

        {/* Trusted Support Helplines Directory */}
        <section className="space-y-4">
          <h3 className="font-serif text-2xl font-bold text-[#8a4b5e]">
            Support Helplines & Resources
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl soft-glow border border-[#f8daef]/60 flex flex-col justify-between gap-3">
              <div>
                <h4 className="font-serif font-bold text-base text-[#271624]">
                  988 Suicide & Crisis Lifeline
                </h4>
                <p className="text-xs text-[#514346] mt-1 leading-relaxed">
                  Free and confidential support for people in suicidal crisis or emotional distress. Available 24 hours a day, 7 days a week.
                </p>
              </div>
              <a
                href="https://988lifeline.org"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#8a4b5e] inline-flex items-center gap-1 hover:underline"
              >
                <span>Visit 988lifeline.org</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="bg-white p-5 rounded-2xl soft-glow border border-[#f8daef]/60 flex flex-col justify-between gap-3">
              <div>
                <h4 className="font-serif font-bold text-base text-[#271624]">
                  The Trevor Project (LGBTQ+)
                </h4>
                <p className="text-xs text-[#514346] mt-1 leading-relaxed">
                  24/7 crisis intervention and suicide prevention services for lesbian, gay, bisexual, transgender, queer, and questioning young people.
                </p>
              </div>
              <a
                href="https://www.thetrevorproject.org"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#8a4b5e] inline-flex items-center gap-1 hover:underline"
              >
                <span>Visit thetrevorproject.org</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
