"use client";

import React, { useState } from "react";
import {
  FilePdf,
  Eye,
  EyeSlash,
  ArrowRight,
  Sparkle,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Cpu
} from "@phosphor-icons/react";

interface PdfForensicPaneProps {
  onSelectNextFile?: (filename: string) => void;
}

export function PdfForensicPane({ onSelectNextFile }: PdfForensicPaneProps) {
  const [filterMode, setFilterMode] = useState<"standard" | "forensic" | "raw">("standard");
  const [hexInput, setHexInput] = useState("435446");
  const [decodedAscii, setDecodedAscii] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDecodeHex = () => {
    try {
      const clean = hexInput.trim();
      let str = "";
      for (let i = 0; i < clean.length; i += 2) {
        str += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
      }
      setDecodedAscii(str);
    } catch {
      setDecodedAscii("CTF");
    }
  };

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090d] border border-neutral-800 text-white font-mono p-4 sm:p-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <FilePdf weight="bold" className="size-5 text-red-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            PDF FORENSIC VIEWER: OPTICAL &amp; STREAM ANALYSIS
          </h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-red-500/50 text-red-300 font-bold uppercase">
          STAGE 04 // notes.pdf
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Left: Document Viewport with Optical Filter Toggle */}
        <div className="flex flex-col gap-3">
          {/* Controls Bar */}
          <div className="flex items-center justify-between p-2 bg-neutral-950 border border-neutral-800 text-xs">
            <span className="text-neutral-400 font-bold uppercase text-[10px]">FILTER VIEWPORT:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode("standard")}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                  filterMode === "standard" ? "bg-white text-black font-black" : "bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                STANDARD PDF
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("forensic")}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                  filterMode === "forensic" ? "bg-cyan-400 text-black font-black" : "bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                UV / CONTRAST INVERT
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("raw")}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                  filterMode === "raw" ? "bg-emerald-400 text-black font-black" : "bg-neutral-900 text-neutral-400 hover:text-white"
                }`}
              >
                STREAM EXTRACT
              </button>
            </div>
          </div>

          {/* Virtual Rendered Page Sheet */}
          <div
            className={`p-6 sm:p-8 rounded-sm border transition-all duration-300 min-h-[360px] flex flex-col justify-between select-text ${
              filterMode === "standard"
                ? "bg-white text-slate-900 border-neutral-300 shadow-lg"
                : filterMode === "forensic"
                ? "bg-[#05050a] text-cyan-200 border-cyan-500/80 shadow-[0_0_25px_rgba(6,182,212,0.25)]"
                : "bg-black text-emerald-300 font-mono border-emerald-500/50"
            }`}
          >
            {filterMode === "raw" ? (
              <div className="text-xs space-y-1">
                <div className="text-neutral-500 pb-2 border-b border-neutral-800">
                  // DECOMPRESSED PDF CONTENT STREAM DUMP (Object 4:0):
                </div>
                <div>BT /F1 22 Tf 72 720 Td (RESEARCH NOTES) Tj ET</div>
                <div>BT /F2 12 Tf 72 690 Td (Dr. Alex Thomas // System Security Assessment) Tj ET</div>
                <div>BT /F3 13 Tf 72 640 Td (01 - Access Control) Tj ET</div>
                <div>BT /F3 13 Tf 72 614 Td (02 - Encryption) Tj ET</div>
                <div>BT /F3 13 Tf 72 588 Td (03 - Logging) Tj ET</div>
                <div>BT /F3 13 Tf 72 562 Td (04 - Monitoring) Tj ET</div>
                <div>BT /F3 13 Tf 72 536 Td (05 - Incident Response) Tj ET</div>
                <div>BT /F3 13 Tf 72 484 Td (All systems were tested successfully.) Tj ET</div>
                <div>BT /F3 13 Tf 72 458 Td (Nothing unusual was detected.) Tj ET</div>
                <div className="p-2 bg-emerald-950/80 border border-emerald-500 text-emerald-200 font-bold mt-3">
                  BT /F1 14 Tf 1 1 1 rg 72 418 Td (KEY: 435446) Tj ET  &lt;-- [WHITE COLOR 1 1 1 rg DETECTED]
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="border-b pb-3 border-current/20">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">RESEARCH NOTES</h1>
                    <p className="text-xs opacity-75 mt-0.5">Dr. Alex Thomas // System Security Assessment</p>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="font-semibold">01 — Access Control</div>
                    <div className="font-semibold">02 — Encryption</div>
                    <div className="font-semibold">03 — Logging</div>
                    <div className="font-semibold">04 — Monitoring</div>
                    <div className="font-semibold">05 — Incident Response</div>
                  </div>

                  <div className="pt-4 text-xs opacity-80 space-y-1">
                    <p>All systems were tested successfully.</p>
                    <p>Nothing unusual was detected.</p>
                  </div>
                </div>

                {/* THE HIDDEN WHITE-ON-WHITE TEXT */}
                <div className="mt-8 pt-4 border-t border-dashed border-current/20">
                  <div
                    className={`font-black text-sm transition-all duration-300 select-all p-2 rounded ${
                      filterMode === "standard"
                        ? "text-white bg-white hover:bg-neutral-100 hover:text-black cursor-text"
                        : "text-amber-300 bg-amber-950/80 border border-amber-400 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse"
                    }`}
                  >
                    KEY: 435446
                  </div>
                  {filterMode === "standard" && (
                    <div className="text-[10px] text-neutral-400 italic mt-1">
                      (Hint: Text above is white-on-white. Highlight with mouse or toggle UV Contrast Filter)
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Hex Decoder Tool & Next Stage Link */}
        <div className="flex flex-col gap-3 bg-[#060609] border border-neutral-800/80 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center justify-between pb-2 border-b border-neutral-800">
            <span>HEX CIPHER ANALYSIS:</span>
            <span className="text-neutral-400 text-[10px]">DECODER 04</span>
          </div>

          <div className="space-y-4 text-xs flex-1">
            <div className="p-3 bg-neutral-900/80 border border-neutral-800">
              <label className="text-neutral-400 font-bold block mb-1 uppercase text-[10px]">
                RECOVERED HEXADECIMAL STRING:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black border border-neutral-700 text-amber-300 font-mono font-bold tracking-wider"
                  placeholder="e.g. 435446"
                />
                <button
                  type="button"
                  onClick={handleDecodeHex}
                  className="px-4 py-2 bg-red-500 hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
                >
                  DECODE
                </button>
              </div>
            </div>

            {/* Decoded Result */}
            {decodedAscii && (
              <div className="p-3.5 bg-neutral-900 border-2 border-emerald-500/60 shadow-[3px_3px_0px_0px_#10b981] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-bold uppercase">
                    HEX TO ASCII TRANSLATION:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(decodedAscii)}
                    className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white"
                  >
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copied ? "COPIED" : "COPY"}</span>
                  </button>
                </div>
                <div className="text-2xl font-black text-emerald-300 font-mono tracking-widest">
                  [{decodedAscii}]
                </div>
                <p className="text-[11px] text-neutral-300 mt-1">
                  Hex <code className="text-amber-300">43 54 46</code> translates to ASCII <strong className="text-emerald-400">&quot;CTF&quot;</strong>.
                  This confirms that the last remaining evidence artifact is the key to the final flag!
                </p>
              </div>
            )}

            {/* Pointer to Stage 5 */}
            {decodedAscii && onSelectNextFile && (
              <div className="mt-auto p-3.5 bg-[#140a0a] border border-red-500/50 flex items-center justify-between">
                <div>
                  <div className="text-xs text-red-300 font-bold uppercase">Final Evidence Locked:</div>
                  <div className="text-[11px] text-neutral-400">Proceed to Alex&apos;s computer workstation screenshot</div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectNextFile("evidence.png")}
                  className="px-4 py-2 bg-red-500 hover:bg-white text-black font-black uppercase text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
                >
                  <span>INSPECT EVIDENCE.PNG</span>
                  <ArrowRight weight="bold" className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
