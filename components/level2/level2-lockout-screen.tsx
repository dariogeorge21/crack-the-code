"use client";

import React from "react";
import Link from "next/link";
import { LockKey, ArrowLeft } from "@phosphor-icons/react";

interface Level2LockoutScreenProps {
  lockReason: string;
}

export function Level2LockoutScreen({ lockReason }: Level2LockoutScreenProps) {
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
              SECURITY LOCKOUT // ROUND 02
            </h1>
          </div>
        </div>

        <div className="p-4 bg-red-950/40 border border-red-800 text-red-300 text-xs sm:text-sm leading-relaxed mb-6 font-mono">
          <div className="font-bold text-red-400 uppercase mb-1">ACCESS DENIED:</div>
          <p>{lockReason}</p>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 mb-6 space-y-1.5">
          <div className="text-white font-bold uppercase text-[11px]">REQUIREMENTS TO UNLOCK:</div>
          <div>1. Access Level 1 via the main terminal.</div>
          <div>2. Discover your physical challenge solution in the lab.</div>
          <div>3. Enter your Round 1 answer and unlock your 10-digit Master Key.</div>
        </div>

        <Link
          href="/"
          className="w-full py-3.5 px-4 bg-[#ff5500] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
        >
          <ArrowLeft weight="bold" className="size-4" />
          <span>RETURN TO LEVEL 01 TERMINAL</span>
        </Link>
      </div>
    </div>
  );
}

