import { NextResponse } from "next/server";
import { BACKGROUND_MEDIA } from "@/lib/constants";
import { DBService } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { checkUserRateLimit } from "@/lib/server-rate-limit";

// Heuristic fallback script creator that can structure any prompt into viral scenes
function generateHeuristicScenes(prompt, targetDuration = 30) {
  const cleanPrompt = prompt.trim().replace(/^create (a )?video (about )?/i, "");
  const words = cleanPrompt.split(/\s+/).slice(0, 6).join(" ");
  const title = `The Truth About ${words || "Viral Success"}`;

  const availableMedia = BACKGROUND_MEDIA.map((m) => m.id);

  if (targetDuration <= 20) {
    return {
      title,
      scenes: [
        {
          id: `sc-${Date.now()}-1`,
          badge: "HOOK ⚡",
          narration: `Here is something about ${cleanPrompt} that almost nobody talks about.`,
          visualId: availableMedia[0] || "cyber-city",
          durationSeconds: 5,
        },
        {
          id: `sc-${Date.now()}-2`,
          badge: "THE SECRET",
          narration: `Most people focus on the wrong things. The real secret is consistency and doing what others avoid.`,
          visualId: availableMedia[1] || "matrix-code",
          durationSeconds: 6,
        },
        {
          id: `sc-${Date.now()}-3`,
          badge: "TAKE ACTION",
          narration: `If you agree with this, double tap and save this video for later.`,
          visualId: availableMedia[2] || "luxury-car",
          durationSeconds: 4,
        },
      ],
    };
  }

  return {
    title,
    scenes: [
      {
        id: `sc-${Date.now()}-1`,
        badge: "VIRAL HOOK ⚡",
        narration: `Wait. If you care about ${cleanPrompt}, this 30 second video might change everything for you.`,
        visualId: availableMedia[0] || "cyber-city",
        durationSeconds: 6,
      },
      {
        id: `sc-${Date.now()}-2`,
        badge: "STEP 1 🚀",
        narration: `First rule: eliminate the noise. Ninety percent of conventional advice is designed to keep you stuck in the average zone.`,
        visualId: availableMedia[1] || "matrix-code",
        durationSeconds: 8,
      },
      {
        id: `sc-${Date.now()}-3`,
        badge: "STEP 2 💡",
        narration: `Second: leverage modern tools and automation. When you multiply your output with smart workflows, speed becomes your superpower.`,
        visualId: availableMedia[2] || "stock-chart",
        durationSeconds: 9,
      },
      {
        id: `sc-${Date.now()}-4`,
        badge: "CALL TO ACTION 🔥",
        narration: `Save this post right now, share it with someone who needs this, and follow for daily game-changing insights.`,
        visualId: availableMedia[3] || "luxury-car",
        durationSeconds: 7,
      },
    ],
  };
}

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    const rateLimitResponse = await checkUserRateLimit(user.id, "generate-script", 12);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json().catch(() => null);
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const requestedDuration = Number(body?.duration ?? 30);
    const duration = Number.isFinite(requestedDuration)
      ? Math.max(10, Math.min(90, Math.round(requestedDuration)))
      : 30;

    if (!prompt || prompt.length > 1000) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let creditResult;
    try {
      creditResult = await DBService.deductCredits(user.id, 5, "AI script generation");
    } catch (err) {
      const insufficient = err.message?.startsWith("Insufficient credits.");
      return NextResponse.json(
        { error: insufficient ? err.message : "Unable to reserve credits", insufficient },
        { status: insufficient ? 402 : 500 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // If an API key is available, attempt real AI generation via OpenAI compatible endpoint
    if (apiKey) {
      try {
        const systemPrompt = `You are a viral short-form video director (TikTok, Instagram Reels, YouTube Shorts).
Your job is to generate a punchy, high-retention video script based on the user's prompt.
Target total duration: around ${duration} seconds.
Output MUST be strict JSON in this format:
{
  "title": "Short catchy title (max 7 words)",
  "scenes": [
    {
      "badge": "HOOK ⚡ / STEP 1 / SECRET / CTA",
      "narration": "Spoken sentence (15-25 words)",
      "visualCategory": "Tech / Luxury / Nature / Abstract / Business / Cinematic",
      "durationSeconds": 6
    }
  ]
}
Include between 3 and 5 scenes. Keep narration conversational, fast-paced, and punchy. No markdown or code block fences, return only the JSON.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          signal: AbortSignal.timeout(20000),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Create a viral video script about: ${prompt}` },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = JSON.parse(data.choices[0]?.message?.content || "{}");
          if (Array.isArray(content.scenes)) {
            const mappedScenes = content.scenes
              .filter((scene) => typeof scene?.narration === "string" && scene.narration.trim())
              .slice(0, 5)
              .map((s, idx) => {
              const matchedBg = BACKGROUND_MEDIA[idx % BACKGROUND_MEDIA.length];
              return {
                id: `sc-${Date.now()}-${idx + 1}`,
                badge: typeof s.badge === "string" ? s.badge.slice(0, 80) : `SCENE ${idx + 1}`,
                narration: s.narration.trim().slice(0, 1000),
                visualId: matchedBg.id,
                durationSeconds: Math.max(3, Math.min(12, s.durationSeconds || 6)),
              };
            });

            if (mappedScenes.length > 0) {
              return NextResponse.json({
                success: true,
                title: typeof content.title === "string" ? content.title.slice(0, 120) : "Viral Short Video",
                scenes: mappedScenes,
                source: "ai",
                credits: creditResult.credits,
              });
            }
          }
        }
      } catch (aiErr) {
        console.warn("External AI call failed, falling back to local heuristic generator:", aiErr);
      }
    }

    // Heuristic fallback generator
    const fallback = generateHeuristicScenes(prompt, duration);
    return NextResponse.json({
      success: true,
      title: fallback.title,
      scenes: fallback.scenes,
      source: "local-engine",
      credits: creditResult.credits,
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Failed to generate script" }, { status: 500 });
  }
}
