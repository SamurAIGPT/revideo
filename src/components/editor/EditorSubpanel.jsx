"use client";

import React, { useState, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  Copy,
  Volume2,
  Wand2,
  Sparkles,
  Music,
  Subtitles,
  Shuffle,
  Clock,
  Check,
  Layers,
  Upload,
  ChevronLeft,
  ChevronDown,
  Play,
  Pause,
  RefreshCw,
  Heart,
  Clapperboard,
  Repeat,
} from "lucide-react";
import { useVideoEditor } from "@/context/VideoEditorContext";
import { BACKGROUND_MEDIA, CAPTION_STYLES, VOICES } from "@/lib/constants";

export function EditorSubpanel() {
  const {
    activeTool,
    setActiveTool,
    scenes,
    setScenes,
    addScene,
    updateScene,
    deleteScene,
    duplicateScene,
    currentSceneIndex,
    setCurrentSceneIndex,
    captionStyle,
    setCaptionStyle,
    setMusicTrack,
    seekToScene,
    aspectRatio,

    // Media & Audio from context (Matching Revid Screenshots)
    mediaLibrary,
    mediaTab,
    setMediaTab,
    mediaFilter,
    setMediaFilter,
    uploadMedia,

    audioTrackData,
    isAudioPreviewPlaying,
    toggleAudioPreview,
    deleteAudio,
    replaceAudio,
    generateCaptionsFromAudio,
  } = useVideoEditor();

  const fileInputRef = useRef(null);
  const audioReplaceInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDuration, setAiDuration] = useState(30);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isCaptionsGeneratedNotice, setIsCaptionsGeneratedNotice] = useState(false);

  // Filter scenes by narration search
  const filteredScenes = scenes.filter((s) =>
    (s.narration || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter stock media by search query and filter chips (Videos, Images, Audio, Motion)
  const filteredStock = BACKGROUND_MEDIA.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);

    let matchesFilter = true;
    if (mediaFilter === "videos") {
      matchesFilter = item.type === "video";
    } else if (mediaFilter === "images") {
      matchesFilter = item.type === "image";
    } else if (mediaFilter === "motion") {
      matchesFilter = item.type === "motion";
    } else if (mediaFilter === "audio") {
      matchesFilter = item.type === "audio";
    }

    return matchesSearch && matchesFilter;
  });

  // Voice speech preview using Web Speech API
  const handlePreviewVoice = (text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text || "Previewing this video scene voiceover.");
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger hidden file picker
  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMedia(file);
      e.target.value = "";
    }
  };

  const handleReplaceAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      replaceAudio({
        id: `audio-${Date.now()}`,
        name: file.name,
        duration: "0:30",
        durationSeconds: 30,
        url: objectUrl,
        type: "Uploaded Music",
      });
      e.target.value = "";
    }
  };

  // AI Script Generation
  const handleGenerateScript = async (prompt) => {
    const finalPrompt = prompt || aiPrompt;
    if (!finalPrompt.trim()) return;

    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/repurpose/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          duration: aiDuration,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.scenes) && data.scenes.length > 0) {
        setScenes(data.scenes);
        setCurrentSceneIndex(0);
      } else {
        const generatedScenes = [
          {
            id: `sc-${Date.now()}-1`,
            badge: "HOOK ⚡",
            narration: `${finalPrompt}: Most people have no idea this exists.`,
            visualId: "cyber-city",
            durationSeconds: 5,
            transition: "fade",
          },
          {
            id: `sc-${Date.now()}-2`,
            badge: "THE PROBLEM",
            narration: "The traditional approach takes hours and costs thousands of dollars.",
            visualId: "matrix-code",
            durationSeconds: 6,
            transition: "slide",
          },
          {
            id: `sc-${Date.now()}-3`,
            badge: "THE SECRET",
            narration: "Here is the exact framework top performers use to achieve 10x output.",
            visualId: "clip-2",
            durationSeconds: 7,
            transition: "zoom",
          },
          {
            id: `sc-${Date.now()}-4`,
            badge: "CALL TO ACTION",
            narration: "Save this video right now and follow for part two tomorrow.",
            visualId: "luxury-car",
            durationSeconds: 5,
            transition: "fade",
          },
        ];
        setScenes(generatedScenes);
        setCurrentSceneIndex(0);
      }
    } catch (err) {
      console.error("AI script generation error:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="relative w-[380px] lg:w-[420px] flex-shrink-0 border-r border-zinc-200 bg-white flex flex-col h-[calc(100vh-3.5rem-11rem)] select-none z-20">
      {/* Hidden File Input for Native Media Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="video/*,image/*,audio/*"
        className="hidden"
      />
      <input
        type="file"
        ref={audioReplaceInputRef}
        onChange={handleReplaceAudioUpload}
        accept="audio/*"
        className="hidden"
      />

      {/* Floating Quick Add Button on the seam (Exact match from revid.ai screenshot: solid black circle with white +) */}
      <button
        onClick={() => addScene(currentSceneIndex)}
        className="absolute -right-3.5 top-12 z-30 w-7 h-7 rounded-full bg-black text-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition"
        title="Add new scene"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* =========================================================================
          1. MEDIA PANEL (Exact match to revid.ai/editor/2UN7cElQ9IeVieiIS42f Screenshot 1)
         ========================================================================= */}
      {activeTool === "media" && (
        <div className="flex flex-col h-full">
          {/* Top Header Row: Segmented Tabs (Library, Stock, Stickers, Effects) + [✦ Generate] */}
          <div className="p-3 border-b border-zinc-100 flex items-center justify-between gap-2">
            {/* Segmented Control Pills */}
            <div className="bg-zinc-100 p-0.5 rounded-xl flex items-center text-xs font-semibold text-zinc-600">
              {[
                { id: "library", label: "Library" },
                { id: "stock", label: "Stock" },
                { id: "stickers", label: "Stickers" },
                { id: "effects", label: "Effects" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMediaTab(tab.id)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    mediaTab === tab.id
                      ? "bg-white text-zinc-900 shadow-xs font-bold"
                      : "hover:text-zinc-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ✦ Generate Button */}
            <button
              onClick={() => setActiveTool("ai")}
              className="bg-black hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition active:scale-95 flex-shrink-0"
              title="Generate with AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate</span>
            </button>
          </div>

          {/* Search Bar & Upload Button Row */}
          <div className="px-3 py-2.5 border-b border-zinc-100 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search your media"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 shadow-2xs"
              />
            </div>

            <button
              onClick={handleTriggerUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 shadow-xs transition active:scale-95 flex-shrink-0 cursor-pointer"
              title="Upload your own files"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>

          {/* Filter Pills Row (All, Videos, Images, Audio, Motion) + Project Selector Dropdown */}
          <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {["all", "videos", "images", "audio", "motion"].map((f) => (
                <button
                  key={f}
                  onClick={() => setMediaFilter(f)}
                  className={`px-2 py-0.5 rounded-md capitalize transition ${
                    mediaFilter === f
                      ? "bg-zinc-100 text-zinc-900 font-bold"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>

            {/* Right icons: "This project ⌄", ✦, ♡, ⟳ */}
            <div className="flex items-center gap-1.5 text-zinc-400">
              <button className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-100 text-[11px] text-zinc-600 font-medium">
                <span>This project</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 hover:text-zinc-800 rounded hover:bg-zinc-50"
                title="Reset search"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Content Area Based on Media Tab */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {mediaTab === "library" && (
              <>
                {mediaLibrary.length === 0 ? (
                  /* Exact Empty State Card from Screenshot 1 */
                  <div className="h-full min-h-[300px] bg-[#f9fafb] border border-zinc-200/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-white border border-zinc-200 shadow-xs flex items-center justify-center text-zinc-400 mb-3">
                      <Clapperboard className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 mb-1">
                      No media in this project yet
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-[220px] mb-4 leading-relaxed">
                      Media you generate or upload in this project lands here.
                    </p>
                    <button
                      onClick={() => setMediaTab("stock")}
                      className="px-4 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full text-xs font-semibold text-zinc-800 shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      Show all media
                    </button>
                  </div>
                ) : (
                  /* Render Uploaded / Project Media items */
                  <div className="grid grid-cols-2 gap-2.5">
                    {mediaLibrary.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.type === "video") {
                            updateScene(currentSceneIndex, "videoUrl", item.url);
                            updateScene(currentSceneIndex, "imageUrl", item.poster || item.url);
                          } else if (item.type === "image") {
                            updateScene(currentSceneIndex, "imageUrl", item.url);
                            updateScene(currentSceneIndex, "videoUrl", "");
                          }
                        }}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-zinc-200 hover:border-emerald-500 cursor-pointer shadow-xs transition bg-zinc-100"
                      >
                        <img
                          src={item.poster || item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] font-semibold text-white truncate">
                            {item.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {mediaTab === "stock" && (
              /* Rich Stock Footage & B-Roll Library matching Revid Stock */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800">
                    Stock Catalog ({filteredStock.length})
                  </span>
                  <span className="text-[11px] text-zinc-400">Click to apply to scene</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredStock.map((item) => {
                    const currentScene = scenes[currentSceneIndex];
                    const isSelected =
                      currentScene?.visualId === item.id || currentScene?.imageUrl === item.url;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (scenes.length === 0) {
                            const newScene = {
                              id: `sc-${Date.now()}`,
                              badge: "Scene 1",
                              narration: "",
                              visualId: item.id,
                              imageUrl: item.type === "image" ? item.url : item.poster,
                              videoUrl: item.type === "video" ? item.url : "",
                              durationSeconds: 15,
                            };
                            setScenes([newScene]);
                            setCurrentSceneIndex(0);
                          } else {
                            updateScene(currentSceneIndex, "visualId", item.id);
                            if (item.type === "image") {
                              updateScene(currentSceneIndex, "imageUrl", item.url);
                              updateScene(currentSceneIndex, "videoUrl", "");
                            } else {
                              updateScene(currentSceneIndex, "videoUrl", item.url);
                              updateScene(currentSceneIndex, "imageUrl", item.poster);
                            }
                          }
                        }}
                        className={`group relative aspect-video rounded-xl overflow-hidden border text-left transition cursor-pointer ${
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/30"
                            : "border-zinc-200 hover:border-zinc-400 shadow-xs"
                        }`}
                      >
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-black/60 text-white font-bold uppercase">
                            {item.type}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-1.5">
                          <span className="text-[10px] font-semibold text-white truncate max-w-[120px]">
                            {item.title}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-300">{item.duration}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {mediaTab === "stickers" && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-800">Viral Callout Badges</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "🔥 Fire", badge: "HOT 🔥" },
                    { label: "⚡ Hook", badge: "HOOK ⚡" },
                    { label: "🚀 Viral", badge: "VIRAL 🚀" },
                    { label: "💯 100%", badge: "100% TRUTH" },
                    { label: "⚠️ Alert", badge: "WARNING ⚠️" },
                    { label: "👉 Action", badge: "SAVE THIS" },
                  ].map((st, i) => (
                    <button
                      key={i}
                      onClick={() => updateScene(currentSceneIndex, "badge", st.badge)}
                      className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-center text-xs font-semibold text-zinc-800 transition cursor-pointer"
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mediaTab === "effects" && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-800">Visual Filter Presets</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "cinematic", name: "Cinematic 35mm", desc: "Warm tones & contrast" },
                    { id: "cyber", name: "Cyberpunk", desc: "Neon cyan & magenta" },
                    { id: "bw", name: "Noir Black & White", desc: "High dynamic punch" },
                    { id: "vintage", name: "Vintage 90s", desc: "Retro VHS aesthetic" },
                  ].map((eff) => {
                    const currentEffect = scenes[currentSceneIndex]?.effect;
                    const isSelected = currentEffect === eff.id;
                    return (
                      <button
                        key={eff.id}
                        onClick={() => updateScene(currentSceneIndex, "effect", eff.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold"
                            : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800"
                        }`}
                      >
                        <div className="text-xs font-bold">{eff.name}</div>
                        <div className="text-[10px] text-zinc-400">{eff.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          2. AUDIO / EDIT AUDIO PANEL (Exact match to Screenshot 2)
         ========================================================================= */}
      {activeTool === "audio" && (
        <div className="flex flex-col h-full">
          {/* Header Row: < Edit Audio + [✦ Generate] */}
          <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between gap-2">
            <button
              onClick={() => setActiveTool("script")}
              className="flex items-center gap-1 text-xs font-bold text-zinc-900 hover:text-emerald-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-500" />
              <span>Edit Audio</span>
            </button>

            <button
              onClick={() => setActiveTool("ai")}
              className="bg-black hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Audio Track Card (Exact match to Screenshot 2) */}
            {audioTrackData ? (
              <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs">
                {/* Top Info Row: Cover art + Title + Subtitle */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Sunset gradient square album art */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-400 via-rose-500 to-indigo-600 flex-shrink-0 shadow-2xs" />
                  <div className="overflow-hidden">
                    <h3 className="text-xs font-bold text-zinc-900 truncate">
                      {audioTrackData.name || "1793086207095-audio.mp3"}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Music · {audioTrackData.duration || "2:01"}
                    </p>
                  </div>
                </div>

                {/* Waveform Player Row */}
                <div className="flex items-center gap-2.5 mb-2">
                  {/* Solid Black Play / Pause Circle */}
                  <button
                    onClick={toggleAudioPreview}
                    className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition flex-shrink-0 cursor-pointer"
                    title={isAudioPreviewPlaying ? "Pause preview" : "Play preview"}
                  >
                    {isAudioPreviewPlaying ? (
                      <Pause className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current translate-x-0.5" />
                    )}
                  </button>

                  {/* Audio Waveform Graphic */}
                  <div className="flex-1 h-7 flex items-center gap-[2px] px-1 overflow-hidden">
                    {[
                      20, 45, 60, 30, 80, 100, 75, 40, 90, 65, 30, 50, 85, 95, 60, 40, 70, 80, 50,
                      35, 90, 100, 85, 60, 40, 75, 55, 30, 65, 90, 80, 45, 30, 20, 15, 10,
                    ].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`w-1 rounded-full transition-all ${
                          isAudioPreviewPlaying
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-zinc-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Time Display Row: 0:00 / 2:01 and in video 0:00 - 2:01 */}
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-3.5">
                  <span>0:00 / {audioTrackData.duration || "2:01"}</span>
                  <span>in video 0:00 - {audioTrackData.duration || "2:01"}</span>
                </div>

                {/* Replace & Delete Buttons Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => audioReplaceInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    <Repeat className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Replace</span>
                  </button>

                  <button
                    onClick={deleteAudio}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-red-50/70 hover:bg-red-100/70 border border-red-200/80 text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-zinc-200 text-center">
                <Music className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-700 mb-1">No audio track attached</p>
                <button
                  onClick={() => audioReplaceInputRef.current?.click()}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold cursor-pointer"
                >
                  + Add Soundtrack
                </button>
              </div>
            )}

            {/* Captions Section (Matching Screenshot 2) */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-zinc-900 tracking-tight">Captions</h4>
              <button
                onClick={() => {
                  generateCaptionsFromAudio();
                  setIsCaptionsGeneratedNotice(true);
                  setTimeout(() => setIsCaptionsGeneratedNotice(false), 2500);
                }}
                className="w-full py-2.5 px-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 flex items-center justify-center gap-2 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Subtitles className="w-4 h-4 text-zinc-500" />
                <span>{isCaptionsGeneratedNotice ? "✓ Captions Generated!" : "Generate captions"}</span>
              </button>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Create word-level captions from this track. Music without vocals won&apos;t produce captions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. SCRIPT PANEL (Matches Screenshot media_1793099208686.png)
         ========================================================================= */}
      {activeTool === "script" && (
        <div className="flex flex-col h-full">
          {/* Subpanel Header with Search */}
          <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">Script</h2>
            <div className="relative w-36">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-zinc-200 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {/* Subpanel Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {scenes.length === 0 ? (
              // Empty State matching screenshot 100% (NO dummy "+ Add First Scene" button!)
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-200">
                  <div className="flex flex-col gap-1 items-center">
                    <span className="w-4 h-0.5 bg-zinc-500 rounded-full" />
                    <span className="w-3 h-0.5 bg-zinc-500 rounded-full" />
                    <span className="w-4 h-0.5 bg-zinc-500 rounded-full" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-zinc-800 mb-1">No scenes yet</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-[200px]">
                  Scenes appear here once your script generates or you add captions.
                </p>
              </div>
            ) : (
              // Populated Scene Cards
              filteredScenes.map((scene, idx) => {
                const isSelected = currentSceneIndex === idx;
                const media =
                  BACKGROUND_MEDIA.find((m) => m.id === scene.visualId) || BACKGROUND_MEDIA[0];

                return (
                  <div
                    key={scene.id || idx}
                    onClick={() => {
                      setCurrentSceneIndex(idx);
                      seekToScene(idx);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                        : "bg-white border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {/* Scene Card Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {scene.badge || `Scene ${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                          <Clock className="w-3 h-3" />
                          <span>{scene.durationSeconds || 5}s</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(scene.narration);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                          title="Preview voiceover"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateScene(idx);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                          title="Duplicate scene"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteScene(idx);
                          }}
                          disabled={scenes.length <= 1}
                          className="p-1 rounded text-zinc-400 hover:text-red-500 disabled:opacity-30 hover:bg-zinc-100"
                          title="Delete scene"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Narration Textarea */}
                    <textarea
                      value={scene.narration}
                      onChange={(e) => updateScene(idx, "narration", e.target.value)}
                      rows={2}
                      className="w-full text-xs bg-transparent text-zinc-800 placeholder:text-zinc-400 resize-none focus:outline-none leading-relaxed"
                      placeholder="Enter narration for this scene..."
                    />

                    {/* Visual Media Thumbnail & Duration Stepper */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={scene.imageUrl || media?.poster}
                          alt="Thumbnail"
                          className="w-10 h-6 object-cover rounded border border-zinc-200"
                        />
                        <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">
                          {media?.title || "Stock Visual"}
                        </span>
                      </div>

                      {/* Duration Adjuster */}
                      <div className="flex items-center border border-zinc-200 rounded-md bg-zinc-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateScene(idx, "durationSeconds", Math.max(1, (scene.durationSeconds || 5) - 1));
                          }}
                          className="px-1.5 py-0.5 text-xs text-zinc-500 hover:text-black cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-1 text-[11px] font-mono font-bold text-zinc-700">
                          {scene.durationSeconds || 5}s
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateScene(idx, "durationSeconds", Math.min(30, (scene.durationSeconds || 5) + 1));
                          }}
                          className="px-1.5 py-0.5 text-xs text-zinc-500 hover:text-black cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. AI GENERATION PANEL
         ========================================================================= */}
      {activeTool === "ai" && (
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-900 mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI Script Writer</span>
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            Type any prompt or video idea, and AI will structure it into viral hook, points, and call to action.
          </p>

          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. 3 secret habits that high performers do before 8 AM..."
            className="w-full text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 resize-none mb-3"
          />

          <div className="mb-4">
            <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">
              Target Duration: <span className="text-emerald-600 font-bold">{aiDuration}s</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setAiDuration(d)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                    aiDuration === d
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleGenerateScript()}
            disabled={isGeneratingAi || !aiPrompt.trim()}
            className="w-full py-2.5 rounded-xl bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
          >
            {isGeneratingAi ? (
              <>
                <Wand2 className="w-4 h-4 animate-spin" />
                <span>Crafting Viral Script...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Scenes with AI</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* =========================================================================
          5. CAPTIONS PANEL
         ========================================================================= */}
      {activeTool === "captions" && (
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-900 mb-1 flex items-center gap-2">
            <Subtitles className="w-4 h-4 text-emerald-600" />
            <span>Viral Caption Styles</span>
          </h2>
          <p className="text-xs text-zinc-500 mb-3">
            Choose high-retention subtitle animations:
          </p>

          <div className="space-y-2">
            {CAPTION_STYLES.map((style) => {
              const isSelected = captionStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setCaptionStyle(style.id)}
                  className={`w-full p-3 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-white border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs"
                      : "bg-white border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-900">{style.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-2">{style.description}</p>
                  <div className={`${style.badgeBg} text-center py-1 rounded-lg`}>
                    <span className={`${style.font} text-sm ${style.highlightColor}`}>VIRAL WORDS</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          6. TRANSITIONS PANEL
         ========================================================================= */}
      {activeTool === "transitions" && (
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-900 mb-1 flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-emerald-600" />
            <span>Scene Transitions</span>
          </h2>
          <p className="text-xs text-zinc-500 mb-3">
            Change transition for Scene {currentSceneIndex + 1}:
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "fade", name: "Smooth Fade" },
              { id: "slide", name: "Slide In" },
              { id: "zoom", name: "Zoom Push" },
              { id: "none", name: "Direct Cut" },
            ].map((t) => {
              const currentScene = scenes[currentSceneIndex];
              const isSelected = (currentScene?.transition || "fade") === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => updateScene(currentSceneIndex, "transition", t.id)}
                  className={`p-3 rounded-xl border text-center text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          7. TEXT PANEL
         ========================================================================= */}
      {activeTool === "text" && (
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          <h2 className="text-sm font-semibold text-zinc-900 mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Text Overlays</span>
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            Add headings, stickers, or lower thirds onto the video canvas.
          </p>

          <div className="space-y-2">
            {[
              { label: "Viral Hook Title", style: "font-black text-lg tracking-tight uppercase text-zinc-900" },
              { label: "Subheading Statement", style: "font-bold text-sm text-zinc-800" },
              { label: "Follow / Like Callout", style: "font-semibold text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded w-fit" },
            ].map((preset, i) => (
              <button
                key={i}
                onClick={() => {
                  const currentNarration = scenes[currentSceneIndex]?.narration || "";
                  updateScene(currentSceneIndex, "narration", `${preset.label.toUpperCase()}! ${currentNarration}`);
                }}
                className="w-full p-3 rounded-xl border border-zinc-200 bg-white hover:border-emerald-500 text-left transition cursor-pointer"
              >
                <div className={preset.style}>{preset.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
