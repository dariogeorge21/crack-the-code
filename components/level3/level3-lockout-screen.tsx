"use client";

import React from "react";
import Link from "next/link";
import { LockKey, ArrowLeft } from "@phosphor-icons/react";

interface Level3LockoutScreenProps {
  lockReason: string;
}

export function Level3LockoutScreen({ lockReason }: Level3LockoutScreenProps) {
  return (
    <div className="min-h-screen bg-[#060608] text-white font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Cyber Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ff5500 1px, transparent 1px), linear-gradient(90deg, #ff5500 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-xl bg-[#0d0d12] border-2 border-red-600 shadow-[8px_8px_0px_0px_#ef4444] p-6 sm:p-8 relative z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <LockKey weight="bold" className="size-8 animate-pulse shrink-0" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-red-400 font-black">
              [CLEARANCE OVERRIDE REJECTED]
            </div>
            <h1 className="text-xl font-black text-white tracking-wide">
              SECURITY LOCKOUT // ROUND 03
            </h1>
          </div>
        </div>

        <div className="p-4 bg-red-950/20 border border-red-900/60 text-xs text-red-200 mb-6 leading-relaxed">
          {lockReason}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/level2"
            className="flex-1 py-3 px-4 bg-[#ff5500] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#ffffff]"
          >
            <ArrowLeft weight="bold" className="size-4" />
            <span>GO TO ROUND 02 ARENA</span>
          </Link>
          <Link
            href="/"
            className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wider transition-colors text-center border border-neutral-800"
          >
            RETURN TO COMMAND HUB
          </Link>
        </div>
      </div>
    </div>
  );
}

