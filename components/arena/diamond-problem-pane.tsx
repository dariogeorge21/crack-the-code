"use client";

import React from "react";
import {
  TerminalWindow,
  Diamond,
  Lightning,
  Code,
  CheckCircle,
  Sparkle,
} from "@phosphor-icons/react";

interface DiamondProblemPaneProps {
  round?: number;
}

export function DiamondProblemPane({ round = 2 }: DiamondProblemPaneProps = {}) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0d] border border-neutral-800 text-neutral-300 font-sans select-text overflow-hidden">
      {/* Problem Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0d0d12] px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900/60 border border-neutral-800 text-[#ff5500] text-xs font-mono font-bold tracking-wider uppercase">
          <TerminalWindow weight="bold" className="size-3.5" />
          <span>Description</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#ff5500]/10 text-[#ff5500] border border-[#ff5500]/30">
            ROUND 0{round}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            DSA // PATTERN
          </span>
        </div>
      </div>

      {/* Main Content with custom scrollbar */}
      <div className="flex-1 overflow-y-auto p-5 text-sm space-y-5 scrollbar-thin scrollbar-thumb-neutral-700 font-mono">
        {/* Title & Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#ff5500]">PROBLEM 0{round} //</span>
            <span className="text-xs text-neutral-500 uppercase">
              OPTICAL LATTICE CALIBRATION
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Diamond weight="fill" className="size-5 text-[#ff5500]" />
            <span>DIAMOND STAR PATTERN</span>
          </h1>
        </div>

        {/* Mission Directive */}
        <div className="p-3.5 bg-neutral-900/80 border border-neutral-800">
          <div className="flex items-start gap-2.5">
            <Lightning weight="fill" className="size-4 text-[#ff5500] shrink-0 mt-0.5" />
            <p className="text-neutral-300 text-xs leading-relaxed font-sans">
              Write a program in <strong className="text-white">Python</strong>, <strong className="text-white">C</strong>, <strong className="text-white">C++</strong>, or <strong className="text-white">Java</strong> that prints a symmetrical diamond pattern of stars (<code className="text-[#ff5500] font-mono">*</code>) for <code className="text-white font-mono font-bold">n = 5</code>.
            </p>
          </div>
        </div>

        {/* Recommended Pattern (Solid Diamond) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
              <CheckCircle weight="fill" className="size-4 text-emerald-400" />
              <span>Recommended Pattern</span>
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              Recommended
            </span>
          </div>

          <div className="p-4 bg-black border border-neutral-800">
            <pre className="text-[#ff5500] font-mono text-xs sm:text-sm leading-5 select-all">
{`    *
   ***
  *****
 *******
*********
 *******
  *****
   ***
    *`}
            </pre>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans">
            Standard solid matrix: odd count of stars per line (1, 3, 5, 7, 9, 7, 5, 3, 1) symmetrically centered with leading spaces.
          </p>
        </div>

        {/* Acceptable Alternative Patterns */}
        <div className="space-y-2.5 pt-3 border-t border-neutral-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
              <Sparkle weight="bold" className="size-4 text-cyan-400" />
              <span>Acceptable Patterns</span>
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
              Also Accepted
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans">
            The automated validation engine also grants clearance for either of these symmetrical formats:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Spaced Diamond */}
            <div className="p-3 bg-[#0a0a0f] border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-neutral-200 uppercase">Spaced Stars</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-neutral-900 text-cyan-400 border border-neutral-700 font-mono">Format 01</span>
              </div>
              <pre className="text-neutral-300 font-mono text-[11px] leading-4 select-all bg-black/60 p-2.5 border border-neutral-900">
{`    *
   * *
  * * *
 * * * *
* * * * *
 * * * *
  * * *
   * *
    *`}
              </pre>
              <span className="text-[10px] text-neutral-500 mt-2 font-sans">
                Stars separated by single spaces (1 to 5 to 1 stars).
              </span>
            </div>

            {/* Hollow Diamond */}
            <div className="p-3 bg-[#0a0a0f] border border-neutral-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-neutral-200 uppercase">Hollow Diamond</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-neutral-900 text-cyan-400 border border-neutral-700 font-mono">Format 02</span>
              </div>
              <pre className="text-neutral-300 font-mono text-[11px] leading-4 select-all bg-black/60 p-2.5 border border-neutral-900">
{`    *
   * *
  *   *
 *     *
*       *
 *     *
  *   *
   * *
    *`}
              </pre>
              <span className="text-[10px] text-neutral-500 mt-2 font-sans">
                Perimeter stars only with hollow interior.
              </span>
            </div>
          </div>
        </div>

        {/* Input & Output Specifications */}
        <div className="p-3 bg-[#0c0c11] border border-neutral-800 text-xs space-y-1 text-neutral-400 font-mono">
          <div>
            <span className="text-neutral-500 font-bold">Input:</span>{" "}
            <code className="text-neutral-300">n = 5</code> (hardcoded or read from stdin)
          </div>
          <div>
            <span className="text-neutral-500 font-bold">Output:</span>{" "}
            <span className="text-neutral-300">Symmetrical 9-line diamond star pattern</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiamondProblemPane;
