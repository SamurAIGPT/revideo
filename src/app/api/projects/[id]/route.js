import { NextResponse } from "next/server";
import { DBService } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET(req, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing project ID" }, { status: 400 });
    }

    const project = await DBService.getProjectById(id, user.id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (err) {
    console.error("[PROJECTS/[ID]/GET] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to load project" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
    const body = await req.json().catch(() => null);

    if (!id || !body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Missing project ID" }, { status: 400 });
    }

    const saved = await DBService.saveProject({ ...body, id }, user.id);
    return NextResponse.json({ success: true, project: saved });
  } catch (err) {
    console.error("[PROJECTS/[ID]/PUT] Error:", err);
    if (err.message === "Invalid project data") {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    if (err.message === "Project not found") {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Failed to save project" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing project ID" }, { status: 400 });
    }

    const deleted = await DBService.deleteProject(id, user.id);
    return deleted
      ? NextResponse.json({ success: true, message: "Project deleted" })
      : NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  } catch (err) {
    console.error("[PROJECTS/[ID]/DELETE] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}
