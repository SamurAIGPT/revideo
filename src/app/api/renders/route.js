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

export async function POST(req) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json();

    const render = await DBService.createRender({
      projectId: body.projectId || null,
      userId: user?.id || null,
      durationSeconds: body.durationSeconds || null,
      videoUrl: body.videoUrl || null,
      fileSizeBytes: body.fileSizeBytes || null,
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
