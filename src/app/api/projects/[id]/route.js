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

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing project ID" }, { status: 400 });
    }

    const project = await DBService.getProjectById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (err) {
    console.error("[PROJECTS/[ID]/GET] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing project ID" }, { status: 400 });
    }

    const saved = await DBService.saveProject({ ...body, id }, user?.id || null);
    return NextResponse.json({ success: true, project: saved });
  } catch (err) {
    console.error("[PROJECTS/[ID]/PUT] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing project ID" }, { status: 400 });
    }

    await DBService.deleteProject(id);
    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (err) {
    console.error("[PROJECTS/[ID]/DELETE] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
