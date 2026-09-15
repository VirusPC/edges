import { exitCodeForTasksError } from "../../utils/exit.js";
import { formatTasksResult, type TasksFailure } from "./format.js";
import { TasksError, type TasksErrorCode } from "./types.js";

export type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

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
