"use client";

import React from "react";
import { MasterKeyHud } from "@/components/layout";

interface Level3MobileHudProps {
  masterCode: string | null;
  currentLevel: number;
}

export function Level3MobileHud({
  masterCode,
  currentLevel,
}: Level3MobileHudProps) {
  const unlockedCount = currentLevel >= 4 ? 6 : 3;
  const tierLabel = currentLevel >= 4 ? "TIER 04" : "TIER 03";

  return (
    <div className="sm:hidden bg-[#09090d] border-b border-neutral-800 px-4 py-1.5 flex items-center justify-between text-xs font-mono">
      <MasterKeyHud
        masterCode={masterCode}
        unlockedCount={unlockedCount}
        size="sm"
      />
      <span className="text-[10px] text-neutral-400">
        {tierLabel}
      </span>
    </div>
  );
}

