import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { PROJECT_LEAF, updateDatedLeaf } from "../../services/node/dated-leaf.js";
import { collectRepeat } from "../metadata.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges projects --help for usage.\n";

export function addProjectUpdateCommand(project: Command, ctx: CliContext): void {
  project
    .command("update")
    .description("Update a project title, body, or metadata")
    .argument("<path>", "projects/<stem>/INDEX.md")
    .option("--title <title>", "New title, written as the H1")
    .option("--body <markdown>", "New body")
    .option("--metadata <key=value>", "Repeatable frontmatter field", collectRepeat, [])
    .action(async (entryPath: string, opts: { title?: string; body?: string; metadata?: string[] }) => {
      try {
        const updated = await updateDatedLeaf(ctx.env, PROJECT_LEAF, entryPath, {
          title: opts.title,
          body: opts.body,
          metadata: opts.metadata,
        });
        ctx.result = succeed({
          command: "projects.update",
          path: updated.path,
          title: updated.title,
        });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
