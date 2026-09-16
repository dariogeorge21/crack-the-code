"use client";

import React from "react";
import {
  Copy,
  Check,
  CaretDown,
  CaretUp,
  Eye,
  EyeSlash,
  CheckCircle,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { AdminTeamData } from "@/types";
import { getLiveDuration } from "@/lib/time";
import { getMaskedCode } from "@/lib/code-masking";
import { AdminTeamDrawer } from "./admin-team-drawer";

interface AdminTableViewProps {
  teams: AdminTeamData[];
  nowMs: number;
  showUnlockedOnly: boolean;
  rowCodeToggles: Record<string, boolean>;
  onToggleRowCode: (id: string) => void;
  expandedTeamId: string | null;
  onToggleExpandedTeam: (id: string) => void;
  copiedCode: string | null;
  onCopy: (text: string, id: string) => void;
  onResetTeam?: (team: AdminTeamData) => void;
  onRevertTeam?: (team: AdminTeamData) => void;
  onClearFilters?: () => void;
}

export function AdminTableView({
  teams,
  nowMs,
  showUnlockedOnly,
  rowCodeToggles,
  onToggleRowCode,
  expandedTeamId,
  onToggleExpandedTeam,
  copiedCode,
  onCopy,
  onResetTeam,
  onRevertTeam,
  onClearFilters,
}: AdminTableViewProps) {
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
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse min-w-[800px]">
          <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-12 text-zinc-500 font-normal">#</th>
              <th className="py-3 px-4 font-semibold">Team Name</th>
              <th className="py-3 px-4 font-semibold">Access Code</th>
              <th className="py-3 px-4 font-semibold">Current Stage</th>
              <th className="py-3 px-4 font-semibold">Elapsed Time</th>
              <th className="py-3 px-4 font-semibold">Master Key Progress</th>
              <th className="py-3 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
                  No telemetry records found matching current criteria.
                </td>
              </tr>
            ) : (
              teams.map((t, idx) => {
              const isExpanded = expandedTeamId === t.id;
              const isUnlockedOnly = rowCodeToggles[t.id] ?? showUnlockedOnly;
              const masked = getMaskedCode(t);
              const displayMasterCode = isUnlockedOnly ? masked : t.master_code;
              const hasCode = t.team_code && !t.is_code_flushed && !t.team_code.startsWith("RESET");
              const isFinished = t.is_finished || t.current_level >= 5 || Boolean(t.completed_level4_at);

              // Status badge config
              const statusBadge = (() => {
                if (isFinished) {
                  return {
                    label: t.rank ? `🏆 Rank #${t.rank} Finished` : "Finished 🏁",
                    style: "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 font-bold",
                  };
                }
                if (t.current_level === 4) {
                  return {
                    label: "Tier 04: Final Lock",
                    style: "bg-orange-950/70 border-orange-500/50 text-orange-300",
                  };
                }
                if (t.current_level === 3) {
                  return {
                    label: "Tier 03: Airport",
                    style: "bg-cyan-950/70 border-cyan-500/50 text-cyan-300",
                  };
                }
                if (t.current_level === 2) {
                  return {
                    label: "Tier 02: Arena",
                    style: "bg-emerald-950/70 border-emerald-500/50 text-emerald-300",
                  };
                }
                if (t.started_at) {
                  return {
                    label: "Tier 01: Lab",
                    style: "bg-amber-950/70 border-amber-500/50 text-amber-300",
                  };
                }
                if (!hasCode) {
                  return {
                    label: "Awaiting Code",
                    style: "bg-zinc-900 border-zinc-700 text-zinc-500",
                  };
                }
                return {
                  label: "Ready / Idle",
                  style: "bg-zinc-900 border-zinc-700 text-zinc-400",
                };
              })();

              return (
                <React.Fragment key={t.id || t.team_number}>
                  <tr
                    className={`transition-colors cursor-pointer hover:bg-zinc-800/40 ${
                      isExpanded ? "bg-zinc-800/50" : ""
                    }`}
                    onClick={() => onToggleExpandedTeam(t.id)}
                  >
                    {/* Rank / Number */}
                    <td className="py-3 px-4 text-zinc-500 font-medium whitespace-nowrap">
                      {t.rank ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[10px]">
                          Rank #{t.rank}
                        </span>
                      ) : (
                        String(idx + 1).padStart(2, "0")
                      )}
                    </td>

                    {/* Team Name */}
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{t.team_name}</span>
                        <span className="text-[10px] text-zinc-500 font-normal">
                          (T-{t.team_number})
                        </span>
                      </div>
                    </td>

                    {/* 3-Digit Access Code */}
                    <td
                      className="py-3 px-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hasCode ? (
                        <button
                          type="button"
                          onClick={() => onCopy(t.team_code, t.id)}
                          title="Click to copy team access code"
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-[#ff5500]/50 hover:border-[#ff5500] text-[#ff5500] font-bold text-xs tracking-wider transition-colors cursor-pointer"
                        >
                          <span>{t.team_code}</span>
                          {copiedCode === t.id ? (
                            <Check weight="bold" className="size-3 text-emerald-400" />
                          ) : (
                            <Copy
                              weight="bold"
                              className="size-3 opacity-40 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-900/60 border border-dashed border-zinc-800 text-zinc-500 italic">
                          Flushed
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md border text-[11px] font-semibold ${statusBadge.style}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Time Taken */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.started_at ? (
                        <div className="flex items-center gap-1.5">
                          {isFinished ? (
                            <>
                              <CheckCircle weight="fill" className="size-3.5 text-emerald-400" />
                              <span className="font-bold text-emerald-300">
                                {t.total_time_formatted || t.time_taken_formatted}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="font-bold text-[#ff5500]">
                                {getLiveDuration(t.started_at, nowMs)}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-xs">—</span>
                      )}
                    </td>

                    {/* Master Code Progress */}
                    <td
                      className="py-3 px-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {displayMasterCode ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded font-bold tracking-widest text-xs select-all ${
                              isUnlockedOnly
                                ? "bg-emerald-950/50 border border-emerald-500/60 text-emerald-300"
                                : "bg-zinc-950 border border-zinc-700 text-zinc-200"
                            }`}
                          >
                            {displayMasterCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleRowCode(t.id)}
                            title={
                              isUnlockedOnly
                                ? "Show full 10-digit code"
                                : "Show unlocked code only"
                            }
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            {isUnlockedOnly ? (
                              <EyeSlash weight="bold" className="size-3.5 text-emerald-400" />
                            ) : (
                              <Eye weight="bold" className="size-3.5 text-zinc-400" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Expand / Inspect & Reset Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        {onResetTeam && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResetTeam(t);
                            }}
                            title={`Reset ${t.team_name} progress & generate fresh code`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 hover:border-red-500 text-red-400 hover:text-red-200 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <ArrowCounterClockwise weight="bold" className="size-3" />
                            <span>Reset</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpandedTeam(t.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/70 hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? "Hide" : "Details"}</span>
                          {isExpanded ? (
                            <CaretUp weight="bold" className="size-3" />
                          ) : (
                            <CaretDown weight="bold" className="size-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details Drawer */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <AdminTeamDrawer
                          team={t}
                          copiedCode={copiedCode}
                          onCopy={onCopy}
                          onResetTeam={onResetTeam}
                          onRevertTeam={onRevertTeam}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

