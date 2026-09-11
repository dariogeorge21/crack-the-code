"use client";

import { useState, useEffect } from "react";

/**
 * Continuous mission clock hook anchored to an ISO UTC start timestamp
 */
export function useMissionTimer(startedAt: string | null | undefined): number {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(startedAt).getTime();

    const updateClock = () => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsedSeconds;
}
