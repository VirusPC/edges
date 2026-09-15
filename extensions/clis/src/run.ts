import { loadConfig } from "./utils/config.js";
import { exitCodeForError } from "./utils/exit.js";
import { formatResult } from "./note/utils/format.js";
import { runNote } from "./note/index.js";
import type { IngestRunner } from "./note/utils/service.js";
import type { IngestFailure } from "./note/utils/types.js";
import { formatHelp, parseArgv } from "./program.js";
import type { BoardFs, BoardWriter } from "./tasks/utils/board.js";
import { runTasks } from "./tasks/index.js";
import { VERSION } from "./utils/version.js";

export type RunIo = {
  env?: NodeJS.ProcessEnv;
  stdinText?: string;
  stdinIsTTY?: boolean;
  ingest?: IngestRunner;
  repoPath?: string;
  fs?: BoardFs;
  now?: Date;
  writer?: BoardWriter;
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

function helpText(text: string): string {
  if (text.trim().length === 0) {
    return formatHelp();
  }
  return text.endsWith("\n") ? text : `${text}\n`;
}

export async function run(argv: string[], io: RunIo = {}): Promise<RunResult> {
  const env = io.env ?? process.env;
  const parsed = parseArgv(argv);

  if (parsed.kind === "help") {
    return { exitCode: 0, stdout: helpText(parsed.text), stderr: "" };
  }
  if (parsed.kind === "version") {
    return { exitCode: 0, stdout: `${VERSION}\n`, stderr: "" };
  }
  if (parsed.kind === "error") {
    const usage =
      argv[0] === "note"
        ? "See edges note --help for usage.\n"
        : argv[0] === "tasks"
          ? "See edges tasks --help for usage.\n"
          : "See edges --help for usage.\n";
    return fail({ status: "failed", errorCode: parsed.errorCode, reason: parsed.reason }, usage);
  }
  if (parsed.kind === "note") {
    return runNote(parsed, {
      env,
      stdinText: io.stdinText,
      stdinIsTTY: io.stdinIsTTY,
      ingest: io.ingest,
    });
  }
  return runTasks(parsed, {
    env,
    repoPath: io.repoPath ?? loadConfig(env).repoPath,
    fs: io.fs,
    now: io.now,
    writer: io.writer,
  });
}
