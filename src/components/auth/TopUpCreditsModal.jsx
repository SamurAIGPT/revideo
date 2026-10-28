"use client";

import React from "react";
import { X, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function TopUpCreditsModal({ isOpen, onClose }) {
  const { credits } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 sm:p-8 space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close credits dialog"
          className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio credits</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950">
            Credit balance
          </h2>
          <p className="text-sm text-zinc-600">
            You have <strong className="text-emerald-700">{credits.toLocaleString()} credits</strong>.
          </p>
        </div>

        <p className="text-sm leading-relaxed text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
          Credit purchases are not available yet. This build has no payment checkout, so credits cannot be added here.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm rounded-2xl transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
