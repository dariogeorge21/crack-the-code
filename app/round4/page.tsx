"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Warning,
  ArrowLeft,
  Timer,
  Terminal,
  Trophy,
  Key,
  Folder,
  FileImage,
  FileText,
  FileCode,
  FilePdf,
  Lightbulb,
  CheckCircle,
  DownloadSimple,
  Sparkle
} from "@phosphor-icons/react";
import { MasterKeyHud } from "@/components/layout";
import { Round4VictoryModal } from "@/components/modals";
import {
  ExifToolPane,
  StegoToolPane,
  ZipExplorerPane,
  PdfForensicPane,
  QrScannerPane,
  ForensicDecoderHub,
  CTFHintsModal
} from "@/components/arena/ctf";
import { Team } from "@/types";
import { SESSION_STORAGE_KEY } from "@/constants";
import { useMissionTimer, usePreventBack } from "@/hooks";
import { formatTimer } from "@/lib/time";

type CTFFileName = "photo.jpg" | "meeting.png" | "report.docx" | "notes.pdf" | "evidence.png";

interface FileDescriptor {
  name: CTFFileName;
  stageNum: number;
  label: string;
  type: string;
  size: string;
  icon: typeof FileImage;
  accent: string;
  clueSummary: string;
}

const CTF_FILES: FileDescriptor[] = [
  {
    name: "photo.jpg",
    stageNum: 1,
    label: "Lab Snapshot",
    type: "JPEG Image",
    size: "32 KB",
    icon: FileImage,
    accent: "#ff5500",
    clueSummary: "EXIF Metadata -> 6D 65 65 74...",
  },
  {
    name: "meeting.png",
    stageNum: 2,
    label: "Meeting Minutes",
    type: "PNG Image",
    size: "15 KB",
    icon: FileImage,
    accent: "#06b6d4",
    clueSummary: "LSB Stego -> VGhlIHBhc3N3...",
  },
  {
    name: "report.docx",
    stageNum: 3,
    label: "Incident Report",
    type: "DOCX Archive",
    size: "1.3 KB",
    icon: FileCode,
    accent: "#a855f7",
    clueSummary: "ZIP / customXml -> Check PDF",
  },
  {
    name: "notes.pdf",
    stageNum: 4,
    label: "Research Notes",
    type: "PDF Document",
    size: "1.9 KB",
    icon: FilePdf,
    accent: "#ef4444",
    clueSummary: "Hidden White Text -> KEY: 435446",
  },
  {
    name: "evidence.png",
    stageNum: 5,
    label: "Workstation Desktop",
    type: "PNG Image",
    size: "23 KB",
    icon: FileImage,
    accent: "#f59e0b",
    clueSummary: "Optical Target -> QR Code",
  },
];

