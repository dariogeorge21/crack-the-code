"use client";

import React from "react";
import { X, ShieldCheck, ArrowClockwise, CircleNotch } from "@phosphor-icons/react";
import { useAdminDashboard } from "@/hooks";
import {
  AdminStats,
  AdminToolbar,
  AdminTableView,
  AdminCardView,
  AdminExportModal,
  AdminResetModal,
  AdminToast,
} from "@/components/admin";

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminDashboardModal({ isOpen, onClose }: AdminDashboardModalProps) {
  const {
    nowMs,
    teams,
    filteredTeams,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    showUnlockedOnly,
    setShowUnlockedOnly,
    rowCodeToggles,
    toggleRowCode,
    expandedTeamId,
    toggleExpandedTeam,
    isCodeFlushed,
    activeTeams,
    completedTeams,
    levelCounts,
    leaderTeam,
    isGenerating,
    handleGenerateTeams,
    isResetting,
    showResetModal,
    setShowResetModal,
    handleConfirmReset,
    showExportModal,
    setShowExportModal,
    copiedCode,
    copyToClipboard,
    toast,
    dismissToast,
    showToast,
    fetchTeams,
  } = useAdminDashboard();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-4 sm:p-6 font-mono text-white max-h-[92vh] flex flex-col overflow-hidden">
        {/* Toast Notification inside modal */}
        <AdminToast toast={toast} onDismiss={dismissToast} />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff5500]/15 border border-[#ff5500]/40 flex items-center justify-center text-[#ff5500]">
              <ShieldCheck weight="bold" className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Central Telemetry Console
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#ff5500]/15 text-[#ff5500] border border-[#ff5500]/30 font-semibold">
                  ASTHRA 11.0
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                11-Teams Live Game Monitoring &amp; Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchTeams(true)}
              disabled={loading}
              title="Refresh data"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            >
              <ArrowClockwise weight="bold" className={`size-4 ${loading ? "animate-spin text-[#ff5500]" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X weight="bold" className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Flushed Notice Banner */}
          {isCodeFlushed && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/60 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
              <span className="font-semibold">
                Access codes are flushed. Click &quot;Generate Codes&quot; to issue 3-digit credentials.
              </span>
              <button
                type="button"
                onClick={handleGenerateTeams}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded bg-[#ff5500] hover:bg-[#ff772a] text-black font-bold text-[11px] uppercase cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isGenerating && <CircleNotch weight="bold" className="size-3.5 animate-spin" />}
                <span>{isGenerating ? "Generating..." : "Generate Now"}</span>
              </button>
            </div>
          )}

          {/* Stats KPI */}
          <AdminStats
            totalTeams={teams.length}
            activeCount={activeTeams.length}
            completedCount={completedTeams.length}
            levelCounts={levelCounts}
            isCodeFlushed={isCodeFlushed}
            leaderTeam={leaderTeam}
            nowMs={nowMs}
          />

          {/* Toolbar */}
          <AdminToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showUnlockedOnly={showUnlockedOnly}
            onToggleShowUnlockedOnly={() => setShowUnlockedOnly(!showUnlockedOnly)}
            isCodeFlushed={isCodeFlushed}
            isGenerating={isGenerating}
            onGenerateTeams={handleGenerateTeams}
            onOpenExportModal={() => setShowExportModal(true)}
            onOpenResetModal={() => setShowResetModal(true)}
            totalCounts={{
              all: teams.length,
              active: activeTeams.length,
              level2: teams.filter((t) => t.current_level >= 2 && t.current_level < 4 && !t.is_finished).length,
              level4: teams.filter((t) => t.current_level === 4 && !t.is_finished).length,
              completed: completedTeams.length,
              idle: teams.filter((t) => t.started_at === null).length,
            }}
          />

          {/* Table or Card View */}
          <div>
            {viewMode === "table" ? (
              <AdminTableView
                teams={filteredTeams}
                nowMs={nowMs}
                showUnlockedOnly={showUnlockedOnly}
                rowCodeToggles={rowCodeToggles}
                onToggleRowCode={toggleRowCode}
                expandedTeamId={expandedTeamId}
                onToggleExpandedTeam={toggleExpandedTeam}
                copiedCode={copiedCode}
                onCopy={copyToClipboard}
                onClearFilters={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
              />
            ) : (
              <AdminCardView
                teams={filteredTeams}
                nowMs={nowMs}
                showUnlockedOnly={showUnlockedOnly}
                rowCodeToggles={rowCodeToggles}
                onToggleRowCode={toggleRowCode}
                expandedTeamId={expandedTeamId}
                onToggleExpandedTeam={toggleExpandedTeam}
                copiedCode={copiedCode}
                onCopy={copyToClipboard}
                onClearFilters={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
              />
            )}
          </div>
        </div>

        {/* Child Modals */}
        <AdminExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          teams={teams}
          onShowToast={showToast}
        />

        <AdminResetModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={handleConfirmReset}
          isResetting={isResetting}
        />
      </div>
    </div>
  );
}
