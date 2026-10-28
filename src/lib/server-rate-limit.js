import { NextResponse } from "next/server";
import { DBService } from "@/lib/db";

export async function checkUserRateLimit(userId, route, maxRequests) {
  const result = await DBService.consumeApiRateLimit(userId, route, maxRequests);
  if (result.allowed) return null;

  return NextResponse.json(
    { error: "Too many requests. Please wait before trying again.", retryAfterSeconds: result.retryAfterSeconds },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    }
  );
}
