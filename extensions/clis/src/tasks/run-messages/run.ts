import type { BoardFs } from "../utils/board.js";
import { formatRunMessagesTable } from "../utils/format.js";
import { succeed, type RunResult } from "../utils/result.js";
import { findRun } from "../utils/service.js";
import type { TasksParseOk } from "../utils/types.js";

export async function runRunMessages(
  parsed: Extract<TasksParseOk, { kind: "tasks-run-messages" }>,
  io: { repoPath: string; fs: BoardFs },
): Promise<RunResult> {
  const found = await findRun(io.repoPath, parsed.runId, parsed.task, io.fs);
  const payload = {
    status: "success" as const,
    command: "run-messages" as const,
    run: found.run,
    messages: found.messages,
  };
  if (parsed.output === "json") {
    return succeed(payload);
  }
  return succeed(payload, formatRunMessagesTable(found.run, found.messages));
}
