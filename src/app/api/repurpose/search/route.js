import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { checkUserRateLimit } from "@/lib/server-rate-limit";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const MUAPI_URL = process.env.MU_API_BASE_URL || "https://api.muapi.ai";
const MUAPI_KEY = process.env.MUAPIAPP_API_KEY || "";

function clampInteger(value, fallback, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.trunc(number))) : fallback;
}

function normalizePlatforms(platforms) {
  if (!Array.isArray(platforms)) return ["youtube"];
  return [...new Set(platforms.filter((platform) => ["youtube", "tiktok", "instagram"].includes(platform)))];
}

// Parse YouTube duration string (e.g. PT2M58S, PT19S, PT1H2M) into seconds
function parseYouTubeDuration(isoDuration) {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// Fetch live YouTube videos with sort & keyword support
async function fetchRealYouTubeVideos(query, count = 15, sortOrder = "relevance", minLikes = 0, maxDuration = 0, mode = "posts") {
  if (!YOUTUBE_API_KEY) {
    return { error: "YOUTUBE_API_KEY is not configured", videos: [] };
  }

  let searchQuery = query || "startup";
  if (mode === "ads") {
    searchQuery = `${searchQuery} ad commercial sponsor`;
  }

  let ytOrder = "relevance";
  if (sortOrder === "views" || sortOrder === "Most views") ytOrder = "viewCount";
  else if (sortOrder === "likes" || sortOrder === "Most likes") ytOrder = "rating";
  else if (sortOrder === "date" || sortOrder === "Newest") ytOrder = "date";

  const cleanQuery = encodeURIComponent(searchQuery);
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${count}&q=${cleanQuery}&type=video&order=${ytOrder}&key=${YOUTUBE_API_KEY}`;

  try {
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    if (!searchRes.ok) {
      console.error("YouTube search request failed with status:", searchRes.status);
      return { error: "YouTube search request failed", videos: [] };
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];
    if (items.length === 0) {
      return { videos: [] };
    }

    const videoIds = items.map((i) => i.id?.videoId).filter(Boolean).join(",");
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;

    const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(10000) });
    if (!detailsRes.ok) {
      console.error("YouTube details request failed with status:", detailsRes.status);
      return { error: "YouTube details request failed", videos: [] };
    }

    const detailsData = await detailsRes.json();
    const details = detailsData.items || [];

    const normalized = details.map((v) => {
      const duration = parseYouTubeDuration(v.contentDetails?.duration);
      const views = parseInt(v.statistics?.viewCount || 0, 10);
      const likes = parseInt(v.statistics?.likeCount || 0, 10);
      const comments = parseInt(v.statistics?.commentCount || 0, 10);

      return {
        id: v.id,
        platform: "youtube",
        title: v.snippet?.title || "YouTube Video",
        authorName: v.snippet?.channelTitle || "YouTube Creator",
        authorHandle: v.snippet?.channelId || "",
        views,
        likes,
        comments,
        duration,
        coverUrl:
          v.snippet?.thumbnails?.maxres?.url ||
          v.snippet?.thumbnails?.high?.url ||
          v.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        videoUrl: "/videos/clip-2.mp4",
        youtubeWatchUrl: `https://www.youtube.com/watch?v=${v.id}`,
        publishedDate: v.snippet?.publishedAt
          ? new Date(v.snippet.publishedAt).toLocaleDateString()
          : "Recently",
        hashtags: v.snippet?.tags || [],
        scenes: [
          {
            id: `sc-yt-${v.id}-1`,
            badge: "HOOK ⚡",
            narration: `Watch this: ${v.snippet?.title || ""}`,
            visualId: "clip-2",
            durationSeconds: 5,
          },
          {
            id: `sc-yt-${v.id}-2`,
            badge: "CORE LESSON 💡",
            narration: "Deliver your highest value insight and explain the strategy directly.",
            visualId: "clip-2",
            durationSeconds: 6,
          },
        ],
      };
    });

    return { videos: normalized };
  } catch (err) {
    console.error("YouTube search request error:", err);
    return { error: "YouTube search is temporarily unavailable", videos: [] };
  }
}

