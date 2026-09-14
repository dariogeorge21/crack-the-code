import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { SupportedLanguage, ExecutionResult, CompilerConfig } from "@/types/compiler";

export const COMPILER_MAP: Record<SupportedLanguage, CompilerConfig> = {
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

/**
 * Executes a local system command with timeout protection
 */
export function runLocalCommand(
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

/**
 * Local compilation and execution runner
 */
export async function runLocalCode(
  language: SupportedLanguage,
  code: string,
  input: string = ""
): Promise<ExecutionResult> {
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

/**
 * Universal execution orchestrator: runs online compiler if API key configured, otherwise falls back to local runners
 */
export async function executeCode(
  language: SupportedLanguage,
  code: string,
  input: string = ""
): Promise<ExecutionResult> {
  const normLang = language.toLowerCase() as SupportedLanguage;
  const apiKey = process.env.ONLINECOMPILER_API_KEY?.trim();

  let cleanCode = code;
  if (normLang === "java") {
    cleanCode = cleanCode.replace(/^\s*package\s+[^;]+;\s*[\r\n]*/gm, "");
  }

  // If online compiler API key is configured, execute via cloud runner
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

        const result: ExecutionResult = {
          output: data.output || data.stdout || "",
          error: data.error || data.stderr || "",
          exitCode: data.exit_code ?? (data.error ? 1 : 0),
          time: execTime,
          memory: memMb,
          source: "onlinecompiler.io",
        };

        if (result.error && result.error.includes("Internal error: code execution failed")) {
          try {
            const localRes = await runLocalCode(normLang, cleanCode, input);
            if (localRes.error || localRes.output) {
              return localRes;
            }
          } catch {
            // fallback
          }
        }
        return result;
      }
    } catch {
      // fallback to local execution below
    }
  }

  // Default to local execution
  return runLocalCode(normLang, cleanCode, input);
}
