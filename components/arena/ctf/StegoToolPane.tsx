"use client";

import React, { useState } from "react";
import {
  Sparkle,
  Eye,
  ArrowRight,
  Terminal,
  Copy,
  Check,
  Cpu,
  Fingerprint,
  FileCode
} from "@phosphor-icons/react";

interface StegoToolPaneProps {
  onSelectNextFile?: (filename: string) => void;
}

export function StegoToolPane({ onSelectNextFile }: StegoToolPaneProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [base64Payload, setBase64Payload] = useState<string | null>(null);
  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"standard" | "lsb">("standard");

  const rawPayload = "VGhlIHBhc3N3b3JkIGlzOiBkb2N1bWVudA==";

  const handleRunStegoScan = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasExtracted(true);
      setBase64Payload(rawPayload);
    }, 700);
  };

  const handleDecodeBase64 = () => {
    try {
      const decoded = atob(rawPayload);
      setDecodedText(decoded);
    } catch {
      setDecodedText("The password is: document");
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
          <Fingerprint weight="bold" className="size-5 text-cyan-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            FORENSIC MODULE: STEGANOGRAPHY &amp; LSB ANALYZER
          </h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-cyan-500/50 text-cyan-300 font-bold uppercase">
          STAGE 02 // meeting.png
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Left: Image Viewer & Bitplane Toggle */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-video sm:aspect-4/3 bg-black border border-neutral-800 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ctf/meeting.png"
              alt="Evidence Target meeting.png"
              className={`object-contain w-full h-full transition-all duration-300 ${
                viewMode === "lsb" ? "contrast-200 hue-rotate-180 invert" : ""
              }`}
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 border border-neutral-700 text-[10px] text-neutral-300">
              TARGET: meeting.png [PNG / 15 KB]
            </div>

            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/85 p-1 border border-neutral-700 text-[10px]">
              <button
                type="button"
                onClick={() => setViewMode("standard")}
                className={`px-2 py-0.5 cursor-pointer font-bold ${
                  viewMode === "standard" ? "bg-cyan-500 text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                RGB
              </button>
              <button
                type="button"
                onClick={() => setViewMode("lsb")}
                className={`px-2 py-0.5 cursor-pointer font-bold ${
                  viewMode === "lsb" ? "bg-cyan-500 text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                LSB PLANE
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunStegoScan}
            disabled={isAnalyzing}
            className="w-full py-3 bg-cyan-500 hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Cpu weight="bold" className="size-4 animate-spin" />
                <span>SCANNING LEAST SIGNIFICANT BITS (LSB)...</span>
              </>
            ) : (
              <>
                <Fingerprint weight="bold" className="size-4" />
                <span>EXTRACT STEGANOGRAPHIC PAYLOAD</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Stego Extraction Output & Decoder */}
        <div className="flex flex-col gap-3 bg-[#060609] border border-neutral-800/80 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between pb-2 border-b border-neutral-800">
            <span>DETECTED STEGO TELEMETRY:</span>
            {hasExtracted && <span className="text-emerald-400 text-[10px]">PAYLOAD RECOVERED</span>}
          </div>

          {hasExtracted ? (
            <div className="space-y-3 text-xs flex-1">
              <div className="p-2.5 bg-neutral-900/80 border border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-500 font-bold">Bitplane Modulation:</span>
                <span className="text-emerald-400 font-bold">Red Channel LSB-1 Encoding</span>
              </div>

              {/* Raw Base64 String */}
              <div className="p-3 bg-neutral-900 border-2 border-cyan-500/60 shadow-[2px_2px_0px_0px_#06b6d4]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-cyan-300 font-bold text-[11px] uppercase">
                    ENCODED BASE64 STREAM DETECTED:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(rawPayload)}
                    className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white"
                  >
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copied ? "COPIED" : "COPY B64"}</span>
                  </button>
                </div>
                <div className="p-2 bg-black font-mono text-cyan-300 text-xs tracking-wider break-all select-all border border-neutral-800">
                  {base64Payload}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDecodeBase64}
                    className="px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase text-[11px] tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#ffffff]"
                  >
                    <Terminal weight="bold" className="size-3.5" />
                    <span>DECODE BASE64 PAYLOAD</span>
                  </button>

                  {decodedText && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-400 text-emerald-300 font-black text-xs">
                      <span>PLAINTEXT:</span>
                      <span className="underline">{decodedText}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Clue pointer explanation */}
              {decodedText && (
                <div className="p-3 bg-neutral-900/90 border border-neutral-800 text-neutral-300 space-y-1 text-xs">
                  <div className="font-bold text-white flex items-center gap-1">
                    <FileCode weight="bold" className="size-4 text-purple-400" />
                    <span>FORENSIC ANALYSIS OF CLUE:</span>
                  </div>
                  <p className="text-neutral-400 text-[11px]">
                    The decoded phrase states <span className="text-amber-300 font-bold">&quot;The password is: document&quot;</span>.
                    This points directly to Alex&apos;s cybersecurity document: <span className="text-purple-300 font-bold">report.docx</span>!
                  </p>
                </div>
              )}

              {/* Pointer to Stage 3 */}
              {decodedText && onSelectNextFile && (
                <div className="mt-2 p-3 bg-[#0c0a14] border border-purple-500/50 flex items-center justify-between">
                  <div className="text-[11px] text-purple-300">
                    Next target: <span className="font-bold text-white">report.docx</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectNextFile("report.docx")}
                    className="px-3 py-1.5 bg-purple-500 hover:bg-white text-black font-bold uppercase text-[10px] tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>INSPECT REPORT.DOCX</span>
                    <ArrowRight weight="bold" className="size-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-neutral-500 text-center">
              <Fingerprint weight="light" className="size-10 text-neutral-600 mb-2" />
              <p className="text-xs">Steganographic scan inactive.</p>
              <p className="text-[10px] text-neutral-600 mt-1">
                Click &quot;Extract Steganographic Payload&quot; to examine pixel bitplanes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
