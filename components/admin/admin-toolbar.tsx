"use client";

import React from "react";
import {
  MagnifyingGlass,
  X,
  Table,
  SquaresFour,
  Cpu,
  Export,
  Trash,
  Eye,
  EyeSlash,
  SortAscending,
} from "@phosphor-icons/react";
import {
  AdminFilterStatus,
  AdminSortOption,
  AdminViewMode,
} from "@/hooks/use-admin-dashboard";

interface AdminToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterStatus: AdminFilterStatus;
  onFilterChange: (status: AdminFilterStatus) => void;
  sortBy: AdminSortOption;
  onSortChange: (sort: AdminSortOption) => void;
  viewMode: AdminViewMode;
  onViewModeChange: (mode: AdminViewMode) => void;
  showUnlockedOnly: boolean;
  onToggleShowUnlockedOnly: () => void;
  isCodeFlushed: boolean;
  isGenerating: boolean;
  onGenerateTeams: () => void;
  onOpenExportModal: () => void;
  onOpenResetModal: () => void;
  totalCounts: {
    all: number;
    active: number;
    level2: number;
    completed: number;
    idle: number;
  };
}

export function AdminToolbar({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  showUnlockedOnly,
  onToggleShowUnlockedOnly,
  isCodeFlushed,
  isGenerating,
  onGenerateTeams,
  onOpenExportModal,
  onOpenResetModal,
  totalCounts,
}: AdminToolbarProps) {
  const filters: { id: AdminFilterStatus; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalCounts.all },
    { id: "active", label: "Active", count: totalCounts.active },
    { id: "level2", label: "Level 2+", count: totalCounts.level2 },
    { id: "completed", label: "Completed", count: totalCounts.completed },
    { id: "idle", label: "Idle", count: totalCounts.idle },
  ];

  return (
    <div className="space-y-3 pb-4 mb-4 border-b border-zinc-800/80 shrink-0 font-mono text-xs">
      {/* Top Row: Search + Filter Tabs + View Mode */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by team name or code..."
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-[#ff5500] text-zinc-200 placeholder:text-zinc-500 outline-none transition-colors text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X weight="bold" className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {filters.map((f) => {
            const isActive = filterStatus === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange(f.id)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#ff5500]/15 border-[#ff5500] text-[#ff5500]"
                    : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive
                      ? "bg-[#ff5500] text-black font-bold"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode & Sort */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-400">
            <SortAscending weight="bold" className="size-3.5 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as AdminSortOption)}
              className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer"
            >
              <option value="number" className="bg-zinc-900 text-white"># Team</option>
              <option value="rank" className="bg-zinc-900 text-white">Leaderboard Rank</option>
              <option value="time" className="bg-zinc-900 text-white">Elapsed Time</option>
              <option value="name" className="bg-zinc-900 text-white">Alphabetical</option>
            </select>
          </div>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              title="Table view"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Table weight="bold" className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("cards")}
              title="Card grid view"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "cards"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <SquaresFour weight="bold" className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Generate Teams & Codes Button */}
          <button
            type="button"
            onClick={onGenerateTeams}
            disabled={isGenerating}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[11px] tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
              isCodeFlushed
                ? "bg-[#ff5500] hover:bg-[#ff772a] text-black shadow-md shadow-[#ff5500]/20"
                : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200"
            }`}
          >
            <Cpu weight="bold" className="size-3.5" />
            <span>{isGenerating ? "Generating..." : "Generate Codes"}</span>
          </button>

          {/* Export Codes Button */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-medium text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Export weight="bold" className="size-3.5 text-zinc-400" />
            <span>Export Codes</span>
          </button>

          {/* Code Visibility Global Toggle */}
          <button
            type="button"
            onClick={onToggleShowUnlockedOnly}
            className={`px-3 py-1.5 rounded-lg border font-medium text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
              showUnlockedOnly
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-400"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300"
            }`}
          >
            {showUnlockedOnly ? (
              <EyeSlash weight="bold" className="size-3.5 text-emerald-400" />
            ) : (
              <Eye weight="bold" className="size-3.5 text-[#ff5500]" />
            )}
            <span>{showUnlockedOnly ? "Unlocked Only" : "Full Master Keys"}</span>
          </button>
        </div>

        {/* Danger: Reset Game Button */}
        <div>
          <button
            type="button"
            onClick={onOpenResetModal}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 hover:border-red-600 text-red-300 hover:text-white font-medium text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash weight="bold" className="size-3.5 text-red-400" />
            <span>Reset Competition</span>
          </button>
        </div>
      </div>
    </div>
  );
}

