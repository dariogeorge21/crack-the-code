import { SupportedLanguage } from "@/types";

export const TOTAL_TEAMS = 11;

export const SESSION_STORAGE_KEY = "crack_the_lock_session_code";

export const MASTER_CODE_LENGTH = 10;

export const ROUND_ACCESS_CODES = {
  ROUND_2: "88",
  ROUND_3: "41",
} as const;

export const ROUND1_VALID_PAIRS: Record<string, string> = {
  "0": "HARD DISK",
  "1": "ALU",
  "2": "CPU",
  "3": "RAM",
  "4": "CACHE MEMORY",
  "5": "SMPS",
  "6": "SSD",
  "7": "CONTROL UNIT",
  "8": "MOTHER BOARD",
  "9": "ROM",
} as const;

export function normalizeRound1Input(val: string): string {
  return (val || "").trim().toUpperCase().replace(/\s+/g, " ");
}

export function isRound1PairValid(digitOrKey: string | number, answer: string): boolean {
  if (digitOrKey === null || digitOrKey === undefined) return false;
  const normKey = digitOrKey.toString().trim();
  const normAnswer = normalizeRound1Input(answer);
  if (!(normKey in ROUND1_VALID_PAIRS)) return false;

  const expected = ROUND1_VALID_PAIRS[normKey];
  if (expected === normAnswer) return true;

  // Resilient check stripping spaces/hyphens (e.g. "MOTHERBOARD" matches "MOTHER BOARD")
  const strip = (s: string) => s.replace(/[\s\-_]/g, "");
  return strip(expected) === strip(normAnswer);
}

export const STARTER_CODES: Record<SupportedLanguage, string> = {
  python: `# Code here
`,

  c: `#include <stdio.h>

int main() {
    // Your code here

    return 0;
}
`,

  cpp: `#include <iostream>

using namespace std;

int main() {
    // Your code here

    return 0;
}
`,

  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Your code here

    }
}
`,
};
