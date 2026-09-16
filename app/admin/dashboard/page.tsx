"use client";

import React from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { useAdminDashboard } from "@/hooks";
import {
  AdminHeader,
  AdminStats,
  AdminToolbar,
  AdminTableView,
  AdminCardView,
  AdminExportModal,
  AdminResetModal,
  AdminTeamActionModal,
  AdminLoginView,
  AdminToast,
} from "@/components/admin";

export default function AdminDashboardPage() {
  const {
    nowMs,
    isAuthenticated,
    password,
    setPassword,
    authError,
    isLoggingIn,
    lockedOut,
    lockoutSecondsRemaining,
    attemptsRemaining,
    handleLoginSubmit,
    handleLogout,
    teams,
    filteredTeams,
    loading,
    autoPoll,
    setAutoPoll,
    lastUpdated,
    fetchTeams,
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
    teamActionModal,
    isTeamActionExecuting,
    handleOpenResetTeam,
    handleOpenRevertTeam,
    handleCloseTeamActionModal,
    handleConfirmTeamAction,
    showExportModal,
    setShowExportModal,
    copiedCode,
    copyToClipboard,
    toast,
    dismissToast,
    showToast,
  } = useAdminDashboard();

  // If not authenticated, render clean minimalist login view
  if (!isAuthenticated) {
    return (
      <AdminLoginView
        password={password}
        onPasswordChange={setPassword}
        onSubmit={handleLoginSubmit}
        isLoggingIn={isLoggingIn}
        authError={authError}
        lockedOut={lockedOut}
        lockoutSecondsRemaining={lockoutSecondsRemaining}
        attemptsRemaining={attemptsRemaining}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono p-4 sm:p-6 lg:p-8 flex flex-col selection:bg-[#ff5500] selection:text-white">
      {/* Floating Action / Feedback Toast */}
      <AdminToast toast={toast} onDismiss={dismissToast} />

      {/* Top Header & Live Sync Controls */}
      <AdminHeader
        autoPoll={autoPoll}
        onToggleAutoPoll={() => setAutoPoll(!autoPoll)}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={() => fetchTeams(true)}
        onLogout={handleLogout}
      />

      {/* Flushed Warning Banner if codes are flushed */}
      {isCodeFlushed && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/60 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3 font-mono shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 uppercase tracking-wider">
              Access Codes Flushed:
            </span>
            <span>
              All participant codes are cleared. Generate fresh 3-digit access codes to enable participant logins.
            </span>
          </div>
          <button
            type="button"
            onClick={handleGenerateTeams}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg bg-[#ff5500] hover:bg-[#ff772a] text-black font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isGenerating && <CircleNotch weight="bold" className="size-3.5 animate-spin" />}
            <span>{isGenerating ? "Generating..." : "Generate Codes Now"}</span>
          </button>
        </div>
      )}

      {/* Executive KPI Summary Cards */}
      <AdminStats
        totalTeams={teams.length}
        activeCount={activeTeams.length}
        completedCount={completedTeams.length}
        levelCounts={levelCounts}
        isCodeFlushed={isCodeFlushed}
        leaderTeam={leaderTeam}
        nowMs={nowMs}
      />

      {/* Filter, Search & View Toolbar */}
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
          level2: teams.filter((t) => t.current_level >= 2).length,
          level4: teams.filter((t) => t.current_level === 4 && !t.is_finished).length,
          completed: completedTeams.length,
          idle: teams.filter((t) => t.started_at === null).length,
        }}
      />

      {/* Primary Data Display: Table or Card Grid */}
      <div className="flex-1">
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
            onResetTeam={handleOpenResetTeam}
            onRevertTeam={handleOpenRevertTeam}
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
            onResetTeam={handleOpenResetTeam}
            onRevertTeam={handleOpenRevertTeam}
            onClearFilters={() => {
              setSearchQuery("");
              setFilterStatus("all");
            }}
          />
        )}
      </div>

      {/* Modals */}
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

      <AdminTeamActionModal
        isOpen={teamActionModal.isOpen}
        action={teamActionModal.action}
        team={teamActionModal.team}
        result={teamActionModal.result}
        onClose={handleCloseTeamActionModal}
        onConfirm={handleConfirmTeamAction}
        isLoading={isTeamActionExecuting}
      />
    </div>
  );
}
