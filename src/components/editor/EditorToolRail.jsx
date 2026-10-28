"use client";

import React from "react";
import {
  Sparkles,
  FileText,
  Type,
  Film,
  Shuffle,
  Music,
  Subtitles,
} from "lucide-react";
import { useVideoEditor } from "@/context/VideoEditorContext";

export function EditorToolRail() {
  const { activeTool, setActiveTool } = useVideoEditor();

  const tools = [
    { id: "ai", label: "AI", icon: Sparkles },
    { id: "script", label: "Script", icon: FileText },
    { id: "text", label: "Text", icon: Type },
    { id: "media", label: "Media", icon: Film },
    { id: "transitions", label: "Transitions", icon: Shuffle },
    { id: "audio", label: "Audio", icon: Music },
    { id: "captions", label: "Captions", icon: Subtitles },
  ];

  return (
    <aside className="w-16 flex-shrink-0 border-r border-zinc-200 bg-white flex flex-col items-center py-3 gap-1 z-30 select-none">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`w-12 h-13 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              isActive
                ? "bg-zinc-100 text-zinc-900 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            }`}
            title={tool.label}
          >
            <Icon
              className={`w-4 h-4 transition-transform ${
                tool.id === "ai"
                  ? "text-emerald-500 stroke-[2.2]"
                  : isActive
                  ? "stroke-[2.2] text-zinc-900"
                  : "stroke-[1.8] text-zinc-500"
              }`}
            />
            <span className={`text-[10px] tracking-tight ${tool.id === "ai" && !isActive ? "text-emerald-600 font-medium" : ""}`}>
              {tool.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
