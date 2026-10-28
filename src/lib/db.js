import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

let lastRateLimitCleanupAt = 0;

export const DBService = {
  async consumeApiRateLimit(userId, route, maxRequests, windowMs = 60000) {
    if (!userId || !route || !Number.isInteger(maxRequests) || maxRequests < 1) {
      throw new Error("Invalid rate limit configuration");
    }

    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowEnd = windowStart + windowMs;
    const id = `${userId}:${route}:${windowStart}`;
    const bucket = await prisma.apiRateLimit.upsert({
      where: { id },
      create: {
        id,
        userId,
        route,
        count: 1,
        expiresAt: new Date(windowEnd),
      },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    if (now - lastRateLimitCleanupAt > 15 * 60 * 1000) {
      lastRateLimitCleanupAt = now;
      try {
        await prisma.apiRateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });
      } catch (err) {
        console.warn("[PRISMA] rate limit cleanup failed:", err.message);
      }
    }

    return {
      allowed: bucket.count <= maxRequests,
      retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - now) / 1000)),
    };
  },

  // --- USER AUTHENTICATION & LOOKUP ---
  async getUserById(id) {
    if (!id) return null;
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        credits: true,
      },
    });
  },

  // --- ATOMIC CREDITS MANAGEMENT ---
  async getCredits(userId) {
    if (!userId) return 0;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return user ? user.credits : 0;
  },

  async deductCredits(userId, amount, reason = "AI Generation") {
    if (!userId || !Number.isInteger(amount) || amount <= 0) return null;

    try {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!user) throw new Error("User not found in database");

        const result = await tx.user.updateMany({
          where: { id: user.id, credits: { gte: amount } },
          data: { credits: { decrement: amount } },
        });

        if (result.count !== 1) {
          const current = await tx.user.findUnique({
            where: { id: user.id },
            select: { credits: true },
          });
          throw new Error(
            `Insufficient credits. Required ${amount} credits, but current balance is ${current?.credits ?? 0}.`
          );
        }

        const updated = await tx.user.findUnique({
          where: { id: user.id },
          select: { id: true, credits: true, name: true, email: true },
        });

        await tx.creditTransaction.create({
          data: {
            id: `tx_${randomUUID()}`,
            userId: user.id,
            amount,
            type: "deduct",
            reason,
            balanceAfter: updated.credits,
          },
        });

        return { success: true, user: updated, credits: updated.credits };
      });
    } catch (err) {
      console.error("[PRISMA] deductCredits error:", err.message);
      throw err;
    }
  },

  async addCredits(userId, amount, reason = "Top Up", type = "topup", idempotencyKey = null) {
    if (!userId || !Number.isInteger(amount) || amount <= 0) return null;

    try {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!user) throw new Error("User not found to add credits");

        const updated = await tx.user.update({
          where: { id: user.id },
          data: { credits: { increment: amount } },
          select: { id: true, credits: true },
        });

        await tx.creditTransaction.create({
          data: {
            id: idempotencyKey ? `tx_${idempotencyKey}` : `tx_${randomUUID()}`,
            userId: user.id,
            amount,
            type,
            reason,
            balanceAfter: updated.credits,
          },
        });

        return { success: true, user: updated, credits: updated.credits };
      });
    } catch (err) {
      console.error("[PRISMA] addCredits error:", err.message);
      throw err;
    }
  },

  // --- VIDEO PROJECTS TABLE (SUPABASE VIA PRISMA) ---
  async getProjects(userId) {
    if (!userId) return [];
    return prisma.videoProject.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  },

  async getProjectById(id, userId) {
    if (!id || !userId) return null;
    return prisma.videoProject.findFirst({
      where: { id, userId },
    });
  },

  async saveProject(project, userId = null) {
    if (!project || typeof project.id !== "string" || !project.id.trim() || project.id.length > 120) {
      throw new Error("Invalid project data");
    }

    const {
      id,
      title,
      prompt,
      script,
      aspect_ratio,
      aspectRatio,
      duration_seconds,
      durationSeconds,
      voice,
      caption_style,
      captionStyle,
      music_track,
      musicTrack,
      music_volume,
      musicVolume,
      scenes,
      audioTrackData,
      thumbnail_url,
      thumbnailUrl,
    } = project;

    const finalTitle = typeof title === "string" && title.trim()
      ? title.trim().slice(0, 200)
      : "Untitled Video";
    const finalPrompt = typeof prompt === "string" ? prompt.slice(0, 10000) : null;
    const finalScript = typeof script === "string" ? script.slice(0, 20000) : null;
    const finalRatio = aspectRatio ?? aspect_ratio ?? "9:16";
    const finalDuration = Math.round(Number(durationSeconds ?? duration_seconds ?? 30));
    const finalVoice = typeof voice === "string" ? voice.slice(0, 80) : "marcus";
    const finalCaption = typeof captionStyle === "string"
      ? captionStyle.slice(0, 80)
      : typeof caption_style === "string"
        ? caption_style.slice(0, 80)
        : "hormozi";
    const finalTrack = typeof musicTrack === "string"
      ? musicTrack.slice(0, 120)
      : typeof music_track === "string"
        ? music_track.slice(0, 120)
        : "none";
    const finalVolume = Number(musicVolume ?? music_volume ?? 0.25);
    const finalThumbnail = typeof (thumbnailUrl ?? thumbnail_url) === "string"
      ? (thumbnailUrl ?? thumbnail_url).slice(0, 2048)
      : null;
    const finalAudioTrackData = audioTrackData && typeof audioTrackData === "object" && !Array.isArray(audioTrackData)
      ? {
          id: typeof audioTrackData.id === "string" ? audioTrackData.id.slice(0, 120) : "",
          name: typeof audioTrackData.name === "string" ? audioTrackData.name.slice(0, 255) : "",
          duration: typeof audioTrackData.duration === "string" ? audioTrackData.duration.slice(0, 20) : "",
          durationSeconds: Number.isFinite(Number(audioTrackData.durationSeconds))
            ? Math.max(0, Math.min(3600, Number(audioTrackData.durationSeconds)))
            : 0,
          url: typeof audioTrackData.url === "string" ? audioTrackData.url.slice(0, 2048) : "",
          type: typeof audioTrackData.type === "string" ? audioTrackData.type.slice(0, 80) : "",
          assetId: typeof audioTrackData.assetId === "string" ? audioTrackData.assetId.slice(0, 120) : "",
        }
      : null;

    if (
      !["9:16", "16:9", "1:1"].includes(finalRatio) ||
      !Number.isInteger(finalDuration) || finalDuration < 1 || finalDuration > 3600 ||
      !Number.isFinite(finalVolume) || finalVolume < 0 || finalVolume > 1 ||
      (scenes !== undefined && (!Array.isArray(scenes) || scenes.length > 200))
    ) {
      throw new Error("Invalid project data");
    }

    const finalScenes = (scenes || []).map((scene, index) => {
      if (!scene || typeof scene !== "object" || Array.isArray(scene)) {
        throw new Error("Invalid project data");
      }
      const sceneDuration = Number(scene.durationSeconds ?? 5);
      if (!Number.isFinite(sceneDuration) || sceneDuration < 0.5 || sceneDuration > 60) {
        throw new Error("Invalid project data");
      }
      return {
        id: typeof scene.id === "string" ? scene.id.slice(0, 120) : `scene-${index + 1}`,
        badge: typeof scene.badge === "string" ? scene.badge.slice(0, 120) : "",
        narration: typeof scene.narration === "string" ? scene.narration.slice(0, 3000) : "",
        visualId: typeof scene.visualId === "string" ? scene.visualId.slice(0, 120) : "clip-1",
        durationSeconds: sceneDuration,
        ...(typeof scene.videoUrl === "string" ? { videoUrl: scene.videoUrl.slice(0, 2048) } : {}),
        ...(typeof scene.imageUrl === "string" ? { imageUrl: scene.imageUrl.slice(0, 2048) } : {}),
        ...(typeof scene.mediaUrl === "string" ? { mediaUrl: scene.mediaUrl.slice(0, 2048) } : {}),
        ...(typeof scene.videoAssetId === "string" ? { videoAssetId: scene.videoAssetId.slice(0, 120) } : {}),
        ...(typeof scene.imageAssetId === "string" ? { imageAssetId: scene.imageAssetId.slice(0, 120) } : {}),
      };
    });

    if (!userId) throw new Error("Authenticated user is required to save a project");

    const createData = {
      id,
      userId,
      title: finalTitle,
      prompt: finalPrompt,
      script: finalScript,
      aspectRatio: finalRatio,
      durationSeconds: finalDuration,
      voice: finalVoice,
      captionStyle: finalCaption,
      musicTrack: finalTrack,
      musicVolume: finalVolume,
      scenes: finalScenes,
      audioTrackData: finalAudioTrackData ?? Prisma.DbNull,
      thumbnailUrl: finalThumbnail,
    };
    const { id: projectId, userId: ownerId, ...updateData } = createData;

    try {
      const existing = await prisma.videoProject.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!existing) {
        return await prisma.videoProject.create({ data: createData });
      }

      const updated = await prisma.videoProject.updateMany({
        where: { id: projectId, userId: ownerId },
        data: updateData,
      });
      if (updated.count !== 1) throw new Error("Project not found");

      return await prisma.videoProject.findUnique({ where: { id: projectId } });
    } catch (err) {
      console.error("[PRISMA] saveProject error:", err.message);
      throw err;
    }
  },

  async deleteProject(id, userId) {
    if (!id || !userId) return false;
    const result = await prisma.videoProject.deleteMany({ where: { id, userId } });
    return result.count === 1;
  },

  // --- SAVED VIDEOS TABLE (SUPABASE VIA PRISMA) ---
  async getSavedVideos(userId) {
    if (!userId) return [];
    return prisma.savedVideo.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async saveVideo(video, userId) {
    if (!video || !video.id || !userId) return null;
    const id = `saved_${randomUUID()}`;
    try {
      return await prisma.savedVideo.create({
        data: {
          id,
          userId,
          videoId: String(video.id),
          platform: typeof video.platform === "string" ? video.platform.slice(0, 30) : "youtube",
          title: typeof video.title === "string" ? video.title.slice(0, 1000) : "Saved Video",
          coverUrl: typeof video.coverUrl === "string" ? video.coverUrl.slice(0, 2048) : "",
          views: BigInt(video.views || 0),
          likes: BigInt(video.likes || 0),
          videoUrl: typeof video.videoUrl === "string" ? video.videoUrl.slice(0, 2048) : "",
        },
      });
    } catch (err) {
      console.error("[PRISMA] saveVideo error:", err.message);
      throw err;
    }
  },

  async removeSavedVideo(videoId, userId, platform = null) {
    if (!videoId || !userId) return false;
    const result = await prisma.savedVideo.deleteMany({
      where: {
        videoId: String(videoId),
        userId,
        ...(typeof platform === "string" && platform ? { platform } : {}),
      },
    });
    return result.count > 0;
  },

  // --- VIDEO RENDERS TABLE (SUPABASE VIA PRISMA) ---
  async createRender({ projectId, userId, durationSeconds, videoUrl, fileSizeBytes = null }) {
    if (!userId) throw new Error("Authenticated user is required to save a render");

    try {
      if (projectId) {
        const project = await prisma.videoProject.findFirst({
          where: { id: projectId, userId },
          select: { id: true },
        });
        if (!project) throw new Error("Project not found");
      }

      return await prisma.videoRender.create({
        data: {
          projectId,
          userId,
          status: "completed",
          durationSeconds: durationSeconds ? Number(durationSeconds) : null,
          videoUrl: videoUrl || null,
          fileSizeBytes: fileSizeBytes ? BigInt(fileSizeBytes) : null,
        },
      });
    } catch (err) {
      console.error("[PRISMA] createRender error:", err.message);
      throw err;
    }
  },
};

