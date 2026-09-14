"use client";

import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import {
  Folder,
  FileText,
  FileCode,
  Archive,
  ArrowRight,
  Eye,
  Check,
  Copy,
  Cpu,
  Warning
} from "@phosphor-icons/react";

interface ZipExplorerPaneProps {
  onSelectNextFile?: (filename: string) => void;
}

interface ZipEntry {
  path: string;
  name: string;
  isFolder: boolean;
  content?: string;
  isSpecial?: boolean;
}

export function ZipExplorerPane({ onSelectNextFile }: ZipExplorerPaneProps) {
  const [entries, setEntries] = useState<ZipEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ZipEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadDocxZip() {
      setIsLoading(true);
      try {
        const res = await fetch("/ctf/report.docx");
        const blob = await res.arrayBuffer();
        const zip = await JSZip.loadAsync(blob);

        const loadedEntries: ZipEntry[] = [];
        const fileNames = Object.keys(zip.files);

        for (const fileName of fileNames) {
          const file = zip.files[fileName];
          if (!file.dir) {
            const text = await file.async("text");
            const isCustom = fileName.includes("customXml");
            loadedEntries.push({
              path: fileName,
              name: fileName.split("/").pop() || fileName,
              isFolder: false,
              content: text,
              isSpecial: isCustom,
            });
          }
        }

        setEntries(loadedEntries);
        // Default to word/document.xml
        const docXml = loadedEntries.find((e) => e.path.includes("word/document.xml"));
        setSelectedEntry(docXml || loadedEntries[0] || null);
      } catch (err) {
        console.error("Error loading DOCX as ZIP:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDocxZip();
  }, []);

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHiddenClue = selectedEntry?.path.includes("customXml");

  return (
    <div className="flex flex-col h-full bg-[#09090d] border border-neutral-800 text-white font-mono p-4 sm:p-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Archive weight="bold" className="size-5 text-purple-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            ARCHIVE FORENSIC EXPLORER: DOCX CONTAINER
          </h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-purple-500/50 text-purple-300 font-bold uppercase">
          STAGE 03 // report.docx
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Left Column: Internal ZIP Directory Tree */}
        <div className="flex flex-col gap-3 bg-[#060609] border border-neutral-800 p-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs font-bold text-neutral-400 uppercase">
            <span>ZIP DIRECTORY STRUCTURE:</span>
            <span className="text-[10px] text-purple-400 font-mono">UNPACKED</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-neutral-500 text-xs gap-2">
              <Cpu className="size-4 animate-spin text-purple-400" />
              <span>Unpacking DOCX ZIP structures...</span>
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[360px]">
              {entries.map((entry) => {
                const isSelected = selectedEntry?.path === entry.path;
                return (
                  <button
                    key={entry.path}
                    type="button"
                    onClick={() => setSelectedEntry(entry)}
                    className={`w-full text-left px-2.5 py-2 text-xs transition-colors flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? "bg-purple-950/70 border-purple-500 text-purple-200 font-bold"
                        : entry.isSpecial
                        ? "bg-neutral-900 border-amber-500/50 text-amber-300 hover:bg-neutral-800"
                        : "bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-900"
                    }`}
                  >
                    <FileCode weight="bold" className={`size-3.5 shrink-0 ${entry.isSpecial ? "text-amber-400 animate-pulse" : "text-purple-400"}`} />
                    <span className="truncate font-mono">{entry.path}</span>
                    {entry.isSpecial && (
                      <span className="ml-auto text-[9px] px-1 bg-amber-950 border border-amber-500/50 text-amber-300 font-bold">
                        FLAGGED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-auto p-2.5 bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400">
            <span className="text-purple-300 font-bold">TIP:</span> DOCX files are compressed OpenXML ZIP archives. Attackers and researchers embed auxiliary data inside subdirectories like <code className="text-amber-300">customXml/</code>.
          </div>
        </div>

        {/* Right Columns: Selected File Code / XML Viewer */}
        <div className="lg:col-span-2 flex flex-col gap-3 bg-[#060609] border border-neutral-800 p-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase">
                CONTENT VIEWER: <span className="text-purple-300">{selectedEntry?.path || "No file selected"}</span>
              </span>
            </div>
            {selectedEntry?.content && (
              <button
                type="button"
                onClick={() => handleCopy(selectedEntry.content || "")}
                className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white cursor-pointer"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                <span>{copied ? "COPIED" : "COPY TEXT"}</span>
              </button>
            )}
          </div>

          {/* XML / Text Box */}
          <div className="flex-1 bg-black p-3.5 border border-neutral-800 overflow-x-auto max-h-[300px] text-xs font-mono select-all">
            <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
              {selectedEntry?.content || "Select a file to inspect its internal XML payload."}
            </pre>
          </div>

          {/* Clue Banner if customXml/item1.xml is opened */}
          {isHiddenClue && (
            <div className="p-3.5 bg-amber-950/40 border-2 border-amber-400 shadow-[3px_3px_0px_0px_#f59e0b] space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase">
                <Warning weight="bold" className="size-4 text-amber-400" />
                <span>HIDDEN ARTIFACT RECOVERED: customXml/item1.xml</span>
              </div>
              <p className="text-xs text-neutral-200">
                Found message: <span className="text-amber-300 font-bold font-mono">&quot;The next clue is inside the PDF.&quot;</span>
              </p>

              {onSelectNextFile && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectNextFile("notes.pdf")}
                    className="px-4 py-2 bg-amber-400 hover:bg-white text-black font-black uppercase text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
                  >
                    <span>OPEN NOTES.PDF</span>
                    <ArrowRight weight="bold" className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
