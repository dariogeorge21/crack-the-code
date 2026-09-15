"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ShieldWarning, Key, House, ArrowRight, CircleNotch } from "@phosphor-icons/react";

interface AdminLoginViewProps {
  password: string;
  onPasswordChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoggingIn: boolean;
  authError: string | null;
  lockedOut: boolean;
  lockoutSecondsRemaining: number;
  attemptsRemaining: number;
}

export function AdminLoginView({
  password,
  onPasswordChange,
  onSubmit,
  isLoggingIn,
  authError,
  lockedOut,
  lockoutSecondsRemaining,
  attemptsRemaining,
}: AdminLoginViewProps) {
  const formatLockoutTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono flex flex-col justify-center items-center p-4 sm:p-6 relative">
      {/* Return to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-zinc-400 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
      >
        <House weight="bold" className="size-3.5" />
        <span>Return to Main Site</span>
      </Link>

      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-md">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 pb-5 mb-6 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-[#ff5500]/15 border border-[#ff5500]/40 flex items-center justify-center text-[#ff5500] shrink-0">
            <ShieldCheck weight="bold" className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">
              Coordinator Gateway
            </h1>
            <div className="text-xs text-zinc-400">
              ASTHRA 11.0 // Crack The Code Central Command
            </div>
          </div>
        </div>

        {/* Lockout Warning Banner */}
        {lockedOut && (
          <div className="mb-5 p-4 rounded-xl bg-red-950/60 border border-red-500/60 text-white text-xs space-y-2 animate-pulse">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <ShieldWarning weight="bold" className="size-4 shrink-0" />
              <span>Security Lockout Active</span>
            </div>
            <p className="text-[11px] text-red-200/90">
              Maximum failed attempts reached. Terminal access is temporarily suspended.
            </p>
            <div className="pt-2 border-t border-red-900/60 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Retry permitted in:</span>
              <span className="font-bold text-base text-white">
                {formatLockoutTimer(lockoutSecondsRemaining)}
              </span>
            </div>
          </div>
        )}

        {/* Normal Error Alert */}
        {!lockedOut && authError && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <ShieldWarning weight="bold" className="size-4 shrink-0 text-red-400" />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300">
                Coordinator Password
              </label>
              {!lockedOut && (
                <span
                  className={`text-[11px] ${
                    attemptsRemaining <= 2 ? "text-red-400 font-bold" : "text-zinc-500"
                  }`}
                >
                  {attemptsRemaining}/5 attempts
                </span>
              )}
            </div>

            <input
              type="password"
              autoFocus
              disabled={lockedOut}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={lockedOut ? "Terminal locked" : "Enter access password..."}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500] text-sm text-white placeholder:text-zinc-600 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || lockedOut || !password.trim()}
            className="w-full py-2.5 px-4 rounded-lg bg-[#ff5500] hover:bg-[#ff772a] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#ff5500]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoggingIn ? (
              <CircleNotch weight="bold" className="size-4 animate-spin" />
            ) : (
              <Key weight="bold" className="size-4" />
            )}
            <span>
              {lockedOut
                ? `Locked (${formatLockoutTimer(lockoutSecondsRemaining)})`
                : isLoggingIn
                ? "Authenticating..."
                : "Enter Dashboard"}
            </span>
            {!lockedOut && !isLoggingIn && (
              <ArrowRight weight="bold" className="size-3.5 ml-0.5" />
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-[11px] text-zinc-500">
          Protected competition telemetry endpoint.
        </div>
      </div>
    </div>
  );
}

