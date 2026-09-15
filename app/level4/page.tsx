"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Key,
  Timer,
  CheckCircle,
  Warning,
  Cpu,
  ArrowSquareOut,
  Trophy,
  Sparkle,
  Lock,
  Clock,
  ShieldCheck,
  CircleNotch,
} from "@phosphor-icons/react";
import confetti from "canvas-confetti";
import { Team } from "@/types";
import { SESSION_STORAGE_KEY } from "@/constants";
import { useMissionTimer, usePreventBack } from "@/hooks";
import { formatTimer, formatDuration } from "@/lib/time";
import { extractLevelSplits } from "@/lib/supabase";

export default function Level4Page() {
  const router = useRouter();

  // 1. Trap browser back button so participants cannot accidentally navigate backward
  usePreventBack();

  // Authentication & Clearance State
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState("");

  // Level 4 Challenge State
  const [flagInput, setFlagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Finished & Celebration State
  const [isFinished, setIsFinished] = useState(false);
  const [finishRank, setFinishRank] = useState<number | null>(null);
  const [finalTotalFormatted, setFinalTotalFormatted] = useState<string | null>(null);
  const [splitDetails, setSplitDetails] = useState<{
    l1Formatted?: string | null;
    l2Formatted?: string | null;
    l3Formatted?: string | null;
    l4Formatted?: string | null;
    totalFormatted?: string | null;
  } | null>(null);
  const [fullMasterCode, setFullMasterCode] = useState<string | null>(null);

  // Party Popper Throw Celebration Effect
  const triggerPopperThrow = useCallback(() => {
    if (typeof window === "undefined") return;

    // Cannon 1: Left Popper (thrown inward and upward)
    confetti({
      particleCount: 85,
      angle: 60,
      spread: 75,
      origin: { x: 0, y: 0.8 },
      colors: ["#ff5500", "#10b981", "#38bdf8", "#facc15", "#e11d48", "#ffffff"],
      zIndex: 9999,
    });

    // Cannon 2: Right Popper (thrown inward and upward)
    confetti({
      particleCount: 85,
      angle: 120,
      spread: 75,
      origin: { x: 1, y: 0.8 },
      colors: ["#ff5500", "#10b981", "#38bdf8", "#facc15", "#e11d48", "#ffffff"],
      zIndex: 9999,
    });

    // Center fountain popper burst
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.65 },
      colors: ["#ff5500", "#10b981", "#facc15", "#38bdf8", "#a855f7", "#ffffff"],
      zIndex: 9999,
    });

    // Delayed secondary blast for flutter & ribbon effect
    setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 70,
        spread: 85,
        origin: { x: 0.1, y: 0.75 },
        colors: ["#ff5500", "#facc15", "#ffffff"],
        zIndex: 9999,
      });
      confetti({
        particleCount: 65,
        angle: 110,
        spread: 85,
        origin: { x: 0.9, y: 0.75 },
        colors: ["#10b981", "#38bdf8", "#ffffff"],
        zIndex: 9999,
      });
    }, 280);
  }, []);

  // Automatically trigger party popper throw effect when victory screen is reached
  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        triggerPopperThrow();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isFinished, triggerPopperThrow]);

  // Live Continuous Mission Timer
  const elapsedSeconds = useMissionTimer(activeTeam?.started_at);

  // Synchronize authentication and session state on load
  useEffect(() => {
    let isMounted = true;

    async function verifyLevel4Access() {
      try {
        const savedCode = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!savedCode) {
          if (isMounted) {
            setIsLocked(true);
            setLockReason("NO ACTIVE TEAM SESSION FOUND. YOU MUST FIRST LOG IN WITH YOUR ASSIGNED TEAM CODE.");
            setIsLoadingAuth(false);
          }
          return;
        }

        const res = await fetch("/api/game/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: savedCode }),
        });

        const data = await res.json();
        if (!res.ok || !data.success || !data.team) {
          if (isMounted) {
            setIsLocked(true);
            setLockReason(data.error || "INVALID OR EXPIRED TEAM CODE.");
            setIsLoadingAuth(false);
          }
          return;
        }

        const team: Team = data.team;

        // ACCESS CONTROL & AUTO-FORWARD:
        // If team hasn't reached Level 4 yet, redirect to their active round
        if (!team.current_level || team.current_level < 4) {
          if (team.current_level === 3) {
            router.replace("/level3");
          } else if (team.current_level === 2) {
            router.replace("/level2");
          } else {
            router.replace("/");
          }
          return;
        }

        if (isMounted) {
          setActiveTeam(team);
          setIsLocked(false);

          // If team already finished (Level 5 or completed_level4_at)
          if (team.current_level >= 5 || team.completed_level4_at) {
            setIsFinished(true);
            setFullMasterCode(team.master_code || null);

            // Compute splits from recorded timestamps
            const { cleanAnswer, completedLevel2At, completedLevel3At, completedLevel4At } = extractLevelSplits(team.round1_answer);
            const l2At = team.completed_level2_at || completedLevel2At;
            const l3At = team.completed_level3_at || completedLevel3At;
            const l4At = team.completed_level4_at || completedLevel4At;

            if (team.started_at && l4At) {
              const startMs = new Date(team.started_at).getTime();
              const l1Ms = team.completed_level1_at ? new Date(team.completed_level1_at).getTime() : startMs;
              const l2Ms = l2At ? new Date(l2At).getTime() : l1Ms;
              const l3Ms = l3At ? new Date(l3At).getTime() : l2Ms;
              const l4Ms = new Date(l4At).getTime();

              const l1Sec = Math.max(0, Math.floor((l1Ms - startMs) / 1000));
              const l2Sec = Math.max(0, Math.floor((l2Ms - l1Ms) / 1000));
              const l3Sec = Math.max(0, Math.floor((l3Ms - l2Ms) / 1000));
              const l4Sec = Math.max(0, Math.floor((l4Ms - l3Ms) / 1000));
              const totSec = l1Sec + l2Sec + l3Sec + l4Sec;

              setSplitDetails({
                l1Formatted: formatDuration(l1Sec),
                l2Formatted: formatDuration(l2Sec),
                l3Formatted: formatDuration(l3Sec),
                l4Formatted: formatDuration(l4Sec),
                totalFormatted: formatDuration(totSec),
              });
              setFinalTotalFormatted(formatDuration(totSec));
            }

            // Fetch team's current rank
            fetch("/api/game/leaderboard")
              .then((r) => r.json())
              .then((lbData) => {
                if (lbData?.leaderboard) {
                  const idx = lbData.leaderboard.findIndex((e: { team_number: number }) => e.team_number === team.team_number);
                  if (idx >= 0) setFinishRank(idx + 1);
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error("Auth verification error:", err);
        if (isMounted) {
          setIsLocked(true);
          setLockReason("UNABLE TO VERIFY CLEARANCE CREDENTIALS. CHECK NETWORK CONNECTION.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    }

    verifyLevel4Access();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Polling for central command reset signal
  useEffect(() => {
    const checkReset = async () => {
      try {
        const res = await fetch("/api/game/status");
        const data = await res.json();
        if (data?.lastResetAt && activeTeam?.started_at) {
          const resetTime = new Date(data.lastResetAt).getTime();
          const startedTime = new Date(activeTeam.started_at).getTime();
          if (resetTime > startedTime) {
            alert("COMPETITION HAS BEEN RESET BY CENTRAL COMMAND // SESSION EXPIRED");
            localStorage.removeItem(SESSION_STORAGE_KEY);
            router.replace("/");
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    const interval = setInterval(checkReset, 5000);
    return () => clearInterval(interval);
  }, [activeTeam?.started_at, router]);

  // Handle Flag Verification Submission
  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || isSubmitting) return;

    const trimmedFlag = flagInput.trim();
    if (!trimmedFlag) {
      setErrorMessage("Please enter the system flag obtained from the target site.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/game/submit-round4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamCode: activeTeam.team_code,
          flag: trimmedFlag,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Flag verification failed. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        setIsFinished(true);
        setFinishRank(data.rank || 1);
        setFinalTotalFormatted(data.totalTimeFormatted || null);
        setSplitDetails(data.splitTime || null);
        setFullMasterCode(data.masterCode || activeTeam.master_code);

        if (data.team) {
          setActiveTeam(data.team);
        }

        triggerPopperThrow();
      }
    } catch (err) {
      console.error("Flag submission error:", err);
      setErrorMessage("Network error connecting to security validator.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading Screen
  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen bg-[#07070a] text-white flex flex-col items-center justify-center font-mono select-none">
        <CircleNotch weight="bold" className="size-8 text-[#ff5500] animate-spin mb-3" />
        <span className="text-xs uppercase tracking-widest text-neutral-400">
          [AUTHENTICATING CLEARANCE // LEVEL 04 GATEWAY...]
        </span>
      </div>
    );
  }

  // 2. Lockout Screen
  if (isLocked || !activeTeam) {
    return (
      <div className="h-screen w-screen bg-[#07070a] text-white flex flex-col items-center justify-center p-4 font-mono select-none">
        <div className="w-full max-w-md bg-[#0c0c11] border-2 border-red-500 shadow-[8px_8px_0px_0px_#ffffff] p-6 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-red-950/70 border border-red-500 text-red-400">
            <Lock weight="bold" className="size-8" />
          </div>
          <h2 className="text-base font-black text-white uppercase tracking-wider">
            SECURITY LOCKOUT // ACCESS DENIED
          </h2>
          <p className="text-xs text-neutral-400">{lockReason}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2.5 bg-[#ff5500] hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-colors"
          >
            RETURN TO COMMAND GATEWAY
          </Link>
        </div>
      </div>
    );
  }

  // Helper to build Master Key slots
  const cleanMasked = (activeTeam.master_code || "A63842****").padEnd(10, "*");
  const keySlots = [];
  for (let i = 0; i < 10; i++) {
    if (isFinished && fullMasterCode) {
      keySlots.push({ char: fullMasterCode[i] || "*", isUnlocked: true });
    } else if (i < 6) {
      keySlots.push({ char: cleanMasked[i] !== "*" ? cleanMasked[i] : (i === 0 ? "A" : String(i)), isUnlocked: true });
    } else {
      keySlots.push({ char: "*", isUnlocked: false });
    }
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col font-mono select-none selection:bg-[#ff5500] selection:text-white relative">
      {/* Background Cyber Grid */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ff5500 1px, transparent 1px), linear-gradient(90deg, #ff5500 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top Cyber Navigation Bar */}
      <header className="h-14 border-b border-neutral-800 bg-[#09090d]/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#ff5500] animate-pulse" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              {activeTeam.team_name}
            </span>
          </div>
          <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-[#ff5500] text-[10px] font-bold tracking-wider">
            CODE: {activeTeam.team_code}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 bg-[#ff5500]/15 border border-[#ff5500]/50 text-[#ff5500] text-[10px] font-bold uppercase tracking-widest">
            {isFinished ? "COMPETITION FINISHED" : "TIER 04: FINAL LOCK"}
          </span>
        </div>

        {/* Live Mission Timer */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-xs">
            <Timer weight="bold" className="size-4 text-[#ff5500]" />
            <span className="text-neutral-400 text-[10px] uppercase tracking-wider hidden sm:inline">MISSION CLOCK:</span>
            <span className="text-[#ff5500] font-black text-xs sm:text-sm">
              {isFinished && finalTotalFormatted
                ? finalTotalFormatted
                : activeTeam.started_at
                ? formatTimer(elapsedSeconds)
                : "00:00"}
            </span>
            <span
              className={`text-[9px] px-1 py-0.2 font-bold uppercase tracking-wider ${
                isFinished
                  ? "bg-purple-950 border border-purple-500/50 text-purple-300"
                  : "bg-emerald-950 border border-emerald-500/50 text-emerald-400"
              }`}
            >
              {isFinished ? "LOCKED" : "LIVE"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        {!isFinished ? (
          /* ========================================================================= */
          /* ACTIVE LEVEL 4 INTERFACE: FLAG INPUT & TARGET SITE ACCESS                 */
          /* ========================================================================= */
          <div className="relative w-full max-w-xl bg-[#0b0b0e] border-2 border-[#ff5500] shadow-[10px_10px_0px_0px_#ffffff] p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            {/* Stage Title */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck weight="fill" className="size-5 text-[#ff5500]" />
                <h2 className="text-sm sm:text-base font-black tracking-widest uppercase text-white">
                  LEVEL 04 // FINAL LOCK SYSTEM BREACH
                </h2>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 font-bold text-[10px] tracking-wider">
                6 / 10 SLOTS ACTIVE
              </span>
            </div>

            {/* Directive Protocol Box */}
            <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 space-y-2 mb-5">
              <div className="text-[#ff5500] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Cpu weight="bold" className="size-4" />
                <span>MISSION PROTOCOL // FINAL DECRYPTION</span>
              </div>
              <p className="text-neutral-400 leading-relaxed text-[11px] sm:text-xs">
                To crack the final 4 digits of your Master Key, navigate to the target external system.
                Discover the hidden verification flag and enter it below to complete the breach.
              </p>
            </div>

            {/* Target Site External Action Button */}
            <div className="p-4 bg-black/60 border-2 border-dashed border-[#ff5500]/60 mb-5 text-center flex flex-col items-center justify-center gap-2">
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
                EXTERNAL TARGET WEBSITE:
              </span>
              <a
                href="https://mini-ctf-ashy.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-[#ff5500] text-white hover:text-black font-black text-xs uppercase tracking-widest border border-[#ff5500] hover:border-white transition-all shadow-[3px_3px_0px_0px_#ff5500] active:translate-y-0.5 cursor-pointer"
              >
                <span>GO TO TARGET SITE</span>
                <ArrowSquareOut weight="bold" className="size-4" />
              </a>
              <span className="text-[10px] text-neutral-500">
                Clicking opens external target web environment in a secure tab
              </span>
            </div>

            {/* Master Key Preview Rack (6 Unlocked, 4 Masked) */}
            <div className="p-3 bg-[#08080c] border border-neutral-800 mb-5">
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-[#ff5500] font-bold flex items-center gap-1.5 uppercase">
                  <Key weight="fill" className="size-3.5" />
                  MASTER VAULT KEY PROGRESS:
                </span>
                <span className="text-neutral-400 text-[10px]">SLOTS 07-10 LOCKED</span>
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                {keySlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-center font-mono font-black w-7 h-8 sm:w-8.5 sm:h-9 text-xs sm:text-sm border transition-all ${
                      slot.isUnlocked
                        ? idx === 0
                          ? "bg-[#ff5500] text-black border-[#ff5500]"
                          : "bg-emerald-500 text-black border-emerald-400"
                        : "bg-neutral-950 text-neutral-600 border-neutral-800"
                    }`}
                  >
                    {slot.char}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="mb-5 p-3 bg-red-950/70 border border-red-500/70 text-red-400 text-xs flex items-center gap-2 animate-in shake duration-200">
                <Warning weight="bold" className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Flag Input Form (Matching Level 1 Input Box Style) */}
            <form onSubmit={handleFlagSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase font-bold text-neutral-300">
                    [ENTER TARGET SITE FLAG]:
                  </label>
                  <span className="text-[10px] text-[#ff5500] font-bold uppercase tracking-wider">
                    TARGET VALIDATION ACTIVE
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  placeholder="ENTER SYSTEM FLAG..."
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-neutral-950 border-2 border-neutral-700 focus:border-[#ff5500] text-sm font-bold text-white outline-none transition-colors tracking-wider uppercase font-mono disabled:opacity-50 shadow-[2px_2px_0px_0px_rgba(255,85,0,0.2)]"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Copy and paste or type the exact flag key extracted from the target webpage.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#ff5500] hover:bg-white text-black font-black text-xs sm:text-sm tracking-widest uppercase transition-all shadow-[4px_4px_0px_0px_#ffffff] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <CircleNotch weight="bold" className="size-4 animate-spin" />
                    <span>VERIFYING SYSTEM FLAG...</span>
                  </>
                ) : (
                  <>
                    <Cpu weight="bold" className="size-4" />
                    <span>VERIFY FLAG &amp; UNLOCK FINAL VAULT</span>
                  </>
                )}
              </button>
            </form>

            {/* Session Security Indicator */}
            <div className="mt-5 pt-3 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-500">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>STATE PROTECTED </span>
              </div>
              <span>TIER 04 VAULT</span>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PERMANENT LOCKED FINISHED VIEW: RANK #X + FULL 10-DIGIT MASTER KEY        */
          /* ========================================================================= */
          <div className="relative w-full max-w-2xl bg-[#09090e] border-2 border-emerald-400 shadow-[10px_10px_0px_0px_#ffffff] p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300 space-y-6">
            {/* Top Celebration Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkle weight="fill" className="size-4 text-emerald-400 animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                  [CENTRAL COMMAND // MISSION COMPLETE]
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerPopperThrow}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 hover:bg-[#ff5500] text-neutral-200 hover:text-black border border-neutral-700 hover:border-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(255,85,0,0.3)] active:translate-y-0.5 cursor-pointer"
                  title="Throw celebration poppers again"
                >
                  <span>🎉 POP CONFETTI</span>
                </button>
                <span className="px-2.5 py-0.5 bg-purple-950 border border-purple-500/60 text-purple-300 font-bold text-[10px] tracking-wider uppercase">
                  COMPETITION LOCKED
                </span>
              </div>
            </div>

            {/* Victory Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border-2 border-emerald-400 text-emerald-300 text-xs sm:text-sm font-black uppercase tracking-widest shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              <CheckCircle weight="fill" className="size-5 text-emerald-400" />
              <span>FINAL LOCK CLEARED // SYSTEM OVERRIDE COMPLETE</span>
            </div>

            {/* Prominent Position / Rank Announcement (Clickable for Celebration Popper) */}
            <div
              onClick={triggerPopperThrow}
              className="p-6 bg-black/70 border-2 border-white/20 hover:border-emerald-400/80 relative overflow-hidden space-y-2 cursor-pointer transition-all group select-none shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)]"
              title="Click to throw celebration poppers!"
            >
              <div className="text-[11px] uppercase tracking-widest text-neutral-400 font-bold">
                OFFICIAL COMPETITION STANDING:
              </div>
              <div className="flex items-center justify-center gap-3 my-1">
                <Trophy weight="fill" className="size-9 sm:size-11 text-amber-400 animate-bounce group-hover:scale-110 transition-transform" />
                <div className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono group-hover:text-emerald-300 transition-colors">
                  {finishRank !== null ? (
                    <>YOU ARE AT POSITION #{finishRank}</>
                  ) : (
                    <>POSITION CONFIRMED</>
                  )}
                </div>
              </div>
              <div className="text-xs text-neutral-300 font-mono">
                Team: <strong className="text-white">{activeTeam.team_name}</strong> (Code: {activeTeam.team_code})
              </div>
              <div className="text-[10px] text-neutral-500 group-hover:text-amber-400 transition-colors uppercase font-bold tracking-wider pt-1">
                🎉 [CLICK ANYWHERE HERE TO THROW CELEBRATION POPPERS]
              </div>
            </div>

            {/* Full 10-Digit Master Vault Key Proudly Revealed */}
            <div className="p-4 bg-[#060608] border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#ff5500] font-bold flex items-center gap-1.5 uppercase">
                  <Key weight="fill" className="size-4" />
                  10-DIGIT MASTER VAULT KEY (100% UNLOCKED):
                </span>
                <span className="text-emerald-400 font-bold text-[10px]">ALL 10 SLOTS EXTRACTED</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-2">
                {keySlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-center font-mono font-black select-none w-8 h-10 sm:w-10 sm:h-12 text-sm sm:text-lg border-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] ${
                      idx === 0
                        ? "bg-[#ff5500] text-black border-white"
                        : "bg-emerald-400 text-black border-white"
                    }`}
                  >
                    {slot.char}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-neutral-500">
                Cryptographic cipher verified by Central Command.
              </div>
            </div>

            {/* Telemetry Splits Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-neutral-900/80 border border-neutral-800">
                <span className="text-[9px] text-neutral-500 block uppercase">Round 1 (Lab)</span>
                <span className="text-amber-400 font-bold">{splitDetails?.l1Formatted || "--"}</span>
              </div>
              <div className="p-2.5 bg-neutral-900/80 border border-neutral-800">
                <span className="text-[9px] text-neutral-500 block uppercase">Round 2 (Arena)</span>
                <span className="text-cyan-400 font-bold">{splitDetails?.l2Formatted || "--"}</span>
              </div>
              <div className="p-2.5 bg-neutral-900/80 border border-neutral-800">
                <span className="text-[9px] text-neutral-500 block uppercase">Round 3 (Airport)</span>
                <span className="text-purple-400 font-bold">{splitDetails?.l3Formatted || "--"}</span>
              </div>
              <div className="p-2.5 bg-neutral-900/80 border border-neutral-800">
                <span className="text-[9px] text-neutral-500 block uppercase">Round 4 (Final)</span>
                <span className="text-emerald-400 font-bold">{splitDetails?.l4Formatted || "--"}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-2.5 bg-emerald-950/40 border border-emerald-500/50">
                <span className="text-[9px] text-emerald-400 block uppercase font-bold">Total Match</span>
                <span className="text-white font-black text-xs sm:text-sm">
                  {finalTotalFormatted || splitDetails?.totalFormatted || "--"}
                </span>
              </div>
            </div>

            {/* Permanent Lockout Directive */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
              <div className="font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                [COMPETITION LOCKED // PARTICIPANT COMPLETED]
              </div>
              Your performance telemetry and final rank have been recorded on the Coordinator Admin Telemetry panel.
              All game rounds are now concluded.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
