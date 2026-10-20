import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { Command } from "commander";
import type { CliContext } from "../../../context.js";
import { asTasksError, renderReviewPageFromText } from "../../../services/tasks/service.js";
import { TasksError } from "../../../domain/models/tasks/types.js";
import { failTask, succeed } from "../run.js";

export function addProjectReviewPageCommand(project: Command, ctx: CliContext): void {
  project
    .command("review-page")
    .description("Render a Task Project review HTML page from groups+items JSON (no board writes)")
    .requiredOption("--from <path>", "JSON file path, or - for stdin")
    .option("--out <path>", "HTML output path (default: OS temp file)")
    .action(async (opts: { from: string; out?: string }) => {
      try {
        const rawText = await readReviewPageSource(opts.from, ctx);
        const rendered = await renderReviewPageFromText(rawText, opts.out, {
          readFile: (abs) => readFile(abs, "utf8"),
          writeFile,
          nowMs: Date.now(),
          tmpDir: tmpdir(),
        });
        ctx.result = succeed({
          status: "success",
          command: "project.review-page",
          path: rendered.path,
          groupCount: rendered.groupCount,
          itemCount: rendered.itemCount,
        });
      } catch (error) {
        const mapped = asTasksError(error);
        ctx.result = failTask(mapped.errorCode, mapped.message);
      }
    });
}

async function readReviewPageSource(from: string, ctx: CliContext): Promise<string> {
  if (from === "-") {
    const text = ctx.stdinText ?? "";
    if (!text.trim()) {
      throw new TasksError("VALIDATION_ERROR", "review-page stdin is empty");
    }
    return text;
  }
  try {
    return await readFile(from, "utf8");
  } catch {
    throw new TasksError("VALIDATION_ERROR", `review-page --from file not readable: ${from}`);
  }
}
