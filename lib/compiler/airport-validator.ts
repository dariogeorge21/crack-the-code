/**
 * Validates whether program output satisfies the Airport Security Checkpoint challenge (Round 3)
 */
export function checkAirportSolution(output: string): {
  isCorrect: boolean;
  hasAccessCode: boolean;
} {
  if (!output) return { isCorrect: false, hasAccessCode: false };

  const lines = output
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Check if access code '41' is present anywhere as a distinct token or line
  const hasAccessCode = lines.some((l) => l === "41" || l.endsWith("41") || /\b41\b/.test(l));

  // Check for expected passenger names
  const expectedNames = ["Rahul", "Anu", "Maria", "John"];
  const matchesNames = expectedNames.every((name) =>
    lines.some((l) => l.toLowerCase().includes(name.toLowerCase()))
  );

  const isCorrect = hasAccessCode && (matchesNames || lines.length >= 2);

  return { isCorrect, hasAccessCode };
}
