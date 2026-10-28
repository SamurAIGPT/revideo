"use client";

import React, { useEffect, useState, useRef } from "react";
import { Player } from "@remotion/player";
import { RevidVideoComposition } from "./RevidVideoComposition";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Sparkles } from "lucide-react";

export function PlayerWrapper({
  scenes = [],
  captionStyle = "hormozi",
  musicTrackUrl = "",
  musicVolume = 0.25,
  aspectRatio = "9:16",
  currentSceneIndex = 0,
  onSeekScene,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute total duration in frames (30fps)
  const fps = 30;
  const totalSeconds = scenes.reduce((acc, s) => acc + (s.durationSeconds || 5), 0);
  const durationInFrames = Math.max(30, totalSeconds * fps);

  // Resolution calculation based on aspect ratio
  let compWidth = 1080;
  let compHeight = 1920;
  let containerAspectClass = "aspect-[9/16] max-h-[640px]";

  if (aspectRatio === "16:9") {
    compWidth = 1920;
    compHeight = 1080;
    containerAspectClass = "aspect-[16/9] w-full max-w-[620px]";
  } else if (aspectRatio === "1:1") {
    compWidth = 1080;
    compHeight = 1080;
    containerAspectClass = "aspect-square w-full max-w-[500px]";
  }

  // Seek when user clicks scene
  useEffect(() => {
    if (!playerRef.current) return;
    let accumulatedSeconds = 0;
    for (let i = 0; i < currentSceneIndex; i++) {
      accumulatedSeconds += scenes[i]?.durationSeconds || 5;
    }
    const targetFrame = accumulatedSeconds * fps;
    playerRef.current.seekTo(targetFrame);
  }, [currentSceneIndex, scenes]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  };

  const handleRestart = () => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
  };

  if (!isMounted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-zinc-950/50 rounded-3xl border border-zinc-800">
        <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" />
        <p className="mt-4 text-xs font-medium text-zinc-400">Initializing Video Studio Engine...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Phone / Canvas Container */}
      <div className="relative group rounded-[2.5rem] p-2 bg-gradient-to-b from-zinc-700/60 via-zinc-800/40 to-zinc-900/80 shadow-2xl shadow-black/80 border border-white/10 backdrop-blur-xl">
        {/* Subtle camera notch for 9:16 vertical view */}
        {aspectRatio === "9:16" && (
          <div className="absolute top-4 inset-x-0 flex justify-center z-50 pointer-events-none">
            <div className="w-24 h-4 bg-black rounded-full border border-white/10" />
          </div>
        )}

        <div className={`overflow-hidden rounded-[2rem] bg-black ${containerAspectClass} shadow-inner`}>
          <Player
            ref={playerRef}
            component={RevidVideoComposition}
            acknowledgeRemotionLicense
            onError={(error) => {
              console.warn("Remotion Player recovered from media error:", error);
            }}
            inputProps={{
              scenes,
              captionStyle,
              musicTrackUrl,
              musicVolume: isMuted ? 0 : musicVolume,
            }}
            durationInFrames={durationInFrames}
            compositionWidth={compWidth}
            compositionHeight={compHeight}
            fps={fps}
            style={{
              width: "100%",
              height: "100%",
            }}
            controls={false}
            autoPlay={false}
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      </div>

      {/* Floating Control Bar below preview */}
      <div className="mt-4 flex items-center gap-3 px-5 py-2.5 rounded-full bg-zinc-900/90 border border-white/10 shadow-xl backdrop-blur-md text-zinc-200">
        <button
          onClick={handleRestart}
          className="p-2 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white"
          title="Restart video"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={togglePlay}
          className="p-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold rounded-full shadow-lg shadow-yellow-400/25 transition transform active:scale-95"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 hover:bg-white/10 rounded-full transition text-zinc-400 hover:text-white"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="h-4 w-px bg-white/15 mx-1" />

        <span className="text-xs font-mono font-medium text-zinc-400 tracking-wider">
          {totalSeconds}s Total
        </span>
      </div>
    </div>
  );
}
