"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkle,
  Key,
  ArrowRight,
  Diamond,
  X,
} from "@phosphor-icons/react";

interface Round3UnlockModalProps {
  isOpen: boolean;
  digits: string[];
  maskedMasterCode: string;
  onComplete: () => void;
}

export function Round3UnlockModal({
  isOpen,
  digits,
  maskedMasterCode,
  onComplete,
}: Round3UnlockModalProps) {
  if (!isOpen) return null;

  // Build the 10 slots
  const slots: { char: string; isUnlocked: boolean; isNew: boolean }[] = [];
  const cleanMasked = (maskedMasterCode || "763842****").padEnd(10, "*");

  for (let i = 0; i < 10; i++) {
    const char = cleanMasked[i] || "*";
    const isUnlocked = char !== "*";
    const isNew = i >= 3 && i <= 5; // Digits 3, 4, 5 are the newly unlocked ones
    slots.push({ char, isUnlocked, isNew });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-[#0a0a0f] border-2 border-[#ff5500] shadow-[10px_10px_0px_0px_#ffffff] p-6 sm:p-8 font-mono text-white overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Background Cyber Grid Accent */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#ff5500 1px, transparent 1px), linear-gradient(90deg, #ff5500 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Diamond weight="fill" className="size-5 text-[#ff5500] animate-bounce" />
            <span className="text-xs font-black uppercase tracking-widest text-[#ff5500]">
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

        {/* Center Stage: 3 Revealed Digits */}
        <div className="text-center my-4">
          <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold mb-2">
            CIPHER DECRYPTION // NEW MASTER KEY DIGITS:
          </div>

          <div className="flex items-center justify-center gap-3 my-3">
            {digits.map((digit, idx) => (
              <div
                key={idx}
                className="w-14 h-16 sm:w-16 sm:h-20 bg-emerald-500 text-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center font-black text-2xl sm:text-3xl"
              >
                {digit}
              </div>
            ))}
          </div>

          <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mt-2 flex items-center justify-center gap-1.5">
            <Sparkle weight="fill" className="size-4 text-emerald-300 animate-spin" />
            <span>TRANSFER COMPLETE // 6 OF 10 DIGITS UNLOCKED!</span>
          </div>
        </div>

        {/* 10-Slot Master Vault Key Rack */}
        <div className="p-4 bg-[#08080c] border border-neutral-800 my-5 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#ff5500] font-bold uppercase tracking-wider">
              <Key weight="fill" className="size-3.5 text-[#ff5500]" />
              <span>MASTER VAULT CIPHER KEY:</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 font-black uppercase tracking-wider">
              6 / 10 DIGITS UNLOCKED
            </span>
          </div>

          {/* 10 Distinct Slot Boxes */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-3">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className={"flex-1 max-w-[42px] aspect-square flex items-center justify-center text-sm sm:text-base font-black border transition-all duration-300 " + (
                  slot.isNew
                    ? "bg-emerald-500 text-black border-white shadow-[2px_2px_0px_0px_#10b981]"
                    : slot.isUnlocked
                    ? "bg-neutral-900 text-cyan-300 border-cyan-500/50"
                    : "bg-[#0a0a0f] text-neutral-600 border-neutral-800"
                )}
              >
                {slot.char}
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
            Slots 01 - 06 Online // Slots 07 - 10 Awaiting Final Breach
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onComplete}
            className="w-full sm:w-auto px-6 py-3 bg-[#ff5500] hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center gap-2 active:translate-y-0.5"
          >
            <span>PROCEED TO FINAL LOCK</span>
            <ArrowRight weight="bold" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
