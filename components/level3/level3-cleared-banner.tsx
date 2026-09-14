"use client";

import React from "react";
import { CheckCircle } from "@phosphor-icons/react";

interface Level3ClearedBannerProps {
  onViewKeys: () => void;
  onDismiss: () => void;
}

export function Level3ClearedBanner({
  onViewKeys,
  onDismiss,
}: Level3ClearedBannerProps) {
  return (
    <div className="bg-emerald-500 text-black px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-300 font-mono">
      <div className="flex items-center gap-2">
        <CheckCircle weight="fill" className="size-4" />
        <span>ACCESS CODE 41 VERIFIED // ROUND 3 CLEARED!</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onViewKeys}
          className="px-3 py-1 bg-black text-white hover:bg-neutral-900 font-black text-[11px] tracking-widest border border-black uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
        >
          <span>VIEW CIPHER KEYS</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="font-bold underline text-[11px] cursor-pointer"
        >
          DISMISS
        </button>
      </div>
    </div>
  );
}

