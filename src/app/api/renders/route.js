import { NextResponse } from "next/server";
import { DBService } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || (body.projectId != null && typeof body.projectId !== "string")) {
      return NextResponse.json({ success: false, error: "Invalid render details" }, { status: 400 });
    }

    const durationSeconds = body.durationSeconds == null ? null : Number(body.durationSeconds);
    const fileSizeBytes = body.fileSizeBytes == null ? null : Number(body.fileSizeBytes);
    if (
      (durationSeconds !== null && (!Number.isFinite(durationSeconds) || durationSeconds <= 0)) ||
      (fileSizeBytes !== null && (!Number.isSafeInteger(fileSizeBytes) || fileSizeBytes <= 0))
    ) {
      return NextResponse.json({ success: false, error: "Invalid render details" }, { status: 400 });
    }

    const render = await DBService.createRender({
      projectId: body.projectId || null,
      userId: user.id,
      durationSeconds,
      videoUrl: typeof body.videoUrl === "string" ? body.videoUrl : null,
      fileSizeBytes,
    });

    return NextResponse.json({
      success: true,
      render: render
        ? {
            ...render,
            durationSeconds: render.durationSeconds ? Number(render.durationSeconds) : null,
            fileSizeBytes: render.fileSizeBytes ? Number(render.fileSizeBytes) : null,
          }
        : null,
    });
  } catch (err) {
    console.error("[RENDERS/POST] Error:", err);
    if (err.message === "Project not found") {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Failed to save render metadata" }, { status: 500 });
  }
}
