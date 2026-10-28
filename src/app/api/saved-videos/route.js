import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DBService } from "@/lib/db";

async function getSessionUser(req) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return await DBService.getUserByEmail(session.user.email);
    }
  } catch {}
  try {
    const email = req?.cookies?.get("revid_user_email")?.value;
    if (!email) return null;
    return await DBService.getUserByEmail(email);
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const user = await getSessionUser(req);
    const savedVideos = await DBService.getSavedVideos(user?.id || null);
    // Convert BigInt to number/string for JSON serialization
    const serialized = savedVideos.map((v) => ({
      ...v,
      views: Number(v.views || 0),
      likes: Number(v.likes || 0),
    }));
    return NextResponse.json({ success: true, videos: serialized });
  } catch (err) {
    console.error("[SAVED-VIDEOS/GET] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json();

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: "Video ID is required" },
        { status: 400 }
      );
    }

    const saved = await DBService.saveVideo(body, user?.id || null);
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "Video ID is required" },
        { status: 400 }
      );
    }

    const deleted = await DBService.removeSavedVideo(videoId, user?.id || null);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    console.error("[SAVED-VIDEOS/DELETE] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
