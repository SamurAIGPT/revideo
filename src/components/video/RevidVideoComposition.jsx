"use client";

import React, { useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  Video,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Audio,
} from "remotion";
import { BACKGROUND_MEDIA, CAPTION_STYLES } from "@/lib/constants";

// Sub-component to render word-by-word karaoke style captions
function SceneCaptions({ narration, durationInFrames, captionStyleId }) {
  const frame = useCurrentFrame();

  const styleConfig =
    CAPTION_STYLES.find((s) => s.id === captionStyleId) || CAPTION_STYLES[0];

  const words = React.useMemo(() => {
    if (!narration) return [];
    return narration.trim().split(/\s+/);
  }, [narration]);

  if (words.length === 0) return null;

  // Distribute words across duration
  const framesPerWord = Math.max(1, durationInFrames / words.length);
  const currentWordIndex = Math.min(
    words.length - 1,
    Math.floor(frame / framesPerWord)
  );

  // Group words into chunks of 4 for clean viral subtitles
  const chunkSize = 4;
  const currentChunkIndex = Math.floor(currentWordIndex / chunkSize);
  const currentChunk = words.slice(
    currentChunkIndex * chunkSize,
    (currentChunkIndex + 1) * chunkSize
  );
  const chunkStartIndex = currentChunkIndex * chunkSize;

  return (
    <div className="absolute inset-x-0 bottom-24 flex justify-center px-6 pointer-events-none z-30">
      <div className={`${styleConfig.badgeBg} max-w-[90%] text-center transition-all duration-150`}>
        <p className={`${styleConfig.font} ${styleConfig.fontSize} leading-snug flex flex-wrap justify-center gap-x-2 gap-y-1`}>
          {currentChunk.map((word, idx) => {
            const globalWordIndex = chunkStartIndex + idx;
            const isCurrent = globalWordIndex === currentWordIndex;
            const isPast = globalWordIndex < currentWordIndex;

            return (
              <span
                key={`${word}-${globalWordIndex}`}
                className={`transition-all duration-75 inline-block ${
                  isCurrent
                    ? `${styleConfig.highlightColor} scale-110 font-black`
                    : isPast
                    ? `${styleConfig.textColor} opacity-95`
                    : `${styleConfig.textColor} opacity-40`
                }`}
              >
                {word}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}

// Sub-component for individual scene video & Ken Burns zoom
function SceneVisual({ scene, durationInFrames }) {
  const frame = useCurrentFrame();
  const media =
    BACKGROUND_MEDIA.find((m) => m.id === scene.visualId) || BACKGROUND_MEDIA[0];

  const customVideo = scene.videoUrl || scene.mediaUrl;
  const isCustomImage = !!scene.imageUrl && !customVideo;

  const videoUrl = customVideo
    ? customVideo
    : !media?.url || media.url.includes("mixkit")
    ? "/videos/clip-1.mp4"
    : media.url;

  const posterUrl = scene.imageUrl || media?.poster;

  // Smooth Ken Burns zoom
  const scale = interpolate(frame, [0, durationInFrames], [1.02, 1.14], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="overflow-hidden bg-zinc-950">
      {/* Background Media with fallback */}
      <div
        className="w-full h-full transform transition-transform duration-75 origin-center relative"
        style={{ transform: `scale(${scale})` }}
      >
        {posterUrl && (
          <img
            src={posterUrl}
            alt={media?.title || "Visual"}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {!isCustomImage && (
          <Video
            src={videoUrl}
            className="w-full h-full object-cover relative z-10"
            muted
            loop
            onError={(err) => {
              console.warn("Scene video recovered:", err);
            }}
          />
        )}
      </div>

      {/* Cinematic dark gradients for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10" />

      {/* Scene Top Badge (e.g. HOOK ⚡ / STEP 1) */}
      {scene.badge && (
        <div className="absolute top-16 inset-x-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-yellow-400 text-black font-black text-sm tracking-widest uppercase px-4 py-1.5 rounded-full shadow-lg shadow-yellow-400/20 transform -rotate-1 border border-black/10">
            {scene.badge}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

// Master Video Composition
export function RevidVideoComposition({
  scenes = [],
  captionStyle = "hormozi",
  captionStyleId,
  musicTrackUrl = "",
  musicVolume = 0.25,
}) {
  const { fps, durationInFrames } = useVideoConfig();
  const currentFrame = useCurrentFrame();

  const progressPercent = Math.min(100, (currentFrame / durationInFrames) * 100);

  // If scenes is empty, render the default zen meditation visual matching screenshot
  const activeScenes =
    scenes && scenes.length > 0
      ? scenes
      : [
          {
            id: "default-monk",
            badge: "",
            narration: "",
            visualId: "monk-meditation",
            imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1080&auto=format&fit=crop&q=80",
            durationSeconds: Math.max(5, Math.round(durationInFrames / fps)),
          },
        ];

  let accumulatedFrames = 0;

  return (
    <AbsoluteFill className="bg-black select-none font-sans">
      {/* Dynamic Scenes Sequence */}
      {activeScenes.map((scene, index) => {
        const sceneDurationInFrames = Math.max(30, (scene.durationSeconds || 5) * fps);
        const fromFrame = accumulatedFrames;
        accumulatedFrames += sceneDurationInFrames;

        return (
          <Sequence
            key={scene.id || index}
            from={fromFrame}
            durationInFrames={sceneDurationInFrames}
          >
            <SceneVisual scene={scene} durationInFrames={sceneDurationInFrames} />
            <SceneCaptions
              narration={scene.narration}
              durationInFrames={sceneDurationInFrames}
              captionStyleId={captionStyleId || captionStyle}
            />
          </Sequence>
        );
      })}

      {/* Top Viral Progress Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-white/20 z-40">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-rose-500 transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Background Music Layer (Only if valid object URL or audio) */}
      {musicTrackUrl && (musicTrackUrl.startsWith("blob:") || musicTrackUrl.startsWith("http")) && (
        <Audio
          src={musicTrackUrl}
          volume={musicVolume}
          loop
          onError={(err) => {
            console.warn("Audio element recovered:", err);
          }}
        />
      )}
    </AbsoluteFill>
  );
}
