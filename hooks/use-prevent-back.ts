"use client";

import { useEffect } from "react";

/**
 * Traps browser back-button events (`popstate`) to ensure participant
 * remains anchored in the active competition arena without losing state
 */
export function usePreventBack(): void {
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
}
