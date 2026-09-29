import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { Command } from "commander";
import type { CliContext } from "../../context.js";
import {
  loadBuiltReviewShell,
  parseReviewPageInput,
  renderReviewPageHtml,
  resolveReviewPageOutPath,
  writeReviewPage,
} from "../utils/review-page.js";
import { runTasksCommand, succeed } from "../utils/result.js";
import { TasksError } from "../utils/types.js";

export function addProjectReviewPageCommand(project: Command, ctx: CliContext): void {
  project
    .command("review-page")
    .description("Render a Task Project review HTML page from groups+items JSON (no board writes)")
    .requiredOption("--from <path>", "JSON file path, or - for stdin")
    .option("--out <path>", "HTML output path (default: OS temp file)")
    .action(async (opts: { from: string; out?: string }) => {
      await runTasksCommand(ctx, async () => {
        const rawText = await readReviewPageSource(opts.from, ctx);
        let raw: unknown;
        try {
          raw = JSON.parse(rawText);
        } catch {
          throw new TasksError(
            "VALIDATION_ERROR",
            "review-page input must be a JSON object with groups[] and items[]",
          );
        }
        const input = parseReviewPageInput(raw);
        const shell = await loadBuiltReviewShell((abs) => readFile(abs, "utf8"));
        const html = renderReviewPageHtml(input, shell);
        const outPath = resolveReviewPageOutPath(opts.out, Date.now(), tmpdir());
        await writeReviewPage(outPath, html, writeFile);
        return succeed({
          status: "success",
          command: "project.review-page",
          path: outPath,
          groupCount: input.groups.length,
          itemCount: input.items.length,
        });
      });
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
