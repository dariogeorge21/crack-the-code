import { MASTER_CODE_LENGTH } from "@/constants/game";

/**
 * Computes the masked 10-digit master key based on team's current clearance level:
 * - Level 1: null / not derived (or single digit if lab answer submitted)
 * - Level 2: 1 digit revealed, 9 masked (e.g. 8*********)
 * - Level 3: 3 digits revealed, 7 masked (e.g. 847*******)
 * - Level 4: 6 digits revealed, 4 masked (e.g. 847253****)
 */
export function computeMaskedMasterCode(
  masterCode: string | null | undefined,
  firstDigit: string | number | null | undefined,
  currentLevel: number
): string | null {
  if (!masterCode && (firstDigit === null || firstDigit === undefined)) return null;
  const full = masterCode || (firstDigit !== null && firstDigit !== undefined ? `${firstDigit}${"0".repeat(MASTER_CODE_LENGTH - 1)}` : "");
  if (!full) return null;

  if (currentLevel >= 5) {
    return full.slice(0, 10);
  }
  if (currentLevel >= 4) {
    return full.slice(0, 6) + "****";
  }
  if (currentLevel >= 3) {
    return full.slice(0, 3) + "*******";
  }
  if (currentLevel >= 2) {
    return full.slice(0, 1) + "*********";
  }
  return "**********";
}

/**
 * Universal client-side resolver for team master code masking
 */
export function getMaskedCode(team: {
  masked_master_code?: string | null;
  master_code?: string | null;
  first_digit?: string | number | null;
  current_level: number;
}): string | null {
  if (team.masked_master_code) return team.masked_master_code;
  return computeMaskedMasterCode(team.master_code, team.first_digit, team.current_level);
}
