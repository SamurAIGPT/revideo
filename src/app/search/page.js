"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  X,
  Play,
  Heart,
  MessageSquare,
  Bookmark,
  ArrowRight,
  Info,
  Loader2,
  AlertCircle,
  Volume2,
  Check,
  Share2,
} from "lucide-react";
import { Sidebar } from "@/components/home/Sidebar";
import { CreateModal } from "@/components/home/CreateModal";

export default function RevidSearchPage() {
  const router = useRouter();

  // Search & Navigation States
  const [activeTab, setActiveTab] = useState("viral"); // "viral" | "ads"
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [apiErrors, setApiErrors] = useState([]);

  // Filter States
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["youtube", "tiktok", "instagram"]);
  const [maxDuration, setMaxDuration] = useState(900); // 15 mins (900s) default matching screenshot
  const [minLikes, setMinLikes] = useState(0);
  const [minViews, setMinViews] = useState(0);
  const [sortOrder, setSortOrder] = useState("relevance");
  const [excludeKeywords, setExcludeKeywords] = useState("");

  // Interaction States
  const [hoveredVideoId, setHoveredVideoId] = useState(null);
  const [remixingId, setRemixingId] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const filterRef = useRef(null);

  // Suggested Chips matching screenshot
  const suggestedChips = [
    "How to create a startup",
    "How to go viral on TikTok",
    "Best AI tools",
    "Create a personal brand",
  ];

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Hydrate bookmarks from PostgreSQL database table
  useEffect(() => {
    async function loadSavedVideos() {
      try {
        const res = await fetch("/api/saved-videos");
        if (res.ok) {
          const data = await res.json();
          if (data.videos) {
            setBookmarkedIds(new Set(data.videos.map((v) => String(v.videoId))));
          }
        }
      } catch (err) {
        console.error("Failed to load saved videos:", err);
      }
    }
    loadSavedVideos();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleBookmark = async (video, e) => {
    e.stopPropagation();
    const id = String(video.id);
    const isCurrentlySaved = bookmarkedIds.has(id);

    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    if (isCurrentlySaved) {
      showToast("Removed from saved collection");
      try {
        await fetch(`/api/saved-videos?videoId=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Error removing saved video:", err);
      }
    } else {
      showToast("Saved to your collection!");
      try {
        await fetch("/api/saved-videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: video.id,
            platform: video.platform || "youtube",
            title: video.title || "Saved Video",
            coverUrl: video.coverUrl || "",
            views: video.views || 0,
            likes: video.likes || 0,
            videoUrl: video.videoUrl || "",
          }),
        });
      } catch (err) {
        console.error("Error saving video to database:", err);
      }
    }
  };

  // Perform Live Search via /api/repurpose/search
  const executeSearch = async (overrideQuery = null, overrideTab = null) => {
    const queryToUse = overrideQuery !== null ? overrideQuery : searchQuery;
    const tabToUse = overrideTab !== null ? overrideTab : activeTab;

    if (!queryToUse.trim()) {
      showToast("Please enter a topic or keyword to search");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setApiErrors([]);

    try {
      const res = await fetch("/api/repurpose/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryToUse.trim(),
          mode: tabToUse === "ads" ? "ads" : "posts",
          platforms: selectedPlatforms,
          count: 16,
          min_likes: minLikes,
          min_views: minViews,
          max_duration: maxDuration,
          sort_order: sortOrder,
          exclude_keywords: excludeKeywords
            ? excludeKeywords.split(",").map((s) => s.trim())
            : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to search viral videos");
      }

      setVideos(data.videos || []);
      if (data.errors && data.errors.length > 0) {
        setApiErrors(data.errors);
      }
    } catch (err) {
      console.error("[SEARCH ERROR]:", err);
      setVideos([]);
      setApiErrors([{ platform: "search", error: err.message || "Failed to connect to search API" }]);
    } finally {
      setLoading(false);
    }
  };

  // Remix Video Action: generate script via MuAPI and navigate to /studio
  const handleRemix = async (video) => {
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
          topics: [searchQuery || "viral"],
        }),
      });

      const data = await res.json();
      if (res.ok && data.script) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("revid_pending_remix", JSON.stringify(data.script));
        }
        router.push("/editor/new?remix=active");
      } else {
        alert(`Failed to remix video: ${data.error || "MuAPI generation issue"}`);
      }
    } catch (err) {
      alert(`Remix error: ${err.message}`);
    } finally {
      setRemixingId(null);
    }
  };

  // Format Helper functions
  const formatStat = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:30";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Active filter count
  const activeFilterCount = (maxDuration > 0 ? 1 : 0) + (minLikes > 0 ? 1 : 0) + (minViews > 0 ? 1 : 0);

  const clearAllFilters = () => {
    setMaxDuration(0);
    setMinLikes(0);
    setMinViews(0);
    setSortOrder("relevance");
    setExcludeKeywords("");
    if (hasSearched) {
      executeSearch();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#fbfbfb] text-zinc-900 font-sans select-none">
      {/* 1:1 Revid.ai Left Sidebar */}
      <Sidebar
        activeNav="search"
        setActiveNav={(nav) => {
          if (nav === "home") router.push("/");
          else if (nav === "repurpose") router.push("/repurpose");
          else if (nav === "videos") router.push("/editor/new");
        }}
        onOpenCreate={() => setIsCreateOpen(true)}
        userCredits={-10}
      />

      {/* Main Search Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#fafafa] p-6 lg:p-10 custom-scrollbar relative">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-6 right-8 z-50 bg-zinc-950 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl animate-fade-in flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Title & Subtitle */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
                Search viral videos
              </h1>
              <span
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                title="Search any topic to find trending posts across platforms, then remix the best into your own short."
              >
                <Info className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 font-normal">
              Search any topic to find trending posts across platforms, then remix the best into your own short.
            </p>
          </div>

          {/* Big Search Box Container (matching screenshot) */}
          <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            {/* Top row: Tabs & note */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab("viral");
                    if (hasSearched) executeSearch(searchQuery, "viral");
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === "viral"
                      ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Viral posts</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("ads");
                    if (hasSearched) executeSearch(searchQuery, "ads");
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === "ads"
                      ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Ads</span>
                </button>
              </div>

              <span className="text-xs text-zinc-400">
                Trending posts across YouTube, Instagram, TikTok and more
              </span>
            </div>

            {/* Middle: Big Search Input */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") executeSearch();
                }}
                placeholder="Search topics, niches, or keywords..."
                className="w-full bg-zinc-50/60 border border-zinc-200/90 rounded-2xl pl-11 pr-14 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white shadow-2xs transition"
              />
              <button
                onClick={() => executeSearch()}
                disabled={loading}
                className="absolute right-2 p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white transition flex items-center justify-center disabled:opacity-50"
                title="Search"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Bottom: Topic Chips */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {suggestedChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(chip);
                    executeSearch(chip);
                  }}
                  className="px-3 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 text-xs font-medium cursor-pointer transition shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar below search box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Filters Dropdown Button */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold shadow-2xs transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Filters</span>
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>

                {/* Filter Dropdown Popover */}
                {showFilterDropdown && (
                  <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl border border-zinc-200 shadow-xl p-4 z-40 space-y-4">
                    {/* Platforms */}
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                        Platforms
                      </span>
                      <div className="flex gap-1.5">
                        {["youtube", "tiktok", "instagram"].map((plat) => {
                          const isSel = selectedPlatforms.includes(plat);
                          return (
                            <button
                              key={plat}
                              onClick={() => {
                                if (isSel && selectedPlatforms.length > 1) {
                                  setSelectedPlatforms(selectedPlatforms.filter((p) => p !== plat));
                                } else if (!isSel) {
                                  setSelectedPlatforms([...selectedPlatforms, plat]);
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

                    {/* Max Duration Slider */}
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Max Duration: {maxDuration > 0 ? `${Math.round(maxDuration / 60)} min` : "Any"}
                      </span>
                      <input
                        type="range"
                        min={60}
                        max={1800}
                        step={60}
                        value={maxDuration || 900}
                        onChange={(e) => setMaxDuration(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    {/* Min Views */}
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Min Views: {formatStat(minViews)}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1000000}
                        step={50000}
                        value={minViews}
                        onChange={(e) => setMinViews(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    {/* Sort Order */}
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Sort Order
                      </span>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none"
                      >
                        <option value="relevance">Most relevant</option>
                        <option value="views">Most views</option>
                        <option value="likes">Most likes</option>
                        <option value="date">Newest</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setShowFilterDropdown(false);
                        if (hasSearched) executeSearch();
                      }}
                      className="w-full py-2 bg-zinc-950 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition"
                    >
                      Apply Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Active Filter Chips */}
              {maxDuration > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-700 font-medium text-[11px] shadow-2xs">
                  <span>Max duration</span>
                  <span className="font-semibold text-zinc-900">
                    {Math.round(maxDuration / 60)}m
                  </span>
                  <button
                    onClick={() => {
                      setMaxDuration(0);
                      if (hasSearched) executeSearch();
                    }}
                    className="hover:text-zinc-950"
                  >
                    <X className="w-3 h-3 text-zinc-400 hover:text-zinc-600" />
                  </button>
                </div>
              )}

              {minViews > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-700 font-medium text-[11px] shadow-2xs">
                  <span>Min views</span>
                  <span className="font-semibold text-zinc-900">{formatStat(minViews)}</span>
                  <button
                    onClick={() => {
                      setMinViews(0);
                      if (hasSearched) executeSearch();
                    }}
                    className="hover:text-zinc-950"
                  >
                    <X className="w-3 h-3 text-zinc-400 hover:text-zinc-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Right side: Refresh & Clear All */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (hasSearched) executeSearch();
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-700 font-semibold text-xs transition"
              >
                <RefreshCw className="w-3 h-3 text-emerald-600" />
                <span>Refresh</span>
              </button>

              <button
                onClick={clearAllFilters}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* API Error Notification if any platform returned an error */}
          {apiErrors.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Live API Status:</span>
              </div>
              {apiErrors.map((err, i) => (
                <p key={i} className="text-[11px] text-amber-700">
                  <span className="font-semibold uppercase">{err.platform}:</span> {err.error}
                </p>
              ))}
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl aspect-[9/15] bg-zinc-100 border border-zinc-200 animate-pulse flex flex-col justify-between p-4"
                >
                  <div className="h-4 w-16 bg-zinc-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-zinc-200 rounded" />
                    <div className="h-4 w-3/4 bg-zinc-200 rounded" />
                  </div>
                  <div className="h-8 w-full bg-zinc-200 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* STATE 1: Empty Query / Initial Graphic matching screenshot */}
          {!hasSearched && !loading && (
            <div className="relative rounded-3xl border border-zinc-200/90 bg-gradient-to-b from-[#fbfdfc] via-white to-[#f4faf6] p-8 sm:p-14 shadow-2xs overflow-hidden">
              <div className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-8 relative z-10">
                {/* Mock Search Pill at top */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white rounded-full border border-zinc-200/90 shadow-sm text-xs text-zinc-400 font-mono">
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="w-0.5 h-3.5 bg-zinc-900 animate-pulse" />
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                    ↗
                  </span>
                </div>

                {/* Center Visual Mockup: Viral Cards + Phone Mockup + Remix Breakdown */}
                <div className="w-full relative py-6 flex items-center justify-center">
                  {/* Floating Background Cards with View Badges */}
                  <div className="absolute left-4 sm:left-12 top-2 w-28 sm:w-32 aspect-[9/14] bg-zinc-900 rounded-2xl overflow-hidden shadow-lg border border-white/20 transform -rotate-6 opacity-80 pointer-events-none">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                      940K
                    </div>
                  </div>

                  <div className="absolute right-4 sm:right-12 top-4 w-28 sm:w-32 aspect-[9/14] bg-zinc-900 rounded-2xl overflow-hidden shadow-lg border border-white/20 transform rotate-6 opacity-80 pointer-events-none">
                    <img
                      src="https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=400&auto=format&fit=crop&q=80"
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                      2.1M
                    </div>
                  </div>

                  {/* Center Phone & Remix Breakdown Card */}
                  <div className="relative z-20 flex flex-col sm:flex-row items-center gap-6 bg-white/90 backdrop-blur-md border border-zinc-200/80 rounded-3xl p-5 sm:p-7 shadow-xl">
                    {/* Phone Mockup */}
                    <div className="w-40 sm:w-44 aspect-[9/16] bg-zinc-950 rounded-[28px] p-2 border-4 border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                        ORIGINAL
                      </div>
                      <img
                        src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&auto=format&fit=crop&q=80"
                        className="absolute inset-0 w-full h-full object-cover opacity-75"
                        alt=""
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
                      <div className="relative z-10 text-[10px] text-white font-mono text-center pt-2">
                        1.3M views
                      </div>
                      <div className="relative z-10 text-[11px] text-white font-bold leading-tight pb-2 px-1">
                        Making viral videos in 2026
                      </div>
                    </div>

                    {/* Connecting Green Flow Line & Breakdown Card */}
                    <div className="space-y-3 text-left">
                      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <span className="font-bold text-zinc-800 uppercase tracking-wider">
                          REMIX
                        </span>
                        <span>1/4</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                          <span>Viral hook kept</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                          <span>Script rewritten</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                          <span>Voice + captions</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl">
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                          <span>Fresh visuals</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-900">
                    Discover what's working right now
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Type any niche, startup keyword, or topic in the box above to find high-performing videos, or pick one of the quick suggestions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: Empty Results State */}
          {hasSearched && !loading && videos.length === 0 && (
            <div className="text-center py-16 bg-white border border-zinc-200 rounded-3xl p-8 space-y-3">
              <p className="text-sm font-bold text-zinc-900">No videos found</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No videos matched your active filters for "{searchQuery}". Try adjusting your filters or searching for another keyword.
              </p>
              <button
                onClick={() => {
                  clearAllFilters();
                  executeSearch(searchQuery);
                }}
                className="px-4 py-2 bg-zinc-950 text-white rounded-full text-xs font-semibold hover:bg-zinc-800 transition"
              >
                Reset Filters & Search Again
              </button>
            </div>
          )}

          {/* STATE 3: Results Grid */}
          {hasSearched && !loading && videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-16">
              {videos.map((video) => {
                const isHovered = hoveredVideoId === video.id;
                const isRemixing = remixingId === video.id;
                const isSaved = bookmarkedIds.has(String(video.id));

                return (
                  <div
                    key={video.id}
                    onClick={() => handleRemix(video)}
                    onMouseEnter={() => setHoveredVideoId(video.id)}
                    onMouseLeave={() => setHoveredVideoId(null)}
                    className="group relative rounded-2xl overflow-hidden aspect-[9/15] bg-zinc-950 border border-zinc-200 shadow-sm cursor-pointer transform hover:-translate-y-1 transition duration-200 flex flex-col justify-between p-3.5"
                  >
                    {/* Media Preview / Poster */}
                    <img
                      src={video.coverUrl}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />

                    {/* Top Row: Platform Badge, Duration & Bookmark Button */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full">
                          {video.platform === "youtube" ? "▶ YouTube" : video.platform}
                        </span>
                        {video.duration > 0 && (
                          <span className="text-[10px] font-mono text-white/90 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => toggleBookmark(video, e)}
                        className={`p-1.5 rounded-full backdrop-blur-md transition ${
                          isSaved
                            ? "bg-yellow-400 text-black"
                            : "bg-black/40 text-white hover:bg-black/70"
                        }`}
                        title={isSaved ? "Saved" : "Save video"}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    {/* Bottom Row: Stats, Title & Remix Button */}
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center gap-2 text-white/90 text-[11px] font-mono drop-shadow">
                        <span className="flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-current text-white/80" />
                          <span>{formatStat(video.views)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-current text-rose-400" />
                          <span>{formatStat(video.likes)}</span>
                        </span>
                        {video.comments > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5 text-white/80" />
                            <span>{formatStat(video.comments)}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                        {video.title}
                      </h3>

                      <button
                        disabled={isRemixing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemix(video);
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
      </main>

      {/* Create Modal */}
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        initialData={{ prompt: searchQuery }}
        onSubmit={async (prompt, duration) => {
          setIsCreateOpen(false);
          router.push(`/editor/new?prompt=${encodeURIComponent(prompt)}&duration=${duration}`);
        }}
      />
    </div>
  );
}
