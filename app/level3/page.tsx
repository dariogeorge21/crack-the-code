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
  AirportProblemPane,
  LeetCodeEditorPane,
  LeetCodeOutputDrawer,
} from "@/components/arena";
import { MasterKeyHud } from "@/components/layout";
import { Round3UnlockModal } from "@/components/modals";
import { Team, SupportedLanguage, ExecutionResult } from "@/types";
import { STARTER_CODES, SESSION_STORAGE_KEY } from "@/constants";
import { useMissionTimer, usePreventBack } from "@/hooks";
import { formatTimer } from "@/lib/time";

export default function Round3Page() {
  const router = useRouter();

  // Trap back navigation in the active arena
  usePreventBack();

  // Team authentication & state
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string>("");

  // Clearance Banner & Key Unlock Modal state
  const [clearedBanner, setClearedBanner] = useState<boolean>(false);
  const [revealedDigits, setRevealedDigits] = useState<string[] | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);

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
        // If team has not reached Level 3 yet, redirect to their active round
        if (!team.current_level || team.current_level < 3) {
          if (team.current_level === 2) {
            router.replace("/level2");
          } else {
            router.replace("/");
          }
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


  // Run code handler (connected to compiler with round: 3)
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
          round: 3,
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

      if (execResult.isCorrect && activeTeam) {
        setClearedBanner(true);
        try {
          const submitRes = await fetch("/api/game/submit-round3", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teamCode: activeTeam.team_code,
              accessCode: execResult.accessCode || "41",
            }),
          });
          const submitData = await submitRes.json();
          if (submitRes.ok && submitData.success) {
            setActiveTeam((prev) =>
              prev
                ? {
                    ...prev,
                    master_code: submitData.maskedMasterCode,
                    current_level: 4,
                    completed_level3_at: submitData.completed_level3_at || new Date().toISOString(),
                  }
                : null
            );
            setRevealedDigits(submitData.revealedDigits);
            setIsUnlockModalOpen(true);
          }
        } catch (submitErr) {
          console.error("Auto-submit Round 3 clearance error:", submitErr);
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

  // Explicit claim clearance handler for manual button inside output drawer
  const handleClaimClearance = useCallback(async () => {
    if (!activeTeam) return;
    if (revealedDigits) {
      setIsUnlockModalOpen(true);
      return;
    }
    try {
      const submitRes = await fetch("/api/game/submit-round3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamCode: activeTeam.team_code,
          accessCode: "41",
        }),
      });
      const submitData = await submitRes.json();
      if (submitRes.ok && submitData.success) {
        setActiveTeam((prev) =>
          prev
            ? {
                ...prev,
                master_code: submitData.maskedMasterCode,
                current_level: 4,
                completed_level3_at: submitData.completed_level3_at || new Date().toISOString(),
              }
            : null
        );
        setRevealedDigits(submitData.revealedDigits);
        setClearedBanner(true);
        setIsUnlockModalOpen(true);
      }
    } catch (submitErr) {
      console.error("Round 3 clearance submit error:", submitErr);
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
                SECURITY LOCKOUT // ROUND 03
              </h1>
            </div>
          </div>

          <div className="p-4 bg-red-950/20 border border-red-900/60 text-xs text-red-200 mb-6 leading-relaxed">
            {lockReason}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/level2"
              className="flex-1 py-3 px-4 bg-[#ff5500] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#ffffff]"
            >
              <ArrowLeft weight="bold" className="size-4" />
              <span>GO TO ROUND 02 ARENA</span>
            </Link>
            <Link
              href="/"
              className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wider transition-colors text-center border border-neutral-800"
            >
              RETURN TO COMMAND HUB
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#07070a] text-white flex flex-col overflow-hidden font-mono select-none">
      {/* Top Cyber Navigation Bar */}
      <header className="h-14 border-b border-neutral-800 bg-[#0a0a0e] px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-40">
        {/* Left: ASTHRA & Round Identifier */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
            <span className="font-black tracking-wider text-[11px] text-[#ff5500]">ASTHRA 11.0</span>
            <span className="text-neutral-700 hidden md:inline">|</span>
            <span className="text-neutral-400 font-bold text-[11px] hidden md:inline">ARENA 03</span>
          </div>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/40 text-rose-400 font-black text-xs uppercase tracking-wider">
              <Code weight="bold" className="size-3.5 text-rose-400" />
              <span>ROUND 03</span>
            </div>
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white hidden md:inline">
              Airport Security Checkpoint
            </span>
          </div>
        </div>

        {/* Center: Continuous Mission Timer & Master Key HUD */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mission Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0e0e14] border border-neutral-800 text-xs">
            <Timer weight="bold" className="size-3.5 text-[#ff5500]" />
            <span className="text-[10px] text-neutral-400 uppercase font-bold hidden sm:inline">
              CLOCK:
            </span>
            <span className="font-mono font-black text-white text-xs sm:text-sm tracking-wider">
              {formatTimer(elapsedSeconds, true)}
            </span>
          </div>

          {/* Master Key HUD displaying revealed digits */}
          <MasterKeyHud
            masterCode={activeTeam.master_code}
            unlockedCount={activeTeam.current_level >= 4 ? 6 : 3}
            size="sm"
            className="hidden sm:flex"
          />
        </div>

        {/* Right: Team Identification Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0e0e14] border border-neutral-800 text-xs shrink-0">
          <span className="text-neutral-500 uppercase font-bold text-[11px] hidden sm:inline">TEAM:</span>
          <span className="text-white font-black">{activeTeam.team_name}</span>
          <span className="px-1.5 py-0.2 bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/40 font-black text-[10px] tracking-wider">
            {activeTeam.current_level >= 4 ? "TIER 04" : "TIER 03"}
          </span>
        </div>
      </header>

      {/* Mobile Master Key Bar (Visible only on mobile screens < sm) */}
      <div className="sm:hidden bg-[#09090d] border-b border-neutral-800 px-4 py-1.5 flex items-center justify-between text-xs">
        <MasterKeyHud
          masterCode={activeTeam.master_code}
          unlockedCount={activeTeam.current_level >= 4 ? 6 : 3}
          size="sm"
        />
        <span className="text-[10px] text-neutral-400 font-mono">
          {activeTeam.current_level >= 4 ? "TIER 04" : "TIER 03"}
        </span>
      </div>

      {/* Verification / Success Toast Banner */}
      {clearedBanner && (
        <div className="bg-emerald-500 text-black px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle weight="fill" className="size-4" />
            <span>ACCESS CODE 41 VERIFIED // ROUND 3 CLEARED!</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsUnlockModalOpen(true)}
              className="px-3 py-1 bg-black text-white hover:bg-neutral-900 font-black text-[11px] tracking-widest border border-black uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
            >
              <span>VIEW CIPHER KEYS</span>
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
        {/* Left Pane: Problem Statement & Instructions (Resizable) */}
        <div
          style={{
            width: isDesktop ? `${splitPercent}%` : "100%",
            height: !isDesktop ? `${verticalSplitPercent}%` : "100%",
          }}
          className="overflow-hidden flex flex-col shrink-0 min-w-0"
        >
          <AirportProblemPane round={3} />
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
          {/* Splitter Grip indicator */}
          <div
            className={`flex items-center justify-center rounded-full bg-neutral-800 group-hover:bg-white group-active:bg-white transition-all shadow-sm ${
              isDesktop ? "flex-col gap-1 w-1.5 h-7" : "flex-row gap-1 h-1.5 w-7"
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
            round={3}
          />
        </div>
      )}

      {/* Round 3 Unlock Celebration Modal */}
      <Round3UnlockModal
        isOpen={isUnlockModalOpen}
        digits={revealedDigits || ["8", "4", "2"]}
        maskedMasterCode={activeTeam.master_code || "763842****"}
        onComplete={() => setIsUnlockModalOpen(false)}
      />
    </div>
  );
}
