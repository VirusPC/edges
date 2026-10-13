import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { createProject } from "../../services/projects/service.js";
import { collectRepeat } from "../metadata.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges projects --help for usage.\n";

export function addProjectCreateCommand(project: Command, ctx: CliContext): void {
  project
    .command("create")
    .description("Create a local project leaf")
    .option("--title <title>", "Project title; written as the H1")
    .option("--body <markdown>", "Project body")
    .option("--metadata <key=value>", "Repeatable frontmatter field", collectRepeat, [])
    .option("--json", "Write JSON to stdout (always on)")
    .action(async (opts: { title?: string; body?: string; metadata?: string[] }) => {
      try {
        const created = await createProject(ctx.env, {
          title: opts.title,
          body: opts.body,
          metadata: opts.metadata,
        });
        ctx.result = succeed({
          command: "projects.create",
          path: created.path,
          title: created.title,
        });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
