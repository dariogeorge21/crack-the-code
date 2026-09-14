"use client";

import React, { useState } from "react";
import {
  Terminal,
  Calculator,
  NotePencil,
  Copy,
  Check,
  Sparkle,
  ArrowClockwise
} from "@phosphor-icons/react";

export function ForensicDecoderHub() {
  const [activeTab, setActiveTab] = useState<"hex" | "base64" | "notes">("hex");

  // Hex tool
  const [hexInput, setHexInput] = useState("");
  const [hexOutput, setHexOutput] = useState("");

  // Base64 tool
  const [b64Input, setB64Input] = useState("");
  const [b64Output, setB64Output] = useState("");

  // Notes tool
  const [notes, setNotes] = useState(
    "Alex left 5 files in missing_researcher/:\n1. photo.jpg -> EXIF metadata has hex: 6D 65 65 74 69 6E 67 2E 70 6E 67 (meeting.png)\n2. meeting.png -> LSB has base64: VGhlIHBhc3N3b3JkIGlzOiBkb2N1bWVudA== (password: document)\n3. report.docx -> ZIP structure has customXml/item1.xml (next clue is in PDF)\n4. notes.pdf -> hidden white text: KEY: 435446 (hex for CTF)\n5. evidence.png -> QR code has final flag!"
  );

  const [copied, setCopied] = useState(false);

  const handleConvertHex = () => {
    try {
      const clean = hexInput.replace(/\s+/g, "");
      let str = "";
      for (let i = 0; i < clean.length; i += 2) {
        str += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
      }
      setHexOutput(str);
    } catch {
      setHexOutput("Error decoding hex string");
    }
  };

  const handleConvertB64 = () => {
    try {
      const decoded = atob(b64Input.trim());
      setB64Output(decoded);
    } catch {
      setB64Output("Error decoding Base64 payload");
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
    <div className="bg-[#09090d] border border-neutral-800 text-white font-mono p-3 text-xs flex flex-col gap-2">
      {/* Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("hex")}
            className={`px-2.5 py-1 uppercase font-bold text-[10px] cursor-pointer transition-colors ${
              activeTab === "hex" ? "bg-[#ff5500] text-black" : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            HEX DECODER
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("base64")}
            className={`px-2.5 py-1 uppercase font-bold text-[10px] cursor-pointer transition-colors ${
              activeTab === "base64" ? "bg-cyan-500 text-black" : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            BASE64 DECODER
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`px-2.5 py-1 uppercase font-bold text-[10px] cursor-pointer transition-colors ${
              activeTab === "notes" ? "bg-amber-400 text-black" : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            CASE SCRATCHPAD
          </button>
        </div>
        <span className="text-[10px] text-neutral-500 uppercase">FORENSIC SUITE</span>
      </div>

      {/* Hex Tool */}
      {activeTab === "hex" && (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            placeholder="Paste Hex here (e.g. 6D 65 65 74 69 6E 67 2E 70 6E 67)..."
            className="flex-1 px-2.5 py-1.5 bg-black border border-neutral-800 text-neutral-200 text-xs font-mono outline-none focus:border-[#ff5500]"
          />
          <button
            type="button"
            onClick={handleConvertHex}
            className="px-3 py-1.5 bg-[#ff5500] hover:bg-white text-black font-bold uppercase text-[10px] tracking-wider cursor-pointer shrink-0"
          >
            CONVERT
          </button>
          {hexOutput && (
            <div className="px-2.5 py-1.5 bg-neutral-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-2 select-all">
              <span>{hexOutput}</span>
              <button
                type="button"
                onClick={() => handleCopy(hexOutput)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Base64 Tool */}
      {activeTab === "base64" && (
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            value={b64Input}
            onChange={(e) => setB64Input(e.target.value)}
            placeholder="Paste Base64 here (e.g. VGhlIHBhc3N3b3JkIGlzOiBkb2N1bWVudA==)..."
            className="flex-1 px-2.5 py-1.5 bg-black border border-neutral-800 text-neutral-200 text-xs font-mono outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={handleConvertB64}
            className="px-3 py-1.5 bg-cyan-400 hover:bg-white text-black font-bold uppercase text-[10px] tracking-wider cursor-pointer shrink-0"
          >
            DECODE
          </button>
          {b64Output && (
            <div className="px-2.5 py-1.5 bg-neutral-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-2 select-all">
              <span>{b64Output}</span>
              <button
                type="button"
                onClick={() => handleCopy(b64Output)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Case Scratchpad */}
      {activeTab === "notes" && (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-2 bg-black border border-neutral-800 text-amber-200/90 text-xs font-mono outline-none focus:border-amber-400 resize-y"
            placeholder="Record your clues and intermediate strings here..."
          />
        </div>
      )}
    </div>
  );
}
