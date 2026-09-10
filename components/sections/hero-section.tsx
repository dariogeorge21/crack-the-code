"use client";

import { EVENT_DATA } from "@/lib/event-data";
import { 
  Lock, 
  LockOpen, 
  ArrowDown, 
  ShieldCheck, 
  Timer, 
  Users,
  Terminal,
  Cpu,
  Play
} from "@phosphor-icons/react";

interface HeroSectionProps {
  onOpenIdeasModal?: () => void;
  onStartGame?: () => void;
}

export function HeroSection({ onOpenIdeasModal, onStartGame }: HeroSectionProps = {}) {
  const scrollToRounds = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("rounds");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between pt-24 pb-8 px-4 sm:px-6 lg:px-12 bg-[#080808] bg-cyber-grid overflow-hidden border-b border-[#27272a]">
      {/* Corner crosshairs for technical precision */}
      <div className="absolute top-20 left-6 text-[#ff5500]/40 font-mono text-xs select-none pointer-events-none hidden md:block">
        + 00°11&apos;ASTHRA // SEC_01
      </div>
      <div className="absolute top-20 right-6 text-neutral-600 font-mono text-xs select-none pointer-events-none hidden md:block">
        VAULT_STATUS: ACTIVE +
      </div>
      <div className="absolute bottom-16 left-6 text-neutral-600 font-mono text-xs select-none pointer-events-none hidden md:block">
        + COORD [9.9312° N, 76.2673° E]
      </div>
      <div className="absolute bottom-16 right-6 text-[#ff5500]/40 font-mono text-xs select-none pointer-events-none hidden md:block">
        ENC_256 // LEVEL_01 READY +
      </div>

      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#ff5500]/10 blur-[130px] pointer-events-none" />

      {/* Top Header Block */}
      <div className="max-w-7xl mx-auto w-full pt-4 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2.5 h-2.5 bg-[#ff5500]" />
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-[#ff5500] font-bold">
            {EVENT_DATA.event.type}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Timer weight="bold" className="size-3.5 text-[#ff5500]" />
            {EVENT_DATA.event.meta.duration}
          </span>
          <span className="text-neutral-700">|</span>
          <span className="flex items-center gap-1.5">
            <Users weight="bold" className="size-3.5 text-[#ff5500]" />
            {EVENT_DATA.event.meta.teamSize}
          </span>
          <span className="text-neutral-700">|</span>
          <span className="text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5">
            {EVENT_DATA.event.meta.roundsCount}
          </span>
        </div>
      </div>

      {/* Main Large Typography Hero Stage */}
      <div className="max-w-7xl mx-auto w-full my-auto py-10 z-10 flex flex-col items-center text-center">
        {/* Subtitle Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-neutral-900/90 border border-neutral-700 shadow-[3px_3px_0px_0px_#ff5500]">
          <span className="w-1.5 h-1.5 bg-[#ff5500]" />
          <span className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-white">
            {EVENT_DATA.event.edition}
          </span>
          <span className="text-neutral-500 font-mono">///</span>
          <span className="text-xs font-mono tracking-wider text-[#ff5500] uppercase">
            {EVENT_DATA.event.tagline}
          </span>
        </div>

        {/* Huge Title: CRACK THE LOCK */}
        <div className="relative w-full max-w-6xl select-none">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-none text-white drop-shadow-2xl">
            CRACK THE
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] via-[#ff772a] to-white glow-orange-text">
              LOCK
            </span>
          </h1>

          {/* Glitch / Precision outline overlay hint */}
          <div className="absolute -top-1 left-0 right-0 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-none text-transparent stroke-orange pointer-events-none opacity-10 blur-[1px]">
            CRACK THE LOCK
          </div>
        </div>

        {/* Hero Message Tagline */}
        <div className="mt-8 max-w-2xl mx-auto">
          <p className="text-lg sm:text-2xl font-bold uppercase tracking-wide text-neutral-200">
            &ldquo;{EVENT_DATA.event.hero_message}&rdquo;
          </p>
          <p className="mt-3 text-xs sm:text-sm text-neutral-400 font-mono max-w-xl mx-auto leading-relaxed">
            4 sequential physical, cryptographic, algorithmic and multi-tier locks.
            Solve the clues, dismantle the firewalls, and crack the final vault.
          </p>
        </div>

        {/* Mini Vault Status Radar (Teaser for 4 rounds) */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
          <div className="p-3 bg-neutral-950 border-2 border-[#ff5500] flex items-center justify-between shadow-[3px_3px_0px_0px_#ff5500]">
            <div className="text-left font-mono">
              <span className="text-[10px] text-neutral-400 block">STAGE 01</span>
              <span className="text-xs font-bold text-white">L1 PHYSICAL</span>
            </div>
            <div className="flex items-center gap-1 text-[#ff5500]">
              <LockOpen weight="bold" className="size-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase">OPEN</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/80 border border-neutral-800 flex items-center justify-between opacity-80 hover:opacity-100 hover:border-neutral-500 transition-all">
            <div className="text-left font-mono">
              <span className="text-[10px] text-neutral-500 block">STAGE 02</span>
              <span className="text-xs font-bold text-neutral-300">L2 DSA/CODE</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-500">
              <Lock weight="bold" className="size-4" />
              <span className="text-[10px] font-bold uppercase">LOCKED</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/80 border border-neutral-800 flex items-center justify-between opacity-80 hover:opacity-100 hover:border-neutral-500 transition-all">
            <div className="text-left font-mono">
              <span className="text-[10px] text-neutral-500 block">STAGE 03</span>
              <span className="text-xs font-bold text-neutral-300">L3 DSA/CODE</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-500">
              <Lock weight="bold" className="size-4" />
              <span className="text-[10px] font-bold uppercase">LOCKED</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/80 border border-neutral-800 flex items-center justify-between opacity-80 hover:opacity-100 hover:border-neutral-500 transition-all">
            <div className="text-left font-mono">
              <span className="text-[10px] text-neutral-500 block">STAGE 04</span>
              <span className="text-xs font-bold text-neutral-300">L4 VAULT</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-500">
              <Lock weight="bold" className="size-4" />
              <span className="text-[10px] font-bold uppercase">LOCKED</span>
            </div>
          </div>
        </div>

        {/* CTA Button Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 z-20">
          <a
            href="#rounds"
            onClick={scrollToRounds}
            className="w-full sm:w-auto px-8 py-4 bg-[#ff5500] hover:bg-white text-black font-black text-sm tracking-widest uppercase transition-all shadow-[4px_4px_0px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>EXPLORE 4 ROUNDS</span>
            <ArrowDown weight="bold" className="size-4 animate-bounce" />
          </a>

          <button
            type="button"
            onClick={() => {
              if (onStartGame) {
                onStartGame();
              } else {
                scrollToRounds({ preventDefault: () => {} } as React.MouseEvent);
              }
            }}
            className="w-full sm:w-auto px-8 py-4 bg-neutral-900 border border-neutral-700 hover:border-[#ff5500] text-white hover:text-[#ff5500] font-bold text-sm tracking-widest uppercase transition-all shadow-[4px_4px_0px_0px_#ff5500] flex items-center justify-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            <Play weight="bold" className="size-4 text-[#ff5500]" />
            <span>START GAME</span>
          </button>
        </div>
      </div>

      {/* Bottom Live Marquee Ribbon */}
      <div className="relative max-w-7xl mx-auto w-full pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-neutral-400 z-10">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-[#ff5500] text-black font-bold text-[10px] tracking-wider uppercase">
            STATUS
          </span>
          <span className="text-white text-xs tracking-wider">
            REGISTRATION OPEN // LIMITED SLOTS
          </span>
        </div>

        <a
          href="#rounds"
          onClick={scrollToRounds}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors cursor-pointer group"
        >
          <span className="text-[11px] tracking-widest uppercase">SCROLL DOWN TO DISCOVER ROUNDS</span>
          <div className="w-6 h-6 border border-neutral-700 flex items-center justify-center group-hover:border-[#ff5500] group-hover:text-[#ff5500] transition-colors">
            <ArrowDown weight="bold" className="size-3" />
          </div>
        </a>
      </div>
    </section>
  );
}

