"use client";

import { EVENT_DATA } from "@/constants";
import { LevelCard } from "./level-card";
import { 
  LockOpen, 
  Lock
} from "@phosphor-icons/react";

interface RoundsSectionProps {
  onOpenIdeasModal?: (roundNum?: number) => void;
}

export function RoundsSection({ onOpenIdeasModal }: RoundsSectionProps = {}) {
  return (
    <section
      id="rounds"
      className="relative py-24 px-4 sm:px-6 lg:px-12 bg-[#080808] border-b border-[#27272a] scroll-mt-12"
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-[10px] font-mono tracking-widest text-[#ff5500] uppercase mb-3">
              <span className="w-2 h-2 bg-[#ff5500]" />
              FOUR PROGRESSIVE LEVELS
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white">
              ROUND PROTOCOLS
            </h2>
            <p className="mt-3 text-sm text-neutral-400 font-mono max-w-xl">
              Teams progress through 4 escalating technical tiers. Clearing each stage reveals the decryption coordinates for the next lock.
            </p>
          </div>

          {/* Interactive Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-[#ff5500] text-[#ff5500]">
              <LockOpen weight="bold" className="size-4" />
              <span className="font-bold">L1: UNLOCKED</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-neutral-400">
              <Lock weight="bold" className="size-4" />
              <span>L2–L4: LOCKED (HOVER TO SCAN)</span>
            </div>
          </div>
        </div>

        {/* 4 Cards Grid - 0 corner-borders */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {EVENT_DATA.rounds.map((round) => (
            <LevelCard
              key={round.number}
              round={round}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

