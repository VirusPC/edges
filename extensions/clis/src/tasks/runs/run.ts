import type { BoardFs } from "../utils/board.js";
import { formatRunsTable } from "../utils/format.js";
import { succeed, type RunResult } from "../utils/result.js";
import { parseRunLog } from "../utils/runlog.js";
import { getTaskService } from "../utils/service.js";
import type { TasksParseOk } from "../utils/types.js";

export async function runRuns(
  parsed: Extract<TasksParseOk, { kind: "tasks-runs" }>,
  io: { repoPath: string; fs: BoardFs },
): Promise<RunResult> {
  const record = await getTaskService(io.repoPath, parsed.target, io.fs);
  const parsedLog = parseRunLog(record.sidecarMarkdown ?? "", record.stem);
  const payload = {
    status: "success" as const,
    command: "runs" as const,
    stem: record.stem,
    runs: parsedLog.runs,
  };
  if (parsed.output === "json") {
    return succeed(payload);
  }
  return succeed(payload, formatRunsTable(parsedLog.runs));
}
