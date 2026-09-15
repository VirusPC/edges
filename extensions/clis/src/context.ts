import type { IngestRunner } from "./note/utils/service.js";
import type { BoardFs, BoardWriter } from "./tasks/utils/board.js";

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

export type CliContext = {
  io: RunIo;
  result: RunResult | undefined;
};

export function usageError(reason: string, scope: "root" | "note" | "tasks"): RunResult {
  const usage =
    scope === "note"
      ? "See edges note --help for usage.\n"
      : scope === "tasks"
        ? "See edges tasks --help for usage.\n"
        : "See edges --help for usage.\n";
  return {
    exitCode: 2,
    stdout: `${JSON.stringify({ status: "failed", errorCode: "VALIDATION_ERROR", reason })}\n`,
    stderr: usage,
  };
}

export function usageScope(argv: string[]): "root" | "note" | "tasks" {
  if (argv[0] === "note") return "note";
  if (argv[0] === "tasks") return "tasks";
  return "root";
}
