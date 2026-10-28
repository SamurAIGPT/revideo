"use client";

import React from "react";

export function SafeZonesOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 select-none overflow-hidden rounded-[2rem]">
      {/* Top Header Safe Zone */}
      <div className="absolute top-0 inset-x-0 h-16 bg-blue-500/10 border-b border-dashed border-blue-400/50 flex items-center justify-center">
        <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded">
          Top Header Zone (Search / Tabs)
        </span>
      </div>

      {/* Right Side Icons Zone (TikTok / Reels / Shorts Actions) */}
      <div className="absolute right-0 top-20 bottom-28 w-16 bg-red-500/10 border-l border-dashed border-red-400/50 flex flex-col items-center justify-center gap-3">
        <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-tighter bg-black/70 px-1 py-0.5 rounded -rotate-90">
          Like / Share Zone
        </span>
      </div>

      {/* Bottom Description & Audio Tag Zone */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-amber-500/10 border-t border-dashed border-amber-400/50 flex items-center justify-center p-2">
        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded">
          Username & Description Zone
        </span>
      </div>

      {/* Central Guide Crosshair / Safe Boundary */}
      <div className="absolute inset-x-4 top-20 bottom-32 border border-emerald-500/30 rounded-xl flex items-start justify-start p-2">
        <span className="text-[9px] font-mono text-emerald-400 font-bold bg-black/60 px-1.5 py-0.5 rounded">
          ✓ Safe Action Center
        </span>
      </div>
    </div>
  );
}
