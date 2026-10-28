import { NextResponse } from "next/server";
import { DBService } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

    const projects = await DBService.getProjects(user.id);
    return NextResponse.json({ success: true, projects });
  } catch (err) {
    console.error("[PROJECTS/GET] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to load projects" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

    const body = await req.json().catch(() => null);

    if (!body || typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    const saved = await DBService.saveProject(body, user.id);
    return NextResponse.json({ success: true, project: saved });
  } catch (err) {
    console.error("[PROJECTS/POST] Error:", err);
    if (err.message === "Invalid project data") {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    if (err.message === "Project not found") {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Failed to save project" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    const deleted = await DBService.deleteProject(id, user.id);
    return NextResponse.json(
      { success: deleted },
      { status: deleted ? 200 : 404 }
    );
  } catch (err) {
    console.error("[PROJECTS/DELETE] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}
