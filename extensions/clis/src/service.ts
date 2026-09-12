import type { IngestRequest, IngestResult, RuntimeConfig, ScriptSuccess } from "./types.js";
import { classifyError, summarize } from "./errors.js";
import { parseMarkers } from "./git/markers.js";
import { runNoteIngest } from "./git/ingest.js";

export type IngestRunner = (
  input: IngestRequest,
  config: RuntimeConfig,
  env?: NodeJS.ProcessEnv,
) => Promise<ScriptSuccess>;

export async function runIngest(
  input: IngestRequest,
  config: RuntimeConfig,
  runner: IngestRunner = runNoteIngest,
  env: NodeJS.ProcessEnv = process.env,
): Promise<IngestResult> {
  try {
    const result = await runner(input, config, env);
    const diagnostics = parseMarkers(result.stdout).diagnostics;
    return {
      status: "success",
      filePath: result.filePath,
      branch: result.branch,
      prUrl: result.prUrl,
      prStatus: result.prStatus,
      stdoutSummary: summarize(diagnostics) ?? "ingest success",
      diagnostics: diagnostics || undefined,
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    const reason = err.message || "unknown ingest failure";
    return {
      status: "failed",
      errorCode: classifyError({
        stdout: err.stdout,
        stderr: err.stderr,
        message: err.message,
        code: err.code,
      }),
      reason,
      stdoutSummary: summarize(err.stdout),
      stderrSummary: summarize(err.stderr),
    };
  }
}