// Fetch live TikTok / Instagram posts using MuAPI
async function fetchRealMuApiPosts(platform, query, count = 12) {
  if (!MUAPI_KEY || MUAPI_KEY.includes("placeholder")) {
    return { error: "MUAPI key is not configured", videos: [] };
  }

  try {
    const res = await fetch(`${MUAPI_URL}/api/v1/social-search-posts`, {
      method: "POST",
      signal: AbortSignal.timeout(6000),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": MUAPI_KEY,
      },
      body: JSON.stringify({
        platform,
        query: query || "startup",
        limit: count,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("MuAPI social search failed with status:", res.status);
      return { error: "Social video search request failed", videos: [] };
    }

    if (data.request_id) {
      // Keep provider polling bounded so multi-platform searches can return in time.
      const pollDeadline = Date.now() + 6000;
      for (let i = 0; i < 5 && Date.now() < pollDeadline; i++) {
        await new Promise((r) => setTimeout(r, Math.min(750, Math.max(0, pollDeadline - Date.now()))));
        const remainingMs = pollDeadline - Date.now();
        if (remainingMs <= 0) break;
        const poll = await fetch(`${MUAPI_URL}/api/v1/predictions/${encodeURIComponent(data.request_id)}/result`, {
          headers: { "x-api-key": MUAPI_KEY },
          signal: AbortSignal.timeout(Math.min(2000, remainingMs)),
        });
        const pollData = await poll.json().catch(() => ({}));
        if (poll.ok) {
          const list = Array.isArray(pollData) ? pollData : pollData?.results?.videos || pollData?.videos || [];
          if (list.length > 0) {
            return {
              videos: list.map((item, idx) => ({
                id: item.id || `mu-${idx}`,
                platform,
                title: item.title || item.text || item.description || "Trending Post",
                authorName: item.authorName || item.author || "Creator",
                authorHandle: item.authorHandle || "",
                views: Number(item.views || item.view_count || 0),
                likes: Number(item.likes || item.like_count || 0),
                comments: Number(item.comments || item.comment_count || 0),
                duration: Number(item.duration || 30),
                coverUrl: item.coverUrl || item.thumbnail || "",
                videoUrl: item.videoUrl || "/videos/clip-1.mp4",
                publishedDate: "Recently",
                hashtags: item.hashtags || [],
                scenes: [
                  {
                    id: `sc-mu-${idx}-1`,
                    badge: "HOOK ⚡",
                    narration: item.title || "Remix this trending concept with your own unique angle.",
                    visualId: "clip-1",
                    durationSeconds: 5,
                  },
                ],
              })),
            };
          }
        }
      }
    }

    return { videos: [] };
  } catch (err) {
    console.error("MuAPI social search request error:", err);
    return { error: "Social video search is temporarily unavailable", videos: [] };
  }
}

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const rateLimitResponse = await checkUserRateLimit(user.id, "repurpose-search", 20);
    if (rateLimitResponse) return rateLimitResponse;

    const parsedBody = await req.json().catch(() => ({}));
    const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody)
      ? parsedBody
      : {};
    const {
      query = "startup",
      mode = "posts", // "posts" or "ads"
      platforms: requestedPlatforms = ["youtube"],
      count: requestedCount = 15,
      min_views: requestedMinViews = 0,
      min_likes: requestedMinLikes = 0,
      max_duration: requestedMaxDuration = 0,
      sort_order: requestedSortOrder = "relevance",
      exclude_keywords = [],
    } = body;
    const cleanQuery = typeof query === "string" ? query.trim().slice(0, 200) : "";
    const platforms = normalizePlatforms(requestedPlatforms);
    const count = clampInteger(requestedCount, 15, 1, 25);
    const safeMode = mode === "ads" ? "ads" : "posts";
    const min_views = clampInteger(requestedMinViews, 0, 0, 1000000000);
    const min_likes = clampInteger(requestedMinLikes, 0, 0, 1000000000);
    const max_duration = clampInteger(requestedMaxDuration, 0, 0, 86400);
    const sort_order = typeof requestedSortOrder === "string" ? requestedSortOrder.slice(0, 30) : "relevance";

    if (!cleanQuery || platforms.length === 0) {
      return NextResponse.json({ error: "A query and supported platform are required" }, { status: 400 });
    }

    let realVideos = [];
    const errors = [];

    // 1. YouTube Live Query
    if (platforms.includes("youtube")) {
      const ytResult = await fetchRealYouTubeVideos(cleanQuery, count, sort_order, min_likes, max_duration, safeMode);
      if (ytResult.videos && ytResult.videos.length > 0) {
        realVideos.push(...ytResult.videos);
      }
      if (ytResult.error) {
        errors.push({ platform: "youtube", error: ytResult.error });
      }
    }

    // 2. MuAPI Live Queries (TikTok, Instagram)
    for (const plat of ["tiktok", "instagram"]) {
      if (platforms.includes(plat)) {
        const muResult = await fetchRealMuApiPosts(plat, cleanQuery, count);
        if (muResult.videos && muResult.videos.length > 0) {
          realVideos.push(...muResult.videos);
        }
        if (muResult.error) {
          errors.push({ platform: plat, error: muResult.error });
        }
      }
    }

    // Exclude keywords filter
    if (Array.isArray(exclude_keywords) && exclude_keywords.length > 0) {
      const exLower = exclude_keywords
        .filter((keyword) => typeof keyword === "string")
        .map((keyword) => keyword.trim().toLowerCase().slice(0, 80))
        .filter(Boolean);

      if (exLower.length > 0) {
        realVideos = realVideos.filter((v) => {
          const text = `${v.title || ""} ${(v.hashtags || []).join(" ")}`.toLowerCase();
          return !exLower.some((ex) => text.includes(ex));
        });
      }
    }

    // Min views filter
    if (min_views > 0) {
      realVideos = realVideos.filter((v) => v.views >= min_views);
    }

    // Min likes filter
    if (min_likes > 0) {
      realVideos = realVideos.filter((v) => v.likes >= min_likes);
    }

    // Max duration filter
    if (max_duration > 0) {
      realVideos = realVideos.filter((v) => v.duration <= max_duration);
    }

    // Sort order
    if (sort_order === "views" || sort_order === "Most views") {
      realVideos.sort((a, b) => b.views - a.views);
    } else if (sort_order === "likes" || sort_order === "Most likes") {
      realVideos.sort((a, b) => b.likes - a.likes);
    }

    return NextResponse.json({
      success: true,
      mode: safeMode,
      query: cleanQuery,
      videos: realVideos,
      total: realVideos.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("POST /api/repurpose/search error:", err);
    return NextResponse.json(
      { error: "Failed to search viral videos" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const rateLimitResponse = await checkUserRateLimit(user.id, "repurpose-search", 20);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || searchParams.get("query") || "startup").trim().slice(0, 200);
    const mode = searchParams.get("mode") || "posts";
    const platformParam = searchParams.get("platform") || searchParams.get("platforms") || "youtube";
    const platforms = normalizePlatforms(platformParam.split(",").map((platform) => platform.trim()));
    const count = clampInteger(searchParams.get("count") || 15, 15, 1, 25);
    const min_views = clampInteger(searchParams.get("min_views") || 0, 0, 0, 1000000000);
    const min_likes = clampInteger(searchParams.get("min_likes") || 0, 0, 0, 1000000000);
    const max_duration = clampInteger(searchParams.get("max_duration") || 0, 0, 0, 86400);
    const safeMode = mode === "ads" ? "ads" : "posts";

    if (!query || platforms.length === 0) {
      return NextResponse.json({ error: "A query and supported platform are required" }, { status: 400 });
    }
    const sort_order = searchParams.get("sort_order") || "relevance";

    let realVideos = [];
    const errors = [];

    if (platforms.includes("youtube")) {
      const ytResult = await fetchRealYouTubeVideos(query, count, sort_order, min_likes, max_duration, safeMode);
      if (ytResult.videos && ytResult.videos.length > 0) {
        realVideos.push(...ytResult.videos);
      }
      if (ytResult.error) {
        errors.push({ platform: "youtube", error: ytResult.error });
      }
    }

    for (const plat of ["tiktok", "instagram"]) {
      if (platforms.includes(plat)) {
        const muResult = await fetchRealMuApiPosts(plat, query, count);
        if (muResult.videos && muResult.videos.length > 0) {
          realVideos.push(...muResult.videos);
        }
        if (muResult.error) {
          errors.push({ platform: plat, error: muResult.error });
        }
      }
    }

    if (min_views > 0) {
      realVideos = realVideos.filter((v) => v.views >= min_views);
    }
    if (min_likes > 0) {
      realVideos = realVideos.filter((v) => v.likes >= min_likes);
    }
    if (max_duration > 0) {
      realVideos = realVideos.filter((v) => v.duration <= max_duration);
    }

    if (sort_order === "views" || sort_order === "Most views") {
      realVideos.sort((a, b) => b.views - a.views);
    } else if (sort_order === "likes" || sort_order === "Most likes") {
      realVideos.sort((a, b) => b.likes - a.likes);
    }

    return NextResponse.json({
      success: true,
      mode: safeMode,
      query,
      videos: realVideos,
      total: realVideos.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("GET /api/repurpose/search error:", err);
    return NextResponse.json(
      { error: "Failed to search viral videos" },
      { status: 500 }
    );
  }
}
