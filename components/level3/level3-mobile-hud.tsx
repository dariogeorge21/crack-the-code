"use client";

import React from "react";
import { MasterKeyHud } from "@/components/layout";

interface Level3MobileHudProps {
  masterCode: string | null;
  currentLevel: number;
  isKeyRevealedInHeader?: boolean;
  isKeyHighlighted?: boolean;
}

export function Level3MobileHud({
  masterCode,
  currentLevel,
  isKeyRevealedInHeader,
  isKeyHighlighted,
}: Level3MobileHudProps) {
  const unlockedCount =
    currentLevel >= 4 || isKeyRevealedInHeader ? 6 : 3;
  const tierLabel = currentLevel >= 4 ? "CLEARED" : "TIER 03";

  return (
    <div className="sm:hidden bg-[#09090d] border-b border-neutral-800 px-4 py-1.5 flex items-center justify-between text-xs font-mono">
      <MasterKeyHud
        masterCode={masterCode}
        unlockedCount={unlockedCount}
        highlightNewDigits={isKeyHighlighted}
        size="sm"
      />
      <span className="text-[10px] text-neutral-400">
        {tierLabel}
      </span>
    </div>
  );
}

