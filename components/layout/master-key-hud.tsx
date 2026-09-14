"use client";

import React from "react";
import { Key, ShieldCheck } from "@phosphor-icons/react";

interface MasterKeyHudProps {
  masterCode: string | null;
  unlockedCount?: number;
  highlightNewDigits?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function MasterKeyHud({
  masterCode,
  unlockedCount = 1,
  highlightNewDigits = false,
  className = "",
  size = "sm",
}: MasterKeyHudProps) {
  if (!masterCode) {
    return (
      <div className={`flex items-center gap-2 px-2.5 py-1 bg-neutral-900/90 border border-neutral-800 font-mono text-xs ${className}`}>
        <Key weight="bold" className="size-3 text-neutral-500 shrink-0" />
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
          VAULT KEY: STANDBY
        </span>
      </div>
    );
  }

  // Parse the 10 slots
  // If masterCode is e.g. "7*********" or "741*******" or "7839201546"
  const totalSlots = 10;
  const slots: { char: string; isUnlocked: boolean; isNew?: boolean }[] = [];

  for (let i = 0; i < totalSlots; i++) {
    const char = masterCode[i] || "*";
    const isUnlocked = char !== "*" && i < unlockedCount;
    const isNew = highlightNewDigits && (
      (unlockedCount === 10 && i >= 6) ||
      (unlockedCount === 6 && i >= 3 && i <= 5) ||
      (unlockedCount === 3 && (i === 1 || i === 2))
    );
    slots.push({ char: isUnlocked ? char : "*", isUnlocked, isNew });
  }

  const isSmall = size === "sm";

  return (
    <div
      id="header-master-key-hud"
      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-[#09090d] border border-neutral-800 text-xs font-mono select-none transition-all duration-300 ${className} ${
        highlightNewDigits ? "ring-2 ring-[#ff5500] shadow-[0_0_20px_rgba(255,85,0,0.5)]" : ""
      }`}
    >
      <div className="flex items-center gap-1 text-[#ff5500] font-bold text-[10px] sm:text-[11px] uppercase tracking-wider shrink-0">
        <Key weight="bold" className="size-3.5 text-[#ff5500]" />
        <span className="hidden sm:inline">VAULT KEY:</span>
      </div>

      {/* 10-slot Straight Line Master Key Display */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {slots.map((slot, idx) => (
          <span
            key={idx}
            className={`flex items-center justify-center font-black font-mono transition-all duration-300 ${
              isSmall ? "w-6 h-6 text-xs" : "w-7 h-7 text-xs sm:text-sm"
            } ${
              slot.isUnlocked
                ? slot.isNew
                  ? "bg-emerald-500 text-black border border-emerald-300 scale-110 shadow-[0_0_12px_#10b981] animate-pulse"
                  : idx === 0
                  ? "bg-[#ff5500] text-black border border-[#ff5500] shadow-[0_0_8px_rgba(255,85,0,0.4)]"
                  : "bg-emerald-500 text-black border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                : "bg-neutral-950 text-neutral-500 border border-neutral-800"
            }`}
          >
            {slot.isUnlocked ? slot.char : "*"}
          </span>
        ))}
      </div>

      {unlockedCount > 1 && (
        <span className="hidden md:inline text-[9px] px-1 bg-emerald-950/80 border border-emerald-700/50 text-emerald-400 font-bold uppercase">
          {unlockedCount}/10
        </span>
      )}
    </div>
  );
}
