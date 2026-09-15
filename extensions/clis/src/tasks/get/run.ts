import type { BoardFs } from "../utils/board.js";
import { succeed, type RunResult } from "../utils/result.js";
import { getTaskService } from "../utils/service.js";
import type { TasksParseOk } from "../utils/types.js";

export async function runGet(
  parsed: Extract<TasksParseOk, { kind: "tasks-get" }>,
  io: { repoPath: string; fs: BoardFs },
): Promise<RunResult> {
  const record = await getTaskService(io.repoPath, parsed.target, io.fs);
  const { sidecarMarkdown: _sidecarMarkdown, ...task } = record;
  return succeed({ status: "success", command: "get", task });
}
