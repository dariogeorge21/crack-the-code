import { NextResponse } from "next/server";
import { executeCode, checkDiamondPattern, checkAirportSolution, checkCodeHasLoop } from "@/lib/compiler";
import { SupportedLanguage } from "@/types";

export async function POST(req: Request) {
  try {
    const { language = "python", code, input = "", round = 2 } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Source code cannot be empty." },
        { status: 400 }
      );
    }

    const targetRound = Number(round) || 2;
    let actualInput = input;
    if (targetRound === 2 && (!actualInput || !actualInput.trim())) {
      actualInput = "5\n";
    }

    const result = await executeCode(language as SupportedLanguage, code, actualInput);

    let isCorrect = false;
    let hasAccessCode = false;
    let accessCode: string | null = null;
    let error = result.error;
    let exitCode = result.exitCode;

    if (targetRound === 2) {
      const hasLoop = checkCodeHasLoop(language as SupportedLanguage, code);
      if (!hasLoop) {
        isCorrect = false;
        hasAccessCode = false;
        accessCode = null;
        exitCode = 1;
        error = "error invalid method";
      } else {
        const diamondCheck = checkDiamondPattern(result.output);
        isCorrect = diamondCheck.isCorrect;
        hasAccessCode = diamondCheck.hasAccessCode;
        accessCode = hasAccessCode ? "88" : null;
      }
    } else if (targetRound === 3) {
      const airportCheck = checkAirportSolution(result.output);
      isCorrect = airportCheck.isCorrect;
      hasAccessCode = airportCheck.hasAccessCode;
      accessCode = hasAccessCode ? "41" : null;
    }

    return NextResponse.json({
      success: true,
      output: result.output,
      error,
      exitCode,
      time: result.time,
      memory: result.memory,
      source: result.source,
      isCorrect,
      hasAccessCode,
      accessCode,
    });
  } catch (err: unknown) {
    console.error("compiler/run error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Code execution failed" },
      { status: 500 }
    );
  }
}
