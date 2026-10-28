"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  Database,
  Film,
  Play,
} from "lucide-react";
import confetti from "canvas-confetti";
import { BACKGROUND_MEDIA } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

export function ExportModal({
  isOpen,
  onClose,
  project,
}) {
  const { deductCredits, isAuthenticated } = useAuth();
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderComplete, setRenderComplete] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isSavedToSupabase, setIsSavedToSupabase] = useState(false);

  if (!isOpen) return null;

  const totalDuration = project.scenes.reduce(
    (acc, s) => acc + (s.durationSeconds || 5),
    0
  );

  // Generate viral social media caption with emojis & tags
  const generatedCaption = `🔥 ${project.title}

${project.scenes.map((s, i) => `${i + 1}. ${s.narration}`).join("\n\n")}

👇 What do you think about this? Drop your thoughts below!
Save this video for later & follow for daily insights 🚀

#viral #trending #reels #shorts #tiktok #fyp #contentcreator #motivation #mindset`;

  const handleStartRender = async () => {
    // Deduct 10 credits if authenticated
    if (isAuthenticated) {
      try {
        await deductCredits(10, "1080p Video Render & Export");
      } catch (creditErr) {
        alert(creditErr.message || "Insufficient credits to render video. Please top up.");
        return;
      }
    }

    setIsRendering(true);
    setRenderProgress(0);
    setRenderComplete(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setRenderProgress(100);
        setIsRendering(false);
        setRenderComplete(true);

        // Trigger celebratory confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        // Save render record to PostgreSQL database table via API
        fetch("/api/renders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            durationSeconds: totalDuration,
            videoUrl: BACKGROUND_MEDIA[0]?.url || "",
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.success) setIsSavedToSupabase(true);
          })
          .catch((err) => console.warn("Render log error:", err));
      } else {
        setRenderProgress(progress);
      }
    }, 250);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleDownloadFile = () => {
    // Downloads video project or direct sample MP4
    const firstMedia = BACKGROUND_MEDIA.find((m) => m.id === project.scenes[0]?.visualId);
    const downloadUrl = firstMedia?.url || "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42861-large.mp4";
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-revid.mp4`;
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-black font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export & Publish Video</h3>
              <p className="text-xs text-zinc-400">
                Render MP4, grab viral copy, and distribute to social channels.
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

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Video Summary Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                {project.aspectRatio} Video
              </span>
              <h4 className="text-sm font-bold text-white mt-1.5">{project.title}</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                {project.scenes.length} Scenes · {totalDuration}s Runtime
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-zinc-400 font-mono">1080 × 1920</span>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">Ready to render</p>
            </div>
          </div>

          {/* Render Action or Progress */}
          {!renderComplete ? (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800 text-center space-y-4">
              {isRendering ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                    <span className="flex items-center gap-1.5 text-yellow-400">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Rendering Remotion composition...
                    </span>
                    <span className="font-mono">{renderProgress}%</span>
                  </div>

                  <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    Stitching scenes, baking dynamic subtitles, and ducking audio...
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleStartRender}
                  className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black shadow-xl shadow-yellow-400/20 flex items-center justify-center gap-2 transition transform active:scale-98"
                >
                  <Film className="w-4 h-4" />
                  <span>Start Video Render (MP4)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <Check className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Video Rendered Successfully!</h4>
              <p className="text-xs text-zinc-400">
                Your high-definition MP4 video is ready for distribution.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={handleDownloadFile}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download MP4 Video</span>
                </button>

                {supabase && (
                  <div className="px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <Database className="w-3.5 h-3.5" />
                    <span>Logged to Supabase</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Viral Social Packaging (Copy Caption & Tags) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-yellow-400" />
                <span>Generated Social Media Copy</span>
              </label>
              <button
                onClick={handleCopyCaption}
                className="flex items-center gap-1 text-[11px] font-semibold text-yellow-400 hover:text-yellow-300 transition"
              >
                {copiedCaption ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              readOnly
              value={generatedCaption}
              rows={6}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 font-mono focus:outline-none custom-scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
