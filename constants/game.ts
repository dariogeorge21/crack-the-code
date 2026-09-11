import { SupportedLanguage } from "@/types";

export const TOTAL_TEAMS = 11;

export const SESSION_STORAGE_KEY = "crack_the_lock_session_code";

export const MASTER_CODE_LENGTH = 10;

export const ROUND_ACCESS_CODES = {
  ROUND_2: "88",
  ROUND_3: "41",
} as const;

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
