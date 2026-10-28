"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { VIRAL_REMIX_CARDS, BACKGROUND_MEDIA, CAPTION_STYLES } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { editorAssetReference, getEditorAsset, storeEditorAsset } from "@/lib/editor-assets";

const VideoEditorContext = createContext(null);

export function VideoEditorProvider({
  initialProjectId,
  initialIsNewProject,
  initialPrompt,
  initialTemplateId,
  initialRemix,
  initialDuration,
  children,
}) {
  const fps = 30;
  const initialTemplate = VIRAL_REMIX_CARDS[0];
  const {
    isAuthenticated,
    isLoading: authLoading,
    setIsLoginModalOpen,
    setIsTopUpOpen,
  } = useAuth();

  // Core Project State
  const [projectId, setProjectId] = useState(initialProjectId || "draft");
  const [projectTitle, setProjectTitle] = useState("Sonic Cinema");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [captionStyle, setCaptionStyle] = useState("hormozi");
  const [musicTrack, setMusicTrack] = useState("none");
  const [musicVolume, setMusicVolume] = useState(0.25);
  const [voice, setVoice] = useState("marcus");
  const [scenes, setScenes] = useState([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  // Audio Track State (Matching Revid AI Screenshot 2)
  const [audioTrackData, setAudioTrackData] = useState(null);
  const [isAudioPreviewPlaying, setIsAudioPreviewPlaying] = useState(false);
  const audioPreviewAudioRef = useRef(null);
  const ownedAssetUrls = useRef(new Set());

  // Media Library State (Matching Revid AI Screenshot 1)
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [mediaUploadError, setMediaUploadError] = useState("");
  const [mediaWarning, setMediaWarning] = useState("");
  const [mediaTab, setMediaTab] = useState("library"); // 'library' | 'stock' | 'stickers' | 'effects'
  const [mediaFilter, setMediaFilter] = useState("all"); // 'all' | 'videos' | 'images' | 'audio' | 'motion'

  // Canvas Selection & Timeline Track Selection
  const [isCanvasSelected, setIsCanvasSelected] = useState(true);
  const [selectedTimelineTrack, setSelectedTimelineTrack] = useState("track2"); // 'track3' | 'track2' | 'track1'

  // Player & Timeline State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(135); // 50 to 200, matching 135% in revid screenshot
  const [safeZonesEnabled, setSafeZonesEnabled] = useState(false);
  const playerRef = useRef(null);

  // Editor Navigation & Tool Drawer (Default to 'media' as in screenshot)
  // 'ai' | 'script' | 'text' | 'media' | 'transitions' | 'audio' | 'captions'
  const [activeTool, setActiveTool] = useState("media");

  // Cloud Save State
  const [saveState, setSaveState] = useState("unsaved"); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectLoadError, setProjectLoadError] = useState(false);
  const initialContentProcessed = useRef(false);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Undo / Redo History Stacks
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isInternalChange = useRef(false);

  useEffect(() => () => {
    if (audioPreviewAudioRef.current) audioPreviewAudioRef.current.pause();
    for (const url of ownedAssetUrls.current) URL.revokeObjectURL(url);
    ownedAssetUrls.current.clear();
  }, []);

  // Compute Total Duration (defaults to audio duration 02:01.34 matching screenshot when scenes is empty)
  const totalSeconds =
    scenes.length > 0
      ? scenes.reduce((acc, s) => acc + (Number(s.durationSeconds) || 5), 0)
      : (audioTrackData?.durationSeconds || 30);
  const durationInFrames = Math.max(fps, Math.round(totalSeconds * fps));
  const projectPayload = useMemo(() => ({
    id: projectId,
    title: projectTitle,
    aspectRatio,
    captionStyle,
    musicTrack,
    musicVolume,
    voice,
    scenes: scenes.map((scene) => {
      const current = scene && typeof scene === "object" ? scene : {};
      return {
        ...current,
        videoUrl: current.videoAssetId
          ? editorAssetReference(current.videoAssetId)
          : typeof current.videoUrl === "string" && current.videoUrl.startsWith("blob:") ? "" : current.videoUrl,
        imageUrl: current.imageAssetId
          ? editorAssetReference(current.imageAssetId)
          : typeof current.imageUrl === "string" && current.imageUrl.startsWith("blob:") ? "" : current.imageUrl,
      };
    }),
    audioTrackData: audioTrackData
      ? {
          ...audioTrackData,
          url: audioTrackData.assetId
            ? editorAssetReference(audioTrackData.assetId)
            : typeof audioTrackData.url === "string" && audioTrackData.url.startsWith("blob:") ? "" : audioTrackData.url,
        }
      : null,
    durationSeconds: totalSeconds,
  }), [projectId, projectTitle, aspectRatio, captionStyle, musicTrack, musicVolume, voice, scenes, audioTrackData, totalSeconds]);
  const projectSnapshot = JSON.stringify(projectPayload);
  const saveStatus = saveState === "saved" && lastSavedSnapshot !== projectSnapshot
    ? "unsaved"
    : saveState;

  // Snapshot current state for history
  const takeSnapshot = useCallback(() => {
    return {
      projectTitle,
      aspectRatio,
      captionStyle,
      musicTrack,
      musicVolume,
      audioTrackData: audioTrackData ? { ...audioTrackData } : null,
      voice,
      scenes: JSON.parse(JSON.stringify(scenes)),
    };
  }, [projectTitle, aspectRatio, captionStyle, musicTrack, musicVolume, audioTrackData, voice, scenes]);

  const pushHistory = useCallback(() => {
    if (isInternalChange.current) return;
    setHistory((prev) => [...prev.slice(-30), takeSnapshot()]);
    setRedoStack([]);
  }, [takeSnapshot]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [takeSnapshot(), ...prev]);
    setHistory((prev) => prev.slice(0, -1));

    isInternalChange.current = true;
    if (previous.projectTitle !== undefined) setProjectTitle(previous.projectTitle);
    if (previous.aspectRatio !== undefined) setAspectRatio(previous.aspectRatio);
    if (previous.captionStyle !== undefined) setCaptionStyle(previous.captionStyle);
    if (previous.musicTrack !== undefined) setMusicTrack(previous.musicTrack);
    if (previous.musicVolume !== undefined) setMusicVolume(previous.musicVolume);
    if (audioPreviewAudioRef.current) audioPreviewAudioRef.current.pause();
    audioPreviewAudioRef.current = null;
    setIsAudioPreviewPlaying(false);
    if (previous.audioTrackData !== undefined) setAudioTrackData(previous.audioTrackData);
    if (previous.voice !== undefined) setVoice(previous.voice);
    if (previous.scenes !== undefined) setScenes(previous.scenes);
    setTimeout(() => {
      isInternalChange.current = false;
    }, 50);
  }, [history, takeSnapshot]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((prev) => [...prev, takeSnapshot()]);
    setRedoStack((prev) => prev.slice(1));

    isInternalChange.current = true;
    if (next.projectTitle !== undefined) setProjectTitle(next.projectTitle);
    if (next.aspectRatio !== undefined) setAspectRatio(next.aspectRatio);
    if (next.captionStyle !== undefined) setCaptionStyle(next.captionStyle);
    if (next.musicTrack !== undefined) setMusicTrack(next.musicTrack);
    if (next.musicVolume !== undefined) setMusicVolume(next.musicVolume);
    if (audioPreviewAudioRef.current) audioPreviewAudioRef.current.pause();
    audioPreviewAudioRef.current = null;
    setIsAudioPreviewPlaying(false);
    if (next.audioTrackData !== undefined) setAudioTrackData(next.audioTrackData);
    if (next.voice !== undefined) setVoice(next.voice);
    if (next.scenes !== undefined) setScenes(next.scenes);
    setTimeout(() => {
      isInternalChange.current = false;
    }, 50);
  }, [redoStack, takeSnapshot]);

  // Load an existing project or initialize content passed from the create/remix flows.
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;
    async function restoreAssetUrl(value) {
      if (typeof value !== "string" || !value) return { url: "", missing: false, asset: null };
      const prefix = "revideo-asset://";
      const assetId = value.startsWith(prefix) ? value.slice(prefix.length) : null;
      if (!assetId) {
        return value.startsWith("blob:")
          ? { url: "", missing: true, asset: null }
          : { url: value, missing: false, asset: null };
      }

      const asset = await getEditorAsset(assetId).catch(() => null);
      if (!asset?.blob) return { url: "", missing: true, asset: null };
      const url = URL.createObjectURL(asset.blob);
      ownedAssetUrls.current.add(url);
      return { url, missing: false, asset };
    }

    async function loadProject() {
      setIsLoading(true);
      setProjectLoadError(false);
      setMediaWarning("");

      if (!isAuthenticated) {
        if (initialPrompt) setIsLoginModalOpen(true);
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        if (initialProjectId && !initialIsNewProject) {
          const res = await fetch(`/api/projects/${initialProjectId}`, { cache: "no-store" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.success || !data.project) {
            throw new Error("Could not load this saved project.");
          }

          const p = data.project;
          let missingAsset = false;
          const restoredSceneResults = await Promise.all((Array.isArray(p.scenes) ? p.scenes : []).map(async (scene) => {
            const savedScene = scene && typeof scene === "object" && !Array.isArray(scene) ? scene : {};
            const [video, image] = await Promise.all([
              restoreAssetUrl(savedScene.videoUrl),
              restoreAssetUrl(savedScene.imageUrl),
            ]);
            missingAsset ||= video.missing || image.missing;
            return {
              scene: { ...savedScene, videoUrl: video.url, imageUrl: image.url },
              videoAsset: video.asset,
              imageAsset: image.asset,
            };
          }));
          const restoredScenes = restoredSceneResults.map((result) => result.scene);
          const restoredMedia = new Map();
          restoredSceneResults.forEach((result) => {
            if (result.videoAsset) {
              restoredMedia.set(result.videoAsset.id, {
                id: result.videoAsset.id,
                assetId: result.videoAsset.id,
                title: result.videoAsset.name,
                category: "Uploaded",
                type: "video",
                url: result.scene.videoUrl,
                poster: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
              });
            }
            if (result.imageAsset) {
              restoredMedia.set(result.imageAsset.id, {
                id: result.imageAsset.id,
                assetId: result.imageAsset.id,
                title: result.imageAsset.name,
                category: "Uploaded",
                type: "image",
                url: result.scene.imageUrl,
                poster: result.scene.imageUrl,
              });
            }
          });

          let restoredAudio = p.audioTrackData || null;
          if (restoredAudio?.url) {
            const audio = await restoreAssetUrl(restoredAudio.url);
            missingAsset ||= audio.missing;
            restoredAudio = { ...restoredAudio, url: audio.url };
            if (audio.asset) {
              restoredMedia.set(audio.asset.id, {
                id: audio.asset.id,
                assetId: audio.asset.id,
                title: audio.asset.name,
                category: "Uploaded",
                type: "audio",
                url: audio.url,
                poster: "",
              });
            }
          }

          if (!isMounted) return;
          setProjectId(p.id);
          if (p.title) setProjectTitle(p.title);
          if (p.aspectRatio || p.aspect_ratio) setAspectRatio(p.aspectRatio || p.aspect_ratio);
          if (p.captionStyle || p.caption_style) setCaptionStyle(p.captionStyle || p.caption_style);
          setMusicTrack(restoredAudio ? (p.musicTrack || p.music_track || "none") : "none");
          if (p.musicVolume !== undefined) setMusicVolume(Number(p.musicVolume));
          if (p.voice) setVoice(p.voice);
          setScenes(restoredScenes);
          setMediaLibrary([...restoredMedia.values()]);
          if (audioPreviewAudioRef.current) audioPreviewAudioRef.current.pause();
          audioPreviewAudioRef.current = null;
          setIsAudioPreviewPlaying(false);
          setAudioTrackData(restoredAudio);
          initialContentProcessed.current = true;
          if (missingAsset) {
            setMediaWarning("Some uploaded media is available only on the browser where it was added. Reupload it here to restore it.");
          }
          return;
        }

        if (!isMounted || initialContentProcessed.current) return;
        initialContentProcessed.current = true;

        if (initialRemix && typeof window !== "undefined") {
          const pendingRemix = sessionStorage.getItem("revid_pending_remix");
          if (pendingRemix) {
            const remix = JSON.parse(pendingRemix);
            if (Array.isArray(remix.scenes) && remix.scenes.length > 0) {
              setProjectTitle(remix.title || "Remixed Video");
              setScenes(remix.scenes);
              sessionStorage.removeItem("revid_pending_remix");
              return;
            }
          }
        }

        if (initialTemplateId) {
          const template = VIRAL_REMIX_CARDS.find((item) => item.id === initialTemplateId);
          if (template) {
            setProjectTitle(template.title);
            setScenes(template.scenes);
            setAspectRatio(template.aspectRatio || "9:16");
            return;
          }
        }

        if (initialPrompt) {
          const duration = Number(initialDuration) || 30;
          const res = await fetch("/api/generate-script", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: initialPrompt, duration }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (res.status === 401) setIsLoginModalOpen(true);
            if (res.status === 402) setIsTopUpOpen(true);
            throw new Error(data.error || "Failed to generate script");
          }
          if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
            throw new Error("The script service returned no scenes.");
          }
          if (isMounted) {
            setProjectTitle(data.title || "New Video");
            setScenes(data.scenes);
            if (Number.isInteger(data.credits)) {
              window.dispatchEvent(
                new CustomEvent("revid-credits-updated", { detail: { credits: data.credits } })
              );
            }
          }
        }
      } catch (err) {
        console.warn("Could not initialize editor content:", err);
        if (isMounted && ((initialProjectId && !initialIsNewProject) || initialPrompt || initialRemix)) {
          setProjectLoadError(true);
          setSaveState("error");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProject();
    return () => {
      isMounted = false;
    };
  }, [
    initialProjectId,
    initialIsNewProject,
    initialPrompt,
    initialTemplateId,
    initialRemix,
    initialDuration,
    isAuthenticated,
    authLoading,
    setIsLoginModalOpen,
    setIsTopUpOpen,
  ]);

  // Autosave engine (debounced 1000ms)
  useEffect(() => {
    if (isLoading || authLoading || !isAuthenticated || projectLoadError) return;

    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: projectSnapshot,
        });

        if (res.ok) {
          setLastSavedSnapshot(projectSnapshot);
          setSaveState("saved");
          setLastSavedAt(new Date());
        } else {
          setSaveState("error");
        }
      } catch (err) {
        console.warn("Autosave local fallback:", err);
        setSaveState("error");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectId, projectPayload, projectSnapshot, isLoading, authLoading, isAuthenticated, projectLoadError]);

  // Scene manipulation methods
  const addScene = useCallback((index = null) => {
    pushHistory();
    const newSceneId = `sc-${Date.now()}`;
    const newScene = {
      id: newSceneId,
      badge: `Scene ${scenes.length + 1}`,
      narration: "Type your spoken narration here. This will display as animated subtitles.",
      visualId: BACKGROUND_MEDIA[scenes.length % BACKGROUND_MEDIA.length]?.id || "clip-1",
      durationSeconds: 5,
      transition: "fade",
    };

    setScenes((prev) => {
      if (index === null || index >= prev.length) {
        return [...prev, newScene];
      }
      const updated = [...prev];
      updated.splice(index + 1, 0, newScene);
      return updated;
    });

    const targetIdx = index === null ? scenes.length : index + 1;
    setCurrentSceneIndex(targetIdx);
  }, [scenes.length, pushHistory]);

  const updateScene = useCallback((index, field, value) => {
    pushHistory();
    setScenes((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  }, [pushHistory]);

  const deleteScene = useCallback((index) => {
    if (scenes.length <= 1) return;
    pushHistory();
    setScenes((prev) => prev.filter((_, i) => i !== index));
    if (currentSceneIndex >= scenes.length - 1) {
      setCurrentSceneIndex(Math.max(0, scenes.length - 2));
    }
  }, [scenes.length, currentSceneIndex, pushHistory]);

  const duplicateScene = useCallback((index) => {
    if (!scenes[index]) return;
    pushHistory();
    const target = scenes[index];
    const cloned = {
      ...target,
      id: `sc-${Date.now()}`,
      badge: `${target.badge || "Scene"} (Copy)`,
    };
    setScenes((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, cloned);
      return next;
    });
    setCurrentSceneIndex(index + 1);
  }, [scenes, pushHistory]);

  const reorderScenes = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    pushHistory();
    setScenes((prev) => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
    setCurrentSceneIndex(toIndex);
  }, [pushHistory]);

  // Split scene at current playhead frame
  const splitSceneAtPlayhead = useCallback(() => {
    if (!scenes || scenes.length === 0) return;
    const currentScene = scenes[currentSceneIndex];
    if (!currentScene) return;

    // Calculate scene start frame and relative offset
    let accFrames = 0;
    for (let i = 0; i < currentSceneIndex; i++) {
      accFrames += Math.round((scenes[i].durationSeconds || 5) * fps);
    }
    const offsetFrames = currentFrame - accFrames;
    const offsetSeconds = offsetFrames / fps;

    // Keep both resulting scenes at least one second long.
    if (offsetSeconds <= 1 || offsetSeconds >= (currentScene.durationSeconds - 1)) {
      return;
    }

    pushHistory();
    const firstDuration = Math.round(offsetSeconds * 10) / 10;
    const secondDuration = Math.max(1, Math.round((currentScene.durationSeconds - firstDuration) * 10) / 10);

    const firstScene = {
      ...currentScene,
      durationSeconds: firstDuration,
    };

    const secondScene = {
      ...currentScene,
      id: `sc-${Date.now()}`,
      badge: `${currentScene.badge || "Scene"} (B)`,
      durationSeconds: secondDuration,
    };

    setScenes((prev) => {
      const updated = [...prev];
      updated.splice(currentSceneIndex, 1, firstScene, secondScene);
      return updated;
    });
  }, [scenes, currentSceneIndex, currentFrame, fps, pushHistory]);

  // Seek Remotion Player to specific second or scene
  const seekToSecond = useCallback((seconds) => {
    const targetFrame = Math.max(0, Math.min(durationInFrames - 1, Math.round(seconds * fps)));
    setCurrentFrame(targetFrame);
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(targetFrame);
      } catch (err) {
        console.warn("Remotion seek error:", err);
      }
    }
  }, [durationInFrames, fps]);

  const seekToScene = useCallback((index) => {
    if (index < 0 || index >= scenes.length) return;
    let accSeconds = 0;
    for (let i = 0; i < index; i++) {
      accSeconds += Number(scenes[i]?.durationSeconds) || 5;
    }
    seekToSecond(accSeconds);
    setCurrentSceneIndex(index);
  }, [scenes, seekToSecond]);

  const togglePlay = useCallback(() => {
    if (playerRef.current) {
      try {
        if (playerRef.current.isPlaying()) {
          playerRef.current.pause();
          setIsPlaying(false);
        } else {
          // If at the end of video, loop or seek to 0 first
          if (currentFrame >= durationInFrames - 1) {
            playerRef.current.seekTo(0);
            setCurrentFrame(0);
          }
          const playPromise = playerRef.current.play();
          setIsPlaying(true);
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch((err) => {
              console.warn("Remotion play error caught:", err);
              setIsPlaying(false);
            });
          }
        }
      } catch (err) {
        console.warn("togglePlay error:", err);
        setIsPlaying((prev) => !prev);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentFrame, durationInFrames]);

  // Upload Media handler
  const uploadMedia = useCallback(async (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video");
    const isAudio = file.type.startsWith("audio");
    const assetId = `asset-${globalThis.crypto.randomUUID()}`;
    setMediaUploadError("");
    try {
      await storeEditorAsset(assetId, file);
    } catch (err) {
      console.error("Could not store uploaded media:", err);
      setMediaUploadError("This file could not be saved in this browser. Check available storage and try again.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    ownedAssetUrls.current.add(objectUrl);

    const newMedia = {
      id: assetId,
      assetId,
      title: file.name,
      category: "Uploaded",
      type: isVideo ? "video" : isAudio ? "audio" : "image",
      url: objectUrl,
      poster: !isVideo && !isAudio ? objectUrl : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    };

    setMediaLibrary((prev) => [newMedia, ...prev]);

    // If it's video or image, apply to active scene, or create first scene if empty
    if (isVideo || !isAudio) {
      setScenes((prev) => {
        if (prev.length === 0) {
          return [
            {
              id: `sc-${Date.now()}`,
              badge: "Scene 1",
              narration: "",
              visualId: "uploaded",
              videoUrl: isVideo ? objectUrl : "",
              imageUrl: !isVideo ? objectUrl : "",
              videoAssetId: isVideo ? assetId : undefined,
              imageAssetId: !isVideo ? assetId : undefined,
              durationSeconds: 15,
            },
          ];
        }
        const updated = [...prev];
        const idx = Math.max(0, Math.min(currentSceneIndex, prev.length - 1));
        updated[idx] = {
          ...updated[idx],
          videoUrl: isVideo ? objectUrl : "",
          imageUrl: !isVideo ? objectUrl : "",
          videoAssetId: isVideo ? assetId : undefined,
          imageAssetId: !isVideo ? assetId : undefined,
        };
        return updated;
      });
      setCurrentSceneIndex(0);
    } else if (isAudio) {
      if (audioPreviewAudioRef.current) audioPreviewAudioRef.current.pause();
      audioPreviewAudioRef.current = null;
      setIsAudioPreviewPlaying(false);
      setAudioTrackData({
        id: `audio-${assetId}`,
        assetId,
        name: file.name,
        duration: "0:30",
        durationSeconds: 30,
        url: objectUrl,
        type: "Uploaded Music",
      });
      setMusicTrack(file.name);
    }
  }, [currentSceneIndex]);

  // Audio actions
  const toggleAudioPreview = useCallback(() => {
    if (!audioTrackData) return;
    if (isAudioPreviewPlaying) {
      audioPreviewAudioRef.current?.pause();
      audioPreviewAudioRef.current = null;
      setIsAudioPreviewPlaying(false);
      return;
    }

    if (!audioTrackData.url) return;
    const audio = new window.Audio(audioTrackData.url);
    audioPreviewAudioRef.current = audio;
    audio.onended = () => setIsAudioPreviewPlaying(false);
    audio.onerror = () => {
      setIsAudioPreviewPlaying(false);
      setMediaUploadError("This audio file could not be previewed. Try uploading it again.");
    };
    audio.play().then(() => setIsAudioPreviewPlaying(true)).catch(() => {
      setIsAudioPreviewPlaying(false);
      setMediaUploadError("This audio file could not be previewed. Try uploading it again.");
    });
  }, [audioTrackData, isAudioPreviewPlaying]);

  const deleteAudio = useCallback(() => {
    pushHistory();
    if (audioPreviewAudioRef.current) {
      audioPreviewAudioRef.current.pause();
      audioPreviewAudioRef.current = null;
    }
    setIsAudioPreviewPlaying(false);
    setAudioTrackData(null);
    setMusicTrack("none");
  }, [pushHistory]);

  const replaceAudio = useCallback((newAudio) => {
    pushHistory();
    if (audioPreviewAudioRef.current) {
      audioPreviewAudioRef.current.pause();
      audioPreviewAudioRef.current = null;
    }
    setIsAudioPreviewPlaying(false);
    setAudioTrackData(newAudio);
    setMusicTrack(newAudio.id || newAudio.name);
  }, [pushHistory]);

  const generateCaptionsFromAudio = useCallback(() => {
    pushHistory();
    setScenes((prev) =>
      prev.map((s, idx) => ({
        ...s,
        narration: s.narration || `Generated word-level caption for scene ${idx + 1}`,
      }))
    );
  }, [pushHistory]);

  return (
    <VideoEditorContext.Provider
      value={{
        fps,
        projectId,
        setProjectId,
        projectTitle,
        setProjectTitle,
        aspectRatio,
        setAspectRatio,
        captionStyle,
        setCaptionStyle,
        musicTrack,
        setMusicTrack,
        musicVolume,
        setMusicVolume,
        voice,
        setVoice,
        scenes,
        setScenes,
        currentSceneIndex,
        setCurrentSceneIndex,
        totalSeconds,
        durationInFrames,

        // Media Library & Audio Tracks (Revid AI Matching)
        mediaLibrary,
        setMediaLibrary,
        mediaUploadError,
        mediaWarning,
        mediaTab,
        setMediaTab,
        mediaFilter,
        setMediaFilter,
        uploadMedia,

        audioTrackData,
        setAudioTrackData,
        isAudioPreviewPlaying,
        toggleAudioPreview,
        deleteAudio,
        replaceAudio,
        generateCaptionsFromAudio,

        // Selection
        isCanvasSelected,
        setIsCanvasSelected,
        selectedTimelineTrack,
        setSelectedTimelineTrack,

        // Player & Playback
        playerRef,
        isPlaying,
        setIsPlaying,
        currentFrame,
        setCurrentFrame,
        zoomLevel,
        setZoomLevel,
        safeZonesEnabled,
        setSafeZonesEnabled,
        togglePlay,
        seekToSecond,
        seekToScene,
        splitSceneAtPlayhead,

        // Tools
        activeTool,
        setActiveTool,

        // History
        undo,
        redo,
        canUndo: history.length > 0,
        canRedo: redoStack.length > 0,

        // Scene Operations
        addScene,
        updateScene,
        deleteScene,
        duplicateScene,
        reorderScenes,

        // Modals
        isExportOpen,
        setIsExportOpen,
        isShareOpen,
        setIsShareOpen,
        isTemplatesOpen,
        setIsTemplatesOpen,

        // Cloud Status
        saveStatus,
        lastSavedAt,
        isLoading,
        projectLoadError,
      }}
    >
      {children}
    </VideoEditorContext.Provider>
  );
}

export function useVideoEditor() {
  const context = useContext(VideoEditorContext);
  if (!context) {
    throw new Error("useVideoEditor must be used within a VideoEditorProvider");
  }
  return context;
}
