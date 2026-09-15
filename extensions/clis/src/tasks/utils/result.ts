import type { CliContext, RunIo, RunResult } from "../../context.js";
import { loadConfig } from "../../utils/config.js";
import { exitCodeForTasksError } from "../../utils/exit.js";
import { createNodeBoardFs, createNodeBoardWriter } from "./board.js";
import { formatTasksResult, type TasksFailure } from "./format.js";
import { TasksError, type TasksErrorCode } from "./types.js";

export type { RunResult };

export function tasksRuntime(io: RunIo) {
  const env = io.env ?? process.env;
  return {
    repoPath: io.repoPath ?? loadConfig(env).repoPath,
    fs: io.fs ?? createNodeBoardFs(),
    now: io.now ?? new Date(),
    writer: io.writer ?? createNodeBoardWriter(),
  };
}

/**
 * Run a tasks subcommand: resolve the runtime from `ctx.io`, run the body, and
 * store the result on `ctx` — mapping any thrown error to a `RunResult`.
 */
export async function runTasksCommand(
  ctx: CliContext,
  fn: (io: ReturnType<typeof tasksRuntime>) => Promise<RunResult>,
): Promise<void> {
  try {
    ctx.result = await fn(tasksRuntime(ctx.io));
  } catch (error) {
    const mapped = asTasksError(error);
    ctx.result = fail(mapped.errorCode, mapped.message);
  }
}

export function fail(errorCode: TasksErrorCode, reason: string): RunResult {
  const payload: TasksFailure = { status: "failed", errorCode, reason };
  return {
    exitCode: exitCodeForTasksError(errorCode),
    stdout: formatTasksResult(payload),
    stderr: "See edges tasks --help for usage.\n",
  };
}

export function succeed(payload: Parameters<typeof formatTasksResult>[0], stdout?: string): RunResult {
  return {
    exitCode: 0,
    stdout: stdout ?? formatTasksResult(payload),
    stderr: "",
  };
}

export function asTasksError(error: unknown): TasksError {
  if (error instanceof TasksError) {
    return error;
  }
  if (error && typeof error === "object" && "errorCode" in error) {
    const code = (error as { errorCode: TasksErrorCode }).errorCode;
    const message = error instanceof Error ? error.message : String(error);
    return new TasksError(code, message);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new TasksError("UNKNOWN_ERROR", message);
}
