import { NextResponse } from "next/server";
import { DBService } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

    const savedVideos = await DBService.getSavedVideos(user.id);
    // Convert BigInt to number/string for JSON serialization
    const serialized = savedVideos.map((v) => ({
      ...v,
      views: Number(v.views || 0),
      likes: Number(v.likes || 0),
    }));
    return NextResponse.json({ success: true, videos: serialized });
  } catch (err) {
    console.error("[SAVED-VIDEOS/GET] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to load saved videos" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

    const body = await req.json().catch(() => null);

    if (!body || !["string", "number"].includes(typeof body.id) || !String(body.id).trim()) {
      return NextResponse.json(
        { success: false, error: "Video ID is required" },
        { status: 400 }
      );
    }

    const views = Number(body.views || 0);
    const likes = Number(body.likes || 0);
    if (!Number.isSafeInteger(views) || views < 0 || !Number.isSafeInteger(likes) || likes < 0) {
      return NextResponse.json({ success: false, error: "Invalid video statistics" }, { status: 400 });
    }
    if (
      (body.title != null && typeof body.title !== "string") ||
      (body.platform != null && typeof body.platform !== "string") ||
      (body.coverUrl != null && typeof body.coverUrl !== "string") ||
      (body.videoUrl != null && typeof body.videoUrl !== "string")
    ) {
      return NextResponse.json({ success: false, error: "Invalid video details" }, { status: 400 });
    }

    const saved = await DBService.saveVideo({ ...body, views, likes }, user.id);
    return NextResponse.json({
      success: true,
      video: {
        ...saved,
        views: Number(saved.views || 0),
        likes: Number(saved.likes || 0),
      },
    });
  } catch (err) {
    console.error("[SAVED-VIDEOS/POST] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to save video" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const platform = searchParams.get("platform");

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "Video ID is required" },
        { status: 400 }
      );
    }

    if (platform != null && (platform.length > 30 || !/^[a-z0-9_-]+$/i.test(platform))) {
      return NextResponse.json({ success: false, error: "Invalid platform" }, { status: 400 });
    }

    const deleted = await DBService.removeSavedVideo(videoId, user.id, platform);
    return NextResponse.json({ success: deleted }, { status: deleted ? 200 : 404 });
  } catch (err) {
    console.error("[SAVED-VIDEOS/DELETE] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to remove saved video" }, { status: 500 });
  }
}
