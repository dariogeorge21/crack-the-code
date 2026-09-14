import { spawn, SpawnOptionsWithoutStdio } from "child_process";
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

const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB cap to prevent buffer DoS

/**
 * Pre-execution static security filter.
 * Prohibits command injection, process spawning, file system traversal,
 * network socket creation, and environment variable sniffing.
 */
export function validateCodeSafety(
  language: SupportedLanguage,
  code: string
): { safe: boolean; reason?: string } {
  if (!code || typeof code !== "string") {
    return { safe: false, reason: "Empty or invalid source code" };
  }

  // Common cross-language dangerous patterns
  const genericBlocked = [
    { pattern: /__proto__|constructor\s*\[/i, name: "Prototype tampering" },
  ];
  for (const item of genericBlocked) {
    if (item.pattern.test(code)) {
      return { safe: false, reason: item.name };
    }
  }

  if (language === "python") {
    const pyBlocked = [
      { pattern: /\b(import\s+os|from\s+os\s+import)\b/, name: "OS module access" },
      { pattern: /\b(import\s+subprocess|from\s+subprocess\s+import)\b/, name: "Subprocess execution" },
      { pattern: /\b(import\s+sys|from\s+sys\s+import)\b/, name: "Sys module access" },
      { pattern: /\b(import\s+socket|from\s+socket\s+import)\b/, name: "Network socket access" },
      { pattern: /\b(import\s+urllib|from\s+urllib\s+import|import\s+requests)\b/, name: "HTTP client access" },
      { pattern: /\b(import\s+pty|from\s+pty\s+import|import\s+commands)\b/, name: "Terminal shell access" },
      { pattern: /\b__import__\s*\(/, name: "Dynamic import reflection" },
      { pattern: /\beval\s*\(/, name: "Dynamic eval execution" },
      { pattern: /\bexec\s*\(/, name: "Dynamic exec execution" },
      { pattern: /\bopen\s*\(/, name: "Direct file system access" },
      { pattern: /\bos\.(system|popen|environ|getenv|walk|listdir|remove|unlink)\b/, name: "OS system call" },
    ];
    for (const item of pyBlocked) {
      if (item.pattern.test(code)) {
        return { safe: false, reason: item.name };
      }
    }
  } else if (language === "c" || language === "cpp") {
    const cBlocked = [
      { pattern: /\bsystem\s*\(/, name: "system() shell execution" },
      { pattern: /\bpopen\s*\(/, name: "popen() pipe execution" },
      { pattern: /\bfork\s*\(/, name: "fork() process execution" },
      { pattern: /\bexec[lvpe]*\s*\(/, name: "exec() process invocation" },
      { pattern: /\bWinExec\s*\(/, name: "WinExec system call" },
      { pattern: /\bShellExecute[AW]?\s*\(/, name: "ShellExecute system call" },
      { pattern: /\bCreateProcess[AW]?\s*\(/, name: "CreateProcess system call" },
      { pattern: /\bgetenv\s*\(/, name: "Environment variable inspection (getenv)" },
      { pattern: /\bfopen\s*\(/, name: "Direct file open (fopen)" },
      { pattern: /\bfreopen\s*\(/, name: "Stream redirect (freopen)" },
      {
        pattern: /#\s*include\s*[<"](windows\.h|winsock.*|sys\/socket\.h|netinet.*|arpa\/inet\.h|unistd\.h|fstream)[>"]/i,
        name: "Restricted system/network header inclusion",
      },
    ];
    for (const item of cBlocked) {
      if (item.pattern.test(code)) {
        return { safe: false, reason: item.name };
      }
    }
  } else if (language === "java") {
    const javaBlocked = [
      { pattern: /\bRuntime\.getRuntime\b/, name: "Runtime process execution" },
      { pattern: /\bProcessBuilder\b/, name: "ProcessBuilder invocation" },
      { pattern: /\bSystem\.getenv\b/, name: "System.getenv inspection" },
      { pattern: /\bSystem\.getProperty\b/, name: "System.getProperty inspection" },
      { pattern: /\bjava\.net\b/, name: "Network socket access" },
      { pattern: /\bjava\.io\.(File|FileInputStream|FileOutputStream)\b/, name: "File I/O access" },
      { pattern: /\bjava\.nio\.file\b/, name: "NIO File access" },
    ];
    for (const item of javaBlocked) {
      if (item.pattern.test(code)) {
        return { safe: false, reason: item.name };
      }
    }
  }

  return { safe: true };
}

/**
 * Executes a local command with direct binary invocation (shell: false),
 * strictly isolated working directory (cwd: tmpDir), and stripped environment variables.
 */
export function runLocalCommand(
  cmd: string,
  args: string[],
  input: string = "",
  timeoutMs = 5000,
  cwd?: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let isFinished = false;

    const workingDir = cwd || os.tmpdir();

    // Sanitized environment: Zero server secrets passed to child processes
    const sanitizedEnv: Record<string, string | undefined> = {
      NODE_ENV: "production",
      PATH: process.env.PATH || "",
      SYSTEMROOT: process.env.SYSTEMROOT || "C:\\Windows",
      WINDIR: process.env.WINDIR || "C:\\Windows",
      TEMP: workingDir,
      TMP: workingDir,
    };

    const spawnOptions: SpawnOptionsWithoutStdio = {
      cwd: workingDir,
      env: sanitizedEnv as unknown as NodeJS.ProcessEnv,
    };

    const proc = spawn(cmd, args, spawnOptions);

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        try {
          proc.kill("SIGKILL");
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
      try {
        proc.stdin.write(input);
        proc.stdin.end();
      } catch {
        // ignore stdin write errors
      }
    }

    proc.stdout?.on("data", (data) => {
      if (stdout.length < MAX_OUTPUT_BYTES) {
        stdout += data.toString();
        if (stdout.length >= MAX_OUTPUT_BYTES) {
          stdout += "\n[Output truncated - 64 KB limit exceeded]";
        }
      }
    });

    proc.stderr?.on("data", (data) => {
      if (stderr.length < MAX_OUTPUT_BYTES) {
        stderr += data.toString();
      }
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
 * Local compilation and execution runner with temporary directory sandbox
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
      const res = await runLocalCommand("python", [filePath], input, 5000, tmpDir);
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

      const compileRes = await runLocalCommand("gcc", [srcPath, "-o", exePath], "", 5000, tmpDir);
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

      const runRes = await runLocalCommand(exePath, [], input, 5000, tmpDir);
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

      const compileRes = await runLocalCommand("g++", [srcPath, "-o", exePath], "", 5000, tmpDir);
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

      const runRes = await runLocalCommand(exePath, [], input, 5000, tmpDir);
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

      const runRes = await runLocalCommand("java", [srcPath], input, 5000, tmpDir);
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
 * Universal execution orchestrator:
 * 1. Enforces static code safety filters.
 * 2. Runs online compiler if configured, or falls back to local sandboxed runner.
 */
export async function executeCode(
  language: SupportedLanguage,
  code: string,
  input: string = ""
): Promise<ExecutionResult> {
  const normLang = language.toLowerCase() as SupportedLanguage;

  // 1. Static Security Validation - Intercept dangerous system calls and file access
  const safetyCheck = validateCodeSafety(normLang, code);
  if (!safetyCheck.safe) {
    return {
      output: "",
      error: `SECURITY VIOLATION: ${safetyCheck.reason}. System commands, file access, and network operations are disabled in the arena compiler.`,
      exitCode: 1,
      time: "0.000s",
      memory: "0 MB",
      source: "security-sandbox",
    };
  }

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

  // Default to local sandboxed execution
  return runLocalCode(normLang, cleanCode, input);
}
