import type { IngestRequest, IngestResult, RuntimeConfig, ScriptSuccess } from "./types.js";
import { classifyError, summarize } from "./errors.js";
import { runIngestScript } from "./scriptAdapter.js";

type IngestRunner = (input: IngestRequest, config: RuntimeConfig) => Promise<ScriptSuccess>;

export async function runIngest(
  input: IngestRequest,
  config: RuntimeConfig,
  runner: IngestRunner = runIngestScript,
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
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    const reason = err.message || "unknown ingest failure";
    return {
      status: "failed",
      errorCode: classifyError({ stdout: err.stdout, stderr: err.stderr, message: err.message }),
      reason,
      stdoutSummary: summarize(err.stdout),
      stderrSummary: summarize(err.stderr),
    };
  }
}
