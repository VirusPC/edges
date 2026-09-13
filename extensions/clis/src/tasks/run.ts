import { loadConfig } from "../config.js";
import { exitCodeForTasksError } from "../exit.js";

type RunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};
import { createNodeBoardFs, type BoardFs, type BoardWriter } from "./board.js";
import { formatTasksResult, type TasksFailure } from "./format.js";
import { listTasksService } from "./service.js";
import type { TasksErrorCode, TasksParseOk } from "./types.js";
import { TasksError } from "./types.js";

export type TasksRunIo = {
  env?: NodeJS.ProcessEnv;
  repoPath?: string;
  fs?: BoardFs;
  now?: Date;
  writer?: BoardWriter;
};

function fail(errorCode: TasksErrorCode, reason: string): RunResult {
  const payload: TasksFailure = { status: "failed", errorCode, reason };
  return {
    exitCode: exitCodeForTasksError(errorCode),
    stdout: formatTasksResult(payload),
    stderr: "See edges tasks --help for usage.\n",
  };
}

function succeed(payload: Parameters<typeof formatTasksResult>[0], stdout?: string): RunResult {
  return {
    exitCode: 0,
    stdout: stdout ?? formatTasksResult(payload),
    stderr: "",
  };
}

function asTasksError(error: unknown): TasksError {
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

export async function runTasks(parsed: TasksParseOk, io: TasksRunIo = {}): Promise<RunResult> {
  const env = io.env ?? process.env;
  const repoPath = io.repoPath ?? loadConfig(env).repoPath;
  const fs = io.fs ?? createNodeBoardFs();

  try {
    switch (parsed.kind) {
      case "tasks-list": {
        const tasks = await listTasksService(repoPath, { status: parsed.status }, fs);
        return succeed({ status: "success", command: "list", tasks });
      }
      case "tasks-get":
      case "tasks-create":
      case "tasks-update":
      case "tasks-status":
      case "tasks-runs":
      case "tasks-run-messages":
        return fail("VALIDATION_ERROR", `${parsed.kind} not wired`);
      default:
        return fail("VALIDATION_ERROR", "unknown tasks command");
    }
  } catch (error) {
    const mapped = asTasksError(error);
    return fail(mapped.errorCode, mapped.message);
  }
}
