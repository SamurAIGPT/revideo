"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Cloud,
  Check,
  Undo2,
  Redo2,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Smartphone,
  Tv,
  Square,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useVideoEditor } from "@/context/VideoEditorContext";
import { useAuth } from "@/context/AuthContext";

export function EditorHeader() {
  const {
    projectTitle,
    setProjectTitle,
    aspectRatio,
    setAspectRatio,
    saveStatus,
    undo,
    redo,
    canUndo,
    canRedo,
    setIsExportOpen,
    setIsShareOpen,
  } = useVideoEditor();

  const { credits, setIsTopUpOpen, user, isAuthenticated, setIsLoginModalOpen } = useAuth();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectTitle);
  const [isAspectMenuOpen, setIsAspectMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      setProjectTitle(tempTitle.trim());
    } else {
      setTempTitle(projectTitle);
    }
    setIsEditingTitle(false);
  };

  const aspectOptions = [
    { id: "9:16", label: "9:16", sub: "TikTok / Reels / Shorts", icon: Smartphone },
    { id: "16:9", label: "16:9", sub: "YouTube / Landscape", icon: Tv },
    { id: "1:1", label: "1:1", sub: "Square / Instagram", icon: Square },
  ];

  const currentAspect = aspectOptions.find((a) => a.id === aspectRatio) || aspectOptions[0];
  const CurrentAspectIcon = currentAspect.icon;

  return (
    <header className="h-14 border-b border-zinc-200 bg-white px-4 flex items-center justify-between z-40 select-none">
      {/* Left Section: Logo, Back, Title, Saved Status */}
      <div className="flex items-center gap-3">
        {/* Brand Logo & Back to Home (Matches Revid green logo + back arrow) */}
        <Link
          href="/"
          className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition"
          title="Back to Dashboard"
        >
          {/* Emerald green camera shutter / eye logo */}
          <div className="w-7 h-7 rounded-lg border border-emerald-500/40 bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold shadow-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="3.5" />
              <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" />
            </svg>
          </div>
          <ChevronLeft className="w-4 h-4 text-zinc-400 hover:text-zinc-800" />
        </Link>

        {/* Project Title (Inline Editable) */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTempTitle(projectTitle);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="px-2 py-0.5 text-sm font-semibold text-zinc-900 bg-zinc-50 border border-emerald-500 rounded-md focus:outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setTempTitle(projectTitle);
                setIsEditingTitle(true);
              }}
              className="text-sm font-semibold text-zinc-900 hover:text-emerald-600 transition flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-zinc-100 max-w-[200px] sm:max-w-xs truncate"
              title="Click to rename"
            >
              <span className="truncate">{projectTitle}</span>
            </button>
          )}

          {/* Cloud Saved Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 pl-1 font-medium">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span className="text-[11px] text-zinc-400">Saving...</span>
              </>
            ) : (
              <>
                <div className="relative flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-zinc-400" />
                  <Check className="w-2.5 h-2.5 absolute text-emerald-600 stroke-[3]" />
                </div>
                <span className="text-[11px] text-zinc-500">Saved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Section: Undo/Redo, Feedback, Aspect Ratio, Upgrade, Export, User */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-md hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-600 transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-md hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-600 transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={() => setIsShareOpen(true)}
          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-black transition"
          title="Share Project"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* Feedback thumbs up/down */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setFeedback(feedback === "like" ? null : "like")}
            className={`p-1.5 rounded-md transition ${
              feedback === "like"
                ? "bg-emerald-50 text-emerald-600"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
            title="Good experience"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFeedback(feedback === "dislike" ? null : "dislike")}
            className={`p-1.5 rounded-md transition ${
              feedback === "dislike"
                ? "bg-red-50 text-red-600"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
            title="Report issue"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aspect Ratio Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsAspectMenuOpen(!isAspectMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 shadow-xs transition"
          >
            <CurrentAspectIcon className="w-3.5 h-3.5 text-zinc-600" />
            <span>{currentAspect.label}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isAspectMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl p-1 z-50">
              {aspectOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = opt.id === aspectRatio;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setAspectRatio(opt.id);
                      setIsAspectMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-600 font-bold"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-[10px] text-zinc-400">{opt.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Upgrade Pill Button */}
        <button
          onClick={() => setIsTopUpOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 transition"
        >
          <span>Upgrade</span>
        </button>

        {/* Export / Publish ↗ Button (Exact match: solid black pill button) */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-black hover:bg-zinc-800 text-white shadow-xs transition-all active:scale-95"
        >
          <span>Export / Publish</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        {/* User Avatar Circle */}
        {isAuthenticated && user?.image ? (
          <img
            src={user.image}
            alt="Profile"
            className="w-7 h-7 rounded-full border border-zinc-200 object-cover cursor-pointer hover:opacity-90 transition"
          />
        ) : (
          <div
            onClick={() => {
              if (!isAuthenticated) setIsLoginModalOpen(true);
            }}
            className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-xs cursor-pointer hover:opacity-90 transition"
            title={isAuthenticated ? user?.name || "Account" : "Sign in"}
          >
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
        )}
      </div>
    </header>
  );
}
