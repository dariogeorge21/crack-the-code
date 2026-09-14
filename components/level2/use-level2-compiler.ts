"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Team, SupportedLanguage, ExecutionResult } from "@/types";
import { STARTER_CODES } from "@/constants";

interface UseLevel2CompilerProps {
  activeTeam: Team | null;
  setActiveTeam: React.Dispatch<React.SetStateAction<Team | null>>;
}

export function useLevel2Compiler({
  activeTeam,
  setActiveTeam,
}: UseLevel2CompilerProps) {
  const router = useRouter();

  // Code Editor state with automatic per-language switching
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [codeMap, setCodeMap] = useState<Record<SupportedLanguage, string>>({
    python: STARTER_CODES.python,
    c: STARTER_CODES.c,
    cpp: STARTER_CODES.cpp,
    java: STARTER_CODES.java,
  });

  const activeCode = codeMap[language] ?? STARTER_CODES[language];

  const handleLanguageChange = useCallback((newLang: SupportedLanguage) => {
    setLanguage(newLang);
  }, []);

  const handleCodeChange = useCallback((newCode: string) => {
    setCodeMap((prev) => ({
      ...prev,
      [language]: newCode,
    }));
  }, [language]);

  // Execution & Output Drawer state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [outputHeight, setOutputHeight] = useState<number>(280);

  // Completion notification modal / banner & Key Unlock animation
  const [clearedBanner, setClearedBanner] = useState<boolean>(false);
  const [revealedDigits, setRevealedDigits] = useState<[string, string] | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [isKeyHighlighted, setIsKeyHighlighted] = useState<boolean>(false);
  const [isKeySettled, setIsKeySettled] = useState<boolean>(false);

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
  }, [isRunning, language, codeMap, activeTeam, setActiveTeam]);

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
  }, [activeTeam, revealedDigits, setActiveTeam]);

  const handleModalSettled = useCallback(() => {
    setIsKeySettled(true);
    setIsKeyHighlighted(true);
  }, []);

  const handleModalComplete = useCallback(() => {
    setIsUnlockModalOpen(false);
    setIsKeySettled(true);
    setIsKeyHighlighted(true);
    router.replace("/level3");
  }, [router]);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const isKeyRevealedInHeader = Boolean(
    (activeTeam && activeTeam.current_level >= 3 && !isUnlockModalOpen) ||
    isKeySettled
  );

  return {
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
    isKeySettled,
    isKeyRevealedInHeader,
    handleRunCode,
    handleClaimClearance,
    handleModalSettled,
    handleModalComplete,
  };
}

