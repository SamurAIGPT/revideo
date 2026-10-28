"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  Repeat,
  Music,
  Link2,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  TrendingUp,
  SlidersHorizontal,
  Play,
  ArrowRight,
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export function HomeFeed({ onOpenCreate, onRemixVideo, onNavigateRepurpose }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("viral"); // 'viral' | 'ads'
  const [bookmarked, setBookmarked] = useState({});
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [remixingId, setRemixingId] = useState(null);

  const fetchTrendingVideos = async () => {
    setLoadingVideos(true);
    setApiError(null);
    try {
      const res = await fetch("/api/repurpose/videos?q=viral&platform=youtube,tiktok,instagram");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load trending videos from server");
      }
      setTrendingVideos(data.videos || []);
      if (data.errors && data.errors.length > 0 && (!data.videos || data.videos.length === 0)) {
        setApiError(data.errors.map((e) => `${e.platform}: ${e.error}`).join(" | "));
      }
    } catch (err) {
      console.error("[HomeFeed] fetch error:", err);
      setApiError(err.message || "Failed to connect to video feed API");
      setTrendingVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchTrendingVideos();
  }, []);

  const handleRemixLive = async (video) => {
    setRemixingId(video.id);
    try {
      const res = await fetch("/api/repurpose/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          description: video.title,
          platform: video.platform || "youtube",
          topics: ["viral"],
        }),
      });
      const data = await res.json();
      if (res.ok && data.script) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("revid_pending_remix", JSON.stringify(data.script));
        }
        router.push("/editor/new?remix=active");
      } else {
        alert(`Failed to remix video: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      alert(`Remix error: ${err.message}`);
    } finally {
      setRemixingId(null);
    }
  };

  const formatViews = (val) => {
    if (!val) return "0";
    if (typeof val === "string" && (val.includes("M") || val.includes("K"))) return val;
    const num = Number(val);
    if (isNaN(num)) return val;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const toggleBookmark = (id, e) => {
    e.stopPropagation();
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sampleTags = [
    "How to create a startup",
    "How to go viral on TikTok",
    "Best AI tools",
    "Create a personal brand",
  ];

  return (
    <main className="flex-1 h-screen overflow-y-auto bg-[#fafafa] text-zinc-900 font-sans p-6 lg:p-10 select-none custom-scrollbar relative">
      {/* Top Search bar */}
      <div className="flex justify-end mb-8">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tools, projects, anything"
            className="w-full bg-white border border-zinc-200/80 rounded-full pl-9 pr-8 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-sm transition"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
            /
          </kbd>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-9">
        {/* Hero Section */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
            Find a viral video or ad to remix
          </h1>
          <p className="text-sm text-zinc-500 font-normal">
            Search what already works in your niche, or paste a link. Revid rebuilds it as your own video.
          </p>
        </div>

        {/* Hero Big Search Box */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-2 sm:p-2.5 flex items-center justify-between gap-3 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-200 transition">
            <div className="flex items-center gap-3 flex-1 pl-2">
              <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    onOpenCreate({ prompt: searchQuery });
                  }
                }}
                placeholder="Paste a link or type a niche"
                className="w-full text-sm text-zinc-800 placeholder:text-zinc-400 bg-transparent focus:outline-none"
              />
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab("viral")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === "viral"
                    ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-zinc-700" />
                <span>Viral posts</span>
              </button>

              <button
                onClick={() => setActiveTab("ads")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === "ads"
                    ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-700" />
                <span>Ads</span>
              </button>
            </div>
          </div>

          {/* Try: Suggestions row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-400 font-medium">Try:</span>
              {sampleTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenCreate({ prompt: tag })}
                  className="bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 px-3 py-1 rounded-xl text-[11px] font-medium transition shadow-2xs"
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-zinc-600 hover:text-zinc-950 font-medium cursor-pointer transition">
              <div className="flex -space-x-1.5 overflow-hidden">
                <img
                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt=""
                />
                <img
                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt=""
                />
                <img
                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                  alt=""
                />
              </div>
              <span className="text-xs">Browse what's trending</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* 4 Feature Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Repurpose a video */}
          <div
            onClick={() => (onNavigateRepurpose ? onNavigateRepurpose() : onOpenCreate({ mode: "repurpose" }))}
            className="bg-white hover:border-emerald-300 p-4 rounded-2xl border border-zinc-200 shadow-2xs cursor-pointer transition-all duration-200 group flex flex-col justify-between h-40"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Repeat className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-zinc-900 group-hover:text-emerald-700 transition">
                  Repurpose a video
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                Remix a viral clip into your own.
              </p>
            </div>

            {/* Illustration Graphic */}
            <div className="relative h-14 flex items-center justify-end pr-2 overflow-hidden">
              <div className="w-16 h-12 bg-zinc-800 rounded-lg shadow-md transform -rotate-6 border border-white/20 overflow-hidden flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <div className="w-16 h-12 bg-zinc-900 rounded-lg shadow-xl transform rotate-6 border border-white/30 overflow-hidden flex items-center justify-center absolute right-1">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80"
                  className="w-full h-full object-cover"
                  alt=""
                />
                <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/70 px-1 rounded">
                  +2.4M
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Video from an idea */}
          <div
            onClick={() => onOpenCreate({ mode: "idea" })}
            className="bg-white hover:border-amber-300 p-4 rounded-2xl border border-zinc-200 shadow-2xs cursor-pointer transition-all duration-200 group flex flex-col justify-between h-40"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-zinc-900 group-hover:text-amber-600 transition">
                  Video from an idea
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                Describe it, we build it.
              </p>
            </div>

            {/* Graphic mockup */}
            <div className="space-y-1 pt-2">
              <div className="bg-zinc-100 rounded-lg px-2.5 py-1 text-[10px] text-zinc-600 font-mono truncate border border-zinc-200/60">
                A day in Tokyo, cine...
              </div>
              <div className="flex items-center gap-1 text-[9px] text-zinc-400">
                <span className="bg-zinc-100 px-1.5 py-0.5 rounded">cinematic</span>
                <span className="bg-zinc-100 px-1.5 py-0.5 rounded">30s</span>
                <span className="bg-zinc-100 px-1.5 py-0.5 rounded">9:16</span>
              </div>
            </div>
          </div>

          {/* Card 3: Video from music */}
          <div
            onClick={() => onOpenCreate({ mode: "music" })}
            className="bg-white hover:border-purple-300 p-4 rounded-2xl border border-zinc-200 shadow-2xs cursor-pointer transition-all duration-200 group flex flex-col justify-between h-40"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Music className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-zinc-900 group-hover:text-purple-700 transition">
                  Video from music
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                Drop a track, we make the visuals.
              </p>
            </div>

            {/* Vinyl record mockup */}
            <div className="relative h-14 flex items-center justify-end pr-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-yellow-300 to-amber-500 shadow-md border border-white/40 flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80"
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-950 border-2 border-zinc-700 shadow-lg absolute right-1 flex items-center justify-center transform translate-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
              </div>
            </div>
          </div>

          {/* Card 4: Video from a link */}
          <div
            onClick={() => onOpenCreate({ mode: "link" })}
            className="bg-white hover:border-sky-300 p-4 rounded-2xl border border-zinc-200 shadow-2xs cursor-pointer transition-all duration-200 group flex flex-col justify-between h-40"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link2 className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-zinc-900 group-hover:text-sky-700 transition">
                  Video from a link
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                YouTube, TikTok or a podcast.
              </p>
            </div>

            {/* Floating badges mockup */}
            <div className="flex items-center justify-end gap-1.5 pr-2 pt-2">
              <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shadow-xs">
                🌐
              </div>
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] shadow-sm">
                🎵
              </div>
              <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                ▶
              </div>
            </div>
          </div>
        </div>

        {/* Browse all tools link */}
        <div className="pt-1">
          <button
            onClick={() => onOpenCreate({})}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition"
          >
            <span>Browse all tools</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section: Viral videos to remix today */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-950">
                Viral videos to remix today
              </h2>
              <p className="text-xs text-zinc-500">
                From your topics. Open one to see how to make it yours.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-zinc-400">
                <button className="p-1 rounded-full hover:bg-zinc-200 text-zinc-600 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 rounded-full hover:bg-zinc-200 text-zinc-600 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => onOpenCreate({})}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-950 transition"
              >
                See more
              </button>
            </div>
          </div>

          {/* Real API Status Message if error occurred */}
          {apiError && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>API Status: {apiError}</span>
              </div>
              <button
                onClick={fetchTrendingVideos}
                className="flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 underline ml-2"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loadingVideos && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl aspect-[9/14] bg-zinc-100 border border-zinc-200 animate-pulse flex flex-col justify-between p-4"
                >
                  <div className="h-4 w-16 bg-zinc-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-zinc-200 rounded" />
                    <div className="h-4 w-2/3 bg-zinc-200 rounded" />
                    <div className="h-9 w-full bg-zinc-200 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingVideos && trendingVideos.length === 0 && !apiError && (
            <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 p-6 space-y-2">
              <p className="text-sm font-bold text-zinc-900">No trending videos found</p>
              <p className="text-xs text-zinc-500">Live API returned no posts for current query.</p>
              <button
                onClick={fetchTrendingVideos}
                className="mt-2 px-4 py-1.5 bg-zinc-950 text-white rounded-full text-xs font-semibold hover:bg-zinc-800 transition"
              >
                Reload Live Feed
              </button>
            </div>
          )}

          {/* Real Live Viral Video Cards */}
          {!loadingVideos && trendingVideos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {trendingVideos.slice(0, 8).map((video) => {
                const isSaved = bookmarked[video.id];
                const isRemixing = remixingId === video.id;

                return (
                  <div
                    key={video.id}
                    onClick={() => handleRemixLive(video)}
                    className="group relative rounded-2xl overflow-hidden aspect-[9/14] bg-zinc-900 border border-zinc-200 shadow-sm cursor-pointer transform hover:-translate-y-1 transition duration-200 flex flex-col justify-between p-3.5"
                  >
                    {/* Background poster */}
                    <img
                      src={video.coverUrl}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />

                    {/* Bookmark Icon & Platform / Views */}
                    <div className="relative z-10 flex items-center justify-between">
                      <button
                        onClick={(e) => toggleBookmark(video.id, e)}
                        className={`p-1.5 rounded-full backdrop-blur-md transition ${
                          isSaved
                            ? "bg-yellow-400 text-black"
                            : "bg-black/40 text-white hover:bg-black/70"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
                          {video.platform || "video"}
                        </span>
                        <span className="text-[10px] font-mono text-white/90 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full">
                          {formatViews(video.views)}
                        </span>
                      </div>
                    </div>

                    {/* Title & Remix Action */}
                    <div className="relative z-10 space-y-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                        {video.title}
                      </h3>

                      <button
                        disabled={isRemixing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemixLive(video);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition disabled:opacity-75"
                      >
                        {isRemixing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            <span>Remixing Script...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Remix this video</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat / Help Bubble in bottom-right */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          className="w-11 h-11 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white shadow-xl flex items-center justify-center transition transform hover:scale-105 active:scale-95"
          title="Need help?"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}
