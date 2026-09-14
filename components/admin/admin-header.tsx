"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  House,
  SignOut,
  ArrowClockwise,
  Pause,
  Play,
} from "@phosphor-icons/react";

interface AdminHeaderProps {
  autoPoll: boolean;
  onToggleAutoPoll: () => void;
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onLogout: () => void;
}

export function AdminHeader({
  autoPoll,
  onToggleAutoPoll,
  loading,
  lastUpdated,
  onRefresh,
  onLogout,
}: AdminHeaderProps) {
  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-zinc-800/80 shrink-0">
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-[#ff5500]/10 border border-[#ff5500]/40 flex items-center justify-center text-[#ff5500] shrink-0">
          <ShieldCheck weight="bold" className="size-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Central Telemetry
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#ff5500]/15 text-[#ff5500] border border-[#ff5500]/30">
              ASTHRA 11.0
            </span>

            {/* Live Sync Status Pill */}
            <button
              type="button"
              onClick={onToggleAutoPoll}
              title={autoPoll ? "Auto-sync every 4s (click to pause)" : "Auto-sync paused (click to resume)"}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono transition-all cursor-pointer border ${
                autoPoll
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  autoPoll ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                }`}
              />
              <span>{autoPoll ? "Live (4s)" : "Paused"}</span>
              {autoPoll ? (
                <Pause weight="bold" className="size-2.5 opacity-60 ml-0.5" />
              ) : (
                <Play weight="fill" className="size-2.5 opacity-60 ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 font-mono">
            <span>11-Teams Real-Time Monitoring</span>
            {formattedTime && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500 text-[11px]">Synced {formattedTime}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh telemetry data now"
          className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <ArrowClockwise weight="bold" className={`size-3.5 ${loading ? "animate-spin text-[#ff5500]" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Main Site Link */}
        <Link
          href="/"
          className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <House weight="bold" className="size-3.5" />
          <span>Main Site</span>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-red-950/60 border border-zinc-700/70 hover:border-red-500/50 text-zinc-300 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <SignOut weight="bold" className="size-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

