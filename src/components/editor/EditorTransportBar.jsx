"use client";

import React from "react";
import {
  Scissors,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Maximize,
  Expand,
} from "lucide-react";
import { useVideoEditor } from "@/context/VideoEditorContext";

export function EditorTransportBar() {
  const {
    isPlaying,
    togglePlay,
    currentFrame,
    durationInFrames,
    fps,
    zoomLevel,
    setZoomLevel,
    seekToSecond,
    splitSceneAtPlayhead,
    currentSceneIndex,
    seekToScene,
    scenes,
  } = useVideoEditor();

  // Helper to format frame into mm:ss.ms
  const formatTimecode = (frame) => {
    const totalSec = frame / fps;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const ms = Math.floor((totalSec % 1) * 100);

    const pad = (n, len = 2) => String(n).padStart(len, "0");
    return `${pad(mins)}:${pad(secs)}.${pad(ms)}`;
  };

  const currentTimecode = formatTimecode(currentFrame);
  const totalTimecode = formatTimecode(durationInFrames);

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      seekToScene(currentSceneIndex - 1);
    } else {
      seekToSecond(0);
    }
  };

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      seekToScene(currentSceneIndex + 1);
    } else {
      seekToSecond(durationInFrames / fps);
    }
  };

  return (
    <div className="h-10 border-t border-b border-zinc-200 bg-white px-4 flex items-center justify-between text-xs select-none z-20">
      {/* Left: Split Tool (Matching Screenshot) */}
      <div className="flex items-center gap-2">
        <button
          onClick={splitSceneAtPlayhead}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-zinc-600 hover:text-black hover:bg-zinc-50 transition active:scale-95"
          title="Split scene at current frame (S)"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>
      </div>

      {/* Center: Playback Controls & Timecode */}
      <div className="flex items-center gap-3">
        {/* Step back / Previous scene */}
        <button
          onClick={handlePrevScene}
          className="p-1 rounded text-zinc-500 hover:text-black hover:bg-zinc-100 transition"
          title="Previous scene"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* Play / Pause Toggle (Exact match: solid black circle with white play triangle) */}
        <button
          onClick={togglePlay}
          className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition"
          title="Play / Pause (Space)"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Step forward / Next scene */}
        <button
          onClick={handleNextScene}
          className="p-1 rounded text-zinc-500 hover:text-black hover:bg-zinc-100 transition"
          title="Next scene"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Timecode Readout (00:00.00 / 00:00.02) */}
        <div className="font-mono text-xs font-medium text-zinc-600 pl-2">
          <span className="text-zinc-800 font-semibold">{currentTimecode}</span>
          <span className="text-zinc-400 mx-1">/</span>
          <span className="text-zinc-500">{totalTimecode}</span>
        </div>
      </div>

      {/* Right: Fit-to-screen, Zoom Slider (135%), Fullscreen */}
      <div className="flex items-center gap-3">
        {/* Fit to screen */}
        <button
          onClick={() => setZoomLevel(100)}
          className="p-1 rounded text-zinc-500 hover:text-black hover:bg-zinc-100 transition"
          title="Fit to Screen"
        >
          <Expand className="w-3.5 h-3.5" />
        </button>

        {/* Zoom percentage & horizontal slider */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-zinc-600 w-9 text-right">
            {zoomLevel}%
          </span>
          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-20 sm:w-24 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-black"
          />
        </div>

        {/* Fullscreen view */}
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen?.();
            }
          }}
          className="p-1 rounded text-zinc-500 hover:text-black hover:bg-zinc-100 transition"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
