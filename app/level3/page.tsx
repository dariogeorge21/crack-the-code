"use client";

import React from "react";
import {
  AirportProblemPane,
  LeetCodeEditorPane,
  LeetCodeOutputDrawer,
} from "@/components/arena";
import { Round3UnlockModal } from "@/components/modals";
import {
  Level3LoadingScreen,
  Level3LockoutScreen,
  Level3Header,
  Level3MobileHud,
  Level3ClearedBanner,
  Level3SplitPane,
  useLevel3Auth,
  useLevel3Compiler,
} from "@/components/level3";
import { useMissionTimer, usePreventBack } from "@/hooks";

export default function Level3Page() {
  // Trap back navigation in the active arena
  usePreventBack();

  // Team authentication & access control
  const { isLoadingAuth, activeTeam, isLocked, lockReason, setActiveTeam } =
    useLevel3Auth();

  // Mission timer state (anchored to team.started_at)
  const elapsedSeconds = useMissionTimer(activeTeam?.started_at);

  // Compiler, execution, and master key unlock states
  const {
    language,
    activeCode,
    handleLanguageChange,
    handleCodeChange,
    isRunning,
    isDrawerOpen,
    setIsDrawerOpen,
    toggleDrawer,
    executionResult,
    outputHeight,
    setOutputHeight,
    clearedBanner,
    setClearedBanner,
    revealedDigits,
    isUnlockModalOpen,
    setIsUnlockModalOpen,
    isKeyHighlighted,
    isKeyRevealedInHeader,
    handleRunCode,
    handleClaimClearance,
    handleModalSettled,
    handleModalComplete,
  } = useLevel3Compiler({ activeTeam, setActiveTeam });

  // 1. Loading screen during biometric / session verification
  if (isLoadingAuth) {
    return <Level3LoadingScreen />;
  }

  // 2. Access denied / lockout screen if not authorized
  if (isLocked || !activeTeam) {
    return <Level3LockoutScreen lockReason={lockReason} />;
  }

  // 3. Authorized Level 3 Arena Interface
  return (
    <div className="h-screen w-screen bg-[#07070a] text-white flex flex-col overflow-hidden font-mono select-none">
      {/* Top Cyber Navigation Bar */}
      <Level3Header
        teamName={activeTeam.team_name}
        currentLevel={activeTeam.current_level}
        masterCode={activeTeam.master_code}
        elapsedSeconds={elapsedSeconds}
        isKeyRevealedInHeader={isKeyRevealedInHeader}
        isKeyHighlighted={isKeyHighlighted}
      />

      {/* Mobile Master Key Bar (< sm screens) */}
      <Level3MobileHud
        masterCode={activeTeam.master_code}
        currentLevel={activeTeam.current_level}
        isKeyRevealedInHeader={isKeyRevealedInHeader}
        isKeyHighlighted={isKeyHighlighted}
      />

      {/* Clearance Success Toast Banner */}
      {clearedBanner && (
        <Level3ClearedBanner
          onViewKeys={() => setIsUnlockModalOpen(true)}
          onDismiss={() => setClearedBanner(false)}
        />
      )}

      {/* Main Split Layout: Left Problem Statement, Right Editor */}
      <Level3SplitPane
        leftPane={<AirportProblemPane round={3} />}
        rightPane={
          <LeetCodeEditorPane
            language={language}
            onLanguageChange={handleLanguageChange}
            code={activeCode}
            onCodeChange={handleCodeChange}
            onRun={handleRunCode}
            isRunning={isRunning}
            isDrawerOpen={isDrawerOpen}
            onToggleDrawer={toggleDrawer}
          />
        }
      />

      {/* Full-Width Resizable Output Bar */}
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
            onResize={setOutputHeight}
            round={3}
          />
        </div>
      )}

      {/* Round 3 Unlock Celebration Modal */}
      <Round3UnlockModal
        isOpen={isUnlockModalOpen}
        digits={revealedDigits || ["8", "4", "2"]}
        maskedMasterCode={activeTeam.master_code || "763842****"}
        onComplete={handleModalComplete}
        onSettled={handleModalSettled}
      />
    </div>
  );
}
