"use client";

import { useState, useEffect } from "react";
import { Team } from "@/types";
import { useMissionTimer } from "@/hooks";
import { formatTimer } from "@/lib/time";
import { isRound1PairValid, normalizeRound1Input } from "@/constants";
import { 
  CheckCircle, 
  LockOpen, 
  Timer, 
  Sparkle, 
  ArrowRight, 
  X, 
  Warning, 
  Key, 
  Cpu,
  CircleNotch
} from "@phosphor-icons/react";

interface Round1ModalProps {
  isOpen: boolean;
  team: Team | null;
  onClose: () => void;
  onProgressToLevel2: () => void;
  onTeamUpdated?: (team: Team) => void;
}

export function Round1Modal({
  isOpen,
  team,
  onClose,
  onProgressToLevel2,
  onTeamUpdated,
}: Round1ModalProps) {
  const [round1Answer, setRound1Answer] = useState("");
  const [firstDigit, setFirstDigit] = useState("");
  const [generatedMasterCode, setGeneratedMasterCode] = useState<string | null>(
    team?.master_code || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStartTime, setActiveStartTime] = useState<string | null>(team?.started_at || null);

  // Live Timer: runs ONLY when activeStartTime (started_at upon master key generation) exists
  const elapsedSeconds = useMissionTimer(isOpen ? activeStartTime : null);

  // Synchronize team props and session state
  useEffect(() => {
    if (team) {
      setGeneratedMasterCode(team.master_code || (team.current_level >= 2 ? "masked" : null));
      setRound1Answer(team.round1_answer || "");
      setFirstDigit(team.first_digit !== null ? team.first_digit.toString() : "");
      setActiveStartTime(team.started_at || null);
    }
  }, [team]);

  // Listen for admin reset signal
  useEffect(() => {
    if (!isOpen) return;

    const checkReset = async () => {
      try {
        const res = await fetch("/api/game/status");
        const data = await res.json();
        if (data?.lastResetAt && team?.started_at) {
          const resetTime = new Date(data.lastResetAt).getTime();
          const startedTime = new Date(team.started_at).getTime();
          if (resetTime > startedTime) {
            alert("GAME HAS BEEN RESET BY CENTRAL COMMAND // PARTICIPANT SESSION EXPIRED");
            onClose();
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    const interval = setInterval(checkReset, 5000);
    return () => clearInterval(interval);
  }, [isOpen, team?.started_at, onClose]);

  if (!isOpen || !team) return null;

  const handleSubmitRound1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formattedAnswer = normalizeRound1Input(round1Answer);
    const cleanedLetter = firstDigit.replace(/[^a-zA-Z]/g, "").toUpperCase();

    if (!cleanedLetter || !formattedAnswer || !isRound1PairValid(cleanedLetter, formattedAnswer)) {
      setErrorMsg("Invalid answer");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/game/submit-round1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          teamCode: team.team_code,
          round1Answer: formattedAnswer,
          firstDigit: cleanedLetter,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to submit Round 1");
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        setGeneratedMasterCode(data.maskedMasterCode || data.team?.master_code || "masked");
        if (data.team) {
          setActiveStartTime(data.team.started_at);
          onTeamUpdated?.(data.team);
        }
      }
    } catch {
      setErrorMsg("Network error submitting Round 1 verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0b0b0e] border-2 border-[#ff5500] shadow-[10px_10px_0px_0px_#ffffff] rounded-none p-6 sm:p-8 font-mono text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-8 h-8 bg-neutral-900 border border-neutral-700 hover:border-[#ff5500] hover:text-[#ff5500] flex items-center justify-center text-neutral-400 transition-colors"
        >
          <X weight="bold" className="size-4" />
        </button>

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#ff5500] animate-pulse" />
              <h3 className="text-base font-black tracking-widest uppercase text-white">
                {team.team_name}
              </h3>
              <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-[#ff5500] text-[10px] font-bold">
                CODE: {team.team_code}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              TIER 01: PHYSICAL CHALLENGE // VAULT CIPHER DERIVATION
            </div>
          </div>

          {/* Active Live Continuous Timer (Starts only after Master Key is generated) */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-xs font-mono">
            <Timer weight="bold" className="size-4 text-[#ff5500]" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 text-[9px] uppercase tracking-wider">MISSION CLOCK:</span>
                {activeStartTime ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {activeStartTime ? (
                  <>
                    <span className="text-[#ff5500] font-black text-sm">{formatTimer(elapsedSeconds)}</span>
                    <span className="text-[9px] px-1 py-0.2 bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold">
                      LIVE
                    </span>
                  </>
                ) : (
                  <span className="text-amber-400 font-bold text-[10px] tracking-wider">
                    STANDBY (STARTS ON KEY GEN)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 bg-red-950/70 border border-red-500/70 text-red-400 text-xs flex items-center gap-2">
            <Warning weight="bold" className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!generatedMasterCode ? (
          /* Verification Form */
          <form onSubmit={handleSubmitRound1} className="space-y-5">
            <div className="p-3.5 bg-neutral-900/70 border border-neutral-800 text-xs text-neutral-300">
              <span className="text-[#ff5500] font-bold">MISSION PROTOCOL:</span> Solve Round 1 physical challenge in the lab to discover your team&apos;s cipher key. Enter your round answer and first number. <span className="text-[#ff5500] font-bold">Your official competition clock will begin running the moment your Master Key is generated.</span>
            </div>

            {/* Input 1: Answer of First Round (Auto-Caps) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase font-bold text-neutral-300">
                  [1] ANSWER OF FIRST ROUND:
                </label>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  AUTO-CAPS ACTIVE
                </span>
              </div>
              <input
                type="text"
                required
                value={round1Answer}
                onChange={(e) => setRound1Answer(e.target.value.toUpperCase())}
                placeholder="ENTER FIRST ROUND ANSWER..."
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 focus:border-[#ff5500] text-sm font-bold text-white outline-none transition-colors uppercase tracking-wider"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Enter the solution or answer found during the Round 1 physical challenge.
              </span>
            </div>

            {/* Input 2: First Letter of Code (Locked to exactly 1 alphabet character A-Z) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase font-bold text-neutral-300">
                  [2] FIRST LETTER OF CODE:
                </label>
                <span className="text-[10px] text-[#ff5500] font-bold uppercase tracking-wider">
                  LOCKED TO 1 LETTER (A-Z)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="text"
                  pattern="[a-zA-Z]"
                  maxLength={1}
                  required
                  value={firstDigit}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
                    setFirstDigit(cleaned.slice(-1));
                  }}
                  placeholder="K"
                  className="w-24 px-4 py-3 bg-neutral-950 border-2 border-neutral-700 focus:border-[#ff5500] text-2xl font-black text-[#ff5500] text-center outline-none transition-colors font-mono shadow-[2px_2px_0px_0px_#ff5500]"
                />
                <span className="text-xs text-neutral-400 font-mono">
                  &larr; Enter single unlocked letter (A-Z). Master Key will start with this letter.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#ff5500] hover:bg-white text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0px_0px_#ffffff] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              {isSubmitting ? (
                <CircleNotch weight="bold" className="size-4 animate-spin" />
              ) : (
                <Cpu weight="bold" className="size-4" />
              )}
              <span>
                {isSubmitting ? "DERIVING CIPHER..." : "VERIFY & GENERATE MASTER KEY"}
              </span>
            </button>
          </form>
        ) : (
          /* Master Key Generated & Progress Screen */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/70 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle weight="bold" className="size-6 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold uppercase text-white">ROUND 1 COMPLETED & VERIFIED</div>
                <div className="text-[11px] text-neutral-300">
                  Master Vault Key generated successfully starting with letter [{firstDigit || team.first_digit}].
                </div>
              </div>
            </div>

            {/* Master Key Display (Masked with * except first digit) */}
            <div className="p-5 bg-neutral-950 border-2 border-[#ff5500] text-center relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[9px] text-[#ff5500] uppercase font-bold tracking-wider">
                CRYPTOGRAPHIC MASTER KEY // MASKED
              </div>
              <div className="text-xs text-neutral-400 uppercase tracking-widest mb-1">
                10-DIGIT MASTER CODE:
              </div>
              <div className="py-2.5 flex items-center justify-center gap-2 sm:gap-3 whitespace-nowrap flex-nowrap select-none overflow-x-auto">
                <span className="text-[#ff5500] bg-neutral-900 px-3 py-1 border-2 border-[#ff5500] font-black text-2xl sm:text-3xl shrink-0 font-mono shadow-[2px_2px_0px_0px_#ff5500]">
                  {firstDigit || team.first_digit || (generatedMasterCode ? generatedMasterCode[0] : "A")}
                </span>
                <span className="text-neutral-400 font-mono font-black text-2xl sm:text-3xl tracking-[0.2em] sm:tracking-[0.28em] whitespace-nowrap shrink-0">
                  *********
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-2">
                First letter validated: [{firstDigit || team.first_digit}]. Remaining 9 digits are encrypted in the central vault.
              </div>
            </div>

            {/* Submission Telemetry Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-900/80 p-3 border border-neutral-800">
              <div>
                <span className="text-neutral-500 text-[10px] block uppercase">Round 1 Answer:</span>
                <span className="text-white font-bold truncate block">{round1Answer || team.round1_answer}</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block uppercase">Initial Cipher Key:</span>
                <span className="text-[#ff5500] font-bold block">{firstDigit || team.first_digit}</span>
              </div>
            </div>

            {/* Progress to Level 2 Button */}
            <button
              type="button"
              onClick={onProgressToLevel2}
              className="w-full py-4 px-6 bg-[#ff5500] hover:bg-white text-black font-black text-sm tracking-widest uppercase transition-all shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center gap-3 cursor-pointer active:translate-y-0.5"
            >
              <span>PROGRESS TO LEVEL 2</span>
              <ArrowRight weight="bold" className="size-5" />
            </button>
          </div>
        )}

        {/* Session Persistence Indicator */}
        <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>SESSION SAVED // AUTO-SYNCED TO CENTRAL SERVER</span>
          </div>
        </div>
      </div>
    </div>
  );
}
