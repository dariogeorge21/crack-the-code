"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  ArrowClockwise,
  Copy,
  Check,
  Code,
  CaretDown,
  Lightning,
  Terminal,
} from "@phosphor-icons/react";

import { SupportedLanguage } from "@/types";
import { STARTER_CODES } from "@/constants";

export type { SupportedLanguage };
export { STARTER_CODES };

interface LeetCodeEditorPaneProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  code: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  isRunning: boolean;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
}

export function LeetCodeEditorPane({
  language,
  onLanguageChange,
  code,
  onCodeChange,
  onRun,
  isRunning,
  isDrawerOpen,
  onToggleDrawer,
}: LeetCodeEditorPaneProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    if (confirm("Reset editor to starter syntax?")) {
      onCodeChange(STARTER_CODES[language]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Run on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isRunning) onRun();
      return;
    }

    // Handle Tab key for indentation (4 spaces)
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + "    " + code.substring(end);
      onCodeChange(newCode);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Sync scroll between line numbers gutter and textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const linesCount = Math.max(1, (code || "").split("\n").length);
  const lineNumbers = Array.from({ length: linesCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-[#0b0b0e] border border-neutral-800 overflow-hidden select-text">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0e0e13] px-3 py-2">
        {/* Left: Language Selection (Python & C Only) & Utilities */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="appearance-none bg-neutral-900 border border-neutral-700 hover:border-neutral-600 px-3 py-1.5 pr-8 text-xs font-mono font-bold text-white uppercase tracking-wider outline-none cursor-pointer transition-colors"
            >
              <option value="python">Python 3.14</option>
              <option value="c">C (GCC 15)</option>
              <option value="cpp">C++ (G++ 15)</option>
              <option value="java">Java (OpenJDK 25)</option>
            </select>
            <CaretDown weight="bold" className="size-3 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="Reset code to default syntax"
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono"
          >
            <ArrowClockwise weight="bold" className="size-3.5" />
            <span className="hidden md:inline text-[10px]">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy source code"
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-mono"
          >
            {copied ? (
              <>
                <Check weight="bold" className="size-3.5 text-emerald-400" />
                <span className="hidden md:inline text-[10px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy weight="bold" className="size-3.5" />
                <span className="hidden md:inline text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Right: TOP RIGHT RUN BUTTON */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-neutral-500 mr-1">
            <kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400">Enter</kbd>
          </div>

          <button
            type="button"
            onClick={onRun}
            disabled={isRunning}
            className={`px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-[3px_3px_0px_0px_#ffffff] active:translate-y-0.5 disabled:opacity-50 ${
              isRunning ? "animate-pulse" : ""
            }`}
          >
            {isRunning ? (
              <>
                <Lightning weight="fill" className="size-3.5 animate-spin" />
                <span>EXECUTING...</span>
              </>
            ) : (
              <>
                <Play weight="fill" className="size-3.5" />
                <span>RUN CODE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area with Line Numbers Gutter */}
      <div className="flex-1 flex overflow-hidden relative font-mono text-xs sm:text-sm bg-[#09090c]">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-12 sm:w-14 py-3 bg-[#0d0d12] border-r border-neutral-800/80 text-neutral-600 text-right pr-3 select-none overflow-hidden font-mono leading-6"
        >
          {lineNumbers.map((num) => (
            <div key={num} className="h-6">
              {num}
            </div>
          ))}
        </div>

        {/* Main Code Textarea */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full p-3 bg-transparent text-emerald-300 font-mono resize-none outline-none leading-6 whitespace-pre tab-[4] selection:bg-[#ff5500]/30 selection:text-white"
            placeholder="Write your solution here..."
          />
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="border-t border-neutral-800 bg-[#0e0e13] px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-neutral-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-neutral-400">
            <Code weight="bold" className="size-3" />
            <span>Ln {linesCount}, Col 1</span>
          </span>
          <span className="text-neutral-600">|</span>
          <span>UTF-8</span>
          <span className="text-neutral-600">|</span>
          <span>Spaces: 4</span>
        </div>
        <div className="flex items-center gap-2">
          {onToggleDrawer && (
            <button
              type="button"
              onClick={onToggleDrawer}
              className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDrawerOpen
                  ? "bg-[#ff5500]/20 text-[#ff5500] border-[#ff5500]/50"
                  : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700"
              }`}
            >
              <Terminal weight="bold" className="size-3 text-[#ff5500]" />
              <span>CONSOLE {isDrawerOpen ? "▼" : "▲"}</span>
            </button>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          <span className="text-neutral-400 uppercase text-[10px] hidden sm:inline">
            ONLINECOMPILER.IO // {language.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default LeetCodeEditorPane;
