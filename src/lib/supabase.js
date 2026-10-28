import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes("placeholder")
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Helper to get all projects from Supabase PostgreSQL database via API
export async function getProjects() {
  try {
    const res = await fetch("/api/projects", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch projects");
    const data = await res.json();
    return data.projects || [];
  } catch (err) {
    console.error("[DB] Error fetching projects:", err.message);
    return [];
  }
}

// Helper to save or update a project into PostgreSQL video_projects table
export async function saveProject(project) {
  if (!project) return null;

  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!res.ok) throw new Error("Failed to save project");
    const data = await res.json();
    return data.project || project;
  } catch (err) {
    console.error("[DB] Error saving project:", err.message);
    return project;
  }
}

// Helper to delete project from PostgreSQL video_projects table
export async function deleteProject(id) {
  if (!id) return false;

  try {
    const res = await fetch(`/api/projects?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.error("[DB] Error deleting project:", err.message);
    return false;
  }
}
