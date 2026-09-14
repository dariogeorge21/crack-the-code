/**
 * Format total elapsed seconds into human-readable duration
 * e.g., "02m 14s" or "1h 05m 22s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins < 10 ? "0" : ""}${remMins}m ${secs < 10 ? "0" : ""}${secs}s`;
  }
  return `${mins < 10 ? "0" : ""}${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
}

/**
 * Format active start timestamp into live running duration
 */
export function getLiveDuration(startedAt: string | null, currentMs: number = Date.now()): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const diffSec = Math.max(0, Math.floor((currentMs - start) / 1000));
  return formatDuration(diffSec);
}

/**
 * Format seconds for in-game HUD displays (HH:MM:SS or MM:SS)
 */
export function formatTimer(totalSeconds: number, forceHours: boolean = false): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (forceHours || hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
