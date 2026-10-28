"use client";

import React, { useState } from "react";
import { X, Copy, Check, Share2, Film, Info } from "lucide-react";

export function ExportModal({ isOpen, onClose, project }) {
  const [copiedCaption, setCopiedCaption] = useState(false);

  if (!isOpen) return null;

  const scenes = Array.isArray(project.scenes) ? project.scenes : [];
  const totalDuration = scenes.reduce((total, scene) => total + (Number(scene.durationSeconds) || 5), 0);
  const generatedCaption = `🔥 ${project.title}

${scenes.map((scene, index) => `${index + 1}. ${scene.narration || ""}`).join("\n\n")}

👇 What do you think about this? Drop your thoughts below!
Save this video for later & follow for daily insights 🚀

#viral #trending #reels #shorts #tiktok #fyp #contentcreator #motivation #mindset`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(generatedCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch {
      setCopiedCaption(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export video</h3>
              <p className="text-xs text-zinc-400">{project.title} · {scenes.length} scenes · {totalDuration}s</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export dialog"
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex gap-3">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">MP4 export is not implemented yet</h4>
              <p className="text-xs leading-relaxed text-zinc-300">
                You can preview this composition in the editor, but this build cannot render or download the edited video. No credits are charged here.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Social media copy</span>
              </label>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
              >
                {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCaption ? "Copied" : "Copy caption"}</span>
              </button>
            </div>
            <textarea
              readOnly
              value={generatedCaption}
              rows={8}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 font-mono focus:outline-none custom-scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
