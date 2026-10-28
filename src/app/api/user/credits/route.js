import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DBService } from "@/lib/db";

async function getEmail(req) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) return session.user.email;
  } catch {}
  return req?.cookies?.get("revid_user_email")?.value || null;
}

export async function GET(req) {
  try {
    const email = await getEmail(req);

    if (!email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const credits = await DBService.getCredits(email);
    return NextResponse.json({ success: true, email, credits });
  } catch (err) {
    console.error("[CREDITS/GET] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const email = await getEmail(req);

    if (!email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action = "deduct", amount = 5, reason = "AI Generation" } = body;

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid credit amount specified" },
        { status: 400 }
      );
    }

    if (action === "deduct") {
      try {
        const result = await DBService.deductCredits(email, numAmount);
        return NextResponse.json({
          success: true,
          action: "deduct",
          deducted: numAmount,
          credits: result.credits,
          user: result.user,
          reason,
        });
      } catch (deductErr) {
        return NextResponse.json(
          { error: deductErr.message, insufficient: true },
          { status: 402 }
        );
      }
    } else if (action === "topup" || action === "add") {
      const result = await DBService.addCredits(email, numAmount);
      return NextResponse.json({
        success: true,
        action: "topup",
        added: numAmount,
        credits: result.credits,
        user: result.user,
        reason,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[CREDITS/POST] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update credits" },
      { status: 500 }
    );
  }
}
