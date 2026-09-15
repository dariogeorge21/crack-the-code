"use client";

import React from "react";
import { Users, Timer, Trophy, CheckCircle, Warning, ChartBar } from "@phosphor-icons/react";
import { AdminTeamData } from "@/types";
import { getLiveDuration } from "@/lib/time";


interface AdminStatsProps {
  totalTeams: number;
  activeCount: number;
  completedCount: number;
  levelCounts: { l1: number; l2: number; l3: number; l4?: number; completed: number };
  isCodeFlushed: boolean;
  leaderTeam: AdminTeamData | null;
  nowMs: number;
}

export function AdminStats({
  totalTeams,
  activeCount,
  completedCount,
  levelCounts,
  isCodeFlushed,
  leaderTeam,
  nowMs,
}: AdminStatsProps) {
  // Leader display time
  const leaderTime = leaderTeam
    ? leaderTeam.total_time_formatted ||
      (leaderTeam.started_at ? getLiveDuration(leaderTeam.started_at, nowMs) : null)
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6 shrink-0 font-mono">
      {/* Card 1: Total Registered */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Registered Teams</span>
          <Users weight="bold" className="size-4 text-zinc-500" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {totalTeams}
          </span>
          <span className="text-xs text-zinc-400">teams allocated</span>
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
          {isCodeFlushed ? (
            <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
              <Warning weight="fill" className="size-3.5 text-amber-400" />
              Codes flushed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle weight="fill" className="size-3.5 text-emerald-400" />
              Access codes active
            </span>
          )}
          <span className="text-zinc-500">Max 11</span>
        </div>
      </div>

      {/* Card 2: Active in Arena */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Active in Arena</span>
          <Timer weight="bold" className="size-4 text-[#ff5500]" />
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="text-2xl sm:text-3xl font-bold text-[#ff5500] tracking-tight">
            {activeCount}
          </span>
          <span className="text-xs text-zinc-400">/ {totalTeams} competing</span>
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
          {activeCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live clock ticking
            </span>
          ) : (
            <span className="text-zinc-500">Awaiting game start</span>
          )}
          <span className="text-zinc-400 font-semibold">{completedCount} Finished</span>
        </div>
      </div>

      {/* Card 3: Stage Progression Funnel */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Stage Distribution</span>
          <ChartBar weight="bold" className="size-4 text-cyan-400" />
        </div>
        {/* Stage Pills */}
        <div className="grid grid-cols-5 gap-1 my-1 text-center">
          <div className="p-1 rounded bg-amber-950/40 border border-amber-500/30">
            <span className="text-[9px] block text-amber-400/80 font-bold">L1</span>
            <span className="text-xs sm:text-sm font-bold text-amber-300">{levelCounts.l1}</span>
          </div>
          <div className="p-1 rounded bg-emerald-950/40 border border-emerald-500/30">
            <span className="text-[9px] block text-emerald-400/80 font-bold">L2</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-300">{levelCounts.l2}</span>
          </div>
          <div className="p-1 rounded bg-cyan-950/40 border border-cyan-500/30">
            <span className="text-[9px] block text-cyan-400/80 font-bold">L3</span>
            <span className="text-xs sm:text-sm font-bold text-cyan-300">{levelCounts.l3}</span>
          </div>
          <div className="p-1 rounded bg-orange-950/40 border border-orange-500/30">
            <span className="text-[9px] block text-orange-400/80 font-bold">L4</span>
            <span className="text-xs sm:text-sm font-bold text-orange-300">{levelCounts.l4 ?? 0}</span>
          </div>
          <div className="p-1 rounded bg-purple-950/40 border border-purple-500/30">
            <span className="text-[9px] block text-purple-400/80 font-bold">Fin</span>
            <span className="text-xs sm:text-sm font-bold text-purple-300">{levelCounts.completed}</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Rounds 1 &rarr; 2 &rarr; 3 &rarr; 4</span>
          <span className="text-zinc-400">{totalTeams - activeCount - completedCount} Idle</span>
        </div>
      </div>

      {/* Card 4: Leader / Fastest Pace */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Race Leader</span>
          <Trophy weight="bold" className="size-4 text-amber-400" />
        </div>
        {leaderTeam ? (
          <div>
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-white text-base truncate">
                {leaderTeam.team_name}
              </span>
              {leaderTeam.is_finished || leaderTeam.current_level >= 5 ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shrink-0">
                  🏆 RANK #{leaderTeam.rank || 1}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/40 shrink-0">
                  Tier 0{leaderTeam.current_level}
                </span>
              )}
            </div>
            <div className="text-xs text-amber-300 font-bold mt-1">
              Time: {leaderTime || "—"}
            </div>
          </div>
        ) : (
          <div className="my-auto py-1">
            <span className="text-sm text-zinc-500 italic">No active race yet</span>
          </div>
        )}
        <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Current Top Rank</span>
          {leaderTeam && (leaderTeam.is_finished || leaderTeam.current_level >= 5) ? (
            <span className="text-emerald-400 font-semibold">Rank #1 Finished 🏆</span>
          ) : leaderTeam ? (
            <span className="text-amber-400 font-semibold">In Mission</span>
          ) : (
            <span>Standby</span>
          )}
        </div>
      </div>
    </div>
  );
}

