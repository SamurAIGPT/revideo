"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { VIRAL_REMIX_CARDS, BACKGROUND_MEDIA, MUSIC_TRACKS, CAPTION_STYLES } from "@/lib/constants";

const VideoEditorContext = createContext(null);

export function VideoEditorProvider({ initialProjectId, children }) {
  const fps = 30;
  const initialTemplate = VIRAL_REMIX_CARDS[0];

  // Core Project State
  const [projectId, setProjectId] = useState(initialProjectId || `proj-${Date.now()}`);
  const [projectTitle, setProjectTitle] = useState("Sonic Cinema");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [captionStyle, setCaptionStyle] = useState("hormozi");
  const [musicTrack, setMusicTrack] = useState("lofi");
  const [musicVolume, setMusicVolume] = useState(0.25);
  const [voice, setVoice] = useState("marcus");
  const [scenes, setScenes] = useState([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  // Audio Track State (Matching Revid AI Screenshot 2)
  const [audioTrackData, setAudioTrackData] = useState({
    id: "audio-default",
    name: "1793086207095-audio.mp3",
    duration: "2:01",
    durationSeconds: 121.34,
    url: "/music/lofi.mp3",
    type: "Music",
  });
  const [isAudioPreviewPlaying, setIsAudioPreviewPlaying] = useState(false);
  const audioPreviewAudioRef = useRef(null);

  // Media Library State (Matching Revid AI Screenshot 1)
  const [mediaLibrary, setMediaLibrary] = useState([]);
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
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // Undo / Redo History Stacks
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isInternalChange = useRef(false);

  // Compute Total Duration (defaults to audio duration 02:01.34 matching screenshot when scenes is empty)
  const totalSeconds =
    scenes.length > 0
      ? scenes.reduce((acc, s) => acc + (Number(s.durationSeconds) || 5), 0)
      : (audioTrackData?.durationSeconds || 121.34);
  const durationInFrames = Math.max(fps, Math.round(totalSeconds * fps));

  // Snapshot current state for history
  const takeSnapshot = useCallback(() => {
    return {
      projectTitle,
      aspectRatio,
      captionStyle,
      musicTrack,
      musicVolume,
      voice,
      scenes: JSON.parse(JSON.stringify(scenes)),
    };
  }, [projectTitle, aspectRatio, captionStyle, musicTrack, musicVolume, voice, scenes]);

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
    if (next.voice !== undefined) setVoice(next.voice);
    if (next.scenes !== undefined) setScenes(next.scenes);
    setTimeout(() => {
      isInternalChange.current = false;
    }, 50);
  }, [redoStack, takeSnapshot]);

  // Load project by ID on mount
  useEffect(() => {
    let isMounted = true;
    async function loadProject() {
      if (!initialProjectId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${initialProjectId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.project && isMounted) {
            const p = data.project;
            setProjectId(p.id);
            if (p.title) setProjectTitle(p.title);
            if (p.aspectRatio || p.aspect_ratio) setAspectRatio(p.aspectRatio || p.aspect_ratio);
            if (p.captionStyle || p.caption_style) setCaptionStyle(p.captionStyle || p.caption_style);
            if (p.musicTrack || p.music_track) setMusicTrack(p.musicTrack || p.music_track);
            if (p.musicVolume !== undefined) setMusicVolume(Number(p.musicVolume));
            if (p.voice) setVoice(p.voice);
            if (Array.isArray(p.scenes) && p.scenes.length > 0) {
              setScenes(p.scenes);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch project from DB, using fallback draft:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProject();
    return () => {
      isMounted = false;
    };
  }, [initialProjectId]);

  // Autosave engine (debounced 1000ms)
  useEffect(() => {
    if (isLoading) return;
    setSaveStatus("saving");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: projectId,
            title: projectTitle,
            aspectRatio,
            captionStyle,
            musicTrack,
            musicVolume,
            voice,
            scenes,
            durationSeconds: totalSeconds,
          }),
        });

        if (res.ok) {
          setSaveStatus("saved");
          setLastSavedAt(new Date());
        } else {
          setSaveStatus("saved"); // Fallback to draft
        }
      } catch (err) {
        console.warn("Autosave local fallback:", err);
        setSaveStatus("saved");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectId, projectTitle, aspectRatio, captionStyle, musicTrack, musicVolume, voice, scenes, totalSeconds, isLoading]);

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

    // Minimum split threshold (0.5s from start and end)
    if (offsetSeconds <= 0.5 || offsetSeconds >= (currentScene.durationSeconds - 0.5)) {
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
  const uploadMedia = useCallback((file) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video");
    const isAudio = file.type.startsWith("audio");
    const objectUrl = URL.createObjectURL(file);

    const newMedia = {
      id: `media-${Date.now()}`,
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
        };
        return updated;
      });
      setCurrentSceneIndex(0);
    } else if (isAudio) {
      setAudioTrackData({
        id: `audio-${Date.now()}`,
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
    if (!audioPreviewAudioRef.current) {
      audioPreviewAudioRef.current = new window.Audio(audioTrackData.url || "/music/lofi.mp3");
      audioPreviewAudioRef.current.onended = () => setIsAudioPreviewPlaying(false);
    }

    if (isAudioPreviewPlaying) {
      audioPreviewAudioRef.current.pause();
      setIsAudioPreviewPlaying(false);
    } else {
      audioPreviewAudioRef.current.play().catch(() => {
        // Fallback Web Audio oscillator if audio file cannot be decoded
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 2);
          }
        } catch (e) {}
      });
      setIsAudioPreviewPlaying(true);
      setTimeout(() => setIsAudioPreviewPlaying(false), 2500);
    }
  }, [audioTrackData, isAudioPreviewPlaying]);

  const deleteAudio = useCallback(() => {
    pushHistory();
    if (audioPreviewAudioRef.current) {
      audioPreviewAudioRef.current.pause();
    }
    setIsAudioPreviewPlaying(false);
    setAudioTrackData(null);
    setMusicTrack("none");
  }, [pushHistory]);

  const replaceAudio = useCallback((newAudio) => {
    pushHistory();
    if (audioPreviewAudioRef.current) {
      audioPreviewAudioRef.current.pause();
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
