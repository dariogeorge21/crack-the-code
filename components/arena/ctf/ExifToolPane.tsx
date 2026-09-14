"use client";

import React, { useState } from "react";
import {
  MagnifyingGlass,
  Eye,
  ArrowRight,
  Sparkle,
  Copy,
  Check,
  Cpu,
  ShieldCheck,
  Terminal
} from "@phosphor-icons/react";

interface ExifToolPaneProps {
  onSelectNextFile?: (filename: string) => void;
}

export function ExifToolPane({ onSelectNextFile }: ExifToolPaneProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [decodedHex, setDecodedHex] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rawHex = "6D 65 65 74 69 6E 67 2E 70 6E 67";

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 600);
  };

  const handleDecodeHex = () => {
    // 6D 65 65 74 69 6E 67 2E 70 6E 67 -> meeting.png
    const hexClean = rawHex.replace(/\s+/g, "");
    let str = "";
    for (let i = 0; i < hexClean.length; i += 2) {
      str += String.fromCharCode(parseInt(hexClean.substr(i, 2), 16));
    }
    setDecodedHex(str);
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
          <MagnifyingGlass weight="bold" className="size-5 text-[#ff5500]" />
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            FORENSIC MODULE: EXIF METADATA ANALYZER
          </h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-400 font-bold uppercase">
          STAGE 01 // photo.jpg
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Left: Image View & Scan Trigger */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-video sm:aspect-4/3 bg-black border border-neutral-800 flex items-center justify-center overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ctf/photo.jpg"
              alt="Evidence Target photo.jpg"
              className="object-contain w-full h-full"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 border border-neutral-700 text-[10px] text-neutral-300">
              TARGET: photo.jpg [JPEG / 32 KB]
            </div>
          </div>

          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="w-full py-3 bg-[#ff5500] hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Cpu weight="bold" className="size-4 animate-spin" />
                <span>PARSING EXIF CHUNKS & TAG BLOCKS...</span>
              </>
            ) : (
              <>
                <Eye weight="bold" className="size-4" />
                <span>EXTRACT EXIF METADATA HEADERS</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Metadata Table & Clue Extractor */}
        <div className="flex flex-col gap-3 bg-[#060609] border border-neutral-800/80 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#ff5500] flex items-center justify-between pb-2 border-b border-neutral-800">
            <span>PARSED EXIF METADATA RECORDS:</span>
            {hasScanned && <span className="text-emerald-400 text-[10px]">7 TAGS EXTRACTED</span>}
          </div>

          {hasScanned ? (
            <div className="space-y-2 text-xs flex-1">
              <div className="p-2 bg-neutral-900/80 border border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-500 font-bold">File Format:</span>
                <span className="text-neutral-300">JPEG / JFIF standard</span>
              </div>
              <div className="p-2 bg-neutral-900/80 border border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-500 font-bold">Artist / Author:</span>
                <span className="text-amber-400 font-bold">Alex Thomas</span>
              </div>
              <div className="p-2 bg-neutral-900/80 border border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-500 font-bold">ImageDescription:</span>
                <span className="text-neutral-200">Look at the other picture.</span>
              </div>
              <div className="p-2 bg-neutral-900/80 border border-neutral-800 flex justify-between items-center">
                <span className="text-neutral-500 font-bold">UserComment:</span>
                <span className="text-neutral-200">Look at the other picture.</span>
              </div>

              {/* Crucial Hex Title Tag */}
              <div className="p-3 bg-neutral-900 border-2 border-emerald-500/60 shadow-[2px_2px_0px_0px_#10b981]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-emerald-400 font-bold text-[11px] uppercase">
                    [CRITICAL TAG] Title / Software String:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(rawHex)}
                    className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white"
                  >
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copied ? "COPIED" : "COPY HEX"}</span>
                  </button>
                </div>
                <div className="p-2 bg-black font-mono text-emerald-300 text-xs tracking-wider break-all select-all border border-neutral-800">
                  {rawHex}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDecodeHex}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[11px] tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#ffffff]"
                  >
                    <Terminal weight="bold" className="size-3.5" />
                    <span>DECODE HEX TO ASCII</span>
                  </button>

                  {decodedHex && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-400 text-emerald-300 font-black text-xs">
                      <span>RESULT:</span>
                      <span className="underline">{decodedHex}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pointer to Stage 2 */}
              {decodedHex && onSelectNextFile && (
                <div className="mt-3 p-3 bg-[#0a0a14] border border-cyan-500/50 flex items-center justify-between">
                  <div className="text-[11px] text-cyan-300">
                    Clue points to target: <span className="font-bold text-white">meeting.png</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectNextFile("meeting.png")}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-white text-black font-bold uppercase text-[10px] tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>OPEN MEETING.PNG</span>
                    <ArrowRight weight="bold" className="size-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-neutral-500 text-center">
              <MagnifyingGlass weight="light" className="size-10 text-neutral-600 mb-2" />
              <p className="text-xs">Exif metadata not yet extracted.</p>
              <p className="text-[10px] text-neutral-600 mt-1">
                Click &quot;Extract EXIF Metadata Headers&quot; to inspect hidden photo tags.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
