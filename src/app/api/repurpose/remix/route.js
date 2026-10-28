import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { DBService } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { checkUserRateLimit } from "@/lib/server-rate-limit";

const MUAPI_URL = process.env.MU_API_BASE_URL || "https://api.muapi.ai";
const MUAPI_KEY = process.env.MUAPIAPP_API_KEY || "";

function toScenes(script) {
  if (Array.isArray(script?.scenes)) return script.scenes.slice(0, 10);

  const scenes = [];
  if (typeof script?.hook === "string" && script.hook.trim()) {
    scenes.push({
      id: `sc-remix-hook-${Date.now()}`,
      badge: "HOOK ⚡",
      narration: script.hook.trim().slice(0, 1000),
      visualId: "clip-1",
      durationSeconds: 5,
    });
  }

  if (Array.isArray(script?.body)) {
    script.body.slice(0, 8).forEach((section, index) => {
      const narration = typeof section === "string" ? section : section?.audio || section?.text;
      if (typeof narration !== "string" || !narration.trim()) return;
      scenes.push({
        id: `sc-remix-body-${index}-${Date.now()}`,
        badge: `POINT #${index + 1}`,
        narration: narration.trim().slice(0, 1000),
        visualId: `clip-${(index % 3) + 1}`,
        durationSeconds: 7,
      });
    });
  }

  if (typeof script?.call_to_action === "string" && script.call_to_action.trim()) {
    scenes.push({
      id: `sc-remix-cta-${Date.now()}`,
      badge: "ACTION 🔥",
      narration: script.call_to_action.trim().slice(0, 1000),
      visualId: "clip-3",
      durationSeconds: 5,
    });
  }

  if (scenes.length === 0 && typeof script?.full_script_text === "string" && script.full_script_text.trim()) {
    scenes.push({
      id: `sc-remix-script-${Date.now()}`,
      badge: "SCRIPT",
      narration: script.full_script_text.trim().slice(0, 1000),
      visualId: "clip-1",
      durationSeconds: 10,
    });
  }

  return scenes;
}

export async function POST(req) {
  let userId = null;
  let charge = null;
  let refunded = false;
  let refundTransactionId = null;

  const refundCharge = async () => {
    if (!userId || !charge || refunded) return;
    await DBService.addCredits(
      userId,
      5,
      "Refunded failed remix generation",
      "refund",
      refundTransactionId
    );
    refunded = true;
  };

  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const rateLimitResponse = await checkUserRateLimit(user.id, "repurpose-remix", 8);
    if (rateLimitResponse) return rateLimitResponse;
    userId = user.id;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid remix request" }, { status: 400 });
    }

    const {
      reference_hook = "",
      title = "Viral Short Video",
      niche = "Marketing & SaaS",
      platform = "tiktok",
      duration = 30,
    } = body;

    const cleanTitle = typeof title === "string" ? title.trim().slice(0, 200) : "";
    const cleanHook = typeof reference_hook === "string" ? reference_hook.trim().slice(0, 1000) : "";
    const cleanNiche = typeof niche === "string" ? niche.trim().slice(0, 120) : "Marketing & SaaS";
    const cleanPlatform = ["tiktok", "instagram", "youtube"].includes(platform) ? platform : "tiktok";
    const requestedDuration = Number(duration);
    const cleanDuration = Number.isFinite(requestedDuration)
      ? Math.max(10, Math.min(90, Math.round(requestedDuration)))
      : 30;

    if (!cleanTitle) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!MUAPI_KEY) {
      return NextResponse.json(
        { error: "MUAPIAPP_API_KEY is not configured in environment" },
        { status: 500 }
      );
    }

    charge = await DBService.deductCredits(userId, 5, "Video remix script generation");
    refundTransactionId = `remix-refund-${randomUUID()}`;

    // Call live MuAPI endpoint: /api/v1/generate-social-video-script
    const response = await fetch(`${MUAPI_URL}/api/v1/generate-social-video-script`, {
      method: "POST",
      signal: AbortSignal.timeout(12000),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": MUAPI_KEY,
      },
      body: JSON.stringify({
        title: cleanTitle,
        niche: cleanNiche || "Marketing & SaaS",
        platform: cleanPlatform,
        duration: cleanDuration,
        reference_hook: cleanHook || cleanTitle,
      }),
    });

    if (!response.ok) {
      await refundCharge();
      return NextResponse.json(
        { error: "Remix script provider request failed" },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data.request_id) {
      const scenes = toScenes(data);
      if (scenes.length === 0) {
        await refundCharge();
        return NextResponse.json({ error: "Remix script provider returned no usable scenes" }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        script: data,
        scenes,
        title: data.title || cleanTitle,
        credits: charge.credits,
      });
    }

    // Bound provider polling so the request can return or refund before serverless timeouts.
    const requestId = data.request_id;
    const pollDeadline = Date.now() + 10000;
    for (let i = 0; i < 6 && Date.now() < pollDeadline; i++) {
      await new Promise((r) => setTimeout(r, Math.min(1000, Math.max(0, pollDeadline - Date.now()))));
      const remainingMs = pollDeadline - Date.now();
      if (remainingMs <= 0) break;
      const pollRes = await fetch(`${MUAPI_URL}/api/v1/predictions/${encodeURIComponent(requestId)}/result`, {
        headers: { "x-api-key": MUAPI_KEY },
        signal: AbortSignal.timeout(Math.min(2500, remainingMs)),
      });
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        const scenes = toScenes(pollData);
        if (scenes.length > 0) {
          return NextResponse.json({
            success: true,
            script: pollData,
            scenes,
            full_text: pollData.full_script_text,
            title: pollData.title || cleanTitle,
            credits: charge.credits,
          });
        }
      }
    }

    await refundCharge();
    return NextResponse.json(
      { error: "MuAPI prediction timed out while generating script" },
      { status: 504 }
    );
  } catch (err) {
    if (charge && !refunded) {
      try {
        await refundCharge();
      } catch (refundError) {
        console.error("Remix credit refund failed:", refundError);
      }
    }
    if (err.message?.startsWith("Insufficient credits.")) {
      return NextResponse.json({ error: err.message, insufficient: true }, { status: 402 });
    }
    console.error("Remix API error:", err);
    return NextResponse.json({ error: "Failed to generate remix script" }, { status: 500 });
  }
}
