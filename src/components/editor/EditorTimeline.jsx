"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Volume2, VolumeX, Music, Subtitles } from "lucide-react";
import { useVideoEditor } from "@/context/VideoEditorContext";
import { BACKGROUND_MEDIA } from "@/lib/constants";

export function EditorTimeline() {
  const {
    scenes,
    currentSceneIndex,
    setCurrentSceneIndex,
    currentFrame,
    durationInFrames,
    fps,
    zoomLevel,
    seekToSecond,
    seekToScene,
    musicTrack,
    audioTrackData,
    setActiveTool,
    selectedTimelineTrack,
    setSelectedTimelineTrack,
  } = useVideoEditor();

  const timelineContainerRef = useRef(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Track visibility & mute states
  const [trackStates, setTrackStates] = useState({
    track3: { visible: true, muted: false }, // Captions / Text
    track2: { visible: true, muted: false }, // Video Scenes
    track1: { visible: true, muted: false }, // Background Audio
  });

  const toggleTrack = (trackId, key) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        [key]: !prev[trackId][key],
      },
    }));
  };

  // Base pixels per second scaled by zoom level (135% = 1.35 * 60px = 81px/sec)
  const pxPerSecond = (zoomLevel / 100) * 60;
  const totalSeconds = durationInFrames / fps;
  const totalTimelineWidth = Math.max(1200, totalSeconds * pxPerSecond + 400);

  // Playhead position in pixels
  const playheadSec = currentFrame / fps;
  const playheadPx = playheadSec * pxPerSecond;

  // Format playhead pill time (00:00.00)
  const formatBadgeTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(mins)}:${pad(s)}.${pad(ms)}`;
  };

  // Generate ruler tick marks (1s, 2s, 3s, ...)
  const maxRulerSeconds = Math.ceil(totalSeconds) + 20;
  const rulerTicks = [];
  for (let s = 1; s <= maxRulerSeconds; s++) {
    rulerTicks.push(s);
  }

  // Handle Scrubbing
  const handleScrub = useCallback(
    (e) => {
      if (!timelineContainerRef.current) return;
      const rect = timelineContainerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left + timelineContainerRef.current.scrollLeft;
      const targetSec = Math.max(0, Math.min(totalSeconds, clickX / pxPerSecond));
      seekToSecond(targetSec);
    },
    [totalSeconds, pxPerSecond, seekToSecond]
  );

  const handleMouseDownScrubber = (e) => {
    setIsScrubbing(true);
    handleScrub(e);
  };

  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e) => {
      handleScrub(e);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, handleScrub]);

  const hasScenes = scenes && scenes.length > 0;

  return (
    <div className="h-44 border-t border-zinc-200 bg-white flex select-none overflow-hidden z-20">
      {/* Left Column: Track Headers (Matching Screenshot: 3, 2, 1 with minimal Eye & Mute) */}
      <div className="w-16 sm:w-20 flex-shrink-0 border-r border-zinc-200 bg-white flex flex-col z-20">
        {/* Ruler Corner Spacer */}
        <div className="h-7 border-b border-zinc-200" />

        {/* Track 3 Header: Captions & Text */}
        <div
          onClick={() => {
            setSelectedTimelineTrack("track3");
            setActiveTool("captions");
          }}
          className={`h-11 border-b border-zinc-100 px-2 flex items-center justify-between text-xs cursor-pointer transition ${
            selectedTimelineTrack === "track3" ? "bg-zinc-50" : "hover:bg-zinc-50/50"
          }`}
        >
          <span className="font-mono text-xs font-semibold text-zinc-600">3</span>
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTrack("track3", "visible");
              }}
              className="p-1 hover:text-zinc-800"
              title="Toggle visibility"
            >
              {trackStates.track3.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-300" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTrack("track3", "muted");
              }}
              className="p-1 hover:text-zinc-800"
              title="Toggle mute"
            >
              {trackStates.track3.muted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Track 2 Header: Video & Scenes */}
        <div
          onClick={() => {
            setSelectedTimelineTrack("track2");
            setActiveTool("script");
          }}
          className={`h-12 border-b border-zinc-100 px-2 flex items-center justify-between text-xs cursor-pointer transition ${
            selectedTimelineTrack === "track2" ? "bg-zinc-50" : "hover:bg-zinc-50/50"
          }`}
        >
          <span className="font-mono text-xs font-semibold text-zinc-600">2</span>
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTrack("track2", "visible");
              }}
              className="p-1 hover:text-zinc-800"
              title="Toggle visibility"
            >
              {trackStates.track2.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-300" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTrack("track2", "muted");
              }}
              className="p-1 hover:text-zinc-800"
              title="Toggle mute"
            >
              {trackStates.track2.muted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Track 1 Header: Audio & Music */}
        <div
          onClick={() => {
            setSelectedTimelineTrack("track1");
            setActiveTool("audio");
          }}
          className={`h-10 px-2 flex items-center justify-between text-xs cursor-pointer transition ${
            selectedTimelineTrack === "track1" ? "bg-zinc-50" : "hover:bg-zinc-50/50"
          }`}
        >
          <span className="font-mono text-xs font-semibold text-zinc-600">1</span>
          <div className="flex items-center gap-1 text-zinc-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTrack("track1", "visible");
              }}
              className="p-1 hover:text-zinc-800"
              title="Toggle visibility"
            >
              {trackStates.track1.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-300" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTrack("track1", "muted");
              }}
              className="p-1 hover:text-zinc-800"
              title="Toggle mute"
            >
              {trackStates.track1.muted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Time Ruler & Track Lanes (Scrollable) */}
      <div
        ref={timelineContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-white"
      >
        <div style={{ width: `${totalTimelineWidth}px` }} className="relative h-full flex flex-col">
          {/* Time Ruler (Matching Screenshot) */}
          <div
            onMouseDown={handleMouseDownScrubber}
            className="h-7 border-b border-zinc-200 relative cursor-pointer flex items-center"
          >
            {rulerTicks.map((s) => {
              const xPos = s * pxPerSecond;
              return (
                <div key={s} style={{ left: `${xPos}px` }} className="absolute bottom-0 flex flex-col items-center">
                  <span className="text-[9px] font-mono text-zinc-400 -translate-x-1/2 select-none mb-0.5">
                    {s}s
                  </span>
                  <div className="w-px h-1.5 bg-zinc-300" />
                </div>
              );
            })}
          </div>

          {/* Track Lanes Area (Clicking or dragging anywhere seeks immediately) */}
          <div
            onMouseDown={(e) => {
              if (e.target.closest("button")) return;
              handleMouseDownScrubber(e);
            }}
            className="flex-1 flex flex-col relative cursor-pointer"
          >
            {/* Track 3 Lane: Captions / Text */}
            <div className="h-11 border-b border-zinc-100 relative flex items-center px-1">
              <div className="absolute inset-x-1 inset-y-1 bg-[#f9fafb] border border-zinc-100 rounded-lg -z-0" />
              {trackStates.track3.visible && hasScenes && scenes.map((scene, idx) => {
                const startSec = scenes.slice(0, idx).reduce((acc, s) => acc + (s.durationSeconds || 5), 0);
                const durationSec = scene.durationSeconds || 5;
                const leftPx = startSec * pxPerSecond;
                const widthPx = durationSec * pxPerSecond;

                return (
                  <div
                    key={`cap-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTimelineTrack("track3");
                      setActiveTool("captions");
                      seekToSecond(startSec);
                    }}
                    style={{ left: `${leftPx}px`, width: `${widthPx - 3}px` }}
                    className="absolute h-8 rounded-md bg-amber-50 hover:bg-amber-100/70 border border-amber-300/80 text-amber-800 px-2 flex items-center gap-1.5 overflow-hidden truncate text-[10px] font-medium z-10 cursor-pointer transition shadow-2xs"
                  >
                    <Subtitles className="w-3 h-3 flex-shrink-0 text-amber-600" />
                    <span className="truncate">{scene.narration || "Animated Caption"}</span>
                  </div>
                );
              })}
            </div>

            {/* Track 2 Lane: Video Scenes (Clips with Thumbnail) */}
            <div className="h-12 border-b border-zinc-100 relative flex items-center px-1">
              <div className="absolute inset-x-1 inset-y-1 bg-[#f9fafb] border border-zinc-100 rounded-lg -z-0" />
              {trackStates.track2.visible && hasScenes && scenes.map((scene, idx) => {
                const startSec = scenes.slice(0, idx).reduce((acc, s) => acc + (s.durationSeconds || 5), 0);
                const durationSec = scene.durationSeconds || 5;
                const leftPx = startSec * pxPerSecond;
                const widthPx = durationSec * pxPerSecond;
                const isSelected = currentSceneIndex === idx;
                const media = BACKGROUND_MEDIA.find((m) => m.id === scene.visualId) || BACKGROUND_MEDIA[0];

                return (
                  <div
                    key={`clip-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTimelineTrack("track2");
                      setCurrentSceneIndex(idx);
                      seekToScene(idx);
                    }}
                    style={{ left: `${leftPx}px`, width: `${widthPx - 3}px` }}
                    className={`absolute h-9 rounded-lg border overflow-hidden cursor-pointer transition-all flex items-center px-2 group z-10 ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-xs"
                        : "border-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    {/* Clip Thumbnail Background */}
                    <img
                      src={scene.imageUrl || media.poster}
                      alt={scene.badge}
                      className="absolute inset-0 w-full h-full object-cover -z-10 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] -z-10" />

                    {/* Clip Details */}
                    <div className="flex items-center justify-between w-full text-white text-[10px] font-bold">
                      <span className="truncate">{scene.badge || `Scene ${idx + 1}`}</span>
                      <span className="text-[9px] font-mono opacity-90">{scene.durationSeconds || 5}s</span>
                    </div>

                    {/* Resize Handle Right */}
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/20 hover:bg-emerald-500 cursor-ew-resize opacity-0 group-hover:opacity-100 transition" />
                  </div>
                );
              })}
            </div>

            {/* Track 1 Lane: Background Audio Track (Exact match to Screenshot 2: Teal/Emerald solid block with waveform) */}
            <div className="h-10 relative flex items-center px-1">
              <div className="absolute inset-x-1 inset-y-1 bg-[#f9fafb] border border-zinc-100 rounded-lg -z-0" />
              {trackStates.track1.visible && audioTrackData && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTimelineTrack("track1");
                    setActiveTool("audio");
                  }}
                  style={{
                    left: "0px",
                    width: `${Math.max(160, totalSeconds * pxPerSecond)}px`,
                  }}
                  className={`absolute h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-2.5 flex flex-col justify-center overflow-hidden z-10 cursor-pointer shadow-xs transition ${
                    selectedTimelineTrack === "track1" ? "ring-2 ring-white border border-teal-500" : ""
                  }`}
                >
                  {/* Audio Track Header inside clip */}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold z-10 mb-0.5">
                    <Music className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Audio · {audioTrackData.name || "Soundtrack"}</span>
                  </div>

                  {/* High-Fidelity Audio Waveform Graphic across track (Screenshot 2 exact match) */}
                  <div className="w-full h-3 flex items-end gap-[1.5px] opacity-75">
                    {[
                      20, 40, 70, 90, 60, 40, 80, 100, 70, 50, 80, 90, 60, 30, 60, 80, 100, 80,
                      60, 40, 80, 95, 60, 40, 70, 90, 80, 50, 40, 70, 85, 100, 75, 50, 30, 60,
                      80, 90, 60, 40, 70, 90, 80, 50, 70, 85, 95, 60, 40, 80, 100, 80, 50, 30,
                    ].map((height, i) => (
                      <span
                        key={i}
                        style={{ height: `${height}%` }}
                        className="w-[2px] bg-white rounded-full flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vertical Playhead Scrubber (With Green Pill Badge Matching Screenshot) */}
          <div
            style={{ left: `${playheadPx}px` }}
            className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center"
          >
            {/* Green Scrubber Badge (00:00.00) clamped so left edge is never clipped at 0s */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDownScrubber(e);
              }}
              style={{
                transform: playheadPx < 28 ? "translateX(0)" : "translateX(-50%)",
              }}
              className="pointer-events-auto cursor-ew-resize h-5 px-1.5 rounded bg-emerald-500 hover:bg-emerald-400 active:scale-105 text-black font-mono font-black text-[10px] flex items-center justify-center shadow-xs select-none transition-colors"
            >
              {formatBadgeTime(playheadSec)}
            </div>

            {/* Vertical Line with Draggable Hit Area */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDownScrubber(e);
              }}
              className="pointer-events-auto cursor-ew-resize w-3 -translate-x-1/2 flex-1 flex justify-center group"
              title="Drag playhead"
            >
              <div className="w-0.5 h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] group-hover:w-1 group-hover:bg-emerald-400 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
