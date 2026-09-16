import { SupportedLanguage } from "@/types";

/**
 * Validates whether program output satisfies the Diamond Star Pattern challenge (Round 2)
 */
export function checkDiamondPattern(output: string): {
  isCorrect: boolean;
  hasAccessCode: boolean;
  reason?: string;
} {
  if (!output || typeof output !== "string") {
    return { isCorrect: false, hasAccessCode: false, reason: "Empty output" };
  }

  // Split lines, expand tabs, trim trailing whitespace
  const allLines = output.split(/\r?\n/);

  // Filter only lines that contain at least one asterisk '*'
  const starLines = allLines
    .map((l) => l.replace(/\t/g, "    ").replace(/\s+$/, ""))
    .filter((l) => l.includes("*"));

  if (starLines.length < 3) {
    return {
      isCorrect: false,
      hasAccessCode: false,
      reason: `Too few star lines (found ${starLines.length}, expected at least 3 for a diamond)`,
    };
  }

  const L = starLines.length;

  // Extract metrics for each line
  const metrics = starLines.map((line, idx) => {
    const starCount = (line.match(/\*/g) || []).length;
    const firstStar = line.indexOf("*");
    const lastStar = line.lastIndexOf("*");
    const width = lastStar - firstStar;
    return { idx, line, starCount, firstStar, lastStar, width };
  });

  const isOdd = L % 2 === 1;
  const midTop = isOdd ? Math.floor(L / 2) : L / 2 - 1;
  const midBottom = isOdd ? midTop : L / 2;

  const maxStars = Math.max(...metrics.map((m) => m.starCount));
  const maxWidth = Math.max(...metrics.map((m) => m.width));

  const isHollow = metrics.every((m) => m.starCount <= 2);

  if (isHollow) {
    // Hollow diamond validation
    if (metrics[midTop].width !== maxWidth && metrics[midBottom].width !== maxWidth) {
      return { isCorrect: false, hasAccessCode: false, reason: "Hollow diamond width does not peak at center" };
    }
    for (let i = 0; i < midTop; i++) {
      if (metrics[i].width > metrics[i + 1].width) {
        return { isCorrect: false, hasAccessCode: false, reason: `Hollow diamond width not increasing at line ${i + 1}` };
      }
    }
    for (let i = 0; i < Math.floor(L / 2); i++) {
      const mirrorIdx = L - 1 - i;
      if (Math.abs(metrics[i].width - metrics[mirrorIdx].width) > 2) {
        return { isCorrect: false, hasAccessCode: false, reason: "Hollow diamond width not symmetric" };
      }
    }
  } else {
    // Solid / dense / spaced diamond validation
    // Center must have maximum stars
    if (metrics[midTop].starCount !== maxStars && metrics[midBottom].starCount !== maxStars) {
      return { isCorrect: false, hasAccessCode: false, reason: "Peak star count is not at the center line(s)" };
    }

    // Top half must be non-decreasing
    for (let i = 0; i < midTop; i++) {
      if (metrics[i].starCount >= metrics[i + 1].starCount) {
        return { isCorrect: false, hasAccessCode: false, reason: `Top half star count not strictly increasing at line ${i + 1}` };
      }
    }

    // Vertical symmetry: line i must have same star count as line (L - 1 - i)
    for (let i = 0; i < Math.floor(L / 2); i++) {
      const mirrorIdx = L - 1 - i;
      if (metrics[i].starCount !== metrics[mirrorIdx].starCount) {
        return {
          isCorrect: false,
          hasAccessCode: false,
          reason: `Star count mismatch between line ${i + 1} (${metrics[i].starCount}) and line ${mirrorIdx + 1} (${metrics[mirrorIdx].starCount})`,
        };
      }
    }
  }

  // Indentation centering check: first star should move leftward towards the center
  let indentationSymmetric = true;
  for (let i = 0; i < Math.floor(L / 2); i++) {
    const mirrorIdx = L - 1 - i;
    const diff = Math.abs(metrics[i].firstStar - metrics[mirrorIdx].firstStar);
    if (diff > 3) {
      indentationSymmetric = false;
    }
  }

  let centersCorrectly = true;
  for (let i = 0; i < midTop; i++) {
    if (metrics[i].firstStar < metrics[i + 1].firstStar) {
      centersCorrectly = false;
    }
  }

  if (!indentationSymmetric && !centersCorrectly) {
    return { isCorrect: false, hasAccessCode: false, reason: "Indentation does not form a diamond shape" };
  }

  return { isCorrect: true, hasAccessCode: true };
}

/**
 * Strips comments and string literals from source code to prevent
 * false positives where loop keywords are embedded in comments or string literals.
 */
export function stripCommentsAndStrings(code: string, language: SupportedLanguage): string {
  if (!code || typeof code !== "string") return "";

  const normLang = (language || "python").toLowerCase() as SupportedLanguage;

  if (normLang === "python") {
    // 1. Python triple-quoted strings ("""...""" or '''...''')
    let clean = code.replace(/"""[\s\S]*?"""/g, '""');
    clean = clean.replace(/'''[\s\S]*?'''/g, "''");
    // 2. Python single/double quoted strings
    clean = clean.replace(/"(?:\\.|[^"\\])*"/g, '""');
    clean = clean.replace(/'(?:\\.|[^'\\])*'/g, "''");
    // 3. Python line comments (# ...)
    clean = clean.replace(/#[^\r\n]*/g, " ");
    return clean;
  } else {
    // C, C++, Java
    // 1. String literals ("...")
    let clean = code.replace(/"(?:\\.|[^"\\])*"/g, '""');
    // 2. Character literals ('...')
    clean = clean.replace(/'(?:\\.|[^'\\])*'/g, "''");
    // 3. Block comments (/* ... */)
    clean = clean.replace(/\/\*[\s\S]*?\*\//g, " ");
    // 4. Line comments (// ...)
    clean = clean.replace(/\/\/[^\r\n]*/g, " ");
    return clean;
  }
}

/**
 * Checks whether the submitted code contains at least one genuine loop syntax.
 * Supported languages: python, c, cpp, java.
 *
 * Returns true if at least one loop construct is found in actual executable code,
 * false otherwise.
 */
export function checkCodeHasLoop(language: SupportedLanguage, code: string): boolean {
  if (!code || typeof code !== "string") return false;

  const clean = stripCommentsAndStrings(code, language);
  const normLang = (language || "python").toLowerCase() as SupportedLanguage;

  if (normLang === "python") {
    // Python reserved loop keywords:
    // 'for' (e.g. for i in range(...), [x for x in ...])
    // 'while' (e.g. while condition:, while True:)
    const hasFor = /\bfor\b/.test(clean);
    const hasWhile = /\bwhile\b/.test(clean);
    return hasFor || hasWhile;
  } else {
    // C, C++, Java loop syntax:
    // for (...)
    // while (...)
    // do { ... } while (...)
    const hasFor = /\bfor\s*\(/.test(clean);
    const hasWhile = /\bwhile\s*\(/.test(clean);
    const hasDoWhile = /\bdo\s*(\{|\b)/.test(clean);
    return hasFor || hasWhile || hasDoWhile;
  }
}

