"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Team } from "@/types";
import { SESSION_STORAGE_KEY } from "@/constants";

export interface UseLevel2AuthReturn {
  isLoadingAuth: boolean;
  activeTeam: Team | null;
  isLocked: boolean;
  lockReason: string;
  setActiveTeam: React.Dispatch<React.SetStateAction<Team | null>>;
}

export function useLevel2Auth(): UseLevel2AuthReturn {
  const router = useRouter();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function verifyAccess() {
      try {
        const savedCode = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!savedCode) {
          if (isMounted) {
            setIsLocked(true);
            setLockReason("NO ACTIVE TEAM SESSION FOUND. YOU MUST FIRST LOG IN WITH YOUR ASSIGNED TEAM CODE.");
            setIsLoadingAuth(false);
          }
          return;
        }

        const res = await fetch("/api/game/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: savedCode }),
        });

        const data = await res.json();
        if (!res.ok || !data.success || !data.team) {
          if (isMounted) {
            setIsLocked(true);
            setLockReason(data.error || "INVALID OR EXPIRED TEAM CODE.");
            setIsLoadingAuth(false);
          }
          return;
        }

        const team: Team = data.team;
        if (isMounted) {
          setActiveTeam(team);
        }

        // ACCESS CONTROL & AUTO-FORWARD:
        // 1. If team has already cleared Round 3 (Tier 4 or completed), forward directly to Level 4!
        if (team.current_level >= 4) {
          router.replace("/level4");
          return;
        }

        // 2. If team has already completed Round 2 (Tier 3), forward directly to Round 3!
        if (team.current_level >= 3) {
          router.replace("/level3");
          return;
        }

        // 2. If team has not cleared Level 1 yet, redirect to Level 1
        if (!team.current_level || team.current_level < 2) {
          router.replace("/");
          return;
        }

        // Passed clearance
        if (isMounted) {
          setIsLocked(false);
        }
      } catch (err) {
        console.error("Authentication check error:", err);
        if (isMounted) {
          setIsLocked(true);
          setLockReason("UNABLE TO VERIFY CLEARANCE CREDENTIALS. CHECK NETWORK CONNECTION.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    }

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return {
    isLoadingAuth,
    activeTeam,
    isLocked,
    lockReason,
    setActiveTeam,
  };
}

