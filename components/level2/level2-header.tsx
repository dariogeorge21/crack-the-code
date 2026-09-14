"use client";

import React from "react";
import { Timer } from "@phosphor-icons/react";
import { MasterKeyHud } from "@/components/layout";
import { formatTimer } from "@/lib/time";

interface Level2HeaderProps {
  teamName: string;
  currentLevel: number;
  masterCode: string | null;
  elapsedSeconds: number;
  isKeyRevealedInHeader: boolean;
  isKeyHighlighted: boolean;
}

export function Level2Header({
  teamName,
  currentLevel,
  masterCode,
  elapsedSeconds,
  isKeyRevealedInHeader,
  isKeyHighlighted,
}: Level2HeaderProps) {
  const unlockedCount =
    currentLevel >= 4 ? 6 : currentLevel >= 3 || isKeyRevealedInHeader ? 3 : 1;

  return (
    <header className="h-14 border-b border-neutral-800 bg-[#0c0c10] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 font-mono">
      {/* Left: Brand & Round */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <span className="font-black text-[#ff5500] tracking-wider">ASTHRA 11.0</span>
          <span className="text-neutral-700">/</span>
          <span className="text-neutral-300 font-bold hidden sm:inline">ARENA 02</span>
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#ff5500] text-black font-black text-xs uppercase tracking-wider shrink-0">
            ROUND 02
          </span>
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white hidden md:inline">
            Diamond Star Pattern Matrix
          </span>
        </div>
      </div>

      {/* Center: Live Team Timer & Master Key Rack */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-700 px-3 py-1 text-xs shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <Timer weight="bold" className="size-3.5 text-[#ff5500]" />
          <span className="text-neutral-400 hidden lg:inline">MISSION:</span>
          <span className="text-[#ff5500] font-black font-mono tracking-wider">
            {formatTimer(elapsedSeconds, true)}
          </span>
        </div>

        {/* Master Key HUD in Desktop Header */}
        <MasterKeyHud
          masterCode={masterCode}
          unlockedCount={unlockedCount}
          highlightNewDigits={isKeyHighlighted}
          size="sm"
          className="hidden sm:flex"
        />
      </div>

      {/* Right: Team Identification Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0e0e14] border border-neutral-800 text-xs shrink-0">
        <span className="text-neutral-500 uppercase font-bold text-[11px] hidden sm:inline">TEAM:</span>
        <span className="text-white font-black">{teamName}</span>
        <span className="px-1.5 py-0.5 bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/40 font-black text-[10px] tracking-wider">
          TIER 0{currentLevel}
        </span>
      </div>
    </header>
  );
}

