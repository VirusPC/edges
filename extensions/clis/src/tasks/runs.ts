import { Command, Option } from "commander";
import type { CliContext } from "../context.js";
import { formatRunsTable } from "./utils/format.js";
import { runTasksCommand, succeed } from "./utils/result.js";
import { parseRunLog } from "./utils/runlog.js";
import { getTaskService } from "./utils/service.js";

const RUNS_AFTER_HELP = `
ARGUMENTS
  <target>  Task stem or path

FLAGS
  --output <format>  table (default) or json

Read-only Run summary. No append.

EXAMPLES
  edges tasks runs 2026-09-11--cli
  edges tasks runs 2026-09-11--cli --output json
`;

export function addRunsCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("runs")
    .description("Read-only Run summary for a Task")
    .argument("<target>", "stem or path")
    .addOption(new Option("--output <format>", "table or json").choices(["table", "json"]).default("table"))
    .addHelpText("after", RUNS_AFTER_HELP)
    .action(async (target: string, opts: { output: "table" | "json" }) => {
      await runTasksCommand(ctx, async (io) => {
        const record = await getTaskService(io.repoPath, target, io.fs);
        const parsedLog = parseRunLog(record.sidecarMarkdown ?? "", record.stem);
        const payload = {
          status: "success" as const,
          command: "runs" as const,
          stem: record.stem,
          runs: parsedLog.runs,
        };
        if (opts.output === "json") {
          return succeed(payload);
        }
        return succeed(payload, formatRunsTable(parsedLog.runs));
      });
    });
}
