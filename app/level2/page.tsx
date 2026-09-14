"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LockKey,
  ShieldCheck,
  Warning,
  ArrowLeft,
  Timer,
  Terminal,
  Play,
  Lightning,
  Sparkle,
  CheckCircle,
  Code,
} from "@phosphor-icons/react";
import {
  DiamondProblemPane,
  LeetCodeEditorPane,
  LeetCodeOutputDrawer,
} from "@/components/arena";
import { MasterKeyHud } from "@/components/layout";
import { KeyUnlockAnimationModal } from "@/components/modals";
import { Team, SupportedLanguage, ExecutionResult } from "@/types";
import { STARTER_CODES, SESSION_STORAGE_KEY } from "@/constants";
import { useMissionTimer, usePreventBack } from "@/hooks";
import { formatTimer } from "@/lib/time";

export default function Round2Page() {
  const router = useRouter();

  // Trap back navigation in the active arena
  usePreventBack();

  // Team authentication & state
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string>("");

  // Mission timer state (anchored to team.started_at)
  const elapsedSeconds = useMissionTimer(activeTeam?.started_at);

  // Code Editor state with automatic per-language switching
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [codeMap, setCodeMap] = useState<Record<SupportedLanguage, string>>({
    python: STARTER_CODES.python,
    c: STARTER_CODES.c,
    cpp: STARTER_CODES.cpp,
    java: STARTER_CODES.java,
  });

  const activeCode = codeMap[language] ?? STARTER_CODES[language];

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
  };

  const handleCodeChange = (newCode: string) => {
    setCodeMap((prev) => ({
      ...prev,
      [language]: newCode,
    }));
  };

  // Execution & Output Drawer state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  // Completion notification modal / banner & Key Unlock animation
  const [clearedBanner, setClearedBanner] = useState<boolean>(false);
  const [revealedDigits, setRevealedDigits] = useState<[string, string] | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [isKeyHighlighted, setIsKeyHighlighted] = useState<boolean>(false);
  const [isKeySettled, setIsKeySettled] = useState<boolean>(false);

  // Split pane dimensions & Output Bar height state
  const [splitPercent, setSplitPercent] = useState<number>(46); // Left (Question) width %
  const [verticalSplitPercent, setVerticalSplitPercent] = useState<number>(45); // Mobile Question height %
  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);
  const [outputHeight, setOutputHeight] = useState<number>(280); // Output bar height in px
  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSplitterPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSplitter(true);
  };

  const handleSplitterPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplitter || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();

    if (window.innerWidth >= 768) {
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(pct, 20), 80));
    } else {
      const y = e.clientY - rect.top;
      const pct = (y / rect.height) * 100;
      setVerticalSplitPercent(Math.min(Math.max(pct, 20), 80));
    }
  };

  const handleSplitterPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingSplitter) {
      setIsDraggingSplitter(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Authenticate participant session on mount
  useEffect(() => {
    async function verifyAccess() {
      try {
        const savedCode = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!savedCode) {
          setIsLocked(true);
          setLockReason("NO ACTIVE TEAM SESSION FOUND. YOU MUST FIRST LOG IN WITH YOUR ASSIGNED TEAM CODE.");
          setIsLoadingAuth(false);
          return;
        }

        const res = await fetch("/api/game/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: savedCode }),
        });

        const data = await res.json();
        if (!res.ok || !data.success || !data.team) {
          setIsLocked(true);
          setLockReason(data.error || "INVALID OR EXPIRED TEAM CODE.");
          setIsLoadingAuth(false);
          return;
        }

        const team: Team = data.team;
        setActiveTeam(team);

        // ACCESS CONTROL & AUTO-FORWARD:
        // 1. If team has already completed Round 2 (Tier 3 or 4), forward them directly to Round 3!
        if (team.current_level >= 3) {
          router.replace("/level3");
          return;
        }

        // 2. If team has not cleared Level 1 yet, redirect to Level 1
        if (!team.current_level || team.current_level < 2) {
          router.replace("/");
          return;
        }

        // Passed clearance
        setIsLocked(false);
      } catch (err) {
        console.error("Authentication check error:", err);
        setIsLocked(true);
        setLockReason("UNABLE TO VERIFY CLEARANCE CREDENTIALS. CHECK NETWORK CONNECTION.");
      } finally {
        setIsLoadingAuth(false);
      }
    }

    verifyAccess();
  }, [router]);

  // Run code handler
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setIsDrawerOpen(true);

    try {
      const codeToRun = codeMap[language] ?? STARTER_CODES[language];
      const res = await fetch("/api/compiler/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code: codeToRun,
          input: "",
          round: 2,
        }),
      });

      const data = await res.json();

      const execResult: ExecutionResult = {
        output: data.output || "",
        error: data.error || (data.success ? "" : "Execution failed"),
        exitCode: data.exitCode ?? 0,
        time: data.time || "0.05s",
        memory: data.memory || "8.0 MB",
        source: data.source || "onlinecompiler.io",
        isCorrect: Boolean(data.isCorrect),
        hasAccessCode: Boolean(data.hasAccessCode),
        accessCode: data.accessCode || null,
      };

      setExecutionResult(execResult);

      if (execResult.isCorrect) {
        setClearedBanner(true);

        // Claim Level 2 clearance and trigger Master Key unlock sequence
        if (activeTeam) {
          try {
            const submitRes = await fetch("/api/game/submit-round2", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                teamCode: activeTeam.team_code,
                accessCode: execResult.accessCode || "88",
              }),
            });
            const submitData = await submitRes.json();
            if (submitRes.ok && submitData.success) {
              setActiveTeam((prev) =>
                prev
                  ? {
                      ...prev,
                      master_code: submitData.maskedMasterCode,
                      current_level: 3,
                      completed_level2_at: submitData.completed_level2_at || new Date().toISOString(),
                    }
                  : null
              );
              setRevealedDigits(submitData.revealedDigits);
              setIsKeySettled(false);
              setIsKeyHighlighted(false);
              setIsUnlockModalOpen(true);
            }
          } catch (submitErr) {
            console.error("Auto-submit Round 2 clearance error:", submitErr);
          }
        }
      }
    } catch (err: unknown) {
      console.error("Execution error:", err);
      setExecutionResult({
        output: "",
        error: err instanceof Error ? err.message : "Network error calling compiler",
        exitCode: 1,
        time: "0s",
        memory: "0 MB",
        source: "system-error",
        isCorrect: false,
        hasAccessCode: false,
        accessCode: null,
      });
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, language, codeMap, activeTeam]);

  // Explicit claim clearance handler for manual drawer button
  const handleClaimClearance = useCallback(async () => {
    if (!activeTeam) return;
    if (revealedDigits) {
      setIsUnlockModalOpen(true);
      return;
    }
    try {
      const submitRes = await fetch("/api/game/submit-round2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamCode: activeTeam.team_code,
          accessCode: "88",
        }),
      });
      const submitData = await submitRes.json();
      if (submitRes.ok && submitData.success) {
        setActiveTeam((prev) =>
          prev
            ? {
                ...prev,
                master_code: submitData.maskedMasterCode,
                current_level: 3,
                completed_level2_at: submitData.completed_level2_at || new Date().toISOString(),
              }
            : null
        );
        setRevealedDigits(submitData.revealedDigits);
        setIsKeySettled(false);
        setIsKeyHighlighted(false);
        setIsUnlockModalOpen(true);
      }
    } catch (err) {
      console.error("Claim clearance error:", err);
    }
  }, [activeTeam, revealedDigits]);

  // Loading state
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#07070a] text-white font-mono flex flex-col items-center justify-center p-4">
        <Lightning weight="fill" className="size-10 text-[#ff5500] animate-spin mb-4" />
        <div className="text-sm font-black tracking-widest uppercase">
          VERIFYING BIOMETRIC CLEARANCE & SECURITY TOKENS...
        </div>
        <div className="text-xs text-neutral-500 mt-2">Connecting to Central Command Vault</div>
      </div>
    );
  }

  // ACCESS DENIED / LOCKED SCREEN
  if (isLocked || !activeTeam) {
    return (
      <div className="min-h-screen bg-[#060608] text-white font-mono flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Cyber Grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#ff5500 1px, transparent 1px), linear-gradient(90deg, #ff5500 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="w-full max-w-xl bg-[#0d0d12] border-2 border-red-600 shadow-[8px_8px_0px_0px_#ef4444] p-6 sm:p-8 relative z-10 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <LockKey weight="bold" className="size-8 animate-pulse shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-red-400 font-black">
                [CLEARANCE OVERRIDE REJECTED]
              </div>
              <h1 className="text-xl font-black text-white tracking-wide">
                SECURITY LOCKOUT // ROUND 02
              </h1>
            </div>
          </div>

          <div className="p-4 bg-red-950/40 border border-red-800 text-red-300 text-xs sm:text-sm leading-relaxed mb-6 font-mono">
            <div className="font-bold text-red-400 uppercase mb-1">ACCESS DENIED:</div>
            <p>{lockReason}</p>
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 mb-6 space-y-1.5">
            <div className="text-white font-bold uppercase text-[11px]">REQUIREMENTS TO UNLOCK:</div>
            <div>1. Access Level 1 via the main terminal.</div>
            <div>2. Discover your physical challenge solution in the lab.</div>
            <div>3. Enter your Round 1 answer and unlock your 10-digit Master Key.</div>
          </div>

          <Link
            href="/"
            className="w-full py-3.5 px-4 bg-[#ff5500] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
          >
            <ArrowLeft weight="bold" className="size-4" />
            <span>RETURN TO LEVEL 01 TERMINAL</span>
          </Link>
        </div>
      </div>
    );
  }

  // Only reveal 3 digits in the header once the animation settles or if user arrived already at Tier 3
  const isKeyRevealedInHeader =
    (activeTeam && activeTeam.current_level >= 3 && !isUnlockModalOpen) ||
    isKeySettled;

  // AUTHORIZED LEETCODE INTERFACE
  return (
    <div className="h-screen bg-[#07070a] text-white font-mono flex flex-col overflow-hidden select-none">
      {/* Top Cyber Navigation Bar */}
      <header className="h-14 border-b border-neutral-800 bg-[#0c0c10] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Brand & Round */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="font-black text-[#ff5500] tracking-wider">ASTHRA 11.0</span>
            <span className="text-neutral-700">/</span>
            <span className="text-neutral-300 font-bold hidden sm:inline">ARENA 02</span>
          </div>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#ff5500] text-black font-black text-xs uppercase tracking-wider shrink-0">
              ROUND 02
            </span>
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white hidden md:inline">
              Diamond Star Pattern Matrix
            </span>
          </div>
        </div>

        {/* Center: Live Team Timer & Master Key Rack */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-700 px-3 py-1 text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <Timer weight="bold" className="size-3.5 text-[#ff5500]" />
            <span className="text-neutral-400 hidden lg:inline">MISSION:</span>
            <span className="text-[#ff5500] font-black font-mono tracking-wider">
              {formatTimer(elapsedSeconds, true)}
            </span>
          </div>

          {/* Master Key HUD in Desktop Header */}
          <MasterKeyHud
            masterCode={activeTeam.master_code}
            unlockedCount={activeTeam.current_level >= 4 ? 6 : (activeTeam.current_level >= 3 || isKeyRevealedInHeader) ? 3 : 1}
            highlightNewDigits={isKeyHighlighted}
            size="sm"
            className="hidden sm:flex"
          />
        </div>

        {/* Right: Team Identification Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0e0e14] border border-neutral-800 text-xs shrink-0">
          <span className="text-neutral-500 uppercase font-bold text-[11px] hidden sm:inline">TEAM:</span>
          <span className="text-white font-black">{activeTeam.team_name}</span>
          <span className="px-1.5 py-0.2 bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/40 font-black text-[10px] tracking-wider">
            TIER 0{activeTeam.current_level}
          </span>
        </div>
      </header>

      {/* Mobile Master Key Bar (Visible only on mobile screens < sm) */}
      <div className="sm:hidden bg-[#09090d] border-b border-neutral-800 px-4 py-1.5 flex items-center justify-between text-xs">
        <MasterKeyHud
          masterCode={activeTeam.master_code}
          unlockedCount={activeTeam.current_level >= 4 ? 6 : (activeTeam.current_level >= 3 || isKeyRevealedInHeader) ? 3 : 1}
          highlightNewDigits={isKeyHighlighted}
          size="sm"
        />
        <span className="text-[10px] text-neutral-400 font-mono">
          TIER 0{activeTeam.current_level}
        </span>
      </div>

      {/* Verification / Success Toast Banner */}
      {clearedBanner && (
        <div className="bg-emerald-500 text-black px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle weight="fill" className="size-4" />
            <span>DIAMOND PATTERN VERIFIED // ROUND 2 CLEARED!</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.replace("/level3")}
              className="px-3 py-1 bg-black text-white hover:bg-neutral-900 font-black text-[11px] tracking-widest border border-black uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
            >
              <span>ENTER ROUND 03 ARENA</span>
            </button>
            <button
              type="button"
              onClick={() => setClearedBanner(false)}
              className="font-bold underline text-[11px] cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Main Split Layout: Left Problem Statement, Middle Splitter Handle, Right Editor + Output */}
      <div
        ref={splitContainerRef}
        className={`flex-1 flex flex-col md:flex-row overflow-hidden relative ${
          isDraggingSplitter ? "select-none" : ""
        }`}
      >
        {/* Left Pane: Problem Statement & Event Log (Resizable) */}
        <div
          style={{
            width: isDesktop ? `${splitPercent}%` : "100%",
            height: !isDesktop ? `${verticalSplitPercent}%` : "100%",
          }}
          className="overflow-hidden flex flex-col shrink-0 min-w-0"
        >
          <DiamondProblemPane round={2} />
        </div>

        {/* Resizable Splitter Handle between Question Panel and Editor */}
        <div
          onPointerDown={handleSplitterPointerDown}
          onPointerMove={handleSplitterPointerMove}
          onPointerUp={handleSplitterPointerUp}
          className={`select-none transition-colors group relative shrink-0 z-20 ${
            isDesktop
              ? "w-2.5 h-full cursor-col-resize bg-[#0c0c11] hover:bg-[#ff5500] active:bg-[#ff5500] border-x border-neutral-800 flex items-center justify-center"
              : "h-2.5 w-full cursor-row-resize bg-[#0c0c11] hover:bg-[#ff5500] active:bg-[#ff5500] border-y border-neutral-800 flex items-center justify-center"
          } ${isDraggingSplitter ? "bg-[#ff5500]!" : ""}`}
          title={
            isDesktop
              ? "Drag horizontally to resize Question and Editor panels"
              : "Drag vertically to resize Question and Editor panels"
          }
        >
          {/* Cyber Grip Dots */}
          <div
            className={`rounded-full bg-neutral-700/80 group-hover:bg-black group-active:bg-black transition-colors ${
              isDesktop
                ? "w-1 h-10 flex flex-col justify-around items-center"
                : "h-1 w-10 flex justify-around items-center"
            }`}
          >
            <span className="size-1 rounded-full bg-neutral-400 group-hover:bg-black group-active:bg-black" />
            <span className="size-1 rounded-full bg-neutral-400 group-hover:bg-black group-active:bg-black" />
            <span className="size-1 rounded-full bg-neutral-400 group-hover:bg-black group-active:bg-black" />
          </div>
        </div>

        {/* Right Pane: Code Editor */}
        <div className="flex-1 overflow-hidden flex flex-col min-w-0 min-h-0">
          <LeetCodeEditorPane
            language={language}
            onLanguageChange={handleLanguageChange}
            code={activeCode}
            onCodeChange={handleCodeChange}
            onRun={handleRunCode}
            isRunning={isRunning}
            isDrawerOpen={isDrawerOpen}
            onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          />
        </div>
      </div>

      {/* Full-Width Resizable Output Bar (Covers bottom of whole screen) */}
      {isDrawerOpen && (
        <div
          style={{ height: `${outputHeight}px` }}
          className="w-full shrink-0 flex flex-col overflow-hidden min-h-[120px] max-h-[85vh] z-30"
        >
          <LeetCodeOutputDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            isRunning={isRunning}
            result={executionResult}
            onAdvanceToNextRound={handleClaimClearance}
            currentHeight={outputHeight}
            onResize={(h) => setOutputHeight(h)}
            round={2}
          />
        </div>
      )}

      {/* Cyber Master Key Unlock Animation Modal */}
      {revealedDigits && (
        <KeyUnlockAnimationModal
          isOpen={isUnlockModalOpen}
          digits={revealedDigits}
          maskedMasterCode={activeTeam.master_code || "7*********"}
          onSettled={() => {
            setIsKeySettled(true);
            setIsKeyHighlighted(true);
          }}
          onComplete={() => {
            setIsUnlockModalOpen(false);
            setIsKeySettled(true);
            setIsKeyHighlighted(true);
            // Seamlessly transition team into Round 3 arena
            router.replace("/level3");
          }}
        />
      )}
    </div>
  );
}
