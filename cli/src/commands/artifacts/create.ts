import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { parseArtifactFromFlags } from "./utils/from.js";
import { collectPublishFiles } from "./utils/collect.js";
import { createArtifact } from "./utils/client.js";
import { loadArtifactsConfig } from "./utils/config.js";
import { ArtifactsError, runArtifactsCommand, succeed } from "./utils/result.js";

export function addArtifactsCreateCommand(artifacts: Command, ctx: CliContext): void {
  artifacts
    .command("create")
    .description("Upload a file or directory as an unpublished draft")
    .argument("<path>", "File or directory to store")
    .option("--entry <relpath>", "Entry file for directory uploads")
    .option("--from-type <type>", "Source type (v1: task)")
    .option("--from-id <id>", "Task stem when --from-type task")
    .option("--task-project <slug>", "Task Project slug when --from-type task")
    .option("--config <path>", "Config file path")
    .action(async (inputPath: string, opts: {
      entry?: string;
      fromType?: string;
      fromId?: string;
      taskProject?: string;
      config?: string;
    }) => {
      await runArtifactsCommand(ctx, async () => {
        const config = await loadArtifactsConfig(ctx.env, opts.config);
        if (!config.token) {
          throw new ArtifactsError("AUTH_MISSING", "missing EDGES_ARTIFACTS_TOKEN; run edges artifacts init");
        }
        if (!config.baseUrl) {
          throw new ArtifactsError("VALIDATION_ERROR", "missing EDGES_ARTIFACTS_BASE_URL; run edges artifacts init");
        }
        const files = await collectPublishFiles(inputPath).catch((error: unknown) => {
          throw new ArtifactsError("VALIDATION_ERROR", error instanceof Error ? error.message : String(error));
        });
        let from;
        try {
          from = parseArtifactFromFlags({
            type: opts.fromType,
            fromId: opts.fromId,
            taskProject: opts.taskProject,
          });
        } catch (error) {
          throw new ArtifactsError("VALIDATION_ERROR", error instanceof Error ? error.message : String(error));
        }
        const created = await createArtifact({
          baseUrl: config.baseUrl,
          token: config.token,
          files,
          entry: opts.entry,
          from,
          fetch: globalThis.fetch,
        });
        return succeed({
          command: "artifacts.create",
          id: created.id,
          ...(from ? { from } : {}),
        });
      });
    });
}
