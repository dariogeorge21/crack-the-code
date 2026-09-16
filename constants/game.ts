import { SupportedLanguage } from "@/types";

export const TOTAL_TEAMS = 11;

export const SESSION_STORAGE_KEY = "crack_the_lock_session_code";

export const MASTER_CODE_LENGTH = 10;

export const ROUND_ACCESS_CODES = {
  ROUND_2: "88",
  ROUND_3: "41",
} as const;

export const ROUND1_VALID_PAIRS: Record<string, string> = {
  "0": "POINTER",
  "1": "TREE",
  "2": "ROOT",
  "3": "PRIORITY QUEUE",
  "4": "SORTING",
  "5": "BUBBLE SORT",
  "6": "SELECTION SORT",
  "7": "INSERTION SORT",
  "8": "LINEAR SEARCH",
  "9": "HASHING",
} as const;

export function normalizeRound1Input(val: string): string {
  return (val || "").trim().toUpperCase().replace(/\s+/g, " ");
}

export function isRound1PairValid(digitOrKey: string | number, answer: string): boolean {
  if (digitOrKey === null || digitOrKey === undefined) return false;
  const normKey = digitOrKey.toString().trim();
  const normAnswer = normalizeRound1Input(answer);
  return Boolean(normKey in ROUND1_VALID_PAIRS && ROUND1_VALID_PAIRS[normKey] === normAnswer);
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
