export type SupportedLanguage = "python" | "c" | "cpp" | "java";

export interface ExecutionResult {
  output: string;
  error?: string;
  exitCode: number;
  time: string;
  memory: string;
  source?: string;
  isCorrect?: boolean;
  hasAccessCode?: boolean;
  accessCode?: string | null;
}

export interface CompilerConfig {
  onlineId: string;
  localExt: string;
  defaultCmd: string;
}
