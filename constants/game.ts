import { SupportedLanguage } from "@/types";

export const TOTAL_TEAMS = 11;

export const SESSION_STORAGE_KEY = "crack_the_lock_session_code";

export const MASTER_CODE_LENGTH = 10;

export const ROUND_ACCESS_CODES = {
  ROUND_2: "88",
  ROUND_3: "41",
} as const;

export const ROUND1_VALID_PAIRS: Record<string, string> = {
  A: "POINTER",
  B: "TREE",
  C: "ROOT",
  D: "PRIORITY QUEUE",
  E: "SORTING",
  F: "BUBBLE SORT",
  G: "SELECTION SORT",
  H: "INSERTION SORT",
  I: "LINEAR SEARCH",
  J: "HASHING",
  K: "LINKED LIST",
} as const;

export function normalizeRound1Input(val: string): string {
  return (val || "").trim().toUpperCase().replace(/\s+/g, " ");
}

export function isRound1PairValid(letter: string, answer: string): boolean {
  const normLetter = (letter || "").trim().toUpperCase();
  const normAnswer = normalizeRound1Input(answer);
  return Boolean(normLetter && ROUND1_VALID_PAIRS[normLetter] === normAnswer);
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
