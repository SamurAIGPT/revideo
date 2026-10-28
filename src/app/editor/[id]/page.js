"use client";

import React, { use, useEffect } from "react";
import { VideoEditorProvider, useVideoEditor } from "@/context/VideoEditorContext";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { EditorToolRail } from "@/components/editor/EditorToolRail";
import { EditorSubpanel } from "@/components/editor/EditorSubpanel";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorTransportBar } from "@/components/editor/EditorTransportBar";
import { EditorTimeline } from "@/components/editor/EditorTimeline";
import { ExportModal } from "@/components/studio/ExportModal";
import { TemplatesModal } from "@/components/studio/TemplatesModal";
import { X, Copy, Check, Share2 } from "lucide-react";

function VideoEditorInner() {
  const {
    projectId,
    projectTitle,
    scenes,
    aspectRatio,
    captionStyle,
    musicTrack,
    isExportOpen,
    setIsExportOpen,
    isTemplatesOpen,
    setIsTemplatesOpen,
    isShareOpen,
    setIsShareOpen,
    togglePlay,
    undo,
    redo,
    splitSceneAtPlayhead,
    setScenes,
    setProjectTitle,
  } = useVideoEditor();

  const [copiedLink, setCopiedLink] = React.useState(false);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is actively typing in an input or textarea
      const targetTag = e.target.tagName?.toLowerCase();
      const isInput = targetTag === "input" || targetTag === "textarea" || e.target.isContentEditable;

      // Space: Toggle Playback
      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        togglePlay();
      }

      // S: Split Scene
      if (e.code === "KeyS" && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        splitSceneAtPlayhead();
      }

      // Ctrl+Z or Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.code === "KeyY") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyZ")
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, undo, redo, splitSceneAtPlayhead]);

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-zinc-900 overflow-hidden select-none">
      {/* 1. Header (Matching revid.ai/editor/new) */}
      <EditorHeader />

      {/* 2. Middle Row: Left Rail (64px) + Subpanel (340px) + Canvas Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <EditorToolRail />
        <EditorSubpanel />
        <EditorCanvas />
      </div>

      {/* 3. Transport Control Bar */}
      <EditorTransportBar />

      {/* 4. Multi-Track Timeline (Bottom Workspace) */}
      <EditorTimeline />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={{
          id: projectId,
          title: projectTitle,
          scenes,
          aspectRatio,
          captionStyle,
          musicTrack,
        }}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={(tpl) => {
          setProjectTitle(tpl.title);
          setScenes(tpl.scenes);
          setIsTemplatesOpen(false);
        }}
      />

      {/* Share Project Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Share Project</h3>
              </div>
              <button
                onClick={() => setIsShareOpen(false)}
                className="p-1 text-zinc-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Anyone with this link can view and remix this video project.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? window.location.href : ""}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyShareLink}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditorPageContent({ params }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams?.id;

  return (
    <VideoEditorProvider initialProjectId={projectId}>
      <VideoEditorInner />
    </VideoEditorProvider>
  );
}

export default function EditorPage({ params }) {
  return (
    <React.Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-mono text-zinc-400">Loading editor...</p>
        </div>
      }
    >
      <EditorPageContent params={params} />
    </React.Suspense>
  );
}
