import { connection, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET() {
  await connection();
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name || "Creator",
        email: user.email,
        image: user.image || null,
        credits: user.credits ?? 0,
      },
    });
  } catch (err) {
    if (err?.digest?.includes?.("PRERENDER")) {
      throw err;
    }
    console.error("[AUTH/ME] Error:", err);
    return NextResponse.json(
      { authenticated: false, error: "Failed to load user" },
      { status: 500 }
    );
  }
}
