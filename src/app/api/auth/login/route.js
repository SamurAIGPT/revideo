import { NextResponse } from "next/server";
import { DBService } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = body.email;

    if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required to sign in." },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();
    const name = body.name ? String(body.name).trim() : email.split("@")[0];
    const image = body.image || null;

    const user = await DBService.createOrGetUser({
      email,
      name,
      image,
      initialCredits: 50,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        credits: user.credits ?? 0,
      },
    });

    response.cookies.set("revid_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("[AUTH/LOGIN] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to log in" },
      { status: 500 }
    );
  }
}
