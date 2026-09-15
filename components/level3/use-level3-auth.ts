"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Team } from "@/types";
import { SESSION_STORAGE_KEY } from "@/constants";

export interface UseLevel3AuthReturn {
  isLoadingAuth: boolean;
  activeTeam: Team | null;
  isLocked: boolean;
  lockReason: string;
  setActiveTeam: React.Dispatch<React.SetStateAction<Team | null>>;
}

export function useLevel3Auth(): UseLevel3AuthReturn {
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
        // 1. If team has already cleared Level 3, redirect to Level 4
        if (team.current_level >= 4) {
          router.replace("/level4");
          return;
        }

        // 2. If team has not reached Level 3 yet, redirect to their active round
        if (!team.current_level || team.current_level < 3) {
          if (team.current_level === 2) {
            router.replace("/level2");
          } else {
            router.replace("/");
          }
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

