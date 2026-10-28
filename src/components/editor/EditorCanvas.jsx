"use client";

import React, { useEffect, useState } from "react";
import { Player } from "@remotion/player";
import { RevidVideoComposition } from "@/components/video/RevidVideoComposition";
import { SafeZonesOverlay } from "./SafeZonesOverlay";
import { useVideoEditor } from "@/context/VideoEditorContext";
import { MessageSquare, Sparkles, Shield, Camera } from "lucide-react";

export function EditorCanvas() {
  const {
    scenes,
    captionStyle,
    musicTrack,
    musicVolume,
    aspectRatio,
    playerRef,
    setIsPlaying,
    setCurrentFrame,
    durationInFrames,
    fps,
    safeZonesEnabled,
    setSafeZonesEnabled,
    isCanvasSelected,
    setIsCanvasSelected,
    audioTrackData,
  } = useVideoEditor();

  const [isMounted, setIsMounted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Canvas aspect dimension calculation
  let compWidth = 1080;
  let compHeight = 1920;
  let containerClasses = "w-[280px] h-[498px] sm:w-[320px] sm:h-[568px] md:w-[340px] md:h-[604px]";

  if (aspectRatio === "16:9") {
    compWidth = 1920;
    compHeight = 1080;
    containerClasses = "w-[520px] h-[292px] sm:w-[600px] sm:h-[338px]";
  } else if (aspectRatio === "1:1") {
    compWidth = 1080;
    compHeight = 1080;
    containerClasses = "w-[360px] h-[360px] sm:w-[420px] sm:h-[420px]";
  }

  const hasScenes = scenes && scenes.length > 0;

  return (
    <div
      onClick={() => setIsCanvasSelected(true)}
      className="flex-1 relative bg-[#fafafa] flex flex-col items-center justify-center p-4 overflow-hidden select-none cursor-default"
    >
      {/* Top Right Safe Zones Toggle Button (Matching Screenshot: clean white pill) */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSafeZonesEnabled(!safeZonesEnabled);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border shadow-xs transition ${
            safeZonesEnabled
              ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20"
              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
          }`}
          title="Toggle TikTok/Reels Safe Zones Guide"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Safe zones</span>
        </button>
      </div>

      {/* Main Video Canvas Frame (Matching Revid AI Screenshot 1 & 2 with green selection border and handles) */}
      <div
        className={`relative ${containerClasses} bg-black shadow-sm overflow-visible flex items-center justify-center transition-all duration-300 ${
          isCanvasSelected ? "ring-2 ring-emerald-500" : "border border-zinc-200"
        }`}
      >
        {/* Revid Selection Handles (Exact match to Screenshots 1 & 2: 8 green anchor points) */}
        {isCanvasSelected && (
          <>
            {/* Top-Left */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 z-50 cursor-nwse-resize shadow-xs" />
            {/* Top-Center */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 z-50 cursor-ns-resize shadow-xs" />
            {/* Top-Right */}
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 z-50 cursor-nesw-resize shadow-xs" />
            {/* Middle-Left */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 z-50 cursor-ew-resize shadow-xs" />
            {/* Middle-Right */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 z-50 cursor-ew-resize shadow-xs" />
            {/* Bottom-Left */}
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 z-50 cursor-nesw-resize shadow-xs" />
            {/* Bottom-Center */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 z-50 cursor-ns-resize shadow-xs" />
            {/* Bottom-Right */}
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 z-50 cursor-nwse-resize shadow-xs" />
          </>
        )}

        {/* Video Canvas Inner Frame */}
        <div className="w-full h-full relative overflow-hidden bg-black">
          {/* Watermark in top-left (Exact match to Screenshots 1 & 2: "📷 revid.ai") */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/30 backdrop-blur-xs text-white/90 text-[11px] font-semibold tracking-tight pointer-events-none select-none">
            <div className="w-3.5 h-3.5 rounded border border-white/60 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
            </div>
            <span>revid.ai</span>
          </div>

          {isMounted ? (
            <Player
              ref={playerRef}
              component={RevidVideoComposition}
              inputProps={{
                scenes,
                captionStyleId: captionStyle,
                musicTrackUrl:
                  audioTrackData?.url &&
                  (audioTrackData.url.startsWith("blob:") || audioTrackData.url.startsWith("http"))
                    ? audioTrackData.url
                    : "",
                musicVolume,
                aspectRatio,
              }}
              durationInFrames={durationInFrames}
              fps={fps}
              compositionWidth={compWidth}
              compositionHeight={compHeight}
              style={{
                width: "100%",
                height: "100%",
              }}
              controls={false}
              loop
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onFrameUpdate={(frame) => setCurrentFrame(frame)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Sparkles className="w-5 h-5 animate-spin text-zinc-400" />
              <span className="text-xs">Loading...</span>
            </div>
          )}

          {/* Safe Zones Overlay */}
          {safeZonesEnabled && <SafeZonesOverlay />}
        </div>
      </div>

      {/* Floating Chat / Support Bubble (Exact match: solid black circle with white chat icon) */}
      <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end gap-2">
        {isHelpOpen && (
          <div className="w-72 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 text-xs select-text animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
              <span className="font-bold text-zinc-900">Revid AI Assistant</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHelpOpen(false);
                }}
                className="text-zinc-400 hover:text-black font-bold p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-zinc-600 mb-2 leading-relaxed">
              Need help? You can upload your own clips in the Media tab, customize captions, or edit the audio waveform in Track 1.
            </p>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsHelpOpen(!isHelpOpen);
          }}
          className="w-10 h-10 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
          title="Help & Support"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
}
