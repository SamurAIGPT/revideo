import { connection, NextResponse } from "next/server";
import { DBService } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET() {
  await connection();
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const credits = await DBService.getCredits(user.id);
    return NextResponse.json({ success: true, credits });
  } catch (err) {
    console.error("[CREDITS/GET] Error:", err);
    return NextResponse.json({ error: "Failed to load credits" }, { status: 500 });
  }
}
