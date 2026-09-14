"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar, Footer, MasterKeyHud } from "@/components/layout";
import { HeroSection, RoundsSection, RulesSection, CoordinatorsSection } from "@/components/sections";
import { IdeaSubmissionModal, GameAuthModal, Round1Modal } from "@/components/modals";
import { Team } from "@/types";
import { SESSION_STORAGE_KEY } from "@/constants";
import { useMissionTimer } from "@/hooks";
import { formatDuration } from "@/lib/time";
import { Timer, Play, Code } from "@phosphor-icons/react";

export default function Home() {
  const router = useRouter();

  const [isIdeasModalOpen, setIsIdeasModalOpen] = useState(false);
  const [selectedRoundForModal, setSelectedRoundForModal] = useState<number>(1);

  // Competition Game Flow State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRound1ModalOpen, setIsRound1ModalOpen] = useState(false);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Non-stop continuous mission timer based on started_at
  const activeTeamElapsed = useMissionTimer(activeTeam?.started_at);

  // Restore saved participant session on mount
  useEffect(() => {
    const savedCode = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedCode) {
      fetch("/api/game/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: savedCode }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.team) {
            setActiveTeam(data.team);
            // AUTO-FORWARD GUARD:
            // If team has already unlocked Round 2 or Round 3, never leave them stuck on Level 1 / Home!
            if (data.team.current_level >= 3) {
              router.replace("/level3");
              return;
            } else if (data.team.current_level >= 2) {
              router.replace("/level2");
              return;
            }

            setStatusNotification(
              `SESSION RESTORED // ${data.team.team_name} (TIER 0${data.team.current_level})`
            );
            setTimeout(() => setStatusNotification(null), 5000);
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        })
        .catch(() => {});
    }
  }, [router]);

  const handleOpenIdeasModal = (roundNum: number = 1) => {
    setSelectedRoundForModal(roundNum);
    setIsIdeasModalOpen(true);
  };

  const handleCloseIdeasModal = () => {
    setIsIdeasModalOpen(false);
  };

  const handleStartGame = () => {
    if (activeTeam) {
      if (activeTeam.current_level >= 3) {
        router.replace("/level3");
      } else if (activeTeam.current_level >= 2) {
        router.replace("/level2");
      } else {
        setIsRound1ModalOpen(true);
      }
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleTeamVerified = (team: Team) => {
    setActiveTeam(team);
    localStorage.setItem(SESSION_STORAGE_KEY, team.team_code);
    if (team.current_level >= 3) {
      router.replace("/level3");
    } else if (team.current_level >= 2) {
      router.replace("/level2");
    } else {
      setIsRound1ModalOpen(true);
    }
  };

  const handleLogoutTeam = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setActiveTeam(null);
    setIsRound1ModalOpen(false);
    setStatusNotification("LOGGED OUT // ENTER TEAM CODE TO RESUME ANYTIME");
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleProgressToLevel2 = () => {
    setIsRound1ModalOpen(false);
    setStatusNotification("LEVEL 01 CLEARED // REDIRECTING TO ROUND 02: CODE ARENA");
    if (activeTeam && activeTeam.current_level >= 3) {
      router.replace("/level3");
    } else {
      router.replace("/level2");
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-[#f4f4f5] flex flex-col font-mono selection:bg-[#ff5500] selection:text-white relative">
      {/* Level Progression Notification Banner */}
      {statusNotification && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-top-4 duration-300">
          <div className="p-4 bg-[#ff5500] text-black font-black text-xs uppercase tracking-wider shadow-[6px_6px_0px_0px_#ffffff] flex items-center justify-between gap-3">
            <span>{statusNotification}</span>
            <button
              type="button"
              onClick={() => setStatusNotification(null)}
              className="font-bold underline text-[11px] cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Top HUD Navigation Bar */}
      <Navbar 
        onOpenIdeasModal={() => handleOpenIdeasModal(1)} 
        onStartGame={handleStartGame}
        activeTeamName={activeTeam ? activeTeam.team_name : undefined}
        activeTeamTimer={activeTeam?.started_at && activeTeamElapsed > 0 ? formatDuration(activeTeamElapsed) : undefined}
        activeTeamMasterCode={activeTeam?.master_code}
        activeTeamLevel={activeTeam?.current_level}
      />

      {/* Persistent HUD Footer when team session is active and modal is closed */}
      {activeTeam && !isRound1ModalOpen && (
        <aside 
          aria-label="Active Team Session HUD"
          className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-5xl px-1 sm:px-2 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
        >
          <div className="bg-[#09090d]/95 border-2 border-[#ff5500] backdrop-blur-md shadow-[6px_6px_0px_0px_#ffffff] p-3 sm:p-3.5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 text-xs font-mono">
            {/* Top Row on mobile/tablet / Left section on Desktop */}
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 sm:gap-4 shrink-0 min-w-0">
              {/* Team Identity */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                  {activeTeam.started_at && (
                    <span className="absolute w-4 h-4 bg-emerald-400/40 rounded-full animate-ping" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white uppercase tracking-wider text-xs sm:text-sm whitespace-nowrap">
                    {activeTeam.team_name}
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/50 text-[10px] font-black tracking-wider shrink-0">
                    TIER 0{activeTeam.current_level}
                  </span>
                </div>
              </div>

              {/* Vertical Divider (tablet & desktop) */}
              <div className="hidden sm:block h-5 w-px bg-neutral-800 shrink-0" />

              {/* Mission Clock */}
              {activeTeam.started_at ? (
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-neutral-300 shrink-0">
                  <Timer weight="bold" className="size-3.5 text-[#ff5500]" />
                  <span className="text-[#ff5500] font-black text-xs font-mono tracking-wider">
                    {formatDuration(activeTeamElapsed)}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold uppercase tracking-wider">
                    RUNNING
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-amber-400 flex items-center gap-1.5 font-bold shrink-0">
                  <Timer weight="bold" className="size-3.5 text-amber-400" />
                  <span>CLOCK: STANDBY</span>
                </div>
              )}
            </div>

            {/* Bottom Row on tablet / Middle & Right sections on Desktop */}
            <div className="flex flex-wrap items-center justify-between xl:justify-end gap-3 shrink-0 pt-2.5 xl:pt-0 border-t border-neutral-800/80 xl:border-t-0">
              {/* Master Key HUD */}
              {activeTeam.master_code && (
                <div className="shrink-0">
                  <MasterKeyHud
                    masterCode={activeTeam.master_code}
                    unlockedCount={activeTeam.current_level >= 4 ? 6 : activeTeam.current_level >= 3 ? 3 : 1}
                    size="sm"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 ml-auto xl:ml-0">
                {/* Current Stage Primary Action Button */}
                {activeTeam.current_level >= 3 ? (
                  <Link
                    href="/level3"
                    className="px-3.5 py-2 bg-[#ff5500] hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] flex items-center gap-1.5 whitespace-nowrap active:translate-y-0.5"
                  >
                    <Code weight="bold" className="size-3.5" />
                    <span>ROUND 3 ARENA</span>
                  </Link>
                ) : activeTeam.current_level >= 2 ? (
                  <Link
                    href="/level2"
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] flex items-center gap-1.5 whitespace-nowrap active:translate-y-0.5"
                  >
                    <Code weight="bold" className="size-3.5" />
                    <span>ROUND 2 ARENA</span>
                  </Link>
                ) : null}

                {/* Only allow opening Level 1 Terminal if team is currently at Level 1 */}
                {activeTeam.current_level < 2 && (
                  <button
                    type="button"
                    onClick={() => setIsRound1ModalOpen(true)}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold uppercase text-xs tracking-wider border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    title="Open Level 1 Terminal"
                  >
                    <Play weight="bold" className="size-3.5 text-[#ff5500]" />
                    <span>TERMINAL</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Hero Section: Full Screen, Huge Typography "CRACK THE LOCK", ASTHRA 11.0 */}
      <HeroSection 
        onOpenIdeasModal={() => handleOpenIdeasModal(1)} 
        onStartGame={handleStartGame}
      />

      {/* 4 Rounds Showcase */}
      <RoundsSection onOpenIdeasModal={handleOpenIdeasModal} />

      {/* Rules & Regulations Section: 10 points structured brutalist grid */}
      <RulesSection />

      {/* Organising Team & Coordinators */}
      <CoordinatorsSection />

      {/* Footer */}
      <Footer />

      {/* Ideas Submission Modal */}
      <IdeaSubmissionModal
        isOpen={isIdeasModalOpen}
        initialRound={selectedRoundForModal}
        onClose={handleCloseIdeasModal}
      />

      {/* Step 1: Gateway Authentication Modal (Team Code Entry) */}
      <GameAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onTeamVerified={handleTeamVerified}
      />

      {/* Step 2: Round 1 Verification Modal (Answers & 10-Digit Master Key Generation) */}
      <Round1Modal
        isOpen={isRound1ModalOpen}
        team={activeTeam}
        onClose={() => setIsRound1ModalOpen(false)}
        onProgressToLevel2={handleProgressToLevel2}
        onTeamUpdated={(updatedTeam) => setActiveTeam(updatedTeam)}
      />
    </main>
  );
}

