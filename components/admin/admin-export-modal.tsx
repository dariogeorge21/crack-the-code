"use client";

import React, { useState } from "react";
import { X, Copy, Check, Printer, FileText } from "@phosphor-icons/react";
import { AdminTeamData } from "@/types";

interface AdminExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: AdminTeamData[];
  onShowToast: (msg: string, type: "success" | "info" | "warning" | "error") => void;
}

export function AdminExportModal({
  isOpen,
  onClose,
  teams,
  onShowToast,
}: AdminExportModalProps) {
  const [copiedType, setCopiedType] = useState<"text" | "csv" | null>(null);

  if (!isOpen) return null;

  const handleCopyText = () => {
    const list = teams
      .map(
        (t) =>
          `Team ${String(t.team_number).padStart(2, "0")} [${t.team_name}]: Code ${
            t.team_code && !t.is_code_flushed ? t.team_code : "FLUSHED"
          }`
      )
      .join("\n");

    navigator.clipboard.writeText(list);
    setCopiedType("text");
    onShowToast("Copied all team codes as formatted text", "success");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyCSV = () => {
    const header = "Team_Number,Team_Name,Access_Code,Current_Level,Time_Elapsed\n";
    const rows = teams
      .map(
        (t) =>
          `${t.team_number},"${t.team_name}",${
            t.team_code && !t.is_code_flushed ? t.team_code : ""
          },${t.current_level},"${t.total_time_formatted || t.time_taken_formatted || ""}"`
      )
      .join("\n");

    navigator.clipboard.writeText(header + rows);
    setCopiedType("csv");
    onShowToast("Copied team data as CSV table", "success");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-5 sm:p-6 font-mono text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText weight="bold" className="size-5 text-[#ff5500]" />
              Export Team Access Codes
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Copy or print credentials for physical distribution to teams.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close export modal"
          >
            <X weight="bold" className="size-4.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 py-3.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedType === "text" ? (
              <Check weight="bold" className="size-3.5 text-emerald-400" />
            ) : (
              <Copy weight="bold" className="size-3.5 text-zinc-400" />
            )}
            <span>{copiedType === "text" ? "Copied List" : "Copy Formatted List"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCSV}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedType === "csv" ? (
              <Check weight="bold" className="size-3.5 text-emerald-400" />
            ) : (
              <Copy weight="bold" className="size-3.5 text-zinc-400" />
            )}
            <span>{copiedType === "csv" ? "Copied CSV" : "Copy CSV"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer weight="bold" className="size-3.5 text-zinc-400" />
            <span>Print Sheet</span>
          </button>
        </div>

        {/* Scrollable Preview */}
        <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2 text-xs">
          {teams.map((t) => (
            <div
              key={t.id || t.team_number}
              className="flex items-center justify-between py-1.5 px-2 rounded bg-zinc-900/60 border border-zinc-850"
            >
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 font-semibold text-[11px]">
                  #{String(t.team_number).padStart(2, "0")}
                </span>
                <span className="font-semibold text-zinc-200">{t.team_name}</span>
              </div>
              <div>
                {t.team_code && !t.is_code_flushed ? (
                  <span className="px-2.5 py-0.5 rounded bg-zinc-900 border border-[#ff5500]/50 text-[#ff5500] font-bold text-xs tracking-wider">
                    {t.team_code}
                  </span>
                ) : (
                  <span className="text-zinc-500 text-[11px] italic">Flushed</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-zinc-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

