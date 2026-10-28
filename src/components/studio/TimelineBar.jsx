"use client";

import React from "react";
import { BACKGROUND_MEDIA } from "@/lib/constants";
import { Plus, Clock } from "lucide-react";

export function TimelineBar({
  scenes,
  currentSceneIndex,
  setCurrentSceneIndex,
  onAddScene,
}) {
  const totalSeconds = scenes.reduce((acc, s) => acc + (s.durationSeconds || 5), 0);

  return (
    <div className="h-28 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl px-4 py-3 flex flex-col justify-between z-20">
      {/* Timeline Header Info */}
      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-yellow-400" />
          <span>Timeline Overview</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-200">{scenes.length} Scenes</span>
        </div>
        <div>
          Total Runtime: <span className="text-yellow-400 font-bold">{totalSeconds}s</span>
        </div>
      </div>

      {/* Multi-scene horizontal track */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {scenes.map((scene, idx) => {
          const isSelected = currentSceneIndex === idx;
          const media =
            BACKGROUND_MEDIA.find((m) => m.id === scene.visualId) ||
            BACKGROUND_MEDIA[0];
          // Width based on relative duration
          const flexGrow = scene.durationSeconds || 5;

          return (
            <button
              key={scene.id || idx}
              onClick={() => setCurrentSceneIndex(idx)}
              style={{ flex: `${flexGrow} 0 auto`, minWidth: "120px" }}
              className={`h-14 rounded-xl border relative overflow-hidden transition-all text-left p-2 flex flex-col justify-between group ${
                isSelected
                  ? "border-yellow-400 ring-2 ring-yellow-400/30 shadow-lg shadow-yellow-400/10"
                  : "border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100"
              }`}
            >
              {/* Background poster & tint */}
              <img
                src={media.poster}
                alt={scene.badge}
                className="absolute inset-0 w-full h-full object-cover -z-10 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] -z-10" />

              {/* Badge & Duration */}
              <div className="flex items-center justify-between z-10 w-full">
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-black/80 text-yellow-400 border border-yellow-400/30 truncate max-w-[80px]">
                  {scene.badge || `Scene ${idx + 1}`}
                </span>
                <span className="text-[9px] font-mono text-zinc-300 bg-black/60 px-1 rounded">
                  {scene.durationSeconds || 5}s
                </span>
              </div>

              {/* Mini caption preview */}
              <p className="text-[9px] text-zinc-200 line-clamp-1 truncate z-10 font-medium">
                {scene.narration}
              </p>
            </button>
          );
        })}

        {/* Add Scene button at the end */}
        <button
          onClick={onAddScene}
          className="h-14 px-4 rounded-xl border border-dashed border-zinc-800 hover:border-yellow-400/60 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-yellow-400 flex items-center justify-center gap-1.5 text-xs font-semibold flex-shrink-0 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Scene</span>
        </button>
      </div>
    </div>
  );
}
