"use client";

import React from "react";
import { MasterKeyHud } from "@/components/layout";

interface Level2MobileHudProps {
  masterCode: string | null;
  currentLevel: number;
  isKeyRevealedInHeader: boolean;
  isKeyHighlighted: boolean;
}

export function Level2MobileHud({
  masterCode,
  currentLevel,
  isKeyRevealedInHeader,
  isKeyHighlighted,
}: Level2MobileHudProps) {
  const unlockedCount =
    currentLevel >= 4 ? 6 : currentLevel >= 3 || isKeyRevealedInHeader ? 3 : 1;

  return (
    <div className="sm:hidden bg-[#09090d] border-b border-neutral-800 px-4 py-1.5 flex items-center justify-between text-xs">
      <MasterKeyHud
        masterCode={masterCode}
        unlockedCount={unlockedCount}
        highlightNewDigits={isKeyHighlighted}
        size="sm"
      />
      <span className="text-[10px] text-neutral-400 font-mono">
        TIER 0{currentLevel}
      </span>
    </div>
  );
}

