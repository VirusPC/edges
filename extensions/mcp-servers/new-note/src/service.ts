import type { IngestErrorCode, IngestRequest, IngestResult, RuntimeConfig, ScriptSuccess } from "./types.js";
import { classifyError, summarize } from "./errors.js";
import { runEdgesNote } from "./cliAdapter.js";

type IngestRunner = (input: IngestRequest, config: RuntimeConfig) => Promise<ScriptSuccess>;

const KNOWN_CODES: ReadonlySet<string> = new Set([
  "VALIDATION_ERROR",
  "SCRIPT_NOT_FOUND",
  "GIT_FAILURE",
  "PUSH_AUTH_FAILED",
  "PR_CREATION_UNAVAILABLE",
  "UNKNOWN_ERROR",
]);

export async function runIngest(
  input: IngestRequest,
  config: RuntimeConfig,
  runner: IngestRunner = runEdgesNote,
): Promise<IngestResult> {
  try {
    const result = await runner(input, config);
    return {
      status: "success",
      filePath: result.filePath,
      branch: result.branch,
      prUrl: result.prUrl,
      prStatus: result.prStatus,
      stdoutSummary: summarize(result.stdout) ?? "ingest success",
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      errorCode?: string;
    };
    const reason = err.message || "unknown ingest failure";
    const fromCli = err.errorCode && KNOWN_CODES.has(err.errorCode) ? (err.errorCode as IngestErrorCode) : undefined;
    return {
      status: "failed",
      errorCode:
        fromCli ??
        classifyError({ stdout: err.stdout, stderr: err.stderr, message: err.message, code: err.code }),
      reason,
      stdoutSummary: summarize(err.stdout),
      stderrSummary: summarize(err.stderr),
    };
  }
}
