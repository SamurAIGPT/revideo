"use client";

import React, { useState } from "react";
import {
  Wand2,
  Film,
  Type,
  Music,
  Trash2,
  Copy,
  Plus,
  Play,
  Sparkles,
  ChevronRight,
  Clock,
  Mic,
  Volume2,
} from "lucide-react";
import { BACKGROUND_MEDIA, CAPTION_STYLES, MUSIC_TRACKS, VOICES } from "@/lib/constants";

export function InspectorPanel({
  scenes,
  setScenes,
  captionStyle,
  setCaptionStyle,
  musicTrack,
  setMusicTrack,
  musicVolume,
  setMusicVolume,
  voice,
  setVoice,
  currentSceneIndex,
  setCurrentSceneIndex,
  onGenerateAiScript,
  isGenerating,
  generationStep,
}) {
  const [activeTab, setActiveTab] = useState("ai"); // 'ai' | 'scenes' | 'captions' | 'audio'
  const [promptText, setPromptText] = useState("");
  const [targetDuration, setTargetDuration] = useState(30);

  // Quick prompt chips
  const promptSuggestions = [
    "3 dark psychology tricks that feel almost illegal",
    "Top AI tools that will replace entire agencies",
    "Why high performers never complain about anything",
    "The 1% money rule the wealthy teach their children",
    "Morning routine habit that doubles your energy",
  ];

  const handleUpdateScene = (index, field, value) => {
    setScenes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddScene = () => {
    const newScene = {
      id: `sc-${Date.now()}`,
      badge: `STEP ${scenes.length + 1}`,
      narration: "Type your spoken narration here. This will display as animated subtitles.",
      visualId: BACKGROUND_MEDIA[scenes.length % BACKGROUND_MEDIA.length].id,
      durationSeconds: 5,
    };
    setScenes((prev) => [...prev, newScene]);
    setCurrentSceneIndex(scenes.length);
  };

  const handleDeleteScene = (index, e) => {
    e.stopPropagation();
    if (scenes.length <= 1) return;
    setScenes((prev) => prev.filter((_, i) => i !== index));
    if (currentSceneIndex >= scenes.length - 1) {
      setCurrentSceneIndex(Math.max(0, scenes.length - 2));
    }
  };

  const handleDuplicateScene = (index, e) => {
    e.stopPropagation();
    const source = scenes[index];
    const duplicated = {
      ...source,
      id: `sc-${Date.now()}`,
      badge: `${source.badge} (Copy)`,
    };
    setScenes((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
    setCurrentSceneIndex(index + 1);
  };

  return (
    <div className="w-full lg:w-[480px] xl:w-[520px] h-full flex flex-col bg-zinc-950 border-r border-zinc-800/80 z-20">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-zinc-800/80 p-2 gap-1 bg-zinc-900/50">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "ai"
              ? "bg-zinc-800 text-yellow-400 shadow-sm border border-yellow-400/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>AI Creator</span>
        </button>

        <button
          onClick={() => setActiveTab("scenes")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "scenes"
              ? "bg-zinc-800 text-yellow-400 shadow-sm border border-yellow-400/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Scenes ({scenes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("captions")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "captions"
              ? "bg-zinc-800 text-yellow-400 shadow-sm border border-yellow-400/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Captions</span>
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "audio"
              ? "bg-zinc-800 text-yellow-400 shadow-sm border border-yellow-400/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
        {/* TAB 1: AI GENERATOR */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent p-4 rounded-2xl border border-yellow-500/20">
              <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Prompt-to-Video Engine
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Turn any idea or topic into an animated viral short
              </h2>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Video Topic or Concept</span>
                <span className="text-[11px] text-zinc-500">Be as specific as you like</span>
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g. 3 psychological tricks that feel almost illegal to know..."
                rows={3}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 transition"
              />
            </div>

            {/* Prompt Suggestions */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Trending Viral Hooks:
              </span>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPromptText(item)}
                    className="text-left text-xs bg-zinc-900 hover:bg-zinc-800 hover:text-yellow-400 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-800/80 transition"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Target Length</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 45].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setTargetDuration(sec)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      targetDuration === sec
                        ? "bg-yellow-400/10 border-yellow-400 text-yellow-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {sec}s {sec === 15 ? "⚡ Bite" : sec === 30 ? "🔥 Reel" : "📖 Deep"}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={() => onGenerateAiScript(promptText || promptSuggestions[0], targetDuration)}
              disabled={isGenerating}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2 transition transform active:scale-98 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-black" />
                  <span>{generationStep || "Crafting Viral Video..."}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Complete Video</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 2: SCENES EDITOR */}
        {activeTab === "scenes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Storyboard ({scenes.length} Scenes)
              </span>
              <button
                onClick={handleAddScene}
                className="flex items-center gap-1 text-xs font-semibold text-yellow-400 hover:text-yellow-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scene</span>
              </button>
            </div>

            <div className="space-y-4">
              {scenes.map((scene, idx) => {
                const isSelected = currentSceneIndex === idx;
                const activeMedia =
                  BACKGROUND_MEDIA.find((m) => m.id === scene.visualId) ||
                  BACKGROUND_MEDIA[0];

                return (
                  <div
                    key={scene.id || idx}
                    onClick={() => setCurrentSceneIndex(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900/90 border-yellow-400/60 shadow-lg shadow-yellow-400/5 ring-1 ring-yellow-400/30"
                        : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60"
                    }`}
                  >
                    {/* Scene Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-bold flex items-center justify-center border border-zinc-700">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={scene.badge || ""}
                          onChange={(e) => handleUpdateScene(idx, "badge", e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs font-bold text-yellow-400 max-w-[120px]"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleDuplicateScene(idx, e)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                          title="Duplicate scene"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {scenes.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteScene(idx, e)}
                            className="p-1 hover:bg-red-950/60 rounded text-zinc-400 hover:text-red-400"
                            title="Delete scene"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Spoken Narration Input */}
                    <div className="space-y-1 mb-3">
                      <label className="text-[11px] font-medium text-zinc-400">
                        Voiceover / Spoken Words (Captions):
                      </label>
                      <textarea
                        value={scene.narration}
                        onChange={(e) => handleUpdateScene(idx, "narration", e.target.value)}
                        rows={2}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                      />
                    </div>

                    {/* Visual Background Picker */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Background Visual</span>
                        <span className="text-zinc-200 font-medium">{activeMedia.title}</span>
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {BACKGROUND_MEDIA.map((m) => (
                          <button
                            key={m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateScene(idx, "visualId", m.id);
                            }}
                            className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border relative ${
                              scene.visualId === m.id
                                ? "border-yellow-400 ring-2 ring-yellow-400/40"
                                : "border-zinc-800 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={m.poster}
                              alt={m.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration Slider */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Duration:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={3}
                          max={12}
                          step={1}
                          value={scene.durationSeconds || 5}
                          onChange={(e) =>
                            handleUpdateScene(idx, "durationSeconds", Number(e.target.value))
                          }
                          className="w-24 accent-yellow-400"
                        />
                        <span className="font-mono text-zinc-200 w-6 text-right">
                          {scene.durationSeconds || 5}s
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CAPTION STYLES */}
        {activeTab === "captions" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Animated Subtitle Styles</h3>
              <p className="text-xs text-zinc-400">
                Choose the dynamic karaoke animation for word-by-word engagement.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {CAPTION_STYLES.map((style) => {
                const isSelected = captionStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setCaptionStyle(style.id)}
                    className={`text-left p-4 rounded-2xl border transition ${
                      isSelected
                        ? "bg-zinc-900 border-yellow-400 ring-1 ring-yellow-400/30"
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">{style.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mb-3">{style.description}</p>

                    {/* Miniature live preview */}
                    <div className="bg-black/80 rounded-xl p-3 flex items-center justify-center border border-white/5">
                      <div className={`${style.badgeBg}`}>
                        <span className={`${style.font} ${style.fontSize}`}>
                          VIRAL <span className={style.highlightColor}>REEL</span> CAPTIONS
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIO & VOICES */}
        {activeTab === "audio" && (
          <div className="space-y-6">
            {/* Voices */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-yellow-400" />
                <span>AI Narration Voice</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      voice === v.id
                        ? "bg-zinc-900 border-yellow-400 ring-1 ring-yellow-400/30"
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{v.name}</span>
                      <span className="text-[10px] text-zinc-500 uppercase">{v.gender}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{v.tagline}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Music */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-yellow-400" />
                <span>Background Soundtrack</span>
              </label>
              <div className="space-y-2">
                {MUSIC_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => setMusicTrack(track.id)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      musicTrack === track.id
                        ? "bg-zinc-900 border-yellow-400 ring-1 ring-yellow-400/30 text-white"
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-300"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{track.name}</p>
                      <span className="text-[10px] text-zinc-500">{track.category}</span>
                    </div>
                    {musicTrack === track.id && (
                      <span className="text-[10px] font-bold text-yellow-400">SELECTED</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Music Ducking Volume</span>
                </span>
                <span className="font-mono text-yellow-400">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-full accent-yellow-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
