"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Edit3,
  Sparkles,
  Search,
  Tag,
  Trash2,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const availableEmotionTags = [
  "Calm",
  "Happy",
  "Grateful",
  "Motivated",
  "Tired",
  "Overwhelmed",
  "Sad",
  "Anxious",
  "Frustrated",
  "Hopeful",
];

export default function JournalPage() {
  const router = useRouter();
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useApp();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Calm", "Grateful"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addJournalEntry({
      title: title.trim() || "Daily Reflection",
      content,
      tags: selectedTags,
    });

    setTitle("");
    setContent("");
    setSelectedTags(["Calm"]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const filteredEntries = journalEntries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "All" || entry.tags.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <AppLayout
      title="MindEase Journal"
      subtitle="A safe, reflective space to write without judgment"
    >
      <div className="flex flex-col gap-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#8a4b5e]">
            What's on your mind today? <span className="text-[#c198b2]">♡</span>
          </h1>
          <p className="text-sm sm:text-base text-[#514346] max-w-2xl leading-relaxed font-sans">
            Take a moment to pause. Write down your thoughts, feelings, or describe
            your day. This is your safe space to reflect without judgment.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-[#dcc9fd] text-[#61527e] font-semibold text-sm flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Your reflection has been saved safely!</span>
            </div>
            <Link
              href="/reflection"
              className="text-xs underline hover:text-[#21133c]"
            >
              Analyze with AI Reflection →
            </Link>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Editor (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {/* Text Writing Canvas */}
              <div className="bg-white rounded-[28px] p-6 sm:p-8 soft-glow border border-[#f8daef]/60 flex flex-col min-h-[460px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[#76546b]">
                    <Edit3 className="w-5 h-5" />
                    <h2 className="font-serif text-xl font-bold text-[#271624]">
                      Today's Reflection
                    </h2>
                  </div>
                  <span className="text-xs text-[#847376] font-mono">
                    {content.length} / 2000
                  </span>
                </div>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your reflection a title (optional)..."
                  className="w-full font-serif text-lg font-bold text-[#271624] placeholder:text-[#847376]/70 border-b border-[#ffe7f7] pb-3 mb-4 focus:outline-none focus:border-[#8a4b5e] bg-transparent"
                />

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                  required
                  rows={10}
                  placeholder="Write whatever feels important to you today... How was your day? What brought you joy or tension? What are you grateful for?"
                  className="flex-1 w-full bg-transparent border-none resize-none focus:outline-none text-base text-[#271624] placeholder:text-[#847376]/60 leading-relaxed font-sans"
                />

                <div className="mt-4 pt-4 border-t border-[#ffe7f7] flex justify-between items-center text-xs text-[#847376]">
                  <span className="italic">Encrypted & private to you</span>
                  <span className="font-medium">Markdown supported</span>
                </div>
              </div>

              {/* Emotion Tags Selector */}
              <div className="bg-white rounded-[28px] p-6 soft-glow border border-[#f8daef]/60">
                <h3 className="font-sans text-xs font-bold text-[#514346] uppercase tracking-wider mb-3">
                  How are you feeling right now?
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableEmotionTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 ${
                          isSelected
                            ? "bg-[#8a4b5e] text-white shadow-xs"
                            : "bg-[#ffeff8] text-[#514346] hover:bg-[#fee0f5] border border-[#d6c1c5]/40"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#c198b2] italic hidden sm:inline">
                  ♡ Take as much time as you need.
                </span>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setTitle("");
                      setContent("");
                    }}
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-full text-sm font-semibold text-[#514346] hover:bg-[#fee0f5] transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={!content.trim()}
                    className="flex-1 sm:flex-initial px-8 py-3 rounded-full bg-[#8a4b5e] text-white text-sm font-semibold hover:bg-[#733e4e] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Save Reflection</span>
                    <span className="text-[#ffd9e1] leading-none">✦</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Search & Timeline Feed (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* AI Deepen Reflection Prompt Banner */}
            <div className="bg-[#ebddff] rounded-[28px] p-6 flex flex-col gap-3 relative overflow-hidden border border-[#d1bef1] hover:-translate-y-0.5 transition-transform">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#d1bef1] rounded-full opacity-60 blur-xl" />
              <div className="relative z-10">
                <h4 className="font-serif text-lg font-bold text-[#21133c] flex items-center gap-2">
                  <span>Want to reflect a little deeper?</span>
                  <span className="text-[#76546b]">✦</span>
                </h4>
                <p className="text-xs text-[#4e3f6a] mt-1 leading-relaxed">
                  Our AI companion can gently guide you through thoughtful prompts based on your recent entries.
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-[#4e3f6a]/70">
                    For self-reflection, not clinical diagnosis
                  </span>
                  <Link
                    href="/reflection"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#665783] hover:underline"
                  >
                    <span>Open AI Insights</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Search & Tag Filter Bar */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#847376] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your reflections..."
                  className="w-full bg-white border border-[#d6c1c5]/50 rounded-full py-2.5 pl-11 pr-4 text-xs text-[#271624] focus:outline-none focus:border-[#8a4b5e] soft-glow"
                />
              </div>

              {/* Tag filters scroll */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {["All", "Calm", "Grateful", "Happy", "Tired", "Overwhelmed"].map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        activeFilter === f
                          ? "bg-[#dcc9fd] text-[#61527e]"
                          : "bg-white text-[#514346] border border-[#d6c1c5]/40 hover:bg-[#fee0f5]"
                      }`}
                    >
                      {f}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Past Reflections List */}
            <div className="flex flex-col gap-3">
              <h3 className="font-serif text-lg font-bold text-[#271624]">
                Past Reflections ({filteredEntries.length})
              </h3>

              {filteredEntries.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-xs text-[#514346] border border-[#f8daef]/60">
                  No matching reflections found.
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-2xl p-5 soft-glow border border-[#f8daef]/60 flex flex-col gap-2.5 hover:border-[#d98fa3]/40 transition-colors group"
                  >
                    <div className="flex items-center justify-between text-xs text-[#514346]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#8a4b5e]" />
                        <span className="font-bold text-[#8a4b5e]">
                          {entry.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#847376]">
                          {entry.timeAgo}
                        </span>
                        <button
                          onClick={() => deleteJournalEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-[#fee0f5] text-[#847376] hover:text-[#ba1a1a] transition-all cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-serif font-bold text-base text-[#271624]">
                      {entry.title}
                    </h4>

                    <p className="text-xs text-[#514346] leading-relaxed line-clamp-3">
                      {entry.content}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {entry.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 rounded-full bg-[#ffeff8] text-[10px] font-semibold text-[#76546b] border border-[#d6c1c5]/40"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
