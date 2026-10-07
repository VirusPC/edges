import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { ProjectNode } from "../../domain/models/projects/project-node.js";
import { collectRepeat, parseMetadata } from "../metadata.js";
import { succeed } from "../result.js";
import { failProject, loadProject, relPath } from "./node.js";

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
        const metadata = parseMetadata(opts.metadata);
        if (opts.title === undefined && opts.body === undefined && metadata === undefined) {
          throw new Error("update must be --title, --body, or --metadata");
        }
        const { scope, service, node, file } = await loadProject(ctx, entryPath);
        let body = opts.body;
        if (opts.title !== undefined) {
          if (opts.title.length < 1 || opts.title.length > 120) {
            throw new Error("project title must be 1–120 characters");
          }
          const draft = new ProjectNode(file).parse(node.serialize());
          if (body !== undefined) draft.body = body;
          draft.title = opts.title;
          body = draft.body;
        }
        const updated = await service.update(node, {
          ...(body !== undefined ? { body } : {}),
          ...(metadata ? { metadata } : {}),
        });
        ctx.result = succeed({
          command: "projects.update",
          path: relPath(scope, file),
          title: updated.title,
        });
      } catch (error) {
        failProject(ctx, error);
      }
    });
}
