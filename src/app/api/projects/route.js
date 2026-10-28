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
    const projects = await DBService.getProjects(user?.id || null);
    return NextResponse.json({ success: true, projects });
  } catch (err) {
    console.error("[PROJECTS/GET] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json();

    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    const saved = await DBService.saveProject(body, user?.id || null);
    return NextResponse.json({ success: true, project: saved });
  } catch (err) {
    console.error("[PROJECTS/POST] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    const deleted = await DBService.deleteProject(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    console.error("[PROJECTS/DELETE] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
