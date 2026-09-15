"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AdminTeamData } from "@/types";

export type AdminFilterStatus = "all" | "active" | "level2" | "level3" | "level4" | "completed" | "idle";
export type AdminSortOption = "number" | "rank" | "time" | "name";
export type AdminViewMode = "table" | "cards";

export interface AdminToast {
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export function useAdminDashboard() {
  // Live continuous clock tick (1s) for live timers
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_auth_token") === "admin_authorized_asthra_session";
    }
    return false;
  });

  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Rate Limiting & Lockout State
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  // Telemetry Teams Data
  const [teams, setTeams] = useState<AdminTeamData[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // UI / View States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<AdminFilterStatus>("all");
  const [sortBy, setSortBy] = useState<AdminSortOption>("number");
  const [viewMode, setViewMode] = useState<AdminViewMode>("table");
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [rowCodeToggles, setRowCodeToggles] = useState<Record<string, boolean>>({});
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Modals & Actions
  const [showResetModal, setShowResetModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toast, setToast] = useState<AdminToast | null>(null);

  const showToast = useCallback((message: string, type: AdminToast["type"] = "info") => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Query server for current lockout status on load
  const checkLockoutStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/login");
      const data = await res.json();
      if (data.lockedOut) {
        setLockedOut(true);
        setLockoutSecondsRemaining(data.remainingSeconds);
        setAttemptsRemaining(0);
      } else {
        setLockedOut(false);
        setAttemptsRemaining(data.attemptsRemaining ?? 5);
      }
    } catch {
      // Ignore initial poll errors
    }
  }, []);

  // Check lockout status on mount if not authenticated
  useEffect(() => {
    let ignore = false;
    if (!isAuthenticated) {
      fetch("/api/admin/login")
        .then((res) => res.json())
        .then((data) => {
          if (ignore) return;
          if (data.lockedOut) {
            setLockedOut(true);
            setLockoutSecondsRemaining(data.remainingSeconds);
            setAttemptsRemaining(0);
          } else {
            setLockedOut(false);
            setAttemptsRemaining(data.attemptsRemaining ?? 5);
          }
        })
        .catch(() => {});
    }
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);


  // Lockout Countdown Timer
  useEffect(() => {
    if (!lockedOut || lockoutSecondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setLockoutSecondsRemaining((prev) => {
        if (prev <= 1) {
          setLockedOut(false);
          setAttemptsRemaining(5);
          setAuthError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedOut, lockoutSecondsRemaining]);

  // Fetch telemetry teams
  const fetchTeams = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const res = await fetch("/api/admin/teams");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data?.teams) {
        setTeams(data.teams);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("fetch teams error:", err);
      if (isManual) {
        showToast("Failed to refresh telemetry data", "error");
      }
    } finally {
      if (isManual) setLoading(false);
    }
  }, [showToast]);

  // Initial telemetry fetch when authenticated
  useEffect(() => {
    let ignore = false;
    if (isAuthenticated) {
      fetch("/api/admin/teams")
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data?.teams) {
            setTeams(data.teams);
            setLastUpdated(new Date());
          }
        })
        .catch((err) => console.error("fetch teams error:", err));
    }
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);


  // Telemetry auto-polling every 4 seconds
  useEffect(() => {
    if (!isAuthenticated || !autoPoll) return;
    const interval = setInterval(() => {
      fetchTeams(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoPoll, fetchTeams]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || lockedOut) return;

    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.status === 429 || data.lockedOut) {
        setLockedOut(true);
        setLockoutSecondsRemaining(data.remainingSeconds || 300);
        setAttemptsRemaining(0);
        setAuthError(data.error || "Too many failed attempts. Security lockout active.");
        return;
      }

      if (!res.ok || data.error) {
        setAuthError(data.error || "Authentication failed");
        if (typeof data.attemptsRemaining === "number") {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        return;
      }

      if (data.success) {
        sessionStorage.setItem("admin_auth_token", data.token);
        setIsAuthenticated(true);
        setPassword("");
        setAuthError(null);
        showToast("Authenticated as Coordinator", "success");
      }
    } catch {
      setAuthError("Network error: Unable to reach auth server");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth_token");
    setIsAuthenticated(false);
    setPassword("");
    checkLockoutStatus();
    showToast("Logged out of telemetry session", "info");
  };

  // Toggle code visibility per row
  const toggleRowCode = (id: string) => {
    setRowCodeToggles((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? showUnlockedOnly),
    }));
  };

  // Toggle row expansion for team details drawer
  const toggleExpandedTeam = (id: string) => {
    setExpandedTeamId((prev) => (prev === id ? null : id));
  };

  // Copy code to clipboard with in-app checkmark
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Generate Teams & Codes
  const handleGenerateTeams = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-teams", { method: "POST" });
      if (res.status === 401) {
        setIsAuthenticated(false);
        showToast("Session expired. Please log in again.", "warning");
        return;
      }
      const data = await res.json();
      if (data.success) {
        showToast("11 Teams & 3-digit access codes generated", "success");
        fetchTeams(false);
      } else {
        showToast("Failed to generate teams", "error");
      }
    } catch {
      showToast("Error connecting to server", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset Game
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/reset-game", { method: "POST" });
      if (res.status === 401) {
        setIsAuthenticated(false);
        showToast("Session expired. Please log in again.", "warning");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setShowResetModal(false);
        showToast("Game reset complete. All teams cleared to Level 1", "success");
        fetchTeams(false);
      } else {
        showToast("Failed to reset game: " + (data.error || "Unknown error"), "error");
      }
    } catch {
      showToast("Network error resetting game", "error");
    } finally {
      setIsResetting(false);
    }
  };

  // Derived KPI Metrics
  const isCodeFlushed = useMemo(() => {
    return teams.length === 0 || teams.some((t) => !t.team_code || t.is_code_flushed);
  }, [teams]);

  const activeTeams = useMemo(() => {
    return teams.filter((t) => t.started_at !== null && !t.is_finished && t.current_level < 5);
  }, [teams]);

  const completedTeams = useMemo(() => {
    return teams.filter((t) => t.is_finished || t.current_level >= 5 || Boolean(t.completed_level4_at));
  }, [teams]);

  const levelCounts = useMemo(() => {
    const counts = { l1: 0, l2: 0, l3: 0, l4: 0, completed: 0 };
    for (const t of teams) {
      if (t.is_finished || t.current_level >= 5 || t.completed_level4_at) counts.completed++;
      else if (t.current_level === 4) counts.l4++;
      else if (t.current_level === 3) counts.l3++;
      else if (t.current_level === 2) counts.l2++;
      else if (t.started_at) counts.l1++;
    }
    return counts;
  }, [teams]);

  // Find leading team: Finished teams by rank first, otherwise highest current_level, then lowest total time
  const leaderTeam = useMemo(() => {
    const started = teams.filter((t) => t.started_at !== null);
    if (started.length === 0) return null;

    return [...started].sort((a, b) => {
      const aFinished = a.is_finished || a.current_level >= 5;
      const bFinished = b.is_finished || b.current_level >= 5;
      if (aFinished && !bFinished) return -1;
      if (!aFinished && bFinished) return 1;
      if (aFinished && bFinished) {
        return (a.rank ?? 999) - (b.rank ?? 999);
      }
      if (b.current_level !== a.current_level) {
        return b.current_level - a.current_level;
      }
      const timeA = a.total_time_seconds ?? a.time_taken_seconds ?? Infinity;
      const timeB = b.total_time_seconds ?? b.time_taken_seconds ?? Infinity;
      return timeA - timeB;
    })[0];
  }, [teams]);

  // Filtered & Sorted Teams
  const filteredTeams = useMemo(() => {
    return teams
      .filter((team) => {
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = team.team_name?.toLowerCase().includes(q);
          const matchCode = team.team_code?.toLowerCase().includes(q);
          const matchNumber = `team ${team.team_number}`.includes(q) || `#${team.team_number}`.includes(q);
          if (!matchName && !matchCode && !matchNumber) return false;
        }

        // Status Filter
        if (filterStatus === "active") {
          return team.started_at !== null && !team.is_finished && team.current_level < 5;
        }
        if (filterStatus === "level2") {
          return team.current_level >= 2;
        }
        if (filterStatus === "level3") {
          return team.current_level >= 3;
        }
        if (filterStatus === "level4") {
          return team.current_level >= 4;
        }
        if (filterStatus === "completed") {
          return team.is_finished || team.current_level >= 5 || Boolean(team.completed_level4_at);
        }
        if (filterStatus === "idle") {
          return team.started_at === null;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rank") {
          // Rank: Finished teams first by rank, then by Level desc, then by Time asc
          const aFin = a.is_finished || a.current_level >= 5;
          const bFin = b.is_finished || b.current_level >= 5;
          if (aFin && !bFin) return -1;
          if (!aFin && bFin) return 1;
          if (aFin && bFin) {
            return (a.rank ?? 999) - (b.rank ?? 999);
          }
          if (b.current_level !== a.current_level) {
            return b.current_level - a.current_level;
          }
          const timeA = a.total_time_seconds ?? a.time_taken_seconds ?? (a.started_at ? Infinity : 999999);
          const timeB = b.total_time_seconds ?? b.time_taken_seconds ?? (b.started_at ? Infinity : 999999);
          return timeA - timeB;
        }
        if (sortBy === "time") {
          const timeA = a.total_time_seconds ?? a.time_taken_seconds ?? (a.started_at ? Infinity : 999999);
          const timeB = b.total_time_seconds ?? b.time_taken_seconds ?? (b.started_at ? Infinity : 999999);
          return timeA - timeB;
        }
        if (sortBy === "name") {
          return a.team_name.localeCompare(b.team_name);
        }
        // Default: team_number
        return a.team_number - b.team_number;
      });
  }, [teams, searchQuery, filterStatus, sortBy]);

  return {
    nowMs,
    // Auth
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
    // Telemetry Data
    teams,
    filteredTeams,
    loading,
    autoPoll,
    setAutoPoll,
    lastUpdated,
    fetchTeams,
    // Filter & Search
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
    // KPIs
    isCodeFlushed,
    activeTeams,
    completedTeams,
    levelCounts,
    leaderTeam,
    // Actions & Modals
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
  };
}

