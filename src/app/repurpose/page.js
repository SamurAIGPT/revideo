"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/home/Sidebar";
import { CreateModal } from "@/components/home/CreateModal";
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  X,
  Play,
  Heart,
  MessageSquare,
  Eye,
  Info,
  Edit2,
  Grid,
  BarChart2,
  ArrowRight,
  Check,
  ChevronDown,
} from "lucide-react";
import { saveProject } from "@/lib/supabase";

export default function RepurposePage() {
  const router = useRouter();

  // Navigation & Modals
  const [activeNav, setActiveNav] = useState("repurpose");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialData, setCreateInitialData] = useState(null);

  // Topics State
  const [topics, setTopics] = useState(["#startup"]);
  const [isEditingTopics, setIsEditingTopics] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState("");

  // Filters State
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    "instagram",
    "tiktok",
    "youtube",
  ]);
  const [minLikes, setMinLikes] = useState(10000);
  const [maxDuration, setMaxDuration] = useState(900); // 15m
  const [dateRange, setDateRange] = useState("Mar 13, 2025 - Sep 11, 2028");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'stats'

  // Search input
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingSpecific, setIsSearchingSpecific] = useState(false);

  // Videos Data, Errors & Loading
  const [videos, setVideos] = useState([]);
  const [apiErrors, setApiErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredVideoId, setHoveredVideoId] = useState(null);
  const [remixingId, setRemixingId] = useState(null);

  // Fetch Repurpose Videos from our live Next.js API
  const fetchVideos = async () => {
    setLoading(true);
    setApiErrors([]);
    try {
      const res = await fetch("/api/repurpose/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          query: searchQuery || topics[0] || "startup",
          min_likes: minLikes,
          max_duration: maxDuration,
          count: 12,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setVideos(data.videos || []);
        if (data.errors) {
          setApiErrors(data.errors);
        }
      } else {
        setApiErrors([
          {
            platform: "general",
            error: data.error || "Failed to load live videos",
          },
        ]);
      }
    } catch (err) {
      console.error("Fetch repurpose error:", err);
      setApiErrors([{ platform: "general", error: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [selectedPlatforms, minLikes, maxDuration]);

  // Format numbers for views/likes (e.g. 76k, 1m)
  const formatStat = (num) => {
    if (!num) return "0";
    if (num >= 1000000)
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
    if (num >= 1000) return (num / 1000).toFixed(0) + "k";
    return String(num);
  };

  // Format seconds to mm:ss
  const formatDuration = (sec) => {
    if (!sec) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Live Remix Video Action using MuAPI script generator
  const handleRemix = async (video) => {
    setRemixingId(video.id);
    try {
      const res = await fetch("/api/repurpose/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_hook: video.title,
          title: video.title,
          platform: video.platform,
          duration: 30,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.scenes && data.scenes.length > 0) {
          const newProjectId = `proj_remix_${Date.now()}`;
          await saveProject({
            id: newProjectId,
            title: data.title || video.title || "Remixed Video",
            scenes: data.scenes,
            aspect_ratio: "9:16",
            duration_seconds: 30,
          });
          sessionStorage.setItem(
            "revid_pending_remix",
            JSON.stringify({
              title: data.title || video.title,
              scenes: data.scenes,
            })
          );
          router.push(`/editor/new?remix=active&projectId=${newProjectId}`);
          return;
        }
      }
    } catch (err) {
      console.warn("Live remix error:", err);
    } finally {
      setRemixingId(null);
    }

    // Fallback to loading the video directly into editor
    router.push(`/editor/new?template=${video.id}`);
  };

  // Open Create Modal
  const handleOpenCreate = (data = {}) => {
    setCreateInitialData(data);
    setIsCreateOpen(true);
  };

  // Add / remove topic
  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicInput.trim()) return;
    const formatted = newTopicInput.startsWith("#")
      ? newTopicInput.trim()
      : `#${newTopicInput.trim()}`;
    if (!topics.includes(formatted)) {
      setTopics([...topics, formatted]);
    }
    setNewTopicInput("");
    setIsEditingTopics(false);
    fetchVideos();
  };

  const handleRemoveTopic = (t) => {
    setTopics(topics.filter((item) => item !== t));
  };

  // Separate vertical videos (Instagram, TikTok) from horizontal (YouTube)
  const verticalVideos = videos.filter((v) => v.platform !== "youtube");
  const youtubeVideos = videos.filter((v) => v.platform === "youtube");

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#fbfbfb] text-zinc-900 font-sans select-none">
      {/* 1:1 Revid.ai Left Sidebar */}
      <Sidebar
        activeNav="repurpose"
        setActiveNav={(nav) => {
          if (nav === "home") router.push("/");
          else if (nav === "search" || nav === "viral-search") router.push("/search");
          else if (nav === "videos") router.push("/editor/new");
        }}
        onOpenCreate={() => handleOpenCreate({})}
        userCredits={-10}
      />

      {/* Main Repurpose Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#fafafa] p-6 lg:p-10 custom-scrollbar relative">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Title & Subtitle + Search specific videos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
                  Videos ready to repurpose
                </h1>
                <span
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  title="Viral posts from your topics across YouTube, Instagram, TikTok and more"
                >
                  <Info className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 font-normal">
                Viral posts from your topics across YouTube, Instagram, TikTok
                and more. Click any post to remix it.
              </p>
            </div>

            {/* Search specific videos button */}
            <div className="flex-shrink-0">
              {isSearchingSpecific ? (
                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-3 py-1.5 shadow-xs">
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchVideos()}
                    placeholder="Search keywords..."
                    autoFocus
                    className="text-xs bg-transparent focus:outline-none w-44"
                  />
                  <button
                    onClick={() => {
                      setIsSearchingSpecific(false);
                      setSearchQuery("");
                      fetchVideos();
                    }}
                  >
                    <X className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-700" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchingSpecific(true)}
                  className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 rounded-full text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition"
                >
                  <span>Search specific videos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Topics Row */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-medium">Topics</span>
            <button
              onClick={() => setIsEditingTopics(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium text-[11px] shadow-2xs transition"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit</span>
            </button>

            {topics.map((topic, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-medium text-[11px] flex items-center gap-1"
              >
                <span>{topic}</span>
                {topics.length > 1 && (
                  <button onClick={() => handleRemoveTopic(topic)}>
                    <X className="w-2.5 h-2.5 text-zinc-400 hover:text-zinc-700" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold shadow-2xs transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Filters</span>
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>

                {/* Filter Dropdown Popover */}
                {showFilterDropdown && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-zinc-200 shadow-xl p-4 z-40 space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                        Platforms
                      </span>
                      <div className="flex gap-1.5">
                        {["instagram", "tiktok", "youtube"].map((plat) => {
                          const isSel = selectedPlatforms.includes(plat);
                          return (
                            <button
                              key={plat}
                              onClick={() => {
                                if (isSel && selectedPlatforms.length > 1) {
                                  setSelectedPlatforms(
                                    selectedPlatforms.filter((p) => p !== plat),
                                  );
                                } else if (!isSel) {
                                  setSelectedPlatforms([
                                    ...selectedPlatforms,
                                    plat,
                                  ]);
                                }
                              }}
                              className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold capitalize transition border ${
                                isSel
                                  ? "bg-zinc-950 text-white border-zinc-950"
                                  : "bg-zinc-50 text-zinc-500 border-zinc-200"
                              }`}
                            >
                              {plat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Min Likes: {formatStat(minLikes)}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100000}
                        step={5000}
                        value={minLikes}
                        onChange={(e) => setMinLikes(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Max Duration: {Math.round(maxDuration / 60)} min
                      </span>
                      <input
                        type="range"
                        min={60}
                        max={1800}
                        step={60}
                        value={maxDuration}
                        onChange={(e) => setMaxDuration(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Active Filter Chips */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-700 font-medium text-[11px] shadow-2xs">
                <span>Min likes</span>
                <span className="font-semibold text-zinc-900">
                  {formatStat(minLikes)}
                </span>
                <button
                  onClick={() => setMinLikes(0)}
                  className="hover:text-zinc-950"
                >
                  <X className="w-3 h-3 text-zinc-400 hover:text-zinc-600" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-700 font-medium text-[11px] shadow-2xs">
                <span>Max duration</span>
                <span className="font-semibold text-zinc-900">
                  {Math.round(maxDuration / 60)}m
                </span>
                <button
                  onClick={() => setMaxDuration(0)}
                  className="hover:text-zinc-950"
                >
                  <X className="w-3 h-3 text-zinc-400 hover:text-zinc-600" />
                </button>
              </div>

              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-700 font-medium text-[11px] shadow-2xs">
                <span>Posting time</span>
                <span className="font-semibold text-zinc-900">{dateRange}</span>
                <button
                  onClick={() => setDateRange("")}
                  className="hover:text-zinc-950"
                >
                  <X className="w-3 h-3 text-zinc-400 hover:text-zinc-600" />
                </button>
              </div>
            </div>

            {/* Refresh and Clear All */}
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={fetchVideos}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eefaf3] hover:bg-[#e3f6ea] text-emerald-800 font-semibold border border-emerald-200 transition"
              >
                <RefreshCw
                  className={`w-3 h-3 text-emerald-600 ${loading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => {
                  setMinLikes(0);
                  setMaxDuration(0);
                  setSearchQuery("");
                  setSelectedPlatforms(["instagram", "tiktok", "youtube"]);
                  fetchVideos();
                }}
                className="text-zinc-400 hover:text-zinc-700 font-medium transition"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Repurpose-ready videos Section Header */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200/80">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-950">
                Repurpose-ready videos
              </span>
              <span className="text-xs text-zinc-400 font-normal">
                Matched to your topics and filters
              </span>
            </div>

            {/* Grid / Stats Toggle */}
            <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                  viewMode === "grid"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Grid className="w-3 h-3" />
                <span>Grid</span>
              </button>

              <button
                onClick={() => setViewMode("stats")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                  viewMode === "stats"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span>Stats</span>
              </button>
            </div>
          </div>

          {/* API Error Notification if any upstream provider returned error */}
          {apiErrors.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Info className="w-3.5 h-3.5" />
                <span>Live API Status:</span>
              </div>
              {apiErrors.map((err, i) => (
                <p key={i} className="text-[11px] text-amber-700">
                  <span className="font-semibold uppercase">
                    {err.platform}:
                  </span>{" "}
                  {err.error}
                </p>
              ))}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl overflow-hidden aspect-[9/15] bg-zinc-100 border border-zinc-200 animate-pulse flex flex-col justify-between p-4"
                >
                  <div className="h-5 w-20 bg-zinc-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-zinc-200 rounded" />
                    <div className="h-4 w-3/4 bg-zinc-200 rounded" />
                  </div>
                  <div className="h-8 w-full bg-zinc-200 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && (
            <div className="text-center py-16 bg-white border border-zinc-200 rounded-3xl p-8 space-y-3">
              <p className="text-sm font-bold text-zinc-900">No videos found</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No videos matched your active filters for "
                {searchQuery || topics[0]}". Try clearing filters or searching
                for another keyword.
              </p>
              <button
                onClick={() => {
                  setMinLikes(0);
                  setMaxDuration(0);
                  setSearchQuery("");
                  fetchVideos();
                }}
                className="px-4 py-2 bg-zinc-950 text-white rounded-full text-xs font-semibold hover:bg-zinc-800 transition"
              >
                Reset Filters & Search Again
              </button>
            </div>
          )}

          {/* Videos Feed Layout matching screenshot */}
          {!loading && videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
              {/* Column 1, 2, 3: Vertical Cards (Instagram, TikTok) */}
              {verticalVideos.map((video) => {
                const isHovered = hoveredVideoId === video.id;
                const isRemixing = remixingId === video.id;

                return (
                  <div
                    key={video.id}
                    onClick={() => handleRemix(video)}
                    onMouseEnter={() => setHoveredVideoId(video.id)}
                    onMouseLeave={() => setHoveredVideoId(null)}
                    className="group relative rounded-2xl overflow-hidden aspect-[9/15] bg-zinc-950 border border-zinc-200 shadow-sm cursor-pointer transform hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between p-3.5"
                  >
                    {/* Media (Video preview on hover, poster image default) */}
                    {isHovered && video.videoUrl ? (
                      <video
                        src={video.videoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={video.coverUrl}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-bold capitalize">
                        {video.platform === "instagram"
                          ? "📷 Instagram"
                          : "🎵 TikTok"}
                      </span>

                      {video.duration > 0 && (
                        <span className="px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-white rounded text-[10px] font-mono">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </div>

                    {/* Middle Hook / Text */}
                    <div className="relative z-10 my-auto text-center px-2">
                      <p className="text-white font-extrabold text-sm sm:text-base leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] line-clamp-4">
                        {video.title}
                      </p>
                    </div>

                    {/* Bottom Stats & Remix Button */}
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3 fill-current text-white/80" />
                          <span>{formatStat(video.views)}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-current text-rose-400" />
                          <span>{formatStat(video.likes)}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-white/80" />
                          <span>{video.comments}</span>
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemix(video);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-yellow-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Remix this video</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Column 4: YouTube Compact Horizontal Cards (matching right side of screenshot) */}
              <div className="flex flex-col gap-3.5">
                {youtubeVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => handleRemix(video)}
                    className="group relative rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-xs hover:border-zinc-400 cursor-pointer transition p-3 space-y-2.5 flex flex-col justify-between"
                  >
                    {/* Thumbnail */}
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-900">
                      <img
                        src={video.coverUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20" />

                      <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-md text-white rounded text-[9px] font-bold">
                        <span className="text-red-500">▶</span> YouTube
                      </div>

                      <div className="absolute bottom-1.5 right-2 px-1 py-0.5 bg-black/80 text-white rounded text-[9px] font-mono">
                        {formatDuration(video.duration)}
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-zinc-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
                      {video.title}
                    </h4>

                    {/* Stats & Remix Action */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className="flex items-center gap-1">
                          <Play className="w-2.5 h-2.5" />
                          <span>{formatStat(video.views)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5" />
                          <span>{formatStat(video.likes)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>{formatStat(video.comments)}</span>
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemix(video);
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full"
                      >
                        Remix →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Topics Modal */}
      {isEditingTopics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-zinc-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">Add Topic</h3>
              <button onClick={() => setIsEditingTopics(false)}>
                <X className="w-4 h-4 text-zinc-400 hover:text-zinc-700" />
              </button>
            </div>

            <form onSubmit={handleAddTopic} className="space-y-3">
              <input
                type="text"
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                placeholder="e.g. #ai, #growth, #ecommerce"
                autoFocus
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />

              <button
                type="submit"
                className="w-full py-2 bg-zinc-950 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Add Topic
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialData={createInitialData}
        onGenerate={(prompt, duration) => {
          router.push(
            `/editor/new?prompt=${encodeURIComponent(prompt)}&duration=${duration}`,
          );
        }}
      />
    </div>
  );
}
