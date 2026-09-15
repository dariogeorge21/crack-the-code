"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkle,
  Key,
  ArrowRight,
  Diamond,
  X,
  Lightning,
  ArrowDown,
  CheckCircle,
} from "@phosphor-icons/react";

interface Round3UnlockModalProps {
  isOpen: boolean;
  digits: string[];
  maskedMasterCode: string;
  onComplete: () => void;
  onSettled?: () => void;
  accessCode?: string;
  subtitle?: string;
}

export function Round3UnlockModal({
  isOpen,
  digits,
  maskedMasterCode,
  onComplete,
  onSettled,
  accessCode = "41",
  subtitle,
}: Round3UnlockModalProps) {
  // Animation phases:
  // "intro": 3 numbers pop up in the center stage; the Master Key below shows slots 3, 4, 5 masked as "*"
  // "flowing": The 3 numbers fly smoothly down into Slots 3, 4, 5 in the Master Key rack
  // "settled": The numbers land into slots with celebration impact; key reveals 6 digits total!
  const [phase, setPhase] = useState<"intro" | "flowing" | "settled">("intro");
  const [isFlowing, setIsFlowing] = useState(false);

  const modalCardRef = useRef<HTMLDivElement>(null);
  const pop0Ref = useRef<HTMLDivElement>(null);
  const pop1Ref = useRef<HTMLDivElement>(null);
  const pop2Ref = useRef<HTMLDivElement>(null);
  const slot3Ref = useRef<HTMLDivElement>(null);
  const slot4Ref = useRef<HTMLDivElement>(null);
  const slot5Ref = useRef<HTMLDivElement>(null);

  const [flightCoords, setFlightCoords] = useState<{
    start0: { x: number; y: number; w: number; h: number };
    end0: { x: number; y: number; w: number; h: number };
    start1: { x: number; y: number; w: number; h: number };
    end1: { x: number; y: number; w: number; h: number };
    start2: { x: number; y: number; w: number; h: number };
    end2: { x: number; y: number; w: number; h: number };
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPhase("intro");
      setIsFlowing(false);
      setFlightCoords(null);
      return;
    }

    setPhase("intro");
    setIsFlowing(false);
    setFlightCoords(null);

    // Phase 1 -> Phase 2: After 1.4s of pop in center, trigger downward flow to Master Key rack
    const flyTimer = setTimeout(() => {
      if (
        modalCardRef.current &&
        pop0Ref.current &&
        pop1Ref.current &&
        pop2Ref.current &&
        slot3Ref.current &&
        slot4Ref.current &&
        slot5Ref.current
      ) {
        const cardRect = modalCardRef.current.getBoundingClientRect();
        const p0 = pop0Ref.current.getBoundingClientRect();
        const p1 = pop1Ref.current.getBoundingClientRect();
        const p2 = pop2Ref.current.getBoundingClientRect();
        const s3 = slot3Ref.current.getBoundingClientRect();
        const s4 = slot4Ref.current.getBoundingClientRect();
        const s5 = slot5Ref.current.getBoundingClientRect();

        setFlightCoords({
          start0: {
            x: p0.left - cardRect.left,
            y: p0.top - cardRect.top,
            w: p0.width,
            h: p0.height,
          },
          end0: {
            x: s3.left - cardRect.left,
            y: s3.top - cardRect.top,
            w: s3.width,
            h: s3.height,
          },
          start1: {
            x: p1.left - cardRect.left,
            y: p1.top - cardRect.top,
            w: p1.width,
            h: p1.height,
          },
          end1: {
            x: s4.left - cardRect.left,
            y: s4.top - cardRect.top,
            w: s4.width,
            h: s4.height,
          },
          start2: {
            x: p2.left - cardRect.left,
            y: p2.top - cardRect.top,
            w: p2.width,
            h: p2.height,
          },
          end2: {
            x: s5.left - cardRect.left,
            y: s5.top - cardRect.top,
            w: s5.width,
            h: s5.height,
          },
        });

        setPhase("flowing");

        // Double rAF ensures start coordinates are painted before CSS transition runs
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsFlowing(true);
          });
        });
      } else {
        setPhase("flowing");
      }
    }, 1400);

    // Phase 2 -> Phase 3: At 2.35s (950ms flight duration), numbers land into slots and settle
    const settleTimer = setTimeout(() => {
      setPhase("settled");
      setIsFlowing(false);
      if (onSettled) onSettled();
    }, 2350);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(settleTimer);
    };
  }, [isOpen, onSettled]);

  if (!isOpen) return null;

  const threeDigits = [
    digits[0] || "8",
    digits[1] || "4",
    digits[2] || "2",
  ];
  const cleanMasked = (maskedMasterCode || "A63842****").padEnd(10, "*");

  // Build 10 slots for the popup's Master Key display
  // Crucially: before phase === "settled", slots 3, 4, 5 display "*" (masked/hashed)!
  const slots: {
    char: string;
    isUnlocked: boolean;
    isTarget: boolean;
    isNew: boolean;
  }[] = [];

  for (let i = 0; i < 10; i++) {
    if (i < 3) {
      // Previously unlocked in Round 1 & Round 2
      slots.push({
        char: cleanMasked[i] !== "*" ? cleanMasked[i] : i === 0 ? "A" : i === 1 ? "6" : "3",
        isUnlocked: true,
        isTarget: false,
        isNew: false,
      });
    } else if (i >= 3 && i <= 5) {
      // Round 3 newly extracted target slots
      const digitIdx = i - 3;
      const isSettled = phase === "settled";
      slots.push({
        char: isSettled ? threeDigits[digitIdx] : "*",
        isUnlocked: isSettled,
        isTarget: !isSettled,
        isNew: isSettled,
      });
    } else {
      // Locked slots 6 to 9
      slots.push({
        char: "*",
        isUnlocked: false,
        isTarget: false,
        isNew: false,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background Cyber Grid Accent */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ff5500 1px, transparent 1px), linear-gradient(90deg, #ff5500 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Main Center Modal Card */}
      <div
        ref={modalCardRef}
        className="relative w-full max-w-xl bg-[#0c0c11] border-2 border-[#ff5500] shadow-[10px_10px_0px_0px_#ffffff] p-5 sm:p-7 text-center overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Dynamic Flying Clones: travel from center pop boxes down to Slots 3, 4, 5 */}
        {flightCoords && phase === "flowing" && (
          <>
            {/* Flying Digit 1 -> Slot 3 */}
            <div
              className="absolute z-40 flex items-center justify-center font-mono font-black bg-emerald-400 text-black border-2 border-white pointer-events-none transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                left: isFlowing ? flightCoords.end0.x : flightCoords.start0.x,
                top: isFlowing ? flightCoords.end0.y : flightCoords.start0.y,
                width: isFlowing ? flightCoords.end0.w : flightCoords.start0.w,
                height: isFlowing ? flightCoords.end0.h : flightCoords.start0.h,
                fontSize: isFlowing ? "14px" : "32px",
                boxShadow: isFlowing
                  ? "0 0 25px #10b981, 0 0 50px #10b981"
                  : "0 0 35px #10b981",
              }}
            >
              {threeDigits[0]}
            </div>

            {/* Flying Digit 2 -> Slot 4 */}
            <div
              className="absolute z-40 flex items-center justify-center font-mono font-black bg-emerald-400 text-black border-2 border-white pointer-events-none transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] delay-[60ms]"
              style={{
                left: isFlowing ? flightCoords.end1.x : flightCoords.start1.x,
                top: isFlowing ? flightCoords.end1.y : flightCoords.start1.y,
                width: isFlowing ? flightCoords.end1.w : flightCoords.start1.w,
                height: isFlowing ? flightCoords.end1.h : flightCoords.start1.h,
                fontSize: isFlowing ? "14px" : "32px",
                boxShadow: isFlowing
                  ? "0 0 25px #10b981, 0 0 50px #10b981"
                  : "0 0 35px #10b981",
              }}
            >
              {threeDigits[1]}
            </div>

            {/* Flying Digit 3 -> Slot 5 */}
            <div
              className="absolute z-40 flex items-center justify-center font-mono font-black bg-emerald-400 text-black border-2 border-white pointer-events-none transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] delay-[120ms]"
              style={{
                left: isFlowing ? flightCoords.end2.x : flightCoords.start2.x,
                top: isFlowing ? flightCoords.end2.y : flightCoords.start2.y,
                width: isFlowing ? flightCoords.end2.w : flightCoords.start2.w,
                height: isFlowing ? flightCoords.end2.h : flightCoords.start2.h,
                fontSize: isFlowing ? "14px" : "32px",
                boxShadow: isFlowing
                  ? "0 0 25px #10b981, 0 0 50px #10b981"
                  : "0 0 35px #10b981",
              }}
            >
              {threeDigits[2]}
            </div>
          </>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Diamond weight="fill" className="size-4 sm:size-5 text-[#ff5500] animate-bounce" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#ff5500]">
              [CENTRAL COMMAND // LEVEL 03 OVERRIDE ACCEPTED]
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 font-bold text-[10px] tracking-wider">
              ROUND 03 CLEARED
            </span>
            <button
              type="button"
              onClick={onComplete}
              className="text-neutral-400 hover:text-white p-1 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X weight="bold" className="size-4" />
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
          <CheckCircle weight="fill" className="size-4" />
          <span>ROUND 03 SECURITY CHALLENGE CLEARED</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mb-1.5">
          CIPHER COORDINATES UNLOCKED
        </h2>

        <p className="text-xs text-neutral-300 mb-3 max-w-md mx-auto">
          {subtitle || (
            <>
              Airport security queue validated. Access code{" "}
              <strong className="text-[#ff5500]">{accessCode}</strong> has extracted the next 3
              digits of your team&apos;s Master Key!
            </>
          )}
        </p>

        {/* Center Stage: 3 Popping Digits */}
        <div className="py-3 px-3 my-2 bg-black/60 border border-neutral-800 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="text-[10px] uppercase text-neutral-400 tracking-widest font-bold mb-2">
            REVEALED CIPHER DIGITS [4], [5] & [6]:
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-5 my-1">
            {/* Digit 1 (Slot 3) Pop Box */}
            <div
              ref={pop0Ref}
              className={`w-14 h-14 sm:w-18 sm:h-18 font-black text-2xl sm:text-4xl flex items-center justify-center border-2 transition-all duration-500 ${
                phase === "intro"
                  ? "bg-emerald-500 text-black border-white shadow-[0_0_35px_#10b981] scale-100 animate-in zoom-in-50 duration-300"
                  : phase === "flowing"
                  ? "bg-emerald-950/30 text-emerald-500/30 border-dashed border-emerald-500/40 scale-90"
                  : "bg-emerald-950/20 text-emerald-400/50 border-emerald-800/60 scale-95"
              }`}
            >
              {threeDigits[0]}
            </div>

            {/* Digit 2 (Slot 4) Pop Box */}
            <div
              ref={pop1Ref}
              className={`w-14 h-14 sm:w-18 sm:h-18 font-black text-2xl sm:text-4xl flex items-center justify-center border-2 transition-all duration-500 ${
                phase === "intro"
                  ? "bg-emerald-500 text-black border-white shadow-[0_0_35px_#10b981] scale-100 animate-in zoom-in-50 duration-300 delay-100"
                  : phase === "flowing"
                  ? "bg-emerald-950/30 text-emerald-500/30 border-dashed border-emerald-500/40 scale-90"
                  : "bg-emerald-950/20 text-emerald-400/50 border-emerald-800/60 scale-95"
              }`}
            >
              {threeDigits[1]}
            </div>

            {/* Digit 3 (Slot 5) Pop Box */}
            <div
              ref={pop2Ref}
              className={`w-14 h-14 sm:w-18 sm:h-18 font-black text-2xl sm:text-4xl flex items-center justify-center border-2 transition-all duration-500 ${
                phase === "intro"
                  ? "bg-emerald-500 text-black border-white shadow-[0_0_35px_#10b981] scale-100 animate-in zoom-in-50 duration-300 delay-200"
                  : phase === "flowing"
                  ? "bg-emerald-950/30 text-emerald-500/30 border-dashed border-emerald-500/40 scale-90"
                  : "bg-emerald-950/20 text-emerald-400/50 border-emerald-800/60 scale-95"
              }`}
            >
              {threeDigits[2]}
            </div>
          </div>

          {/* Phase Caption */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold min-h-[20px]">
            {phase === "intro" && (
              <div className="flex items-center gap-1.5 text-[#ff5500]">
                <Lightning weight="fill" className="size-3.5 animate-bounce" />
                <span className="uppercase tracking-wider text-[11px]">
                  NEW DIGITS EXTRACTED // INJECTING TO MASTER KEY...
                </span>
              </div>
            )}
            {phase === "flowing" && (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ArrowDown weight="bold" className="size-3.5 animate-bounce" />
                <span className="uppercase tracking-wider text-[11px]">
                  TRANSFERRING DIGITS INTO MASTER KEY SLOTS...
                </span>
              </div>
            )}
            {phase === "settled" && (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Sparkle weight="fill" className="size-3.5 text-emerald-300 animate-spin" />
                <span className="uppercase tracking-wider text-[11px] font-bold">
                  TRANSFER COMPLETE // 6 OF 10 DIGITS UNLOCKED!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 10-Slot Master Vault Key Rack */}
        <div className="p-3.5 bg-[#08080c] border border-neutral-800 mb-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#ff5500] font-bold uppercase tracking-wider">
              <Key weight="fill" className="size-3.5 text-[#ff5500]" />
              <span>MASTER VAULT CIPHER KEY:</span>
            </div>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 font-bold uppercase tracking-wider border transition-all duration-300 ${
                phase === "settled"
                  ? "bg-emerald-950/90 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-neutral-900 text-neutral-400 border-neutral-800"
              }`}
            >
              {phase === "settled" ? "6 / 10 DIGITS UNLOCKED" : "3 / 10 DIGITS UNLOCKED"}
            </span>
          </div>

          {/* 10 Distinct Slot Boxes */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-2">
            {slots.map((slot, idx) => {
              const isTargetSlot3 = idx === 3;
              const isTargetSlot4 = idx === 4;
              const isTargetSlot5 = idx === 5;

              return (
                <div
                  key={idx}
                  ref={
                    isTargetSlot3
                      ? slot3Ref
                      : isTargetSlot4
                      ? slot4Ref
                      : isTargetSlot5
                      ? slot5Ref
                      : undefined
                  }
                  className={`flex items-center justify-center font-mono font-black select-none transition-all duration-300 w-7 h-8 sm:w-8.5 sm:h-9.5 text-xs sm:text-sm ${
                    slot.isUnlocked
                      ? slot.isNew
                        ? "bg-emerald-400 text-black border-2 border-white scale-110 shadow-[0_0_20px_#10b981] animate-bounce"
                        : idx === 0
                        ? "bg-[#ff5500] text-black border border-[#ff5500] shadow-[0_0_8px_rgba(255,85,0,0.4)]"
                        : "bg-emerald-500 text-black border border-emerald-400"
                      : slot.isTarget
                      ? "bg-emerald-950/30 text-emerald-400/70 border-2 border-dashed border-emerald-500/60 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : "bg-neutral-950 text-neutral-600 border border-neutral-800"
                  }`}
                >
                  {slot.char}
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-neutral-500 mt-1.5 text-center">
            {phase === "settled"
              ? "Slots 01 - 06 Online // Slots 07 - 10 Awaiting Final Breach"
              : "Awaiting coordinate injection into slots [04], [05] & [06]..."}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onComplete}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#ff5500] hover:bg-white text-black font-black uppercase text-xs sm:text-sm tracking-wider transition-all cursor-pointer shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center gap-2 active:translate-y-0.5"
          >
            <span>PROCEED TO FINAL LOCK</span>
            <ArrowRight weight="bold" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

