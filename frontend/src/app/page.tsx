"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Heart,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Server,
  Database,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { checkBackendHealth, HealthResponse, API_BASE_URL } from "@/lib/api";

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkBackendHealth();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err?.message || "Failed to reach backend");
      setHealth(null);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white flex flex-col">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-teal-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 -left-20 w-[450px] h-[450px] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Heart className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              AuraWell
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-950 text-teal-400 border border-teal-800/60 font-medium">
              Foundation v0.1
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-slate-400 hover:text-teal-400 transition-colors"
            >
              <span>API Swagger Docs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.status === "healthy"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <span className="text-slate-300">
                {health?.status === "healthy" ? "API Live" : "API Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto px-6 py-12 flex flex-col gap-12">
        <section className="text-center max-w-3xl mx-auto pt-6 pb-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/70 border border-teal-800/60 text-teal-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Emotional Well-Being Assistant</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Mindful insight for your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-cyan-400 to-indigo-400">
              emotional journey
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
            A comprehensive mental wellness companion providing daily mood check-ins, reflective journaling, AI-assisted emotional analysis, trend tracking, and safety-aware guidance.
          </p>
        </section>

        {/* System Health Status Panel */}
        <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-950/80 border border-teal-800/60 text-teal-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  System Architecture & Health Status
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time connectivity between Next.js frontend and FastAPI backend
                </p>
              </div>
            </div>

            <button
              onClick={fetchHealth}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
            {/* Frontend Status */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Server className="w-4 h-4 text-teal-400" />
                  Frontend (Next.js)
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Operational
                </span>
              </div>
              <p className="text-xs text-slate-400">App Router, TypeScript, Tailwind CSS</p>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Port: 3000 • Env: {process.env.NODE_ENV}
              </div>
            </div>

            {/* Backend API Status */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Backend (FastAPI)
                </span>
                {health?.status === "healthy" ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Healthy
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {loading ? "Checking..." : "Offline / Unreachable"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {health ? `Env: ${health.environment}` : `Target: ${API_BASE_URL}`}
              </p>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Endpoint: <code className="text-teal-400">/health</code>
              </div>
            </div>

            {/* Database Status */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Database className="w-4 h-4 text-indigo-400" />
                  PostgreSQL 16
                </span>
                {health?.database?.status === "connected" ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    {health?.database?.status || "Ready in Docker"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                SQLAlchemy Async + Alembic
              </p>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Docker Compose / Local Port: 5432
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Backend is currently offline or unreachable at <code className="text-amber-200">{API_BASE_URL}</code>. Run <code className="text-amber-200">uvicorn app.main:app --reload</code> in the backend directory.
              </span>
            </div>
          )}

          {lastChecked && (
            <div className="mt-4 text-right text-[11px] text-slate-500">
              Last status ping: {lastChecked}
            </div>
          )}
        </section>

        {/* Feature Pillars Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-teal-500/40 transition-colors flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/60 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Daily Check-Ins</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quick, intuitive mood scoring, emotional spectrum logging, and factor attribution.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/40 transition-colors flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Mindful Journaling</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Expressive writing space with Gemini AI-powered sentiment & emotion extraction.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 transition-colors flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Longitudinal Trends</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visual mood trajectories, cyclical pattern detection, and positive trigger analysis.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-rose-500/40 transition-colors flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Safety-Aware System</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ethical AI guardrails, crisis detection triggers, and rapid-access support hotlines.
            </p>
          </div>
        </section>

        {/* Tech Stack Summary */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-300">Stack Ready:</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200">Next.js App Router</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200">TypeScript</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200">FastAPI</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200">PostgreSQL</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200">Docker Compose</span>
          </div>
          <span className="text-slate-500">AuraWell Foundation Build</span>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI-Powered Emotional Well-Being Monitoring Assistant</span>
          <span>Designed with safety, privacy, and empathy</span>
        </div>
      </footer>
    </div>
  );
}
