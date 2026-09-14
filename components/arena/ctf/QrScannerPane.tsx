"use client";

import React, { useState, useRef } from "react";
import jsQR from "jsqr";
import {
  QrCode,
  Scan,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  Sparkle,
  Copy,
  Check,
  Cpu,
  Trophy,
  ArrowRight
} from "@phosphor-icons/react";

interface QrScannerPaneProps {
  onInsertFlag?: (flag: string) => void;
}

export function QrScannerPane({ onInsertFlag }: QrScannerPaneProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [detectedFlag, setDetectedFlag] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scanError, setScanError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleScanImage = () => {
    setIsScanning(true);
    setScanError(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/ctf/evidence.png";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            setDetectedFlag(code.data);
            setScanError(null);
          } else {
            setScanError("No optical barcode identified in the primary layer. Try inspecting the raw image file directly.");
          }
        } else {
          setScanError("Unable to initialize canvas 2D context for optical analysis.");
        }
      } catch (err) {
        console.warn("Canvas QR scan error:", err);
        setScanError("Error processing optical image data. Inspect image in separate viewer.");
      } finally {
        setTimeout(() => setIsScanning(false), 500);
      }
    };

    img.onerror = () => {
      setScanError("Failed to load /ctf/evidence.png optical asset.");
      setIsScanning(false);
    };
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
          <QrCode weight="bold" className="size-5 text-amber-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            HIGH-RES OPTICAL VIEWER &amp; QR SCANNER
          </h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-amber-950 border border-amber-500/60 text-amber-300 font-bold uppercase animate-pulse">
          STAGE 05 // FINAL TARGET
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Left: High-Res Workstation Screenshot Viewer */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-video sm:aspect-4/3 bg-black border border-neutral-800 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ctf/evidence.png"
              alt="Evidence Target evidence.png"
              style={{ transform: `scale(${zoomLevel})` }}
              className="object-contain w-full h-full transition-transform duration-200"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 border border-neutral-700 text-[10px] text-neutral-300">
              TARGET: evidence.png [PNG / 23 KB]
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 p-1 border border-neutral-700">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                className="p-1 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                title="Zoom Out"
              >
                <MagnifyingGlassMinus weight="bold" className="size-3.5" />
              </button>
              <span className="text-[10px] font-bold px-1">{Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                title="Zoom In"
              >
                <MagnifyingGlassPlus weight="bold" className="size-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleScanImage}
            disabled={isScanning}
            className="w-full py-3 bg-amber-400 hover:bg-white text-black font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Cpu weight="bold" className="size-4 animate-spin" />
                <span>SCANNING PIXEL MATRIX FOR OPTICAL BARCODES...</span>
              </>
            ) : (
              <>
                <Scan weight="bold" className="size-4" />
                <span>SCAN IMAGE FOR QR CODE &amp; CIPHER</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Detected Flag & Action Panel */}
        <div className="flex flex-col gap-3 bg-[#060609] border border-neutral-800/80 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between pb-2 border-b border-neutral-800">
            <span>OPTICAL ANALYSIS ENGINE:</span>
            {detectedFlag && <span className="text-emerald-400 text-[10px]">QR CODE DECODED</span>}
          </div>

          {detectedFlag ? (
            <div className="space-y-4 text-xs flex-1 flex flex-col justify-between">
              <div className="p-3 bg-neutral-900/80 border border-neutral-800 space-y-1">
                <div className="text-neutral-500 font-bold uppercase text-[10px]">Matrix Recognition Status:</div>
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Sparkle weight="fill" className="size-4 text-emerald-400" />
                  <span>Optical barcode identified: ISO/IEC 18004 Standard QR</span>
                </div>
              </div>

              {/* Master Flag Box */}
              <div className="p-4 bg-amber-950/30 border-2 border-amber-400 shadow-[4px_4px_0px_0px_#f59e0b] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 font-black text-xs uppercase flex items-center gap-1.5">
                    <Trophy weight="fill" className="size-4 text-amber-400" />
                    <span>FINAL TOURNAMENT FLAG DETECTED:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(detectedFlag)}
                    className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copied ? "COPIED" : "COPY FLAG"}</span>
                  </button>
                </div>

                <div className="p-3 bg-black border border-neutral-800 font-mono text-sm sm:text-base font-black text-amber-300 select-all tracking-wide break-all">
                  {detectedFlag}
                </div>

                <p className="text-[11px] text-neutral-300">
                  Submit this flag into the <strong className="text-white">Master Flag Terminal</strong> below to claim victory and unlock the final 4 digits of the Master Key!
                </p>
              </div>

              {/* Auto-fill Button */}
              {onInsertFlag && (
                <button
                  type="button"
                  onClick={() => onInsertFlag(detectedFlag)}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] flex items-center justify-center gap-2"
                >
                  <span>TRANSFER FLAG TO SUBMISSION TERMINAL</span>
                  <ArrowRight weight="bold" className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-12 text-neutral-500 text-center">
              {scanError ? (
                <div className="p-3 bg-red-950/60 border border-red-500/70 text-red-300 text-xs text-left w-full space-y-1">
                  <div className="font-bold text-red-400 uppercase text-[10px]">SCAN WARNING // INCOMPLETE ACQUISITION</div>
                  <p className="text-[11px] leading-relaxed">{scanError}</p>
                </div>
              ) : (
                <>
                  <Scan weight="light" className="size-10 text-neutral-600 mb-2" />
                  <p className="text-xs">No optical scan performed yet.</p>
                  <p className="text-[10px] text-neutral-600 mt-1">
                    Click &quot;Scan Image for QR Code &amp; Cipher&quot; to decode Dr. Alex&apos;s hidden barcode.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
