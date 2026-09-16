"use client";

import React, { useState } from "react";
import {
  Warning,
  ArrowCounterClockwise,
  X,
  CircleNotch,
  CheckCircle,
  Copy,
  Check,
  ShieldCheck,
  Key,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { AdminTeamData, AdminTeamActionResult } from "@/types";

interface AdminTeamActionModalProps {
  isOpen: boolean;
  action: "reset" | "revert" | null;
  team: AdminTeamData | null;
  result?: AdminTeamActionResult | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function AdminTeamActionModal({
  isOpen,
  action,
  team,
  result,
  onClose,
  onConfirm,
  isLoading,
}: AdminTeamActionModalProps) {
  const [copiedNewCode, setCopiedNewCode] = useState(false);

  if (!isOpen || !team || !action) return null;

  // Post-reset success display screen with quick copy
  if (result?.success && result.newTeamCode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-emerald-500/60 shadow-2xl p-5 sm:p-6 font-mono text-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <CheckCircle weight="fill" className="size-5 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Team Reset Complete!
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X weight="bold" className="size-4" />
            </button>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">{team.team_name}</span>
              <span className="text-[10px] text-zinc-500">Allocated Team {team.team_number}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
              <span>Status:</span>
              <span className="font-bold text-amber-400">Reset to Tier 01 (Standby)</span>
            </div>
            {result.previousTeamCode && (
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Previous Code (Revoked):</span>
                <span className="line-through text-red-400/80 font-bold">{result.previousTeamCode}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/90 font-semibold block">
              New Assigned 3-Digit Team Code
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black tracking-widest text-white bg-black/60 px-4 py-2 rounded-lg border border-emerald-500/50 shadow-inner">
                {result.newTeamCode}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.newTeamCode!);
                  setCopiedNewCode(true);
                  setTimeout(() => setCopiedNewCode(false), 2000);
                }}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-900/30"
              >
                {copiedNewCode ? (
                  <>
                    <Check weight="bold" className="size-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy weight="bold" className="size-4" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 pt-1">
              Give this fresh code to <strong>{team.team_name}</strong> to let them log in from scratch.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isReset = action === "reset";
  const currentLevel = team.current_level;
  const targetLevel = isReset ? 1 : Math.max(1, currentLevel - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-xl bg-zinc-900 border ${
          isReset ? "border-red-900/70" : "border-amber-700/60"
        } shadow-2xl p-5 sm:p-6 font-mono text-white space-y-4`}
      >
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
                {isReset ? "Confirm Team Reset & New Code" : "Confirm Level Rollback"}
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
                You are about to completely reset <strong>{team.team_name}</strong> back to Tier 01 and assign them a brand new login code.
              </span>
            ) : (
              <span>
                You are about to revert <strong>{team.team_name}</strong> from Tier 0{currentLevel} to Tier 0{targetLevel}.
              </span>
            )}
          </div>

          <ul className="text-[11px] text-zinc-400 space-y-1.5 list-disc pl-4 bg-black/40 p-2.5 rounded border border-zinc-800/80">
            {isReset ? (
              <>
                <li className="text-emerald-400">
                  <strong className="text-white">Fresh 3-Digit Access Code</strong>: A new unique code will be automatically generated.
                </li>
                <li className="text-red-400">
                  <strong className="text-white">Old Code Invalidation</strong>: Current code (<strong>{team.team_code || "—"}</strong>) will be revoked immediately.
                </li>
                <li>
                  <strong className="text-zinc-200">Progress Cleared</strong>: All completed levels, split times, submitted answers, and master keys are wiped to null.
                </li>
                <li className="text-cyan-400">
                  <strong className="text-white">Strict Isolation</strong>: Other teams&apos; progress, codes, and timers are <strong>completely untouched</strong>.
                </li>
              </>
            ) : (
              <>
                <li className="text-emerald-400">
                  <strong className="text-white">Team Access Code ({team.team_code || "—"})</strong> is preserved for participant login.
                </li>
                <li className="text-cyan-400">
                  <strong className="text-white">10-Digit Master Lock</strong> is preserved, but unlocked digits are masked again back to Tier 0{targetLevel}.
                </li>
                <li>Tier 0{currentLevel} completion split timestamp is revoked.</li>
                <li>The participant&apos;s browser will automatically reflect the updated level on next action/refresh.</li>
              </>
            )}
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
              <span>Confirm Reset & Generate Code</span>
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
