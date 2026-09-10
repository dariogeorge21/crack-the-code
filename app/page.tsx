"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar, Footer, MasterKeyHud } from "@/components/layout";
import { HeroSection, RoundsSection, RulesSection, CoordinatorsSection } from "@/components/sections";
import { IdeaSubmissionModal, GameAuthModal, Round1Modal } from "@/components/modals";
import { Team } from "@/lib/supabase";
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
  const [activeTeamElapsed, setActiveTeamElapsed] = useState<number>(0);
  useEffect(() => {
    if (!activeTeam?.started_at) {
      setActiveTeamElapsed(0);
      return;
    }

    const startTime = new Date(activeTeam.started_at).getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setActiveTeamElapsed(diff);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeTeam?.started_at]);

  const formatElapsed = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins < 10 ? "0" : ""}${remMins}m ${secs < 10 ? "0" : ""}${secs}s`;
    }
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Restore saved participant session on mount
  useEffect(() => {
    const savedCode = localStorage.getItem("crack_the_lock_session_code");
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
            setStatusNotification(
              `SESSION RESTORED // ${data.team.team_name} (TIER 0${data.team.current_level})`
            );
            setTimeout(() => setStatusNotification(null), 5000);
          } else {
            localStorage.removeItem("crack_the_lock_session_code");
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleOpenIdeasModal = (roundNum: number = 1) => {
    setSelectedRoundForModal(roundNum);
    setIsIdeasModalOpen(true);
  };

  const handleCloseIdeasModal = () => {
    setIsIdeasModalOpen(false);
  };

  const handleStartGame = () => {
    if (activeTeam) {
      // Team already in session -> resume directly from where they left off
      setIsRound1ModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleTeamVerified = (team: Team) => {
    setActiveTeam(team);
    localStorage.setItem("crack_the_lock_session_code", team.team_code);
    setIsRound1ModalOpen(true);
  };

  const handleLogoutTeam = () => {
    localStorage.removeItem("crack_the_lock_session_code");
    setActiveTeam(null);
    setIsRound1ModalOpen(false);
    setStatusNotification("LOGGED OUT // ENTER TEAM CODE TO RESUME ANYTIME");
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleProgressToLevel2 = () => {
    setIsRound1ModalOpen(false);
    setStatusNotification("LEVEL 01 CLEARED // REDIRECTING TO ROUND 02: CODE ARENA");
    router.push("/level2");
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
        activeTeamTimer={activeTeam?.started_at && activeTeamElapsed > 0 ? formatElapsed(activeTeamElapsed) : undefined}
        activeTeamMasterCode={activeTeam?.master_code}
        activeTeamLevel={activeTeam?.current_level}
      />

      {/* Persistent HUD Footer when team session is active and modal is closed */}
      {activeTeam && !isRound1ModalOpen && (
        <aside 
          aria-label="Active Team Session HUD"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-4 duration-300"
        >
          <div className="bg-[#0b0b0e]/95 border-2 border-[#ff5500] backdrop-blur-md shadow-[6px_6px_0px_0px_#ffffff] p-3.5 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              {activeTeam.started_at ? (
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
              ) : (
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full shrink-0" />
              )}
              <div>
                <div className="font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>{activeTeam.team_name}</span>
                  <span className="px-1.5 py-0.2 bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/50 text-[10px]">
                    TIER 0{activeTeam.current_level}
                  </span>
                </div>
                {activeTeam.started_at ? (
                  <div className="text-[11px] text-neutral-300 flex items-center gap-1.5 mt-0.5">
                    <Timer weight="bold" className="size-3.5 text-[#ff5500]" />
                    <span className="text-neutral-400">MISSION CLOCK:</span>
                    <span className="text-[#ff5500] font-black text-xs font-mono">
                      {formatElapsed(activeTeamElapsed)}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold uppercase tracking-wider">
                      RUNNING
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-400 flex items-center gap-1.5 mt-0.5 font-bold">
                    <Timer weight="bold" className="size-3.5 text-amber-400" />
                    <span>MISSION CLOCK: STANDBY</span>
                    <span className="text-[9px] text-neutral-400 font-normal">(STARTS ON KEY GEN)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Master Key HUD in Bottom Session Bar */}
            {activeTeam.master_code && (
              <MasterKeyHud
                masterCode={activeTeam.master_code}
                unlockedCount={activeTeam.current_level >= 3 ? 3 : 1}
                size="sm"
                className="hidden lg:flex"
              />
            )}

            <div className="flex items-center gap-2">
              {activeTeam.current_level >= 2 && (
                <Link
                  href="/level2"
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff] flex items-center gap-1.5"
                >
                  <Code weight="bold" className="size-3" />
                  <span>ROUND 2 ARENA</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => setIsRound1ModalOpen(true)}
                className="px-3.5 py-2 bg-[#ff5500] hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff] flex items-center gap-1.5"
              >
                <Play weight="bold" className="size-3" />
                <span>TERMINAL</span>
              </button>
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

