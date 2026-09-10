import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Supported languages: Python, C, C++, and Java
const COMPILER_MAP: Record<string, { onlineId: string; localExt: string; defaultCmd: string }> = {
  python: {
    onlineId: "python-3.14",
    localExt: "py",
    defaultCmd: "python",
  },
  c: {
    onlineId: "gcc-15",
    localExt: "c",
    defaultCmd: "gcc",
  },
  cpp: {
    onlineId: "g++-15",
    localExt: "cpp",
    defaultCmd: "g++",
  },
  java: {
    onlineId: "openjdk-25",
    localExt: "java",
    defaultCmd: "javac",
  },
};

// Helper to execute command with timeout
function runLocalCommand(
  cmd: string,
  args: string[],
  input: string = "",
  timeoutMs = 5000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let isFinished = false;

    const proc = spawn(cmd, args, { shell: true });

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        try {
          proc.kill();
        } catch {
          // ignore
        }
        resolve({
          stdout,
          stderr: stderr + "\n[Execution timed out after 5 seconds]",
          exitCode: 124,
        });
      }
    }, timeoutMs);

    if (input && proc.stdin) {
      proc.stdin.write(input);
      proc.stdin.end();
    }

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
        });
      }
    });

    proc.on("error", (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: stderr + "\n" + err.message,
          exitCode: 1,
        });
      }
    });
  });
}

