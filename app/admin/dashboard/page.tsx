"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ShieldWarning, 
  Lock, 
  LockOpen, 
  ArrowClockwise, 
  Trash, 
  Warning, 
  Check, 
  Copy, 
  Terminal, 
  Key, 
  Users, 
  Timer, 
  Cpu, 
  Sparkle, 
  SignOut,
  House,
  Eye,
  EyeSlash
} from "@phosphor-icons/react";
import { AdminTeamData } from "@/types";
import { getLiveDuration } from "@/lib/time";
import { getMaskedCode } from "@/lib/code-masking";
import { TOTAL_TEAMS } from "@/constants";

export default function AdminDashboardPage() {
  // Live continuous clock tick (1s)
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Rate Limiting & Lockout State
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  // Dashboard Data State
  const [teams, setTeams] = useState<AdminTeamData[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState<boolean>(false);
  const [rowCodeToggles, setRowCodeToggles] = useState<Record<string, boolean>>({});

  const toggleRowCode = (id: string) => {
    setRowCodeToggles((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? showUnlockedOnly),
    }));
  };

  // Query server for current lockout status on load
  const checkLockoutStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/login");
      const data = await res.json();
      if (data.lockedOut) {
        setLockedOut(true);
        setLockoutSecondsRemaining(data.remainingSeconds);
        setAttemptsRemaining(0);
      } else {
        setLockedOut(false);
        setAttemptsRemaining(data.attemptsRemaining ?? 5);
      }
    } catch {
      // Ignore initial poll errors
    }
  }, []);

  useEffect(() => {
    // Check if previously logged in this session
    const token = sessionStorage.getItem("admin_auth_token");
    if (token === "admin_authorized_asthra_session") {
      setIsAuthenticated(true);
    } else {
      checkLockoutStatus();
    }
  }, [checkLockoutStatus]);

  // Lockout Countdown Timer
  useEffect(() => {
    if (!lockedOut || lockoutSecondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setLockoutSecondsRemaining((prev) => {
        if (prev <= 1) {
          setLockedOut(false);
          setAttemptsRemaining(5);
          setAuthError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedOut, lockoutSecondsRemaining]);

  // Fetch telemetry teams
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      if (data?.teams) {
        setTeams(data.teams);
      }
    } catch (err) {
      console.error("fetch teams error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeams();
    }
  }, [isAuthenticated, fetchTeams]);

  // Telemetry auto-polling every 4 seconds
  useEffect(() => {
    if (!isAuthenticated || !autoPoll) return;
    const interval = setInterval(fetchTeams, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoPoll, fetchTeams]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || lockedOut) return;

    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.status === 429 || data.lockedOut) {
        // Locked Out
        setLockedOut(true);
        setLockoutSecondsRemaining(data.remainingSeconds || 300);
        setAttemptsRemaining(0);
        setAuthError(data.error || "Too many failed attempts. Security lockout active.");
        setIsLoggingIn(false);
        return;
      }

      if (!res.ok || data.error) {
        setAuthError(data.error || "Authentication failed");
        if (typeof data.attemptsRemaining === "number") {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        setIsLoggingIn(false);
        return;
      }

      if (data.success) {
        sessionStorage.setItem("admin_auth_token", data.token);
        setIsAuthenticated(true);
        setPassword("");
        setAuthError(null);
      }
    } catch {
      setAuthError("NETWORK ERROR // UNABLE TO REACH AUTH SERVER");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth_token");
    setIsAuthenticated(false);
    setPassword("");
    checkLockoutStatus();
  };

  const handleGenerateTeams = async () => {
    setIsGenerating(true);
    setActionNotice(null);
    try {
      const res = await fetch("/api/admin/generate-teams", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionNotice("11 TEAMS & 3-DIGIT CODES GENERATED SUCCESSFULLY");
        fetchTeams();
      } else {
        setActionNotice("FAILED TO GENERATE TEAMS");
      }
    } catch {
      setActionNotice("ERROR CONNECTING TO SERVER");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/reset-game", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setShowResetConfirm(false);
        setActionNotice("GAME RESET COMPLETE // ALL TEAMS LOGGED OUT & MASTER KEYS CLEARED");
        fetchTeams();
      } else {
        alert("Failed to reset game: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Error resetting game");
    } finally {
      setIsResetting(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const printOrCopyAllCodes = () => {
    const hasActiveCodes = teams.some((t) => t.team_code && !t.is_code_flushed && !t.team_code.startsWith("RESET"));
    if (!hasActiveCodes) {
      alert("NOTICE: Team codes are currently flushed. Please click 'GENERATE TEAMS & CODES' first to create active codes.");
      return;
    }
    const list = teams
      .map((t) => `${t.team_name} : [CODE: ${t.team_code || "FLUSHED"}]`)
      .join("\n");
    navigator.clipboard.writeText(list);
    alert("COPIED ALL 11 TEAM CODES TO CLIPBOARD:\n\n" + list);
  };

  const formatLockoutTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  // Quick stats
  const activeCount = teams.filter((t) => t.started_at !== null).length;
  const clearedCount = teams.filter((t) => t.current_level >= 2).length;

  // =========================================================================
  // VIEW 1: ADMIN LOGIN SCREEN WITH EXPONENTIAL LOCKOUT
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070709] text-white font-mono flex flex-col justify-center items-center p-4 sm:p-6 relative bg-cyber-grid">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="absolute top-6 left-6 text-neutral-400 hover:text-[#ff5500] text-xs flex items-center gap-2 border border-neutral-800 bg-neutral-950 px-3 py-1.5 transition-colors"
        >
          <House weight="bold" className="size-4" />
          <span>RETURN TO HOME</span>
        </Link>

        <div className="w-full max-w-md bg-[#0c0c0f] border-2 border-[#ff5500] shadow-[10px_10px_0px_0px_#ffffff] p-6 sm:p-8 relative">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-neutral-800">
            <div className="w-9 h-9 bg-[#ff5500] flex items-center justify-center text-black font-black">
              <ShieldCheck weight="bold" className="size-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-widest uppercase text-white">
                CENTRAL COMMAND ACCESS
              </h1>
              <div className="text-[10px] text-neutral-400">
                ASTHRA 11.0 // CRACK THE LOCK
              </div>
            </div>
          </div>

          {/* Lockout Warning Banner */}
          {lockedOut && (
            <div className="mb-6 p-4 bg-red-950/80 border-2 border-red-500 text-white text-xs space-y-2 animate-pulse">
              <div className="flex items-center gap-2 font-black text-red-400 uppercase tracking-wider">
                <ShieldWarning weight="bold" className="size-5 shrink-0" />
                <span>SECURITY LOCKOUT ENFORCED</span>
              </div>
              <p className="text-[11px] text-red-200">
                Maximum 5 failed attempts exceeded. Access has been temporarily suspended.
              </p>
              <div className="pt-2 border-t border-red-900/80 flex items-center justify-between text-xs">
                <span className="text-neutral-400">RETRY PERMITTED IN:</span>
                <span className="font-black text-lg text-white font-mono">
                  {formatLockoutTimer(lockoutSecondsRemaining)}
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 pt-1">
                * Note: Lockout duration increments exponentially on consecutive violations (5m &rarr; 10m &rarr; 20m &rarr; 40m).
              </div>
            </div>
          )}

          {/* Normal Error Alert */}
          {!lockedOut && authError && (
            <div className="mb-5 p-3 bg-red-950/70 border border-red-500/70 text-red-400 text-xs flex items-center gap-2">
              <ShieldWarning weight="bold" className="size-4 shrink-0 text-red-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase font-bold text-neutral-300">
                  COORDINATOR MASTER PASSWORD:
                </label>
                {!lockedOut && (
                  <span className={`text-[10px] font-bold ${attemptsRemaining <= 2 ? "text-red-400" : "text-neutral-500"}`}>
                    Attempts: {attemptsRemaining}/5
                  </span>
                )}
              </div>

              <input
                type="password"
                autoFocus
                disabled={lockedOut}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lockedOut ? "TERMINAL LOCKED" : "Enter password..."}
                className="w-full px-4 py-3.5 bg-neutral-950 border-2 border-neutral-700 focus:border-[#ff5500] text-sm font-bold tracking-wider text-white outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Protected administrative telemetry gateway.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || lockedOut || !password.trim()}
              className="w-full py-3.5 px-4 bg-[#ff5500] hover:bg-white text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0px_0px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              <Key weight="bold" className="size-4" />
              <span>
                {lockedOut
                  ? `LOCKED (${formatLockoutTimer(lockoutSecondsRemaining)})`
                  : isLoggingIn
                  ? "AUTHENTICATING..."
                  : "AUTHENTICATE & ENTER"}
              </span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL ADMIN TELEMETRY DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#08080a] text-white font-mono p-4 sm:p-6 lg:p-8 flex flex-col">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff5500] flex items-center justify-center text-black font-black">
            <ShieldCheck weight="bold" className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-black tracking-widest uppercase text-white">
                CENTRAL COMMAND // TELEMETRY
              </h1>
              <span className="px-2 py-0.5 bg-[#ff5500]/10 border border-[#ff5500]/50 text-[#ff5500] text-[10px] font-bold">
                ASTHRA 11.0
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">
              Route: /admin/dashboard // Live 11-Teams Game Monitoring System
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Return to website */}
          <Link
            href="/"
            className="px-3.5 py-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-600 text-xs text-neutral-300 flex items-center gap-2 transition-colors"
          >
            <House weight="bold" className="size-4" />
            <span>MAIN SITE</span>
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 bg-neutral-900 border border-neutral-700 hover:border-red-500 hover:text-red-400 text-xs text-neutral-300 font-bold uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <SignOut weight="bold" className="size-4" />
            <span>LOGOUT</span>
          </button>
        </div>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className="mb-5 p-3.5 bg-[#ff5500]/20 border border-[#ff5500] text-[#ff5500] text-xs flex items-center justify-between shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <Sparkle weight="bold" className="size-4" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-xs text-neutral-400 hover:text-white uppercase font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="p-4 bg-neutral-950 border border-neutral-800 shadow-[2px_2px_0px_0px_#ff5500]">
          <span className="text-[10px] text-neutral-500 block uppercase font-bold">Total Registered</span>
          <span className="text-2xl font-black text-white">{teams.length} TEAMS</span>
        </div>
        <div className="p-4 bg-neutral-950 border border-neutral-800 shadow-[2px_2px_0px_0px_#ff5500]">
          <span className="text-[10px] text-neutral-500 block uppercase font-bold">Active in Game</span>
          <span className="text-2xl font-black text-[#ff5500]">{activeCount} / 11</span>
        </div>
        <div className="p-4 bg-neutral-950 border border-neutral-800 shadow-[2px_2px_0px_0px_#ff5500]">
          <span className="text-[10px] text-neutral-500 block uppercase font-bold">Level 2 Unlocked</span>
          <span className="text-2xl font-black text-emerald-400">{clearedCount} / 11</span>
        </div>
        <div className="p-4 bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Live Stream Feed</span>
            <span className="text-xs font-bold text-neutral-300">
              {autoPoll ? "AUTO-POLL (4s)" : "MANUAL ONLY"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAutoPoll(!autoPoll)}
            className={`px-3 py-1.5 text-[10px] font-black border transition-colors ${
              autoPoll ? "bg-[#ff5500] text-black border-[#ff5500]" : "bg-neutral-900 text-neutral-400 border-neutral-700"
            }`}
          >
            {autoPoll ? "POLLING ON" : "POLLING OFF"}
          </button>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-800 shrink-0 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Generate Teams Button */}
          <button
            type="button"
            onClick={handleGenerateTeams}
            disabled={isGenerating}
            className="py-2.5 px-4 bg-[#ff5500] hover:bg-white text-black font-black uppercase transition-all shadow-[3px_3px_0px_0px_#ffffff] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Cpu weight="bold" className="size-4" />
            <span>{isGenerating ? "GENERATING..." : "GENERATE TEAMS & CODES"}</span>
          </button>

          {/* Export Codes Button */}
          <button
            type="button"
            onClick={printOrCopyAllCodes}
            className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold uppercase flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Copy weight="bold" className="size-4" />
            <span>EXPORT / PRINT CODES</span>
          </button>

          {/* Refresh Data Button */}
          <button
            type="button"
            onClick={fetchTeams}
            disabled={loading}
            className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold uppercase flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowClockwise weight="bold" className={`size-4 ${loading ? "animate-spin" : ""}`} />
            <span>REFRESH DATA</span>
          </button>

          {/* Eye Toggle Button: Unlocked vs Full Codes */}
          <button
            type="button"
            onClick={() => setShowUnlockedOnly((prev) => !prev)}
            className={`py-2.5 px-4 border font-black uppercase flex items-center gap-2 cursor-pointer transition-all ${
              showUnlockedOnly
                ? "bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[2px_2px_0px_0px_#10b981]"
                : "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300"
            }`}
            title="Toggle between showing unlocked digits only vs full master codes"
          >
            {showUnlockedOnly ? (
              <EyeSlash weight="bold" className="size-4 text-emerald-400" />
            ) : (
              <Eye weight="bold" className="size-4 text-[#ff5500]" />
            )}
            <span>{showUnlockedOnly ? "SHOWING UNLOCKED ONLY" : "SHOW UNLOCKED ONLY"}</span>
          </button>
        </div>

        {/* Reset Game Button */}
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="py-2.5 px-4 bg-red-950/90 hover:bg-red-900 border border-red-600 text-red-300 hover:text-white font-black uppercase flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Trash weight="bold" className="size-4 text-red-400" />
          <span>RESET GAME</span>
        </button>
      </div>

      {/* Flushed Codes Warning Banner */}
      {teams.some((t) => !t.team_code || t.is_code_flushed) && (
        <div className="mb-5 p-3.5 bg-amber-950/40 border border-amber-500/70 text-amber-300 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <Warning weight="bold" className="size-4 text-amber-400 shrink-0" />
            <span className="font-bold">TEAM CODES FLUSHED:</span>
            <span>All participant team codes are cleared. Click &quot;GENERATE TEAMS &amp; CODES&quot; to issue fresh 3-digit access codes for all {TOTAL_TEAMS} teams.</span>
          </div>
          <button
            type="button"
            onClick={handleGenerateTeams}
            disabled={isGenerating}
            className="px-3.5 py-1.5 bg-[#ff5500] hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff] shrink-0"
          >
            {isGenerating ? "GENERATE CODES NOW" : "GENERATE CODES NOW"}
          </button>
        </div>
      )}

      {/* Main Teams Telemetry Table */}
      <div className="overflow-x-auto overflow-y-auto flex-1 border border-neutral-800 bg-[#0c0c0f]">
        <table className="w-full text-left text-xs border-collapse min-w-[950px]">
          <thead className="bg-neutral-950 sticky top-0 border-b border-neutral-800 text-[10px] uppercase text-neutral-400">
            <tr>
              <th className="p-3.5">Team Name</th>
              <th className="p-3.5">3-Digit Code</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Current Tier</th>
              <th className="p-3.5">Time Taken</th>
              <th className="p-3.5">Code Got (First Digit)</th>
              <th className="p-3.5">Round 1 Answer</th>
              <th className="p-3.5">
                <div className="flex items-center gap-2">
                  <span>{showUnlockedOnly ? "Unlocked Team Code" : "10-Digit Generated Master Code"}</span>
                  <button
                    type="button"
                    onClick={() => setShowUnlockedOnly((prev) => !prev)}
                    title={showUnlockedOnly ? "Switch to full master codes" : "Switch to unlocked digits only"}
                    className={`p-1 border rounded transition-colors cursor-pointer ${
                      showUnlockedOnly
                        ? "bg-emerald-950 border-emerald-500 text-emerald-400 hover:bg-emerald-900"
                        : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500"
                    }`}
                  >
                    {showUnlockedOnly ? (
                      <EyeSlash weight="bold" className="size-3.5" />
                    ) : (
                      <Eye weight="bold" className="size-3.5" />
                    )}
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900 font-mono">
            {teams.map((t) => (
              <tr key={t.id || t.team_number} className="hover:bg-neutral-900/50 transition-colors">
                {/* Team Name */}
                <td className="p-3.5 font-bold text-white whitespace-nowrap">
                  {t.team_name}
                </td>

                {/* Team Code with Quick Copy or Flushed state */}
                <td className="p-3.5 whitespace-nowrap">
                  {t.team_code && !t.is_code_flushed ? (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(t.team_code, t.id)}
                      title="Click to copy code"
                      className="px-3 py-1 bg-neutral-900 border border-[#ff5500]/60 hover:border-[#ff5500] text-[#ff5500] font-black text-sm tracking-widest flex items-center gap-2 group cursor-pointer"
                    >
                      <span>{t.team_code}</span>
                      {copiedCode === t.id ? (
                        <Check weight="bold" className="size-3.5 text-emerald-400" />
                      ) : (
                        <Copy weight="bold" className="size-3.5 opacity-40 group-hover:opacity-100" />
                      )}
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 bg-neutral-900 border border-dashed border-neutral-800 text-neutral-500 font-mono text-xs italic">
                      — FLUSHED —
                    </span>
                  )}
                </td>

                {/* Status Badge */}
                <td className="p-3.5 whitespace-nowrap">
                  {t.current_level >= 4 ? (
                    <span className="px-2.5 py-1 bg-purple-950 text-purple-400 border border-purple-500/50 text-[10px] font-bold">
                      LEVEL 4 UNLOCKED
                    </span>
                  ) : t.current_level >= 3 ? (
                    <span className="px-2.5 py-1 bg-cyan-950 text-cyan-400 border border-cyan-500/50 text-[10px] font-bold">
                      LEVEL 3 UNLOCKED
                    </span>
                  ) : t.current_level >= 2 ? (
                    <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold">
                      LEVEL 2 UNLOCKED
                    </span>
                  ) : t.started_at ? (
                    <span className="px-2.5 py-1 bg-amber-950 text-amber-400 border border-amber-500/50 text-[10px] font-bold">
                      IN ROUND 1
                    </span>
                  ) : t.is_code_flushed || !t.team_code ? (
                    <span className="px-2.5 py-1 bg-neutral-900 text-neutral-500 border border-neutral-800 text-[10px]">
                      AWAITING CODE
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px]">
                      IDLE
                    </span>
                  )}
                </td>

                {/* Tier */}
                <td className="p-3.5 whitespace-nowrap">
                  <span className="font-bold text-neutral-200">
                    Tier 0{t.current_level}
                  </span>
                </td>

                {/* Time Taken & Split Tracking */}
                <td className="p-3.5 whitespace-nowrap">
                  {t.started_at ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-[#ff5500] font-black text-sm">
                        {t.current_level >= 4 ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                            <span>{t.total_time_formatted || t.time_taken_formatted}</span>
                            <span className="text-[9px] px-1 py-0.2 bg-purple-950 border border-purple-500/50 text-purple-400 font-bold tracking-wider">
                              DONE
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            <span>{getLiveDuration(t.started_at)}</span>
                            <span className="text-[9px] px-1 py-0.2 bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold tracking-wider">
                              LIVE
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-0.5 text-[10px] font-mono">
                        {t.l1_time_formatted ? (
                          <div className="flex items-center gap-1.5 text-neutral-400">
                            <span className="text-neutral-500 font-bold">L1 Split:</span>
                            <span className="text-neutral-200 font-bold">{t.l1_time_formatted}</span>
                          </div>
                        ) : t.current_level === 1 ? (
                          <div className="flex items-center gap-1.5 text-amber-400/80">
                            <span className="text-amber-500/70 font-bold">L1:</span>
                            <span className="italic">{getLiveDuration(t.started_at)} (in progress)</span>
                          </div>
                        ) : null}

                        {t.l2_time_formatted ? (
                          <div className="flex items-center gap-1.5 text-cyan-400">
                            <span className="text-cyan-500 font-bold">L2 Split:</span>
                            <span className="text-cyan-300 font-bold">{t.l2_time_formatted}</span>
                          </div>
                        ) : t.current_level === 2 && t.completed_level1_at ? (
                          <div className="flex items-center gap-1.5 text-cyan-400/80">
                            <span className="text-cyan-500/70 font-bold">L2:</span>
                            <span className="italic">{getLiveDuration(t.completed_level1_at)} (in progress)</span>
                          </div>
                        ) : null}

                        {t.l3_time_formatted ? (
                          <div className="flex items-center gap-1.5 text-purple-400">
                            <span className="text-purple-500 font-bold">L3 Split:</span>
                            <span className="text-purple-300 font-bold">{t.l3_time_formatted}</span>
                          </div>
                        ) : t.current_level === 3 && (t.completed_level2_at || t.l2_time_formatted) ? (
                          <div className="flex items-center gap-1.5 text-purple-400/80">
                            <span className="text-purple-500/70 font-bold">L3:</span>
                            <span className="italic">{getLiveDuration(t.completed_level2_at || null)} (in progress)</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <span className="text-neutral-500 font-mono text-xs">
                      — IDLE —
                    </span>
                  )}
                </td>

                {/* Code Got (First Digit) */}
                <td className="p-3.5 whitespace-nowrap">
                  {t.first_digit !== null ? (
                    <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 text-white font-bold">
                      [{t.first_digit}]
                    </span>
                  ) : (
                    <span className="text-neutral-600">—</span>
                  )}
                </td>

                {/* Round 1 Answer */}
                <td className="p-3.5 max-w-[200px] truncate text-neutral-300" title={t.round1_answer || ""}>
                  {t.round1_answer || <span className="text-neutral-600">—</span>}
                </td>

                {/* 10-Digit Master Code / Unlocked Digits */}
                <td className="p-3.5 whitespace-nowrap">
                  {(() => {
                    const isUnlockedOnly = rowCodeToggles[t.id] ?? showUnlockedOnly;
                    const masked = getMaskedCode(t);
                    const displayCode = isUnlockedOnly ? masked : t.master_code;

                    if (!displayCode) {
                      return <span className="text-neutral-600 text-xs">— NOT DERIVED —</span>;
                    }

                    return (
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`px-3 py-1 font-black tracking-widest text-xs select-all shadow-[2px_2px_0px_0px_#ffffff] ${
                            isUnlockedOnly
                              ? "bg-emerald-950/50 border border-emerald-500 text-emerald-400"
                              : "bg-neutral-950 border border-[#ff5500] text-[#ff5500]"
                          }`}
                        >
                          {displayCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRowCode(t.id)}
                          title={isUnlockedOnly ? "Show full 10-digit code" : "Show unlocked code only"}
                          className={`p-1 border rounded transition-colors cursor-pointer ${
                            isUnlockedOnly
                              ? "bg-emerald-950 border-emerald-500/80 text-emerald-400 hover:bg-emerald-900"
                              : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500"
                          }`}
                        >
                          {isUnlockedOnly ? (
                            <EyeSlash weight="bold" className="size-3.5" />
                          ) : (
                            <Eye weight="bold" className="size-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reset Confirmation Dialog Overlay */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0e0e12] border-2 border-red-500 shadow-[10px_10px_0px_0px_#ff0000] p-6 text-white font-mono space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
              <Warning weight="bold" className="size-6 text-red-500" />
              <h3 className="text-sm font-black uppercase text-red-400 tracking-wider">
                CONFIRM GAME RESET
              </h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to reset the competition?
            </p>

            <ul className="text-[11px] text-neutral-400 list-disc pl-5 space-y-1">
              <li>All 11 team levels will be reset to Level 1.</li>
              <li>Elapsed timers will be wiped.</li>
              <li>Submitted Round 1 answers and 10-digit master keys will be erased.</li>
              <li>All active participant screens will be logged out immediately.</li>
            </ul>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-1/2 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-300 uppercase cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer disabled:opacity-50"
              >
                {isResetting ? "RESETTING..." : "YES, RESET ALL"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
