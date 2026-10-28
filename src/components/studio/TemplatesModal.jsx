"use client";

import React from "react";
import { X, Sparkles, Clock, Check } from "lucide-react";
import { VIRAL_TEMPLATES, BACKGROUND_MEDIA } from "@/lib/constants";

export function TemplatesModal({ isOpen, onClose, onLoadTemplate }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Viral Short Video Templates</h3>
              <p className="text-xs text-zinc-400">
                Pre-configured high-retention frameworks inspired by top creators.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates List */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {VIRAL_TEMPLATES.map((tpl) => {
            const firstSceneMedia =
              BACKGROUND_MEDIA.find((m) => m.id === tpl.scenes[0]?.visualId) ||
              BACKGROUND_MEDIA[0];

            return (
              <div
                key={tpl.id}
                className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-yellow-400/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-24 rounded-xl overflow-hidden relative flex-shrink-0 border border-zinc-700">
                    <img
                      src={firstSceneMedia.poster}
                      alt={tpl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 text-yellow-400 px-1 rounded">
                      {tpl.duration}s
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                        {tpl.aspectRatio} Reel
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {tpl.scenes.length} Scenes
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-yellow-400 transition">
                      {tpl.title}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-1">
                      "{tpl.scenes[0]?.narration}"
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLoadTemplate(tpl);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center gap-1.5 shadow-md shadow-yellow-400/20 transition flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Use Template</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