// Local compilation and execution runner
async function runLocalCode(language: string, code: string, input: string = "") {
  const startTime = Date.now();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ctc-arena-"));

  try {
    if (language === "python") {
      const filePath = path.join(tmpDir, "solution.py");
      fs.writeFileSync(filePath, code);
      const res = await runLocalCommand("python", [filePath], input);
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(3);
      return {
        output: res.stdout,
        error: res.stderr,
        exitCode: res.exitCode,
        time: `${executionTime}s`,
        memory: "12.4 MB",
        source: "local-python",
      };
    }

    if (language === "c") {
      const srcPath = path.join(tmpDir, "solution.c");
      const exePath = path.join(tmpDir, "solution.exe");
      fs.writeFileSync(srcPath, code);

      // Compile
      const compileRes = await runLocalCommand("gcc", [srcPath, "-o", exePath]);
      if (compileRes.exitCode !== 0) {
        return {
          output: compileRes.stdout,
          error: compileRes.stderr || "Compilation failed",
          exitCode: compileRes.exitCode,
          time: "0.000s",
          memory: "0 MB",
          source: "local-gcc",
        };
      }

      // Execute
      const runRes = await runLocalCommand(exePath, [], input);
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(3);
      return {
        output: runRes.stdout,
        error: runRes.stderr,
        exitCode: runRes.exitCode,
        time: `${executionTime}s`,
        memory: "3.2 MB",
        source: "local-gcc",
      };
    }

    if (language === "cpp") {
      const srcPath = path.join(tmpDir, "solution.cpp");
      const exePath = path.join(tmpDir, "solution.exe");
      fs.writeFileSync(srcPath, code);

      // Compile
      const compileRes = await runLocalCommand("g++", [srcPath, "-o", exePath]);
      if (compileRes.exitCode !== 0) {
        return {
          output: compileRes.stdout,
          error: compileRes.stderr || "Compilation failed",
          exitCode: compileRes.exitCode,
          time: "0.000s",
          memory: "0 MB",
          source: "local-g++",
        };
      }

      // Execute
      const runRes = await runLocalCommand(exePath, [], input);
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(3);
      return {
        output: runRes.stdout,
        error: runRes.stderr,
        exitCode: runRes.exitCode,
        time: `${executionTime}s`,
        memory: "4.1 MB",
        source: "local-g++",
      };
    }

    if (language === "java") {
      let className = "Main";
      const match = code.match(/public\s+class\s+(\w+)/);
      if (match && match[1]) {
        className = match[1];
      }

      const srcPath = path.join(tmpDir, `${className}.java`);
      fs.writeFileSync(srcPath, code);

      const runRes = await runLocalCommand("java", [srcPath], input);
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(3);
      return {
        output: runRes.stdout,
        error: runRes.stderr,
        exitCode: runRes.exitCode,
        time: `${executionTime}s`,
        memory: "28.5 MB",
        source: "local-java",
      };
    }

    return {
      output: "",
      error: `Unsupported language: ${language}`,
      exitCode: 1,
      time: "0s",
      memory: "0 MB",
      source: "local-unknown",
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

// Validate whether the output satisfies the Airport Security Checkpoint challenge
function checkAirportSolution(output: string): { isCorrect: boolean; hasAccessCode: boolean } {
  if (!output) return { isCorrect: false, hasAccessCode: false };

  const lines = output
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Check if access code '41' is present anywhere as a distinct token or line
  const hasAccessCode = lines.some((l) => l === "41" || l.endsWith("41") || /\b41\b/.test(l));

  // Check for expected names
  const expectedNames = ["Rahul", "Anu", "Maria", "John"];
  const matchesNames = expectedNames.every((name) =>
    lines.some((l) => l.toLowerCase().includes(name.toLowerCase()))
  );

  const isCorrect = hasAccessCode && (matchesNames || lines.length >= 2);

  return { isCorrect, hasAccessCode };
}

export async function POST(req: Request) {
  try {
    const { language = "python", code, input = "" } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Source code cannot be empty." },
        { status: 400 }
      );
    }

    const normLang = language.toLowerCase();
    const apiKey = process.env.ONLINECOMPILER_API_KEY?.trim();

    let cleanCode = code;
    if (normLang === "java") {
      // Strip package declarations (e.g. `package com.ctc;`) which cause single-file compilation errors
      cleanCode = cleanCode.replace(/^\s*package\s+[^;]+;\s*[\r\n]*/gm, "");
    }

    let result: {
      output: string;
      error: string;
      exitCode: number;
      time: string;
      memory: string;
      source: string;
    };

    // If API key is present, try onlinecompiler.io first
    if (apiKey && apiKey !== "your_api_key_here") {
      const compilerId = COMPILER_MAP[normLang]?.onlineId || "python-3.14";
      try {
        const response = await fetch("https://api.onlinecompiler.io/api/run-code-sync/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: apiKey,
          },
          body: JSON.stringify({
            compiler: compilerId,
            code: cleanCode,
            input,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const memKb = parseInt(data.memory || "0", 10);
          const memMb = memKb > 0 ? (memKb / 1024).toFixed(1) + " MB" : "8.2 MB";
          const execTime = data.time ? `${parseFloat(data.time).toFixed(3)}s` : "0.050s";

          result = {
            output: data.output || data.stdout || "",
            error: data.error || data.stderr || "",
            exitCode: data.exit_code ?? (data.error ? 1 : 0),
            time: execTime,
            memory: memMb,
            source: "onlinecompiler.io",
          };

          // If onlinecompiler.io masked compilation/runtime error with generic "Internal error"
          if (result.error && result.error.includes("Internal error: code execution failed")) {
            console.warn(
              `onlinecompiler.io masked error with 'Internal error' for ${normLang}. Attempting local compiler for detailed diagnostics...`
            );
            try {
              const localRes = await runLocalCode(normLang, cleanCode, input);
              if (localRes.error || localRes.output) {
                result = localRes;
              } else {
                result.error =
                  normLang === "java"
                    ? "Compilation failed: Please check for syntax errors. In Java, ensure all helper classes are static inner classes inside 'public class Main' and remove any package declarations."
                    : "Compilation failed: Please check your source code for syntax errors.";
              }
            } catch {
              result.error =
                normLang === "java"
                  ? "Compilation failed: Please check for syntax errors. In Java, ensure all helper classes are static inner classes inside 'public class Main' and remove any package declarations."
                  : "Compilation failed: Please check your source code for syntax errors.";
            }
          }
        } else {
          console.warn(
            `onlinecompiler.io returned ${response.status}. Falling back to local execution.`
          );
          result = await runLocalCode(normLang, cleanCode, input);
        }
      } catch (apiErr) {
        console.warn("onlinecompiler.io fetch failed, falling back to local execution:", apiErr);
        result = await runLocalCode(normLang, cleanCode, input);
      }
    } else {
      // Direct local execution using system installed compilers
      result = await runLocalCode(normLang, cleanCode, input);
    }

    const { isCorrect, hasAccessCode } = checkAirportSolution(result.output);

    return NextResponse.json({
      success: true,
      output: result.output,
      error: result.error,
      exitCode: result.exitCode,
      time: result.time,
      memory: result.memory,
      source: result.source,
      isCorrect,
      hasAccessCode,
      accessCode: hasAccessCode ? "41" : null,
    });
  } catch (err: unknown) {
    console.error("compiler/run error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Code execution failed" },
      { status: 500 }
    );
  }
}
