"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function StudioRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(params ? `/editor/new?${params}` : "/editor/new");
  }, [router, searchParams]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
      <p className="text-xs font-mono text-zinc-400">Opening video editor...</p>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <StudioRedirectInner />
    </Suspense>
  );
}
