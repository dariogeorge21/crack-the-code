"use client";

import React from "react";
import { Warning, ArrowCounterClockwise, X, CircleNotch, ShieldCheck, Key } from "@phosphor-icons/react";
import { AdminTeamData } from "@/types";

interface AdminTeamActionModalProps {
  isOpen: boolean;
  action: "reset" | "revert" | null;
  team: AdminTeamData | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function AdminTeamActionModal({
  isOpen,
  action,
  team,
  onClose,
  onConfirm,
  isLoading,
}: AdminTeamActionModalProps) {
  if (!isOpen || !team || !action) return null;

  const isReset = action === "reset";
  const currentLevel = team.current_level;
  const targetLevel = isReset ? 1 : Math.max(1, currentLevel - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-md rounded-xl bg-zinc-900 border ${
        isReset ? "border-red-900/70" : "border-amber-700/60"
      } shadow-2xl p-5 sm:p-6 font-mono text-white space-y-4`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            {isReset ? (
              <Warning weight="bold" className="size-5 text-red-400 shrink-0" />
            ) : (
              <ArrowCounterClockwise weight="bold" className="size-5 text-amber-400 shrink-0" />
            )}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isReset ? "Confirm Team Reset" : "Confirm Level Rollback"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            <X weight="bold" className="size-4" />
          </button>
        </div>

        {/* Team Identification Badge */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-white text-sm">{team.team_name}</div>
            <div className="text-[10px] text-zinc-500">Allocated Team {team.team_number}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 block uppercase">Transition</span>
            <div className="flex items-center gap-1 font-bold">
              <span className="text-zinc-400">Tier 0{currentLevel}</span>
              <span className="text-zinc-600">→</span>
              <span className={isReset ? "text-red-400" : "text-amber-400"}>
                Tier 0{targetLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Action Details & Guarantees */}
        <div className="space-y-2 text-xs">
          <div className="text-zinc-300 leading-relaxed text-[11px]">
            {isReset ? (
              <span>
                You are about to reset all active progress for <strong>{team.team_name}</strong> back to Tier 01 (Round 1).
              </span>
            ) : (
              <span>
                You are about to revert <strong>{team.team_name}</strong> from Tier 0{currentLevel} to Tier 0{targetLevel}.
              </span>
            )}
          </div>

          <ul className="text-[11px] text-zinc-400 space-y-1.5 list-disc pl-4 bg-black/40 p-2.5 rounded border border-zinc-800/80">
            <li className="text-emerald-400">
              <strong className="text-white">Team Access Code ({team.team_code || "—"})</strong> is preserved for participant login.
            </li>
            <li className="text-cyan-400">
              <strong className="text-white">10-Digit Master Lock</strong> is preserved, but unlocked digits are masked again back to Tier 0{targetLevel}.
            </li>
            {isReset ? (
              <li>All split timers and completion records will be reset to null.</li>
            ) : (
              <li>Tier 0{currentLevel} completion split timestamp is revoked.</li>
            )}
            <li>The participant&apos;s browser will automatically reflect the updated level on next action/refresh.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 ${
              isReset
                ? "bg-red-600 hover:bg-red-500 shadow-red-900/30"
                : "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30"
            }`}
          >
            {isLoading ? (
              <>
                <CircleNotch weight="bold" className="size-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isReset ? (
              <span>Confirm Reset to L1</span>
            ) : (
              <span>Confirm Revert to L0{targetLevel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminTeamActionModal;
