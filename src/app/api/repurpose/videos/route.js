import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const MUAPI_URL = process.env.MU_API_BASE_URL || "https://api.muapi.ai";
const MUAPI_KEY = process.env.MUAPIAPP_API_KEY || "";

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

// Fetch real YouTube videos using live YouTube Data API v3
async function fetchRealYouTubeVideos(query, count = 12, minLikes = 0, maxDuration = 900) {
  if (!YOUTUBE_API_KEY) {
    return { error: "YOUTUBE_API_KEY is not configured", videos: [] };
  }

  const cleanQuery = encodeURIComponent(query || "startup viral shorts");
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${count}&q=${cleanQuery}&type=video&key=${YOUTUBE_API_KEY}`;

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    return { error: `YouTube API Search error: ${errorText}`, videos: [] };
  }

  const searchData = await searchRes.json();
  const items = searchData.items || [];
  if (items.length === 0) {
    return { videos: [] };
  }

  const videoIds = items.map((i) => i.id?.videoId).filter(Boolean).join(",");
  const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;

  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) {
    const errorText = await detailsRes.text();
    return { error: `YouTube API Details error: ${errorText}`, videos: [] };
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
      authorName: v.snippet?.channelTitle || "Creator",
      authorHandle: v.snippet?.channelId || "",
      views,
      likes,
      comments,
      duration,
      coverUrl:
        v.snippet?.thumbnails?.maxres?.url ||
        v.snippet?.thumbnails?.high?.url ||
        v.snippet?.thumbnails?.medium?.url ||
        v.snippet?.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
      videoUrl: `/videos/clip-${(v.id.charCodeAt(0) % 3) + 1}.mp4`,
      youtubeWatchUrl: `https://www.youtube.com/watch?v=${v.id}`,
      publishedDate: v.snippet?.publishedAt ? new Date(v.snippet.publishedAt).toLocaleDateString() : "Recently",
      hashtags: v.snippet?.tags || [],
      scenes: [
        {
          id: `sc-yt-${v.id}-1`,
          badge: "HOOK ⚡",
          narration: v.snippet?.title ? `Watch this: ${v.snippet.title.slice(0, 80)}` : "Start with an unexpected revelation.",
          visualId: `clip-${(v.id.charCodeAt(0) % 3) + 1}`,
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
}

// Fetch real posts using live MuAPI social-search-posts
async function fetchRealMuApiPosts(platform, query, count = 12) {
  if (!MUAPI_KEY) {
    return { error: "MUAPIAPP_API_KEY is not configured", videos: [] };
  }

  try {
    const res = await fetch(`${MUAPI_URL}/api/v1/social-search-posts`, {
      method: "POST",
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

    const data = await res.json();
    if (!res.ok) {
      return { error: data?.error?.message || data?.detail || "MuAPI request failed", videos: [] };
    }

    if (data.request_id) {
      // Poll prediction task
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const poll = await fetch(`${MUAPI_URL}/api/v1/predictions/${data.request_id}/result`, {
          headers: { "x-api-key": MUAPI_KEY },
        });
        const pollData = await poll.json();
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
    return { error: err.message, videos: [] };
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      platforms = ["youtube"],
      query = "startup",
      min_likes = 0,
      max_duration = 0,
      count = 12,
    } = body;

    let realVideos = [];
    const errors = [];

    // Query live YouTube API
    if (platforms.includes("youtube")) {
      const ytResult = await fetchRealYouTubeVideos(query, count, min_likes, max_duration);
      if (ytResult.videos && ytResult.videos.length > 0) {
        realVideos.push(...ytResult.videos);
      }
      if (ytResult.error) {
        errors.push({ platform: "youtube", error: ytResult.error });
      }
    }

    // Query live MuAPI for TikTok / Instagram
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

    // Apply real filters if requested
    if (min_likes > 0) {
      realVideos = realVideos.filter((v) => v.likes >= min_likes);
    }
    if (max_duration > 0) {
      realVideos = realVideos.filter((v) => v.duration <= max_duration);
    }

    return NextResponse.json({
      success: true,
      videos: realVideos,
      total: realVideos.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Repurpose videos API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch live videos" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "viral";
    const platformParam = searchParams.get("platform") || "youtube";
    const platforms = platformParam.split(",").map((p) => p.trim());
    const count = Number(searchParams.get("count") || 12);
    const min_likes = Number(searchParams.get("min_likes") || 0);
    const max_duration = Number(searchParams.get("max_duration") || 0);

    let realVideos = [];
    const errors = [];

    // Query live YouTube API
    if (platforms.includes("youtube")) {
      const ytResult = await fetchRealYouTubeVideos(query, count, min_likes, max_duration);
      if (ytResult.videos && ytResult.videos.length > 0) {
        realVideos.push(...ytResult.videos);
      }
      if (ytResult.error) {
        errors.push({ platform: "youtube", error: ytResult.error });
      }
    }

    // Query live MuAPI for TikTok / Instagram
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

    if (min_likes > 0) {
      realVideos = realVideos.filter((v) => v.likes >= min_likes);
    }
    if (max_duration > 0) {
      realVideos = realVideos.filter((v) => v.duration <= max_duration);
    }

    return NextResponse.json({
      success: true,
      videos: realVideos,
      total: realVideos.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("GET /api/repurpose/videos error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch live videos" },
      { status: 500 }
    );
  }
}

