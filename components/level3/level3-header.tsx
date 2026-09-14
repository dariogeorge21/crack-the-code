"use client";

import React from "react";
import { Timer, Code } from "@phosphor-icons/react";
import { MasterKeyHud } from "@/components/layout";
import { formatTimer } from "@/lib/time";

interface Level3HeaderProps {
  teamName: string;
  currentLevel: number;
  masterCode: string | null;
  elapsedSeconds: number;
}

export function Level3Header({
  teamName,
  currentLevel,
  masterCode,
  elapsedSeconds,
}: Level3HeaderProps) {
  const unlockedCount = currentLevel >= 4 ? 6 : 3;
  const tierLabel = currentLevel >= 4 ? "CLEARED" : "TIER 03";

  return (
    <header className="h-14 border-b border-neutral-800 bg-[#0a0a0e] px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-40 font-mono">
      {/* Left: ASTHRA & Round Identifier */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
          <span className="font-black tracking-wider text-[11px] text-[#ff5500]">ASTHRA 11.0</span>
          <span className="text-neutral-700 hidden md:inline">|</span>
          <span className="text-neutral-400 font-bold text-[11px] hidden md:inline">ARENA 03</span>
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/40 text-rose-400 font-black text-xs uppercase tracking-wider">
            <Code weight="bold" className="size-3.5 text-rose-400" />
            <span>ROUND 03</span>
          </div>
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white hidden md:inline">
            Airport Security Checkpoint
          </span>
        </div>
      </div>

      {/* Center: Continuous Mission Timer & Master Key HUD */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mission Timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0e0e14] border border-neutral-800 text-xs">
          <Timer weight="bold" className="size-3.5 text-[#ff5500]" />
          <span className="text-[10px] text-neutral-400 uppercase font-bold hidden sm:inline">
            CLOCK:
          </span>
          <span className="font-mono font-black text-white text-xs sm:text-sm tracking-wider">
            {formatTimer(elapsedSeconds, true)}
          </span>
        </div>

        {/* Master Key HUD displaying revealed digits */}
        <MasterKeyHud
          masterCode={masterCode}
          unlockedCount={unlockedCount}
          size="sm"
          className="hidden sm:flex"
        />
      </div>

      {/* Right: Team Identification Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0e0e14] border border-neutral-800 text-xs shrink-0">
        <span className="text-neutral-500 uppercase font-bold text-[11px] hidden sm:inline">TEAM:</span>
        <span className="text-white font-black">{teamName}</span>
        <span className="px-1.5 py-0.5 bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/40 font-black text-[10px] tracking-wider">
          {tierLabel}
        </span>
      </div>
    </header>
  );
}

