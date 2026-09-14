"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Sparkle,
  Key,
  CheckCircle,
  Timer,
  Crown,
  Copy,
  Check,
  Medal,
  Users,
  Lightning
} from "@phosphor-icons/react";

interface SplitTime {
  l1Formatted?: string | null;
  l2Formatted?: string | null;
  l3Formatted?: string | null;
  l4Formatted?: string | null;
  totalFormatted?: string | null;
  l1Seconds?: number | null;
  l2Seconds?: number | null;
  l3Seconds?: number | null;
  l4Seconds?: number | null;
  totalSeconds?: number | null;
}

interface LeaderboardEntry {
  team_number: number;
  team_name: string;
  current_level: number;
  is_winner?: boolean;
  total_formatted?: string | null;
  cleared?: boolean;
}

interface Round4VictoryModalProps {
  isOpen: boolean;
  digits: string[];
  masterCode: string;
  splitTime: SplitTime;
  teamName: string;
  teamNumber: number;
  onClose: () => void;
}

export function Round4VictoryModal({
  isOpen,
  digits,
  masterCode,
  splitTime,
  teamName,
  teamNumber,
  onClose,
}: Round4VictoryModalProps) {
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingBoard(true);
    fetch("/api/game/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch((err) => console.error("Error fetching leaderboard:", err))
      .finally(() => setLoadingBoard(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanMasterCode = (masterCode || "7839201546").slice(0, 10).padEnd(10, "*");

  const slots = cleanMasterCode.split("").map((char, idx) => ({
    char,
    isNew: idx >= 6, // Digits 7, 8, 9, 10
  }));

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanMasterCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#09090e] border-2 border-amber-400 shadow-[10px_10px_0px_0px_#f59e0b] p-5 sm:p-8 font-mono text-white overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
        {/* Background Cyber Grid Accent */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy weight="fill" className="size-6 text-amber-400 animate-bounce" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-400">
              [CRACK THE LOCK // PROTOCOL MASTER BREACH]
            </span>
          </div>
          <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-400/80 text-amber-300 font-black text-[10px] tracking-wider uppercase animate-pulse">
            VICTORY ACHIEVED
          </span>
        </div>

        {/* Victory Declaration Banner */}
        <div className="text-center my-3 py-3 px-4 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 border border-amber-500/30">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-xl sm:text-2xl uppercase tracking-wider">
            <Crown weight="fill" className="size-6 text-amber-400" />
            <span>GAME WON: {teamName || `TEAM ${teamNumber}`}!</span>
          </div>
          <p className="text-xs text-neutral-300 mt-1 uppercase tracking-wide">
            You successfully investigated all recovered files and cracked the final master lock!
          </p>
        </div>

        {/* 4 Revealed Digits Showcase */}
        <div className="text-center my-4">
          <div className="text-[11px] uppercase tracking-wider text-amber-300 font-bold mb-2 flex items-center justify-center gap-1.5">
            <Sparkle weight="fill" className="size-4 text-amber-400 animate-spin" />
            <span>FINAL 4 CIPHER DIGITS REVEALED:</span>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
            {digits.map((digit, idx) => (
              <div
                key={idx}
                className="w-13 h-15 sm:w-16 sm:h-20 bg-amber-400 text-black border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] flex flex-col items-center justify-center font-black transition-transform hover:scale-105"
              >
                <span className="text-2xl sm:text-3xl">{digit}</span>
                <span className="text-[9px] uppercase tracking-tighter text-amber-950 font-bold">SLOT 0{idx + 7}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Complete 10-Slot Master Vault Key Rack */}
        <div className="p-3.5 sm:p-4 bg-[#050508] border border-amber-500/40 my-4 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold uppercase tracking-wider">
              <Key weight="fill" className="size-3.5 text-amber-400" />
              <span>COMPLETE MASTER VAULT KEY:</span>
            </div>
            <button
              onClick={handleCopyCode}
              type="button"
              className="flex items-center gap-1 px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 text-[10px] font-bold uppercase cursor-pointer transition-colors"
            >
              {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              <span>{copied ? "COPIED" : "COPY KEY"}</span>
            </button>
          </div>

          {/* 10 Distinct Slot Boxes */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-2">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className={`flex-1 max-w-[42px] aspect-square flex items-center justify-center text-sm sm:text-base font-black border transition-all duration-300 ${
                  slot.isNew
                    ? "bg-amber-400 text-black border-white shadow-[2px_2px_0px_0px_#f59e0b]"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/60"
                }`}
              >
                {slot.char}
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-2 flex items-center justify-center gap-1">
            <CheckCircle weight="fill" className="size-3.5 text-emerald-400" />
            <span>10 / 10 DIGITS UNLOCKED // VAULT PERMANENTLY BREACHED</span>
          </div>
        </div>

        {/* Time Splits Performance Matrix */}
        <div className="p-3.5 bg-neutral-950 border border-neutral-800 my-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
              <Timer weight="bold" className="size-3.5 text-[#ff5500]" />
              MISSION TIME SPLIT MATRIX
            </span>
            <div className="text-sm font-black text-amber-400 font-mono">
              TOTAL: {splitTime.totalFormatted || "—"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <div className="p-2 bg-neutral-900 border border-neutral-800 text-center">
              <div className="text-[9px] text-neutral-400 font-bold uppercase">LEVEL 1</div>
              <div className="text-xs font-bold text-neutral-200 mt-0.5">{splitTime.l1Formatted || "—"}</div>
            </div>
            <div className="p-2 bg-neutral-900 border border-neutral-800 text-center">
              <div className="text-[9px] text-cyan-400 font-bold uppercase">LEVEL 2</div>
              <div className="text-xs font-bold text-cyan-300 mt-0.5">{splitTime.l2Formatted || "—"}</div>
            </div>
            <div className="p-2 bg-neutral-900 border border-neutral-800 text-center">
              <div className="text-[9px] text-purple-400 font-bold uppercase">LEVEL 3</div>
              <div className="text-xs font-bold text-purple-300 mt-0.5">{splitTime.l3Formatted || "—"}</div>
            </div>
            <div className="p-2 bg-neutral-900 border border-emerald-500/50 text-center">
              <div className="text-[9px] text-emerald-400 font-bold uppercase">LEVEL 4</div>
              <div className="text-xs font-bold text-emerald-300 mt-0.5">{splitTime.l4Formatted || "—"}</div>
            </div>
          </div>
        </div>

        {/* Live Leaderboard Preview */}
        <div className="p-3 bg-neutral-950 border border-neutral-800 my-4 max-h-[160px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-neutral-800">
            <span className="text-[10px] text-neutral-400 font-bold uppercase flex items-center gap-1.5">
              <Medal weight="bold" className="size-3.5 text-amber-400" />
              LIVE TOURNAMENT LEADERBOARD
            </span>
            <span className="text-[9px] text-neutral-500 uppercase">RANKED STANDINGS</span>
          </div>

          {loadingBoard ? (
            <div className="text-center py-3 text-xs text-neutral-500">Retrieving standings...</div>
          ) : (
            <div className="space-y-1">
              {leaderboard.slice(0, 5).map((entry, idx) => {
                const isCurrent = entry.team_number === teamNumber;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-2 py-1 text-xs ${
                      isCurrent
                        ? "bg-amber-500/20 border border-amber-400 text-amber-300 font-bold"
                        : "bg-neutral-900/60 text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-neutral-500">#{idx + 1}</span>
                      <span>{entry.team_name || `Team ${entry.team_number}`}</span>
                      {entry.is_winner && <Crown weight="fill" className="size-3 text-amber-400" />}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-neutral-400">{entry.is_winner ? "CLEARED" : `Tier ${entry.current_level}`}</span>
                      <span className="font-bold text-white">{entry.total_formatted || "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-amber-400 hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center gap-2 active:translate-y-0.5"
          >
            <span>DISMISS & CELEBRATE VICTORY</span>
          </button>
        </div>
      </div>
    </div>
  );
}
