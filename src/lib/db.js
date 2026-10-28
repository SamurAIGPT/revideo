import { prisma } from "./prisma";

export const DBService = {
  // --- USER AUTHENTICATION & LOOKUP ---
  async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    try {
      return await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          credits: true,
        },
      });
    } catch (err) {
      console.error("[PRISMA] getUserByEmail error:", err.message);
      return null;
    }
  },

  async getUserById(id) {
    if (!id) return null;
    try {
      return await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          credits: true,
        },
      });
    } catch (err) {
      console.error("[PRISMA] getUserById error:", err.message);
      return null;
    }
  },

  async createOrGetUser({ email, name, image, initialCredits = 50 }) {
    if (!email) throw new Error("Email is required");
    const cleanEmail = email.trim().toLowerCase();

    try {
      let user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: name || cleanEmail.split("@")[0],
            image: image || null,
            credits: initialCredits,
          },
        });
      }

      return user;
    } catch (err) {
      console.error("[PRISMA] createOrGetUser error:", err.message);
      throw err;
    }
  },

  // --- ATOMIC CREDITS MANAGEMENT ---
  async getCredits(userIdentifier) {
    if (!userIdentifier) return 0;
    try {
      const isEmail = userIdentifier.includes("@");
      const user = await prisma.user.findUnique({
        where: isEmail ? { email: userIdentifier.toLowerCase().trim() } : { id: userIdentifier },
        select: { credits: true },
      });
      return user ? user.credits : 0;
    } catch (err) {
      console.error("[PRISMA] getCredits error:", err.message);
      return 0;
    }
  },

  async deductCredits(userIdentifier, amount, reason = "AI Generation") {
    if (!userIdentifier || amount <= 0) return null;

    const isEmail = userIdentifier.includes("@");
    const where = isEmail ? { email: userIdentifier.toLowerCase().trim() } : { id: userIdentifier };

    try {
      const user = await prisma.user.findUnique({
        where,
        select: { id: true, credits: true, name: true, email: true },
      });

      if (!user) {
        throw new Error("User not found in database");
      }

      if (user.credits < amount) {
        throw new Error(
          `Insufficient credits. Required ${amount} credits, but current balance is ${user.credits}.`
        );
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            decrement: amount,
          },
        },
      });

      // Log transaction
      await prisma.creditTransaction.create({
        data: {
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: user.id,
          amount,
          type: "deduct",
          reason,
          balanceAfter: updated.credits,
        },
      }).catch(() => {});

      return { success: true, user: updated, credits: updated.credits };
    } catch (err) {
      console.error("[PRISMA] deductCredits error:", err.message);
      throw err;
    }
  },

  async addCredits(userIdentifier, amount, reason = "Top Up") {
    if (!userIdentifier || amount <= 0) return null;

    const isEmail = userIdentifier.includes("@");
    const where = isEmail ? { email: userIdentifier.toLowerCase().trim() } : { id: userIdentifier };

    try {
      const user = await prisma.user.findUnique({
        where,
        select: { id: true, credits: true },
      });

      if (!user) {
        throw new Error("User not found to add credits");
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: {
            increment: amount,
          },
        },
      });

      // Log transaction
      await prisma.creditTransaction.create({
        data: {
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: user.id,
          amount,
          type: "topup",
          reason,
          balanceAfter: updated.credits,
        },
      }).catch(() => {});

      return { success: true, user: updated, credits: updated.credits };
    } catch (err) {
      console.error("[PRISMA] addCredits error:", err.message);
      throw err;
    }
  },

  // --- VIDEO PROJECTS TABLE (SUPABASE VIA PRISMA) ---
  async getProjects(userId = null) {
    try {
      return await prisma.videoProject.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { updatedAt: "desc" },
      });
    } catch (err) {
      console.error("[PRISMA] getProjects error:", err.message);
      return [];
    }
  },

  async getProjectById(id) {
    if (!id) return null;
    try {
      return await prisma.videoProject.findUnique({
        where: { id },
      });
    } catch (err) {
      console.error("[PRISMA] getProjectById error:", err.message);
      return null;
    }
  },

  async saveProject(project, userId = null) {
    if (!project || !project.id) return null;

    const {
      id,
      title = "Untitled Video",
      prompt = null,
      script = null,
      aspect_ratio = "9:16",
      aspectRatio = "9:16",
      duration_seconds = 30,
      durationSeconds = 30,
      voice = "marcus",
      caption_style = "hormozi",
      captionStyle = "hormozi",
      music_track = "lofi",
      musicTrack = "lofi",
      music_volume = 0.25,
      musicVolume = 0.25,
      scenes = [],
      thumbnail_url = null,
      thumbnailUrl = null,
    } = project;

    const finalRatio = aspectRatio || aspect_ratio || "9:16";
    const finalDuration = Number(durationSeconds || duration_seconds || 30);
    const finalVoice = voice || "marcus";
    const finalCaption = captionStyle || caption_style || "hormozi";
    const finalTrack = musicTrack || music_track || "lofi";
    const finalVolume = Number(musicVolume || music_volume || 0.25);
    const finalThumbnail = thumbnailUrl || thumbnail_url || null;

    try {
      return await prisma.videoProject.upsert({
        where: { id },
        create: {
          id,
          userId,
          title,
          prompt,
          script,
          aspectRatio: finalRatio,
          durationSeconds: finalDuration,
          voice: finalVoice,
          captionStyle: finalCaption,
          musicTrack: finalTrack,
          musicVolume: finalVolume,
          scenes: Array.isArray(scenes) ? scenes : [],
          thumbnailUrl: finalThumbnail,
        },
        update: {
          title,
          prompt,
          script,
          aspectRatio: finalRatio,
          durationSeconds: finalDuration,
          voice: finalVoice,
          captionStyle: finalCaption,
          musicTrack: finalTrack,
          musicVolume: finalVolume,
          scenes: Array.isArray(scenes) ? scenes : [],
          thumbnailUrl: finalThumbnail,
        },
      });
    } catch (err) {
      console.error("[PRISMA] saveProject error:", err.message);
      throw err;
    }
  },

  async deleteProject(id) {
    if (!id) return false;
    try {
      await prisma.videoProject.delete({ where: { id } });
      return true;
    } catch (err) {
      console.error("[PRISMA] deleteProject error:", err.message);
      return false;
    }
  },

  // --- SAVED VIDEOS TABLE (SUPABASE VIA PRISMA) ---
  async getSavedVideos(userId = null) {
    try {
      return await prisma.savedVideo.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: "desc" },
      });
    } catch (err) {
      console.error("[PRISMA] getSavedVideos error:", err.message);
      return [];
    }
  },

  async saveVideo(video, userId = null) {
    if (!video || !video.id) return null;
    const id = `saved_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      return await prisma.savedVideo.create({
        data: {
          id,
          userId,
          videoId: String(video.id),
          platform: video.platform || "youtube",
          title: video.title || "Saved Video",
          coverUrl: video.coverUrl || "",
          views: BigInt(video.views || 0),
          likes: BigInt(video.likes || 0),
          videoUrl: video.videoUrl || "",
        },
      });
    } catch (err) {
      console.error("[PRISMA] saveVideo error:", err.message);
      throw err;
    }
  },

  async removeSavedVideo(videoId, userId = null) {
    try {
      await prisma.savedVideo.deleteMany({
        where: {
          videoId: String(videoId),
          userId: userId || undefined,
        },
      });
      return true;
    } catch (err) {
      console.error("[PRISMA] removeSavedVideo error:", err.message);
      return false;
    }
  },

  // --- VIDEO RENDERS TABLE (SUPABASE VIA PRISMA) ---
  async createRender({ projectId, userId = null, durationSeconds, videoUrl, fileSizeBytes = null }) {
    try {
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
      return null;
    }
  },
};

