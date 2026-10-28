"use client";

import React, { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function NewEditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;

    const query = new URLSearchParams(searchParams.toString());
    const requestedProjectId = query.get("projectId");
    query.delete("projectId");
    const projectId = requestedProjectId || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (!requestedProjectId) query.set("new", "1");
    const params = query.toString();
    const destination = params ? `/editor/${projectId}?${params}` : `/editor/${projectId}`;
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
      <p className="text-xs font-mono text-zinc-400">Initializing unique video editor workspace...</p>
    </div>
  );
}

export default function NewEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-mono text-zinc-400">Loading editor...</p>
        </div>
      }
    >
      <NewEditorInner />
    </Suspense>
  );
}
