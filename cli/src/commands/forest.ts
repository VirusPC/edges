import type { Command } from "commander";
import path from "node:path";
import { type CliContext, usageError } from "../context.js";
import { succeed } from "./result.js";
import { buildSystemForest, resolveScope, type ForestForm } from "../services/forest/service.js";
import type { BaseNode } from "../domain/models/index.js";

function projectNode(node: BaseNode, scopeDir: string) {
  return {
    path: path.relative(scopeDir, node.path) || node.path,
    type: node.type,
    name: node.name,
    description: node.description,
  };
}

export function addForestCommand(program: Command, ctx: CliContext): void {
  const command = program
    .command("forest")
    .description("System forest: project-harness AGENTS roots plus Super materials");
  command.action(() => {
    ctx.result = usageError("missing forest command. Use edges forest --help.", "root");
  });
  command
    .command("list")
    .description("List the system forest as JSON trees (BaseNode projection)")
    .option(
      "--form <form>",
      'Forest form: "independent" (default) or "innermost"',
      "independent",
    )
    .option("--no-super", "Omit the runtime SuperAgentsNode root")
    .allowExcessArguments(false)
    .action(async (opts: { form: string; super?: boolean }) => {
      const form = opts.form as ForestForm;
      if (form !== "independent" && form !== "innermost") {
        ctx.result = usageError(
          `--form must be "independent" or "innermost" (got ${opts.form})`,
          "root",
        );
        return;
      }
      const scopeDir = resolveScope(ctx.env);
      const forest = await buildSystemForest(scopeDir, {
        form,
        includeSuper: opts.super !== false,
      });
      ctx.result = succeed({
        command: "forest.list",
        form,
        trees: forest.map((tree) => ({
          root: path.relative(scopeDir, tree[0]!.path) || tree[0]!.path,
          nodes: tree.map((node) => projectNode(node, scopeDir)),
        })),
      });
    });
}
