import { ZodError } from "zod";
import { checkAuth } from "./auth.js";
import { loadConfig } from "./config.js";
import { exitCodeFor, exitCodeForError } from "./exit.js";
import { formatResult } from "./format.js";
import { HELP_TEXT } from "./help.js";
import { parseArgv } from "./parse.js";
import { runIngestScript } from "./scriptAdapter.js";
import { runIngest, type IngestRunner } from "./service.js";
import type { IngestFailure } from "./types.js";
import { formatZodReason, validateInput } from "./validation.js";
import { VERSION } from "./version.js";

export type RunIo = {
  env?: NodeJS.ProcessEnv;
  stdinText?: string;
  stdinIsTTY?: boolean;
  ingest?: IngestRunner;
};

export type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

function fail(failure: IngestFailure, stderr = ""): RunResult {
  return {
    exitCode: exitCodeForError(failure.errorCode),
    stdout: formatResult(failure),
    stderr: stderr ? (stderr.endsWith("\n") ? stderr : `${stderr}\n`) : "",
  };
}

export async function run(argv: string[], io: RunIo = {}): Promise<RunResult> {
  const env = io.env ?? process.env;
  const parsed = parseArgv(argv);

  if (parsed.kind === "help") {
    return { exitCode: 0, stdout: HELP_TEXT.endsWith("\n") ? HELP_TEXT : `${HELP_TEXT}\n`, stderr: "" };
  }
  if (parsed.kind === "version") {
    return { exitCode: 0, stdout: `${VERSION}\n`, stderr: "" };
  }
  if (parsed.kind === "error") {
    return fail(
      { status: "failed", errorCode: parsed.errorCode, reason: parsed.reason },
      "See edges-note --help for usage.\n",
    );
  }

  let request;
  try {
    request = validateInput({
      title: parsed.title,
      content: parsed.content,
      coAuthor: parsed.coAuthor,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(
        { status: "failed", errorCode: "VALIDATION_ERROR", reason: formatZodReason(error) },
        "See edges-note --help for usage.\n",
      );
    }
    throw error;
  }

  const config = loadConfig(env);
  if (parsed.dryRun) {
    config.dryRun = true;
  }
  if (parsed.mode) {
    config.mode = parsed.mode;
  }

  const auth = await checkAuth({
    expectedToken: config.authToken,
    tokenFile: parsed.tokenFile,
    tokenStdin: parsed.tokenStdin,
    stdinText: io.stdinText,
    stdinIsTTY: io.stdinIsTTY,
  });
  if (!auth.ok) {
    return fail({ status: "failed", errorCode: auth.failure.errorCode, reason: auth.failure.reason });
  }

  const runner = io.ingest ?? runIngestScript;
  const result = await runIngest(request, config, runner, env);
  const stderrLines =
    result.status === "success"
      ? result.diagnostics
      : result.stderrSummary;
  const stderr = stderrLines ? `${stderrLines.endsWith("\n") ? stderrLines : `${stderrLines}\n`}` : "";

  return {
    exitCode: exitCodeFor(result),
    stdout: formatResult(result),
    stderr,
  };
}
