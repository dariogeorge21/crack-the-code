"use client";

import React, { useState } from "react";
import {
  Lightbulb,
  X,
  Sparkle,
  Warning,
  Eye,
  Check
} from "@phosphor-icons/react";

interface CTFHintsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile: string;
}

interface StageHint {
  file: string;
  stageName: string;
  hint1: string;
  hint2: string;
}

const HINTS_DATA: Record<string, StageHint> = {
  "photo.jpg": {
    file: "photo.jpg",
    stageName: "Stage 01: Photo Metadata",
    hint1: "Have you checked the properties of the image?",
    hint2: "Check the metadata tags (Artist, Description, Title) or try an EXIF parser.",
  },
  "meeting.png": {
    file: "meeting.png",
    stageName: "Stage 02: Meeting Steganography",
    hint1: "There is data hidden in the image.",
    hint2: "Look at the suspicious-looking text. It appears to be Base64 encoded in the image bitplane.",
  },
  "report.docx": {
    file: "report.docx",
    stageName: "Stage 03: Document Archive",
    hint1: "What type of file is DOCX?",
    hint2: "Try treating it as a ZIP archive. Unzip the structure and look for custom XML folders.",
  },
  "notes.pdf": {
    file: "notes.pdf",
    stageName: "Stage 04: Research Notes PDF",
    hint1: "The PDF may contain more text than you can see.",
    hint2: "Try selecting everything in the PDF. Look for white-on-white text or inspect the raw stream.",
  },
  "evidence.png": {
    file: "evidence.png",
    stageName: "Stage 05: Evidence Desktop",
    hint1: "Look carefully at the image.",
    hint2: "Some things are easier for a camera or scanner to read than your eyes. Look for an optical QR barcode.",
  },
};

export function CTFHintsModal({ isOpen, onClose, activeFile }: CTFHintsModalProps) {
  const [revealedHints, setRevealedHints] = useState<Record<string, { h1: boolean; h2: boolean }>>({
    "photo.jpg": { h1: false, h2: false },
    "meeting.png": { h1: false, h2: false },
    "report.docx": { h1: false, h2: false },
    "notes.pdf": { h1: false, h2: false },
    "evidence.png": { h1: false, h2: false },
  });

  if (!isOpen) return null;

  const currentHint = HINTS_DATA[activeFile] || HINTS_DATA["photo.jpg"];
  const status = revealedHints[currentHint.file] || { h1: false, h2: false };

  const revealH1 = () => {
    setRevealedHints((prev) => ({
      ...prev,
      [currentHint.file]: { ...prev[currentHint.file], h1: true },
    }));
  };

  const revealH2 = () => {
    setRevealedHints((prev) => ({
      ...prev,
      [currentHint.file]: { ...prev[currentHint.file], h2: true },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#09090e] border-2 border-amber-400 shadow-[8px_8px_0px_0px_#ffffff] p-5 font-mono text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Lightbulb weight="fill" className="size-5 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
              TACTICAL INTEL // HINT SYSTEM
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X weight="bold" className="size-4" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-xs font-bold text-white uppercase">{currentHint.stageName}</div>
          <div className="text-[10px] text-neutral-400">Target File: {currentHint.file}</div>
        </div>

        {/* Hint 1 */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400">HINT LEVEL 01 (GENERAL DIRECTION)</span>
            {!status.h1 ? (
              <button
                type="button"
                onClick={revealH1}
                className="px-2 py-0.5 bg-amber-400 text-black font-bold uppercase text-[9px] cursor-pointer"
              >
                UNLOCK HINT 1
              </button>
            ) : (
              <span className="text-[9px] text-emerald-400 font-bold">UNLOCKED</span>
            )}
          </div>
          <p className="text-xs text-neutral-200">
            {status.h1 ? currentHint.hint1 : "Locked. Click unlock to view directional clue."}
          </p>
        </div>

        {/* Hint 2 */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400">HINT LEVEL 02 (TECHNICAL DETAIL)</span>
            {!status.h2 ? (
              <button
                type="button"
                onClick={revealH2}
                disabled={!status.h1}
                className="px-2 py-0.5 bg-red-500 disabled:opacity-50 text-white font-bold uppercase text-[9px] cursor-pointer"
              >
                UNLOCK HINT 2
              </button>
            ) : (
              <span className="text-[9px] text-emerald-400 font-bold">UNLOCKED</span>
            )}
          </div>
          <p className="text-xs text-neutral-200">
            {status.h2 ? currentHint.hint2 : "Locked. Requires Hint 1 unlocked first."}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-white text-white hover:text-black font-bold uppercase text-xs tracking-wider transition-colors cursor-pointer"
          >
            CLOSE INTEL
          </button>
        </div>
      </div>
    </div>
  );
}
