import { ZodError } from "zod";
import { loadConfig } from "../utils/config.js";
import { exitCodeFor, exitCodeForError } from "../utils/exit.js";
import { checkAuth } from "./utils/auth.js";
import { formatResult } from "./utils/format.js";
import { runNoteIngest } from "./utils/git/ingest.js";
import { runIngest, type IngestRunner } from "./utils/service.js";
import type { IngestFailure } from "./utils/types.js";
import { formatZodReason, validateInput } from "./utils/validation.js";
import type { NoteParseOk } from "./program.js";

export type NoteRunIo = {
  env: NodeJS.ProcessEnv;
  stdinText?: string;
  stdinIsTTY?: boolean;
  ingest?: IngestRunner;
};

export type NoteRunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

function fail(failure: IngestFailure, stderr = ""): NoteRunResult {
  return {
    exitCode: exitCodeForError(failure.errorCode),
    stdout: formatResult(failure),
    stderr: stderr ? (stderr.endsWith("\n") ? stderr : `${stderr}\n`) : "",
  };
}

export async function runNote(parsed: NoteParseOk, io: NoteRunIo): Promise<NoteRunResult> {
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
        "See edges note --help for usage.\n",
      );
    }
    throw error;
  }

  const config = loadConfig(io.env);
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

  const runner = io.ingest ?? runNoteIngest;
  const result = await runIngest(request, config, runner, io.env);
  const stderrLines = result.status === "success" ? result.diagnostics : result.stderrSummary;
  const stderr = stderrLines ? `${stderrLines.endsWith("\n") ? stderrLines : `${stderrLines}\n`}` : "";

  return {
    exitCode: exitCodeFor(result),
    stdout: formatResult(result),
    stderr,
  };
}
