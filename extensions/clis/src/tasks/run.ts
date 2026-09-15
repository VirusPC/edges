import { loadConfig } from "../utils/config.js";
import { runCreate } from "./create/index.js";
import { runGet } from "./get/index.js";
import { runList } from "./list/index.js";
import { runRunMessages } from "./run-messages/index.js";
import { runRuns } from "./runs/index.js";
import { runStatus } from "./status/index.js";
import { runUpdate } from "./update/index.js";
import {
  createNodeBoardFs,
  createNodeBoardWriter,
  type BoardFs,
  type BoardWriter,
} from "./utils/board.js";
import { asTasksError, fail, type RunResult } from "./utils/result.js";
import type { TasksParseOk } from "./utils/types.js";

export type TasksRunIo = {
  env?: NodeJS.ProcessEnv;
  repoPath?: string;
  fs?: BoardFs;
  now?: Date;
  writer?: BoardWriter;
};

export async function runTasks(parsed: TasksParseOk, io: TasksRunIo = {}): Promise<RunResult> {
  const env = io.env ?? process.env;
  const repoPath = io.repoPath ?? loadConfig(env).repoPath;
  const fs = io.fs ?? createNodeBoardFs();
  const now = io.now ?? new Date();

  try {
    switch (parsed.kind) {
      case "tasks-list":
        return await runList(parsed, { repoPath, fs });
      case "tasks-get":
        return await runGet(parsed, { repoPath, fs });
      case "tasks-create":
        return await runCreate(parsed, { repoPath, writer: io.writer ?? createNodeBoardWriter(), now });
      case "tasks-update":
        return await runUpdate(parsed, { repoPath, writer: io.writer ?? createNodeBoardWriter(), now });
      case "tasks-status":
        return await runStatus(parsed, { repoPath, writer: io.writer ?? createNodeBoardWriter(), now });
      case "tasks-runs":
        return await runRuns(parsed, { repoPath, fs });
      case "tasks-run-messages":
        return await runRunMessages(parsed, { repoPath, fs });
      default:
        return fail("VALIDATION_ERROR", "unknown tasks command");
    }
  } catch (error) {
    const mapped = asTasksError(error);
    return fail(mapped.errorCode, mapped.message);
  }
}
