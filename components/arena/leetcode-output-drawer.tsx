"use client";

import React, { useState, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  Warning,
  CaretUp,
  CaretDown,
  X,
  Clock,
  Cpu,
  Terminal,
  ShieldCheck,
  Lightning,
  ArrowRight,
} from "@phosphor-icons/react";

import { ExecutionResult } from "@/types";

export type { ExecutionResult };

interface LeetCodeOutputDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  result: ExecutionResult | null;
  onAdvanceToNextRound?: () => void;
  currentHeight?: number;
  onResize?: (height: number) => void;
  isDocked?: boolean;
  round?: number;
}

export function LeetCodeOutputDrawer({
  isOpen,
  onClose,
  isRunning,
  result,
  onAdvanceToNextRound,
  currentHeight = 280,
  onResize,
  isDocked = true,
  round = 2,
}: LeetCodeOutputDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(currentHeight);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = currentHeight;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !onResize) return;
    const deltaY = startYRef.current - e.clientY; // Dragging UP increases height
    const minHeight = 120;
    const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.75 : 600;
    const newHeight = Math.min(
      Math.max(startHeightRef.current + deltaY, minHeight),
      maxHeight
    );
    onResize(newHeight);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleToggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (onResize) {
      if (nextState) {
        onResize(Math.floor(window.innerHeight * 0.65));
      } else {
        onResize(280);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`w-full h-full bg-[#0c0c11] border-t-2 border-[#ff5500] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] font-mono flex flex-col relative overflow-hidden select-none ${
        isDragging ? "select-none" : ""
      }`}
    >
      {/* Resizable Top Handle Bar */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`h-2.5 w-full bg-[#121218] hover:bg-[#ff5500] active:bg-[#ff5500] cursor-row-resize flex items-center justify-center transition-colors select-none group shrink-0 border-b border-neutral-800 relative z-10 ${
          isDragging ? "bg-[#ff5500]!" : ""
        }`}
        title="Drag up or down to resize console output"
      >
        {/* Cyber Grab Bar */}
        <div className="w-14 h-1 rounded-full bg-neutral-600 group-hover:bg-black group-active:bg-black transition-colors" />
      </div>

      {/* Drawer Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#121218] border-b border-neutral-800 select-none shrink-0">
        {/* Left: Execution Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {isRunning ? (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-400 font-bold">
                <Lightning weight="fill" className="size-3.5 animate-spin" />
                <span>COMPILING & EXECUTING...</span>
              </div>
            ) : result ? (
              result.isCorrect ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500 text-emerald-400 font-black">
                  <CheckCircle weight="fill" className="size-4 text-emerald-400" />
                  <span>
                    {round === 2
                      ? "ACCEPTED // DIAMOND PATTERN VERIFIED"
                      : "ACCEPTED // ACCESS CODE VERIFIED"}
                  </span>
                </div>
              ) : result.exitCode !== 0 || result.error ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950 border border-red-500/70 text-red-400 font-bold">
                  <XCircle weight="fill" className="size-4" />
                  <span>RUNTIME / COMPILATION ERROR</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950 border border-amber-500/60 text-amber-400 font-bold">
                  <Warning weight="fill" className="size-4" />
                  <span>WRONG ANSWER // OUTPUT VERIFICATION FAILED</span>
                </div>
              )
            ) : (
              <span className="text-neutral-400 font-bold">EXECUTION CONSOLE</span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 border-l border-neutral-800 pl-3">
            <span className="px-2.5 py-1 text-xs uppercase tracking-wider font-bold text-white bg-neutral-800 border-b-2 border-[#ff5500]">
              Terminal Output
            </span>
          </div>
        </div>

        {/* Right: Metrics & Controls */}
        <div className="flex items-center gap-3">
          {result && !isRunning && (
            <div className="hidden md:flex items-center gap-3 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Clock weight="bold" className="size-3 text-[#ff5500]" />
                <span>{result.time}</span>
              </span>
              <span className="flex items-center gap-1">
                <Cpu weight="bold" className="size-3 text-[#ff5500]" />
                <span>{result.memory}</span>
              </span>
              <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400">
                {result.source}
              </span>
            </div>
          )}

          {/* Expand / Minimize Toggle */}
          <button
            type="button"
            onClick={handleToggleExpand}
            title={isExpanded ? "Collapse height" : "Expand height"}
            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <CaretDown weight="bold" className="size-4" />
            ) : (
              <CaretUp weight="bold" className="size-4" />
            )}
          </button>

          {/* Close Drawer */}
          <button
            type="button"
            onClick={onClose}
            title="Close console drawer"
            className="p-1 hover:bg-red-950 hover:text-red-400 text-neutral-400 transition-colors cursor-pointer"
          >
            <X weight="bold" className="size-4" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#08080b] select-text">
        {isRunning ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Lightning weight="fill" className="size-8 text-[#ff5500] animate-bounce" />
            <div className="text-xs uppercase tracking-widest font-bold text-white">
              DISPATCHING COMPILATION JOB...
            </div>
            <div className="text-[11px] text-neutral-500">
              {round === 2
                ? "Validating diamond matrix geometry & star pattern symmetry"
                : "Simulating Cochin International Airport security line events"}
            </div>
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {result?.isCorrect && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/60 text-emerald-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck weight="bold" className="size-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold uppercase text-white">
                      {round === 2
                        ? "DIAMOND MATRIX VERIFIED // OPTICAL LATTICE ALIGNED"
                        : "CHALLENGE SOLVED // ACCESS CODE UNLOCKED"}
                    </span>
                    <p className="text-[11px] text-emerald-400/90 mt-0.5">
                      {round === 2
                        ? "The diamond star pattern matches Central Command's geometric symmetry specifications."
                        : "The queue state simulation matches the Cochin Airport security requirements."}
                    </p>
                  </div>
                </div>
                {onAdvanceToNextRound && (
                  <button
                    type="button"
                    onClick={onAdvanceToNextRound}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_#ffffff] shrink-0"
                  >
                    <span>CLAIM CLEARANCE</span>
                    <ArrowRight weight="bold" className="size-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Standard Output Console */}
            <div>
              <div className="flex items-center gap-1 text-[11px] text-neutral-500 uppercase font-bold mb-1">
                <Terminal weight="bold" className="size-3" />
                <span>Standard Output (stdout):</span>
              </div>
              <pre className="p-3 bg-black border border-neutral-800 text-neutral-200 overflow-x-auto whitespace-pre font-mono text-xs leading-5">
                {result?.output ? result.output : <span className="text-neutral-600">[No output produced]</span>}
              </pre>
            </div>

            {/* Standard Error / Compilation Errors */}
            {result?.error && (
              <div>
                <div className="flex items-center gap-1 text-[11px] text-red-400 uppercase font-bold mb-1">
                  <Warning weight="bold" className="size-3" />
                  <span>Errors / Warnings (stderr):</span>
                </div>
                <pre className="p-3 bg-red-950/30 border border-red-900/60 text-red-300 overflow-x-auto whitespace-pre font-mono text-xs leading-5">
                  {result.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeetCodeOutputDrawer;
