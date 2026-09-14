"use client";

import React from "react";
import { Warning, ArrowClockwise, X } from "@phosphor-icons/react";

interface AdminResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isResetting: boolean;
}

export function AdminResetModal({
  isOpen,
  onClose,
  onConfirm,
  isResetting,
}: AdminResetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-red-900/60 shadow-2xl p-5 sm:p-6 font-mono text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5 text-red-400">
            <Warning weight="bold" className="size-5 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              Confirm Competition Reset
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="text-zinc-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X weight="bold" className="size-4" />
          </button>
        </div>

        {/* Warning Content */}
        <p className="text-xs text-zinc-300 leading-relaxed">
          Are you sure you want to reset the competition? This action cannot be undone.
        </p>

        <ul className="text-[11px] text-zinc-400 space-y-1.5 list-disc pl-4">
          <li>All teams will be reset to Level 1.</li>
          <li>All elapsed times and split timing records will be cleared.</li>
          <li>Submitted answers and derived master keys will be erased.</li>
          <li>All active participant browser sessions will be logged out.</li>
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isResetting}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-900/30 disabled:opacity-50"
          >
            {isResetting ? (
              <>
                <ArrowClockwise weight="bold" className="size-3.5 animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <span>Confirm Full Reset</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