export default function Round4Page() {
  const router = useRouter();

  // Trap back navigation
  usePreventBack();

  // Auth & Team State
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string>("");

  // Mission timer
  const elapsedSeconds = useMissionTimer(activeTeam?.started_at);

  // Active File in Workstation
  const [activeFile, setActiveFile] = useState<CTFFileName>("photo.jpg");
  const [inspectedFiles, setInspectedFiles] = useState<Record<CTFFileName, boolean>>({
    "photo.jpg": true,
    "meeting.png": false,
    "report.docx": false,
    "notes.pdf": false,
    "evidence.png": false,
  });

  // Flag Submission State
  const [flagInput, setFlagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Victory Modal State
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [revealedDigits, setRevealedDigits] = useState<string[]>(["9", "1", "5", "8"]);
  const [splitTimeData, setSplitTimeData] = useState<Record<string, unknown>>({});
  const [isGameWon, setIsGameWon] = useState(false);

  // Hints Modal State
  const [isHintsOpen, setIsHintsOpen] = useState(false);

  // Manual code entry state on lock screen
  const [manualCode, setManualCode] = useState("");
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);

  // Authenticate team session
  const verifyTeamSession = useCallback(async (codeToVerify?: string) => {
    setIsLoadingAuth(true);
    setLockReason("");
    try {
      let code = codeToVerify;
      if (!code) {
        const storedLocal = typeof window !== "undefined" ? localStorage.getItem(SESSION_STORAGE_KEY) : null;
        const storedSession = typeof window !== "undefined" ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null;
        const raw = storedLocal || storedSession || "";
        
        if (raw.startsWith("{")) {
          try {
            const parsed = JSON.parse(raw);
            code = parsed.team_code || "";
          } catch {
            code = raw;
          }
        } else {
          code = raw.trim();
        }
      }

      if (!code) {
        setIsLocked(true);
        setLockReason("NO ACTIVE TEAM SESSION FOUND. Enter your 3-digit Team Access Code below to enter Round 4.");
        setIsLoadingAuth(false);
        return;
      }

      const res = await fetch("/api/game/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.team) {
        setIsLocked(true);
        setLockReason(data.error || "INVALID OR EXPIRED TEAM ACCESS CODE.");
        setIsLoadingAuth(false);
        return;
      }

      const team: Team = data.team;
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_STORAGE_KEY, team.team_code);
        sessionStorage.setItem(SESSION_STORAGE_KEY, team.team_code);
      }
      setActiveTeam(team);

      // Check level clearance
      if (!team.current_level || team.current_level < 4) {
        setIsLocked(true);
        setLockReason(
          `CLEARANCE RESTRICTED: Team "${team.team_name}" is at Clearance Tier 0${team.current_level || 1}. You must complete Round 3 (Airport Checkpoint) to unlock Level 4.`
        );
        setIsLoadingAuth(false);
        return;
      }

      // Passed clearance
      setIsLocked(false);
      if (team.current_level >= 5 || team.completed_level4_at) {
        setIsGameWon(true);
      }
    } catch (err) {
      console.error("verifyTeamSession error:", err);
      setIsLocked(true);
      setLockReason("SESSION INITIALIZATION FAILED. UNABLE TO REACH AUTH SERVER.");
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    verifyTeamSession();
  }, [verifyTeamSession]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setIsVerifyingManual(true);
    await verifyTeamSession(manualCode.trim());
    setIsVerifyingManual(false);
  };

  const handleSelectFile = (fileName: CTFFileName) => {
    setActiveFile(fileName);
    setInspectedFiles((prev) => ({ ...prev, [fileName]: true }));
  };

  const handleInsertFlag = (flag: string) => {
    setFlagInput(flag);
  };

  const handleSubmitFlag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!flagInput.trim() || !activeTeam || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/game/submit-round4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamCode: activeTeam.team_code,
          flag: flagInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || "Flag verification failed. Double check your extracted strings.");
        setIsSubmitting(false);
        return;
      }

      // Update session storage
      if (data.team) {
        localStorage.setItem(SESSION_STORAGE_KEY, data.team.team_code);
        sessionStorage.setItem(SESSION_STORAGE_KEY, data.team.team_code);
        setActiveTeam(data.team);
      }

      setRevealedDigits(data.revealedDigits || ["9", "1", "5", "8"]);
      setSplitTimeData(data.splitTime || {});
      setIsGameWon(true);
      setIsVictoryModalOpen(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Network error during flag validation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading Screen
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#060608] text-white flex flex-col items-center justify-center p-4 font-mono">
        <div className="flex items-center gap-3 text-amber-400">
          <Terminal weight="bold" className="size-6 animate-spin" />
          <span className="text-sm uppercase tracking-widest font-black">
            SYNCHRONIZING SECURE CTF WORKSTATION...
          </span>
        </div>
      </div>
    );
  }

  // Locked Screen
  if (isLocked || !activeTeam) {
    return (
      <div className="min-h-screen bg-[#060608] text-white flex flex-col items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-[#0a0a0f] border-2 border-amber-500/80 p-6 sm:p-8 shadow-[8px_8px_0px_0px_#f59e0b]">
          <div className="flex items-center gap-3 text-amber-400 mb-4 pb-3 border-b border-neutral-800">
            <Warning weight="fill" className="size-6 shrink-0" />
            <span className="text-xs font-black uppercase tracking-widest">
              ROUND 04 // AUTHENTICATION &amp; CLEARANCE
            </span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed mb-5 font-mono">
            {lockReason || "Authentication required to enter Round 4."}
          </p>

          {/* Inline Quick Code Entry */}
          <form onSubmit={handleManualLogin} className="mb-6 space-y-3 p-3.5 bg-black border border-neutral-800">
            <label className="text-[10px] font-bold text-amber-400 uppercase block tracking-wider">
              ENTER TEAM ACCESS CODE:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={8}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. 743"
                className="flex-1 px-3 py-2 bg-[#09090d] border border-neutral-700 focus:border-amber-400 text-white font-mono font-bold tracking-widest text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!manualCode.trim() || isVerifyingManual}
                className="px-4 py-2 bg-amber-400 hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_0px_#ffffff] disabled:opacity-50 shrink-0"
              >
                {isVerifyingManual ? "CHECKING..." : "ENTER"}
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-2">
            {activeTeam && activeTeam.current_level < 4 && (
              <Link
                href={activeTeam.current_level === 3 ? "/level3" : activeTeam.current_level === 2 ? "/level2" : "/"}
                className="flex-1 py-2.5 px-3 bg-[#ff5500] hover:bg-white text-black font-black uppercase text-[11px] tracking-wider flex items-center justify-center gap-1.5 transition-all text-center shadow-[2px_2px_0px_0px_#ffffff]"
              >
                <span>GO TO TIER 0{activeTeam.current_level} ARENA</span>
              </Link>
            )}
            <Link
              href="/"
              className="py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-1.5 transition-all text-center border border-neutral-800"
            >
              <ArrowLeft weight="bold" className="size-3.5" />
              <span>LOBBY</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white font-mono flex flex-col overflow-hidden">
      {/* Top Header HUD */}
      <header className="h-14 bg-[#09090e] border-b border-neutral-800 px-3 sm:px-5 flex items-center justify-between gap-2 shrink-0 select-none z-20">
        {/* Left: Brand & Round Clearance */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-xs font-bold"
            title="Main Lobby"
          >
            <ArrowLeft weight="bold" className="size-4" />
            <span className="hidden md:inline uppercase">LOBBY</span>
          </Link>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 bg-amber-950 border border-amber-500/60 text-amber-400 font-black text-[10px] tracking-wider uppercase flex items-center gap-1">
              <Trophy weight="fill" className="size-3" />
              <span>ROUND 04 // FINAL LOCK</span>
            </span>
            <span className="hidden lg:inline text-neutral-500 text-[11px]">
              &quot;The Missing Researcher&quot;
            </span>
          </div>
        </div>

        {/* Center: 10-Slot Master Key HUD */}
        <div className="flex items-center">
          <MasterKeyHud
            masterCode={activeTeam.master_code || "7839201546"}
            unlockedCount={isGameWon ? 10 : 6}
            highlightNewDigits={isGameWon}
            size="sm"
          />
        </div>

        {/* Right: Team Info, Timer, Hints Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mission Timer */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-xs text-amber-400 font-black">
            <Timer weight="bold" className="size-3.5" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Tactical Hints Button */}
          <button
            type="button"
            onClick={() => setIsHintsOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/60 text-amber-400 font-bold text-[10px] uppercase cursor-pointer transition-colors shadow-[2px_2px_0px_0px_#f59e0b]"
          >
            <Lightbulb weight="fill" className="size-3.5 text-amber-400" />
            <span className="hidden sm:inline">HINTS</span>
          </button>

          {/* Team Tag */}
          <div className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-[10px] font-bold text-neutral-300">
            {activeTeam.team_name || `TEAM ${activeTeam.team_number}`}
          </div>
        </div>
      </header>

      {/* Main Investigation Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Virtual Filesystem / Case File Locker */}
        <aside className="w-full lg:w-72 bg-[#08080c] border-b lg:border-b-0 lg:border-r border-neutral-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 uppercase">
              <Folder weight="fill" className="size-4 text-amber-400" />
              <span>missing_researcher/</span>
            </div>
            <span className="text-[10px] text-neutral-500 uppercase">5 RECOVERED</span>
          </div>

          {/* Files List */}
          <div className="p-2 space-y-1.5 overflow-y-auto flex-1 max-h-48 lg:max-h-none">
            {CTF_FILES.map((file) => {
              const isActive = activeFile === file.name;
              const isInspected = inspectedFiles[file.name];
              const Icon = file.icon;

              return (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => handleSelectFile(file.name)}
                  className={`w-full text-left p-2.5 transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                    isActive
                      ? "bg-neutral-900 border-amber-400 text-white shadow-[2px_2px_0px_0px_#f59e0b]"
                      : "bg-[#060609] border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon weight="bold" className="size-4 shrink-0" style={{ color: file.accent }} />
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{file.name}</div>
                      <div className="text-[10px] text-neutral-500 truncate">{file.label}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] px-1 bg-neutral-950 border border-neutral-800 text-neutral-400">
                      {file.size}
                    </span>
                    {isInspected && (
                      <CheckCircle weight="fill" className="size-3.5 text-emerald-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Alex's Message Box */}
          <div className="p-3 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1 text-[10px] uppercase">
              <Sparkle weight="fill" className="size-3" />
              <span>ALEX&apos;S LAST TRANSMISSION:</span>
            </div>
            <p className="italic text-neutral-300 text-[10px] leading-relaxed">
              &quot;Don&apos;t trust what you see. The truth is hidden inside the files.&quot;
            </p>
          </div>
        </aside>

        {/* Center: Dynamic Forensic Inspector Pane */}
        <main className="flex-1 flex flex-col bg-[#07070a] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {activeFile === "photo.jpg" && (
              <ExifToolPane onSelectNextFile={(file) => handleSelectFile(file as CTFFileName)} />
            )}
            {activeFile === "meeting.png" && (
              <StegoToolPane onSelectNextFile={(file) => handleSelectFile(file as CTFFileName)} />
            )}
            {activeFile === "report.docx" && (
              <ZipExplorerPane onSelectNextFile={(file) => handleSelectFile(file as CTFFileName)} />
            )}
            {activeFile === "notes.pdf" && (
              <PdfForensicPane onSelectNextFile={(file) => handleSelectFile(file as CTFFileName)} />
            )}
            {activeFile === "evidence.png" && (
              <QrScannerPane onInsertFlag={handleInsertFlag} />
            )}
          </div>

          {/* Bottom Area: Forensic Utility Drawer + Master Flag Terminal */}
          <div className="shrink-0 border-t border-neutral-800 bg-[#08080c] flex flex-col">
            {/* Decoders Hub */}
            <div className="border-b border-neutral-800/80">
              <ForensicDecoderHub />
            </div>

            {/* Master Flag Submission Console */}
            <form onSubmit={handleSubmitFlag} className="p-3 sm:p-4 bg-[#050508] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase shrink-0">
                <Trophy weight="fill" className="size-4" />
                <span>MASTER FLAG TERMINAL:</span>
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  placeholder="FLAG{alex_left_more_than_a_message}"
                  className="w-full px-3 py-2 bg-black border-2 border-neutral-700 focus:border-amber-400 text-amber-300 font-mono text-xs sm:text-sm font-bold tracking-wider outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !flagInput.trim()}
                className="px-6 py-2 bg-amber-400 hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] disabled:opacity-50 flex items-center justify-center gap-2 active:translate-y-0.5 shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Terminal weight="bold" className="size-4 animate-spin" />
                    <span>VERIFYING FLAG...</span>
                  </>
                ) : (
                  <>
                    <Key weight="bold" className="size-4" />
                    <span>SUBMIT FLAG &amp; CLAIM VICTORY</span>
                  </>
                )}
              </button>
            </form>

            {/* Submission Error Banner */}
            {submitError && (
              <div className="px-4 py-2 bg-red-950/80 border-t border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-2">
                <Warning weight="bold" className="size-4 text-red-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Hints Modal */}
      <CTFHintsModal
        isOpen={isHintsOpen}
        onClose={() => setIsHintsOpen(false)}
        activeFile={activeFile}
      />

      {/* Round 4 Victory Modal */}
      <Round4VictoryModal
        isOpen={isVictoryModalOpen}
        digits={revealedDigits}
        masterCode={activeTeam.master_code || "7839201546"}
        splitTime={splitTimeData}
        teamName={activeTeam.team_name}
        teamNumber={activeTeam.team_number}
        onClose={() => setIsVictoryModalOpen(false)}
      />
    </div>
  );
}
