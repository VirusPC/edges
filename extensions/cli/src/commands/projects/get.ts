import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { getDatedLeaf, PROJECT_LEAF } from "../../services/node/dated-leaf.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges projects --help for usage.\n";

export function addProjectGetCommand(project: Command, ctx: CliContext): void {
  project
    .command("get")
    .description("Read one project leaf")
    .argument("<path>", "projects/<stem>/INDEX.md")
    .action(async (entryPath: string) => {
      try {
        const loaded = await getDatedLeaf(ctx.env, PROJECT_LEAF, entryPath);
        ctx.result = succeed({
          command: "projects.get",
          path: loaded.path,
          title: loaded.title,
          body: loaded.body,
        });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
