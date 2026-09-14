"use client";

import React from "react";
import {
  Copy,
  Check,
  Eye,
  EyeSlash,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import { AdminTeamData } from "@/types";
import { getLiveDuration } from "@/lib/time";
import { getMaskedCode } from "@/lib/code-masking";
import { AdminTeamDrawer } from "./admin-team-drawer";

interface AdminCardViewProps {
  teams: AdminTeamData[];
  nowMs: number;
  showUnlockedOnly: boolean;
  rowCodeToggles: Record<string, boolean>;
  onToggleRowCode: (id: string) => void;
  expandedTeamId: string | null;
  onToggleExpandedTeam: (id: string) => void;
  copiedCode: string | null;
  onCopy: (text: string, id: string) => void;
  onClearFilters?: () => void;
}

export function AdminCardView({
  teams,
  nowMs,
  showUnlockedOnly,
  rowCodeToggles,
  onToggleRowCode,
  expandedTeamId,
  onToggleExpandedTeam,
  copiedCode,
  onCopy,
  onClearFilters,
}: AdminCardViewProps) {
  if (teams.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-zinc-900/40 border border-zinc-800 font-mono text-zinc-400 space-y-3">
        <p className="text-sm font-semibold">No teams found matching current criteria.</p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 font-mono">
      {teams.map((t, idx) => {
        const isExpanded = expandedTeamId === t.id;
        const isUnlockedOnly = rowCodeToggles[t.id] ?? showUnlockedOnly;
        const masked = getMaskedCode(t);
        const displayMasterCode = isUnlockedOnly ? masked : t.master_code;
        const hasCode = t.team_code && !t.is_code_flushed && !t.team_code.startsWith("RESET");

        // Progress percentage for visual mini-bar
        const progressPercent = t.current_level >= 4 ? 100 : t.current_level === 3 ? 75 : t.current_level === 2 ? 50 : t.started_at ? 25 : 0;

        return (
          <div
            key={t.id || t.team_number}
            className={`rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden bg-zinc-900/60 ${
              isExpanded
                ? "border-zinc-700 bg-zinc-900 shadow-md"
                : "border-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            {/* Card Header */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-bold text-sm text-white truncate max-w-[180px]" title={t.team_name}>
                      {t.team_name}
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Allocated Team {t.team_number}
                  </span>
                </div>

                {/* 3-Digit Access Code */}
                {hasCode ? (
                  <button
                    type="button"
                    onClick={() => onCopy(t.team_code, t.id)}
                    title="Click to copy team code"
                    className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-[#ff5500]/50 hover:border-[#ff5500] text-[#ff5500] font-bold text-xs tracking-wider transition-colors cursor-pointer"
                  >
                    <span>{t.team_code}</span>
                    {copiedCode === t.id ? (
                      <Check weight="bold" className="size-3 text-emerald-400" />
                    ) : (
                      <Copy weight="bold" className="size-3 opacity-40 group-hover:opacity-100" />
                    )}
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-950 border border-dashed border-zinc-800 text-zinc-500 italic">
                    Flushed
                  </span>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-semibold">
                    {t.current_level >= 4
                      ? "Cleared 🏁"
                      : t.current_level === 3
                      ? "Round 3: Master Key"
                      : t.current_level === 2
                      ? "Round 2: Code Arena"
                      : t.started_at
                      ? "Round 1: Audio Lab"
                      : "Standby"}
                  </span>
                  <span className="text-zinc-500 text-[10px]">{progressPercent}%</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      t.current_level >= 4
                        ? "bg-purple-500"
                        : t.current_level === 3
                        ? "bg-cyan-500"
                        : t.current_level === 2
                        ? "bg-emerald-500"
                        : t.started_at
                        ? "bg-amber-500"
                        : "bg-zinc-700"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Timing & Master Code Row */}
              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                {/* Timer */}
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Elapsed Time</span>
                  {t.started_at ? (
                    <div className="flex items-center gap-1.5">
                      {t.current_level >= 4 ? (
                        <span className="font-bold text-purple-300">
                          {t.total_time_formatted || t.time_taken_formatted}
                        </span>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-bold text-[#ff5500]">
                            {getLiveDuration(t.started_at, nowMs)}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-500 italic text-xs">Not started</span>
                  )}
                </div>

                {/* Master Code */}
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block uppercase">Master Key</span>
                  {displayMasterCode ? (
                    <div className="inline-flex items-center gap-1">
                      <span
                        className={`text-xs font-bold tracking-wider ${
                          isUnlockedOnly ? "text-emerald-400" : "text-zinc-300"
                        }`}
                      >
                        {displayMasterCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleRowCode(t.id)}
                        className="text-zinc-500 hover:text-white p-0.5 cursor-pointer"
                      >
                        {isUnlockedOnly ? (
                          <EyeSlash weight="bold" className="size-3 text-emerald-400" />
                        ) : (
                          <Eye weight="bold" className="size-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-zinc-600 text-xs">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer: Details Toggle */}
            <div className="bg-zinc-950/60 border-t border-zinc-800/60 px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase">
                Tier 0{t.current_level}
              </span>
              <button
                type="button"
                onClick={() => onToggleExpandedTeam(t.id)}
                className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                {isExpanded ? (
                  <CaretUp weight="bold" className="size-3" />
                ) : (
                  <CaretDown weight="bold" className="size-3" />
                )}
              </button>
            </div>

            {/* Expanded Drawer in Card */}
            {isExpanded && (
              <AdminTeamDrawer
                team={t}
                copiedCode={copiedCode}
                onCopy={onCopy}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

