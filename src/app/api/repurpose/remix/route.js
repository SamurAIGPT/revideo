import { NextResponse } from "next/server";

const MUAPI_URL = process.env.MU_API_BASE_URL || "https://api.muapi.ai";
const MUAPI_KEY = process.env.MUAPIAPP_API_KEY || "";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      reference_hook = "",
      title = "Viral Short Video",
      niche = "Marketing & SaaS",
      platform = "tiktok",
      duration = 30,
    } = body;

    if (!MUAPI_KEY) {
      return NextResponse.json(
        { error: "MUAPIAPP_API_KEY is not configured in environment" },
        { status: 500 }
      );
    }

    // Call live MuAPI endpoint: /api/v1/generate-social-video-script
    const response = await fetch(`${MUAPI_URL}/api/v1/generate-social-video-script`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": MUAPI_KEY,
      },
      body: JSON.stringify({
        title,
        niche: niche || "Marketing & SaaS",
        platform: platform.toLowerCase(),
        duration: Number(duration) || 30,
        reference_hook: reference_hook || title,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `MuAPI script generation error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.request_id) {
      return NextResponse.json({ script: data });
    }

    // Poll prediction result until completed (max 20 seconds)
    const requestId = data.request_id;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`${MUAPI_URL}/api/v1/predictions/${requestId}/result`, {
        headers: { "x-api-key": MUAPI_KEY },
      });
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        if (pollData.title && (pollData.body || pollData.hook)) {
          // Format into scenes for Remotion composition
          const scenes = [];
          if (pollData.hook) {
            scenes.push({
              id: `sc-ai-hook-${Date.now()}`,
              badge: "HOOK ⚡",
              narration: pollData.hook,
              visualId: "clip-1",
              durationSeconds: 5,
            });
          }

          if (Array.isArray(pollData.body)) {
            pollData.body.forEach((section, idx) => {
              scenes.push({
                id: `sc-ai-body-${idx}-${Date.now()}`,
                badge: `POINT #${idx + 1}`,
                narration: section.audio || section.text || "Key insight.",
                visualId: `clip-${(idx % 3) + 1}`,
                durationSeconds: 7,
              });
            });
          }

          if (pollData.call_to_action) {
            scenes.push({
              id: `sc-ai-cta-${Date.now()}`,
              badge: "ACTION 🔥",
              narration: pollData.call_to_action,
              visualId: "clip-3",
              durationSeconds: 5,
            });
          }

          return NextResponse.json({
            success: true,
            script: pollData,
            scenes,
            full_text: pollData.full_script_text,
            title: pollData.title,
          });
        }
      }
    }

    return NextResponse.json(
      { error: "MuAPI prediction timed out while generating script" },
      { status: 504 }
    );
  } catch (err) {
    console.error("Remix API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
