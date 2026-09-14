"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  DiamondProblemPane,
  LeetCodeEditorPane,
  LeetCodeOutputDrawer,
} from "@/components/arena";
import { KeyUnlockAnimationModal } from "@/components/modals";
import {
  Level2LoadingScreen,
  Level2LockoutScreen,
  Level2Header,
  Level2MobileHud,
  Level2ClearedBanner,
  Level2SplitPane,
  useLevel2Auth,
  useLevel2Compiler,
} from "@/components/level2";
import { useMissionTimer, usePreventBack } from "@/hooks";

export default function Level2Page() {
  const router = useRouter();

  // Trap back navigation in the active arena
  usePreventBack();

  // Team authentication & access control
  const { isLoadingAuth, activeTeam, isLocked, lockReason, setActiveTeam } =
    useLevel2Auth();

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
    isKeyHighlighted,
    isKeyRevealedInHeader,
    handleRunCode,
    handleClaimClearance,
    handleModalSettled,
    handleModalComplete,
  } = useLevel2Compiler({ activeTeam, setActiveTeam });

  // 1. Loading screen during biometric / session verification
  if (isLoadingAuth) {
    return <Level2LoadingScreen />;
  }

  // 2. Access denied / lockout screen if not authorized
  if (isLocked || !activeTeam) {
    return <Level2LockoutScreen lockReason={lockReason} />;
  }

  // 3. Authorized Level 2 Arena Interface
  return (
    <div className="h-screen bg-[#07070a] text-white font-mono flex flex-col overflow-hidden select-none">
      {/* Top Cyber Navigation Bar */}
      <Level2Header
        teamName={activeTeam.team_name}
        currentLevel={activeTeam.current_level}
        masterCode={activeTeam.master_code}
        elapsedSeconds={elapsedSeconds}
        isKeyRevealedInHeader={isKeyRevealedInHeader}
        isKeyHighlighted={isKeyHighlighted}
      />

      {/* Mobile Master Key Bar (< sm screens) */}
      <Level2MobileHud
        masterCode={activeTeam.master_code}
        currentLevel={activeTeam.current_level}
        isKeyRevealedInHeader={isKeyRevealedInHeader}
        isKeyHighlighted={isKeyHighlighted}
      />

      {/* Clearance Success Toast Banner */}
      {clearedBanner && (
        <Level2ClearedBanner
          onAdvance={() => router.replace("/level3")}
          onDismiss={() => setClearedBanner(false)}
        />
      )}

      {/* Main Split Layout: Left Problem Statement, Right Editor */}
      <Level2SplitPane
        leftPane={<DiamondProblemPane round={2} />}
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
          onSettled={handleModalSettled}
          onComplete={handleModalComplete}
        />
      )}
    </div>
  );
}
