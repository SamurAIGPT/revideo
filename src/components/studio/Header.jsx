"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Smartphone,
  Tv,
  Square,
  Download,
  FolderOpen,
  PlusCircle,
  Database,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Header({
  projectTitle,
  setProjectTitle,
  aspectRatio,
  setAspectRatio,
  onOpenTemplates,
  onNewProject,
  onOpenExport,
  onBackToHome,
  isSaving,
  isSupabaseConnected,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { credits, setIsTopUpOpen, isAuthenticated, setIsLoginModalOpen } = useAuth();


  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
          >
            <span>← Home</span>
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-yellow-200 flex items-center justify-center shadow-lg shadow-yellow-500/20 text-black font-black text-lg">
            R
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">Revid.ai</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                Studio
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">Viral Short-Form Engine</span>
          </div>
        </div>

        <div className="h-5 w-px bg-zinc-800 hidden md:block" />

        {/* Editable Title */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              autoFocus
              className="bg-zinc-900 border border-yellow-400/50 rounded-lg px-2.5 py-1 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-zinc-200 hover:text-white transition flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-zinc-900 max-w-[200px] sm:max-w-xs truncate"
              title="Click to rename project"
            >
              <span className="truncate">{projectTitle}</span>
              <span className="text-[10px] text-zinc-400 font-normal">✎</span>
            </button>
          )}

          {/* Sync indicator */}
          <div
            className={`hidden lg:flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
              isSupabaseConnected
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                : "bg-amber-950/40 text-amber-400 border-amber-500/30"
            }`}
          >
            <Database className="w-3 h-3" />
            <span>{isSupabaseConnected ? "Supabase Synced" : "Local Draft"}</span>
          </div>
        </div>
      </div>

      {/* Middle Aspect Ratio Switcher */}
      <div className="hidden md:flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
        <button
          onClick={() => setAspectRatio("9:16")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            aspectRatio === "9:16"
              ? "bg-yellow-400 text-black shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
          title="9:16 Vertical (TikTok, Reels, Shorts)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>9:16</span>
        </button>

        <button
          onClick={() => setAspectRatio("16:9")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            aspectRatio === "16:9"
              ? "bg-yellow-400 text-black shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
          title="16:9 Landscape (YouTube)"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>16:9</span>
        </button>

        <button
          onClick={() => setAspectRatio("1:1")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            aspectRatio === "1:1"
              ? "bg-yellow-400 text-black shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
          title="1:1 Square (Instagram Feed / LinkedIn)"
        >
          <Square className="w-3.5 h-3.5" />
          <span>1:1</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Templates</span>
        </button>

        <button
          onClick={onNewProject}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition flex items-center gap-1.5"
          title="Create New Video"
        >
          <PlusCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">New</span>
        </button>

        <button
          onClick={() => (isAuthenticated ? setIsTopUpOpen(true) : setIsLoginModalOpen(true))}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 transition shadow-xs cursor-pointer"
          title="Your AI Credits - Click to top up"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{credits.toLocaleString()} credits</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black shadow-lg shadow-yellow-400/20 transition transform active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
