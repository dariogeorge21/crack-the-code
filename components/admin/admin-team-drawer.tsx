"use client";

import React from "react";
import { Copy, Check, Key, Clock, Code } from "@phosphor-icons/react";

import { AdminTeamData } from "@/types";
import { getMaskedCode } from "@/lib/code-masking";

interface AdminTeamDrawerProps {
  team: AdminTeamData;
  copiedCode: string | null;
  onCopy: (text: string, id: string) => void;
}

export function AdminTeamDrawer({ team, copiedCode, onCopy }: AdminTeamDrawerProps) {
  const maskedCode = getMaskedCode(team);
  const copyKeyId = `full-key-${team.id}`;

  return (
    <div className="bg-zinc-950/90 border-t border-zinc-800/80 p-4 sm:p-5 font-mono text-xs text-zinc-300 animate-in slide-in-from-top-2 duration-150">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel 1: Round 1 Telemetry */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 font-semibold text-[11px] pb-1.5 border-b border-zinc-800/60">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Code weight="bold" className="size-3.5" />
              Round 1: Audio Lab
            </span>
            <span className="text-zinc-500">
              {team.completed_level1_at || team.current_level >= 2 ? "CLEARED" : team.started_at ? "IN PROGRESS" : "NOT STARTED"}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Submitted Answer:</span>
              <span className="font-semibold text-white truncate max-w-[160px]" title={team.round1_answer || "None"}>
                {team.round1_answer || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">First Digit Got:</span>
              <span className="font-bold text-amber-400">
                {team.first_digit !== null ? `[ ${team.first_digit} ]` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">L1 Split Time:</span>
              <span className="font-bold text-zinc-200">
                {team.l1_time_formatted || (team.current_level === 1 && team.started_at ? "In progress" : "—")}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 2: Round 2 & 3 Telemetry */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 font-semibold text-[11px] pb-1.5 border-b border-zinc-800/60">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Clock weight="bold" className="size-3.5" />
              Arena Splits (R2 &amp; R3)
            </span>
            <span className="text-zinc-500">
              {team.current_level >= 4 ? "FINISHED" : `TIER 0${team.current_level}`}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">R2 Code Arena Split:</span>
              <span className="font-bold text-cyan-300">
                {team.l2_time_formatted || (team.current_level === 2 ? "In progress" : "—")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">R3 Master Key Split:</span>
              <span className="font-bold text-purple-300">
                {team.l3_time_formatted || (team.current_level === 3 ? "In progress" : "—")}
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-800/60 pt-1">
              <span className="text-zinc-400 font-semibold">Total Match Time:</span>
              <span className="font-bold text-[#ff5500]">
                {team.total_time_formatted || team.time_taken_formatted || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 3: Master Key Inspector */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-400 font-semibold text-[11px] pb-1.5 border-b border-zinc-800/60">
              <span className="flex items-center gap-1.5 text-[#ff5500]">
                <Key weight="bold" className="size-3.5" />
                10-Digit Master Code
              </span>
              <span className="text-zinc-500 text-[10px]">
                {team.master_code ? "GENERATED" : "PENDING"}
              </span>
            </div>

            <div className="pt-2">
              {team.master_code ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-zinc-950 border border-zinc-800">
                    <span className="font-bold tracking-widest text-sm text-white select-all">
                      {team.master_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopy(team.master_code!, copyKeyId)}
                      title="Copy full 10-digit master key"
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                    >
                      {copiedCode === copyKeyId ? (
                        <>
                          <Check weight="bold" className="size-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy weight="bold" className="size-3" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-zinc-500 flex justify-between">
                    <span>Participant View:</span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      {maskedCode || "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-zinc-500 text-center italic text-xs">
                  Master key has not been generated for this team.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

