"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  ShieldCheck, 
  ArrowClockwise, 
  Trash, 
  X, 
  Warning, 
  Check, 
  Copy, 
  DownloadSimple, 
  Terminal, 
  Key, 
  Users, 
  Timer, 
  Cpu, 
  Sparkle,
  Eye,
  EyeSlash
} from "@phosphor-icons/react";
import { AdminTeamData } from "@/types";
import { getLiveDuration } from "@/lib/time";
import { getMaskedCode } from "@/lib/code-masking";

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminDashboardModal({ isOpen, onClose }: AdminDashboardModalProps) {
  // Live continuous clock tick (1s)
  const [nowMs, setNowMs] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [teams, setTeams] = useState<AdminTeamData[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState<boolean>(false);
  const [rowCodeToggles, setRowCodeToggles] = useState<Record<string, boolean>>({});

  const toggleRowCode = (id: string) => {
    setRowCodeToggles((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? showUnlockedOnly),
    }));
  };

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      if (data?.teams) {
        setTeams(data.teams);
      }
    } catch (err) {
      console.error("fetch teams error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen, fetchTeams]);

  // Auto polling every 4 seconds
  useEffect(() => {
    if (!isOpen || !autoPoll) return;
    const interval = setInterval(fetchTeams, 4000);
    return () => clearInterval(interval);
  }, [isOpen, autoPoll, fetchTeams]);

  if (!isOpen) return null;

  const handleGenerateTeams = async () => {
    setIsGenerating(true);
    setActionNotice(null);
    try {
      const res = await fetch("/api/admin/generate-teams", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionNotice("11 TEAMS & 3-DIGIT CODES GENERATED SUCCESSFULLY");
        fetchTeams();
      } else {
        setActionNotice("FAILED TO GENERATE TEAMS");
      }
    } catch {
      setActionNotice("ERROR CONNECTING TO SERVER");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/reset-game", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setShowResetConfirm(false);
        setActionNotice("GAME RESET COMPLETE // ALL TEAMS LOGGED OUT & MASTER KEYS CLEARED");
        fetchTeams();
      } else {
        alert("Failed to reset game: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Error resetting game");
    } finally {
      setIsResetting(false);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const printOrCopyAllCodes = () => {
    const list = teams
      .map((t) => `${t.team_name} : [CODE: ${t.team_code}]`)
      .join("\n");
    navigator.clipboard.writeText(list);
    alert("COPIED ALL 11 TEAM CODES TO CLIPBOARD:\n\n" + list);
  };

  // Quick stats
  const activeCount = teams.filter((t) => t.started_at !== null).length;
  const clearedCount = teams.filter((t) => t.current_level >= 2).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-[#0a0a0d] border-2 border-[#ff5500] shadow-[12px_12px_0px_0px_#ffffff] rounded-none p-4 sm:p-6 font-mono text-white max-h-[95vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#ff5500] flex items-center justify-center text-black font-black">
              <ShieldCheck weight="bold" className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-widest uppercase text-white">
                  CENTRAL TELEMETRY // ADMIN COMMAND
                </h2>
                <span className="px-2 py-0.5 bg-[#ff5500]/10 border border-[#ff5500]/50 text-[#ff5500] text-[10px] font-bold">
                  ASTHRA 11.0
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Authorized Session: 18092026 // Real-time 11 Teams Game Monitoring
              </div>
            </div>
          </div>

          {/* Close Window */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin dashboard"
            className="w-9 h-9 bg-neutral-900 border border-neutral-700 hover:border-[#ff5500] hover:text-[#ff5500] flex items-center justify-center text-neutral-400 transition-colors self-end sm:self-auto cursor-pointer"
          >
            <X weight="bold" className="size-5" />
          </button>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="mb-4 p-3 bg-[#ff5500]/20 border border-[#ff5500] text-[#ff5500] text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-bold">
              <Sparkle weight="bold" className="size-4" />
              <span>{actionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 shrink-0">
          <div className="p-3 bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase">Total Teams</span>
            <span className="text-xl font-black text-white">{teams.length}</span>
          </div>
          <div className="p-3 bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase">In Session</span>
            <span className="text-xl font-black text-[#ff5500]">{activeCount} / 11</span>
          </div>
          <div className="p-3 bg-neutral-950 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block uppercase">Level 2 Unlocked</span>
            <span className="text-xl font-black text-emerald-400">{clearedCount} / 11</span>
          </div>
          <div className="p-3 bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase">Telemetry Feed</span>
              <span className="text-xs font-bold text-neutral-300">
                {autoPoll ? "LIVE (4s)" : "MANUAL"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoPoll(!autoPoll)}
              className={`px-2 py-1 text-[10px] font-bold border ${
                autoPoll ? "bg-[#ff5500] text-black border-[#ff5500]" : "bg-neutral-900 text-neutral-400 border-neutral-700"
              }`}
            >
              {autoPoll ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Control Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-3 border-b border-neutral-800 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Generate Teams Button */}
            <button
              type="button"
              onClick={handleGenerateTeams}
              disabled={isGenerating}
              className="py-2 px-3.5 bg-[#ff5500] hover:bg-white text-black font-black uppercase transition-all shadow-[2px_2px_0px_0px_#ffffff] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Cpu weight="bold" className="size-4" />
              <span>{isGenerating ? "GENERATING..." : "GENERATE TEAMS & CODES"}</span>
            </button>

            {/* Copy All Codes */}
            <button
              type="button"
              onClick={printOrCopyAllCodes}
              className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <Copy weight="bold" className="size-3.5" />
              <span>EXPORT CODES</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={fetchTeams}
              disabled={loading}
              className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowClockwise weight="bold" className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>REFRESH</span>
            </button>

            {/* Eye Toggle Button: Unlocked vs Full Codes */}
            <button
              type="button"
              onClick={() => setShowUnlockedOnly((prev) => !prev)}
              className={`py-2 px-3 border font-black uppercase flex items-center gap-1.5 cursor-pointer transition-all ${
                showUnlockedOnly
                  ? "bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[2px_2px_0px_0px_#10b981]"
                  : "bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300"
              }`}
              title="Toggle between showing unlocked digits only vs full master codes"
            >
              {showUnlockedOnly ? (
                <EyeSlash weight="bold" className="size-3.5 text-emerald-400" />
              ) : (
                <Eye weight="bold" className="size-3.5 text-[#ff5500]" />
              )}
              <span>{showUnlockedOnly ? "SHOWING UNLOCKED ONLY" : "SHOW UNLOCKED ONLY"}</span>
            </button>
          </div>

          {/* Reset Game Button */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="py-2 px-3.5 bg-red-950/80 hover:bg-red-900 border border-red-600/70 text-red-300 hover:text-white font-black uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash weight="bold" className="size-4 text-red-400" />
            <span>RESET GAME</span>
          </button>
        </div>

        {/* Scrollable Teams Telemetry Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1 border border-neutral-800">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead className="bg-neutral-950 sticky top-0 border-b border-neutral-800 text-[10px] uppercase text-neutral-400">
              <tr>
                <th className="p-3">Team</th>
                <th className="p-3">3-Digit Code</th>
                <th className="p-3">Status</th>
                <th className="p-3">Current Tier</th>
                <th className="p-3">Time Taken</th>
                <th className="p-3">Code Got</th>
                <th className="p-3">Round 1 Answer</th>
                <th className="p-3">
                  <div className="flex items-center gap-2">
                    <span>{showUnlockedOnly ? "Unlocked Team Code" : "10-Digit Master Code"}</span>
                    <button
                      type="button"
                      onClick={() => setShowUnlockedOnly((prev) => !prev)}
                      title={showUnlockedOnly ? "Switch to full master codes" : "Switch to unlocked digits only"}
                      className={`p-1 border rounded transition-colors cursor-pointer ${
                        showUnlockedOnly
                          ? "bg-emerald-950 border-emerald-500 text-emerald-400 hover:bg-emerald-900"
                          : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500"
                      }`}
                    >
                      {showUnlockedOnly ? (
                        <EyeSlash weight="bold" className="size-3.5" />
                      ) : (
                        <Eye weight="bold" className="size-3.5" />
                      )}
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {teams.map((t) => (
                <tr key={t.id || t.team_number} className="hover:bg-neutral-950/60 transition-colors">
                  {/* Team Name */}
                  <td className="p-3 font-bold text-white whitespace-nowrap">
                    {t.team_name}
                  </td>

                  {/* Team Code with Quick Copy */}
                  <td className="p-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(t.team_code, t.id)}
                      title="Click to copy code"
                      className="px-2.5 py-1 bg-neutral-900 border border-[#ff5500]/60 hover:border-[#ff5500] text-[#ff5500] font-black text-sm tracking-widest flex items-center gap-1.5 group cursor-pointer"
                    >
                      <span>{t.team_code}</span>
                      {copiedCode === t.id ? (
                        <Check weight="bold" className="size-3 text-emerald-400" />
                      ) : (
                        <Copy weight="bold" className="size-3 opacity-40 group-hover:opacity-100" />
                      )}
                    </button>
                  </td>

                  {/* Status Badge */}
                  <td className="p-3 whitespace-nowrap">
                    {t.current_level >= 4 ? (
                      <span className="px-2 py-0.5 bg-purple-950 text-purple-400 border border-purple-500/50 text-[10px] font-bold">
                        L4 UNLOCKED
                      </span>
                    ) : t.current_level >= 3 ? (
                      <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/50 text-[10px] font-bold">
                        L3 UNLOCKED
                      </span>
                    ) : t.current_level >= 2 ? (
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold">
                        L2 UNLOCKED
                      </span>
                    ) : t.started_at ? (
                      <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-500/50 text-[10px] font-bold">
                        IN ROUND 1
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-neutral-900 text-neutral-500 border border-neutral-800 text-[10px]">
                        IDLE
                      </span>
                    )}
                  </td>

                  {/* Level */}
                  <td className="p-3 whitespace-nowrap">
                    <span className="font-bold text-neutral-200">
                      Level 0{t.current_level}
                    </span>
                  </td>

                  {/* Time Taken & Split Times */}
                  <td className="p-3 whitespace-nowrap">
                    {t.started_at ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 font-mono text-[#ff5500] font-black text-sm">
                          {t.current_level >= 4 ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                              <span>{t.total_time_formatted || t.time_taken_formatted}</span>
                              <span className="text-[9px] px-1 py-0.2 bg-purple-950 border border-purple-500/50 text-purple-400 font-bold tracking-wider">
                                DONE
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              <span>{getLiveDuration(t.started_at)}</span>
                              <span className="text-[9px] px-1 py-0.2 bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-bold tracking-wider">
                                LIVE
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-0.5 text-[10px] font-mono">
                          {t.l1_time_formatted ? (
                            <div className="flex items-center gap-1.5 text-neutral-400">
                              <span className="text-neutral-500 font-bold">L1 Split:</span>
                              <span className="text-neutral-200 font-bold">{t.l1_time_formatted}</span>
                            </div>
                          ) : t.current_level === 1 ? (
                            <div className="flex items-center gap-1.5 text-amber-400/80">
                              <span className="text-amber-500/70 font-bold">L1:</span>
                              <span className="italic">{getLiveDuration(t.started_at)} (in progress)</span>
                            </div>
                          ) : null}

                          {t.l2_time_formatted ? (
                            <div className="flex items-center gap-1.5 text-cyan-400">
                              <span className="text-cyan-500 font-bold">L2 Split:</span>
                              <span className="text-cyan-300 font-bold">{t.l2_time_formatted}</span>
                            </div>
                          ) : t.current_level === 2 && t.completed_level1_at ? (
                            <div className="flex items-center gap-1.5 text-cyan-400/80">
                              <span className="text-cyan-500/70 font-bold">L2:</span>
                              <span className="italic">{getLiveDuration(t.completed_level1_at)} (in progress)</span>
                            </div>
                          ) : null}

                          {t.l3_time_formatted ? (
                            <div className="flex items-center gap-1.5 text-purple-400">
                              <span className="text-purple-500 font-bold">L3 Split:</span>
                              <span className="text-purple-300 font-bold">{t.l3_time_formatted}</span>
                            </div>
                          ) : t.current_level === 3 && (t.completed_level2_at || t.l2_time_formatted) ? (
                            <div className="flex items-center gap-1.5 text-purple-400/80">
                              <span className="text-purple-500/70 font-bold">L3:</span>
                              <span className="italic">{getLiveDuration(t.completed_level2_at || null)} (in progress)</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <span className="text-neutral-500 font-mono text-xs">
                        — IDLE —
                      </span>
                    )}
                  </td>

                  {/* Code They Got (First Number) */}
                  <td className="p-3 whitespace-nowrap">
                    {t.first_digit !== null ? (
                      <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-white font-bold">
                        [{t.first_digit}]
                      </span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>

                  {/* Round 1 Answer */}
                  <td className="p-3 max-w-[200px] truncate text-neutral-300" title={t.round1_answer || ""}>
                    {t.round1_answer || <span className="text-neutral-600">—</span>}
                  </td>

                  {/* 10-Digit Master Code / Unlocked Digits */}
                  <td className="p-3 whitespace-nowrap">
                    {(() => {
                      const isUnlockedOnly = rowCodeToggles[t.id] ?? showUnlockedOnly;
                      const masked = getMaskedCode(t);
                      const displayCode = isUnlockedOnly ? masked : t.master_code;

                      if (!displayCode) {
                        return <span className="text-neutral-600 text-xs">— NOT GENERATED —</span>;
                      }

                      return (
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 font-black tracking-widest text-xs select-all ${
                              isUnlockedOnly
                                ? "bg-emerald-950/50 border border-emerald-500 text-emerald-400"
                                : "bg-neutral-950 border border-[#ff5500] text-[#ff5500]"
                            }`}
                          >
                            {displayCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRowCode(t.id)}
                            title={isUnlockedOnly ? "Show full 10-digit code" : "Show unlocked code only"}
                            className={`p-1 border rounded transition-colors cursor-pointer ${
                              isUnlockedOnly
                                ? "bg-emerald-950 border-emerald-500/80 text-emerald-400 hover:bg-emerald-900"
                                : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500"
                            }`}
                          >
                            {isUnlockedOnly ? (
                              <EyeSlash weight="bold" className="size-3 text-emerald-400" />
                            ) : (
                              <Eye weight="bold" className="size-3 text-neutral-400" />
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reset Confirmation Dialog Overlay */}
        {showResetConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#0e0e12] border-2 border-red-500 shadow-[8px_8px_0px_0px_#ff0000] p-6 text-white font-mono space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                <Warning weight="bold" className="size-6 text-red-500" />
                <h3 className="text-sm font-black uppercase text-red-400 tracking-wider">
                  CONFIRM GAME WIPE & RESET
                </h3>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Are you sure you want to reset the competition?
              </p>

              <ul className="text-[11px] text-neutral-400 list-disc pl-5 space-y-1">
                <li>All 11 team levels will be reset to Level 1.</li>
                <li>Elapsed time clocks will be cleared.</li>
                <li>Submitted Round 1 answers and 10-digit master keys will be erased.</li>
                <li>All active participant browsers will be logged out immediately.</li>
              </ul>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="w-1/2 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-300 uppercase cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleConfirmReset}
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? "RESETTING..." : "YES, RESET ALL"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
