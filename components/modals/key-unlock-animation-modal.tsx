"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkle,
  Key,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Lightning,
  ArrowDown,
} from "@phosphor-icons/react";

interface KeyUnlockAnimationModalProps {
  isOpen: boolean;
  digits: [string, string] | string[];
  maskedMasterCode: string;
  onComplete: () => void;
  onSettled?: () => void;
  accessCode?: string;
  subtitle?: string;
}

export function KeyUnlockAnimationModal({
  isOpen,
  digits,
  maskedMasterCode,
  onComplete,
  onSettled,
  accessCode = "88",
  subtitle,
}: KeyUnlockAnimationModalProps) {
  // Animation phases:
  // "intro": 2 numbers pop up in the center stage; the Master Key below shows slots 1 & 2 masked as "*"
  // "flowing": The 2 numbers fly smoothly down into Slot 1 and Slot 2 in the popup's Master Key rack
  // "settled": The numbers land into Slot 1 and Slot 2 with celebration impact; key reveals 3 digits!
  const [phase, setPhase] = useState<"intro" | "flowing" | "settled">("intro");
  const [isFlowing, setIsFlowing] = useState(false);

  const modalCardRef = useRef<HTMLDivElement>(null);
  const pop0Ref = useRef<HTMLDivElement>(null);
  const pop1Ref = useRef<HTMLDivElement>(null);
  const slot1Ref = useRef<HTMLDivElement>(null);
  const slot2Ref = useRef<HTMLDivElement>(null);

  const [flightCoords, setFlightCoords] = useState<{
    start0: { x: number; y: number; w: number; h: number };
    end0: { x: number; y: number; w: number; h: number };
    start1: { x: number; y: number; w: number; h: number };
    end1: { x: number; y: number; w: number; h: number };
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

    // Phase 1 -> Phase 2: After 1.4s of pop in center, trigger downward flow to popup's Master Key
    const flyTimer = setTimeout(() => {
      if (
        modalCardRef.current &&
        pop0Ref.current &&
        pop1Ref.current &&
        slot1Ref.current &&
        slot2Ref.current
      ) {
        const cardRect = modalCardRef.current.getBoundingClientRect();
        const p0 = pop0Ref.current.getBoundingClientRect();
        const p1 = pop1Ref.current.getBoundingClientRect();
        const s1 = slot1Ref.current.getBoundingClientRect();
        const s2 = slot2Ref.current.getBoundingClientRect();

        setFlightCoords({
          start0: {
            x: p0.left - cardRect.left,
            y: p0.top - cardRect.top,
            w: p0.width,
            h: p0.height,
          },
          end0: {
            x: s1.left - cardRect.left,
            y: s1.top - cardRect.top,
            w: s1.width,
            h: s1.height,
          },
          start1: {
            x: p1.left - cardRect.left,
            y: p1.top - cardRect.top,
            w: p1.width,
            h: p1.height,
          },
          end1: {
            x: s2.left - cardRect.left,
            y: s2.top - cardRect.top,
            w: s2.width,
            h: s2.height,
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

  // First character unlocked in Level 1 (or default 'A')
  const firstDigit =
    maskedMasterCode && maskedMasterCode[0] !== "*" ? maskedMasterCode[0] : "A";

  // Build 10 slots for the popup's Master Key display
  // Crucially: before phase === "settled", slots 1 and 2 MUST display "*" (masked)!
  const slots: {
    char: string;
    isUnlocked: boolean;
    isTarget: boolean;
    isNew: boolean;
  }[] = [];

  for (let i = 0; i < 10; i++) {
    if (i === 0) {
      slots.push({
        char: firstDigit,
        isUnlocked: true,
        isTarget: false,
        isNew: false,
      });
    } else if (i === 1) {
      slots.push({
        char: phase === "settled" ? digits[0] : "*",
        isUnlocked: phase === "settled",
        isTarget: true,
        isNew: phase === "settled",
      });
    } else if (i === 2) {
      slots.push({
        char: phase === "settled" ? digits[1] : "*",
        isUnlocked: phase === "settled",
        isTarget: true,
        isNew: phase === "settled",
      });
    } else {
      slots.push({
        char: "*",
        isUnlocked: false,
        isTarget: false,
        isNew: false,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono select-none overflow-hidden">
      {/* Background Cyber Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ff5500 1px, transparent 1px), linear-gradient(90deg, #ff5500 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Main Center Modal Card */}
      <div
        ref={modalCardRef}
        className="w-full max-w-lg bg-[#0c0c11] border-2 border-[#ff5500] shadow-[10px_10px_0px_0px_#ffffff] p-5 sm:p-7 relative z-10 text-center animate-in zoom-in-95 duration-300 overflow-hidden"
      >
        {/* Dynamic Flying Clones: travel from center pop boxes down to Slot 1 & Slot 2 inside this popup */}
        {flightCoords && phase === "flowing" && (
          <>
            {/* Flying Digit 1 -> Slot 1 */}
            <div
              className="absolute z-40 flex items-center justify-center font-mono font-black bg-emerald-400 text-black border-2 border-white pointer-events-none transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                left: isFlowing ? flightCoords.end0.x : flightCoords.start0.x,
                top: isFlowing ? flightCoords.end0.y : flightCoords.start0.y,
                width: isFlowing ? flightCoords.end0.w : flightCoords.start0.w,
                height: isFlowing ? flightCoords.end0.h : flightCoords.start0.h,
                fontSize: isFlowing ? "14px" : "36px",
                boxShadow: isFlowing
                  ? "0 0 25px #10b981, 0 0 50px #10b981"
                  : "0 0 35px #10b981",
              }}
            >
              {digits[0]}
            </div>

            {/* Flying Digit 2 -> Slot 2 */}
            <div
              className="absolute z-40 flex items-center justify-center font-mono font-black bg-emerald-400 text-black border-2 border-white pointer-events-none transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] delay-[60ms]"
              style={{
                left: isFlowing ? flightCoords.end1.x : flightCoords.start1.x,
                top: isFlowing ? flightCoords.end1.y : flightCoords.start1.y,
                width: isFlowing ? flightCoords.end1.w : flightCoords.start1.w,
                height: isFlowing ? flightCoords.end1.h : flightCoords.start1.h,
                fontSize: isFlowing ? "14px" : "36px",
                boxShadow: isFlowing
                  ? "0 0 25px #10b981, 0 0 50px #10b981"
                  : "0 0 35px #10b981",
              }}
            >
              {digits[1]}
            </div>
          </>
        )}

        {/* Top Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
          <CheckCircle weight="fill" className="size-4" />
          <span>ROUND 02 SECURITY CHALLENGE CLEARED</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mb-1.5">
          CIPHER COORDINATES UNLOCKED
        </h2>

        <p className="text-xs text-neutral-300 mb-4 max-w-md mx-auto">
          {subtitle || (
            <>
              Diamond pattern verified. Access code{" "}
              <strong className="text-[#ff5500]">{accessCode}</strong> has extracted the next 2
              digits of your team&apos;s Master Key!
            </>
          )}
        </p>

        {/* Center Stage: Popping Digits */}
        <div className="py-4 px-3 my-3 bg-black/60 border border-neutral-800 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="text-[10px] uppercase text-neutral-400 tracking-widest font-bold mb-2.5">
            REVEALED CIPHER DIGITS [2] & [3]:
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6 my-1">
            {/* Digit 1 Pop Box */}
            <div
              ref={pop0Ref}
              className={`w-16 h-16 sm:w-20 sm:h-20 font-black text-3xl sm:text-4xl flex items-center justify-center border-2 transition-all duration-500 ${
                phase === "intro"
                  ? "bg-emerald-500 text-black border-white shadow-[0_0_35px_#10b981] scale-100 animate-in zoom-in-50 duration-300"
                  : phase === "flowing"
                  ? "bg-emerald-950/30 text-emerald-500/30 border-dashed border-emerald-500/40 scale-90"
                  : "bg-emerald-950/20 text-emerald-400/50 border-emerald-800/60 scale-95"
              }`}
            >
              {digits[0]}
            </div>

            {/* Digit 2 Pop Box */}
            <div
              ref={pop1Ref}
              className={`w-16 h-16 sm:w-20 sm:h-20 font-black text-3xl sm:text-4xl flex items-center justify-center border-2 transition-all duration-500 ${
                phase === "intro"
                  ? "bg-emerald-500 text-black border-white shadow-[0_0_35px_#10b981] scale-100 animate-in zoom-in-50 duration-300 delay-100"
                  : phase === "flowing"
                  ? "bg-emerald-950/30 text-emerald-500/30 border-dashed border-emerald-500/40 scale-90"
                  : "bg-emerald-950/20 text-emerald-400/50 border-emerald-800/60 scale-95"
              }`}
            >
              {digits[1]}
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
                  TRANSFER COMPLETE // 3 OF 10 DIGITS UNLOCKED!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 10-Slot Master Vault Key Rack inside Popup */}
        <div className="p-3.5 bg-[#08080c] border border-neutral-800 mb-5 relative">
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
              {phase === "settled" ? "3 / 10 DIGITS UNLOCKED" : "1 / 10 DIGITS UNLOCKED"}
            </span>
          </div>

          {/* 10 Distinct Slot Boxes */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-2">
            {slots.map((slot, idx) => {
              const isTargetSlot1 = idx === 1;
              const isTargetSlot2 = idx === 2;

              return (
                <div
                  key={idx}
                  ref={
                    isTargetSlot1
                      ? slot1Ref
                      : isTargetSlot2
                      ? slot2Ref
                      : undefined
                  }
                  className={`flex items-center justify-center font-mono font-black select-none transition-all duration-300 ${
                    "w-7 h-8 sm:w-8.5 sm:h-9.5 text-xs sm:text-sm"
                  } ${
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
              ? "Slots [2] & [3] locked into Vault Key. 7 encrypted digits remaining."
              : "Awaiting coordinate injection into slots [2] & [3]..."}
          </div>
        </div>

        {/* Continue Action Button */}
        <button
          type="button"
          onClick={onComplete}
          className="w-full py-4 px-6 font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 bg-[#ff5500] hover:bg-white text-black shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-[6px_6px_0px_0px_#ffffff]"
        >
          <span>PROCEED // LEVEL 03 UNLOCKED</span>
          <ArrowRight weight="bold" className="size-4" />
        </button>
      </div>
    </div>
  );
}
