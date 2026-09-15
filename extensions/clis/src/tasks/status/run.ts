import type { BoardWriter } from "../utils/board.js";
import { moveTaskStatus } from "../utils/move.js";
import { succeed, type RunResult } from "../utils/result.js";
import type { TasksParseOk } from "../utils/types.js";

export async function runStatus(
  parsed: Extract<TasksParseOk, { kind: "tasks-status" }>,
  io: { repoPath: string; writer: BoardWriter; now: Date },
): Promise<RunResult> {
  const moved = await moveTaskStatus(io.repoPath, parsed.target, parsed.next, {
    fs: io.writer,
    now: io.now,
  });
  return succeed({ status: "success", command: "status", ...moved });
}
