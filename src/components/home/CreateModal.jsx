"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Link2,
  Music,
  Repeat,
  Wand2,
  Clock,
  ArrowRight,
} from "lucide-react";

export function CreateModal({ isOpen, onClose, initialData, onGenerate }) {
  const [mode, setMode] = useState("idea"); // 'idea' | 'link' | 'music' | 'repurpose'
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.mode) setMode(initialData.mode);
      if (initialData.prompt) setPrompt(initialData.prompt);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const finalPrompt = mode === "link" ? `Summary and viral breakdown of: ${url}` : prompt;
    await onGenerate(finalPrompt || "3 viral psychological tricks", duration);
    setIsLoading(false);
    onClose();
  };

  const quickIdeas = [
    "How to build a 6-figure SaaS with Next.js & Supabase",
    "3 dark psychology tricks that feel almost illegal",
    "Why high performers never complain about anything",
    "Top AI tools that will replace entire agencies",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 flex flex-col text-zinc-900 font-sans">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950">Create with Revid.ai</h3>
              <p className="text-xs text-zinc-500">Pick how you want to start your video</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-zinc-100 p-2 gap-1.5 bg-zinc-50/70">
          <button
            onClick={() => setMode("idea")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === "idea"
                ? "bg-white text-zinc-950 shadow-2xs border border-zinc-200"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>From idea</span>
          </button>

          <button
            onClick={() => setMode("link")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === "link"
                ? "bg-white text-zinc-950 shadow-2xs border border-zinc-200"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-sky-500" />
            <span>From link</span>
          </button>

          <button
            onClick={() => setMode("music")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === "music"
                ? "bg-white text-zinc-950 shadow-2xs border border-zinc-200"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Music className="w-3.5 h-3.5 text-purple-500" />
            <span>From music</span>
          </button>

          <button
            onClick={() => setMode("repurpose")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === "repurpose"
                ? "bg-white text-zinc-950 shadow-2xs border border-zinc-200"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Repeat className="w-3.5 h-3.5 text-emerald-500" />
            <span>Repurpose</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {mode === "link" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">
                Paste YouTube, TikTok, or Article Link
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                <span>Describe what you want to create</span>
                <span className="text-[11px] text-zinc-400">AI will build script & visuals</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 3 psychological tricks that feel almost illegal to know..."
                rows={3}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />

              {/* Suggestions */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                  Viral prompts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickIdeas.map((item, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setPrompt(item)}
                      className="text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-xl transition text-left"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Target Length */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Duration</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 45].map((sec) => (
                <button
                  type="button"
                  key={sec}
                  onClick={() => setDuration(sec)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    duration === sec
                      ? "bg-zinc-950 text-white border-zinc-950"
                      : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {sec}s {sec === 15 ? "⚡ Bite" : sec === 30 ? "🔥 Reel" : "📖 Deep"}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
                <span>Generating Video with Revid AI...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-emerald-400" />
                <span>Generate Video</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
