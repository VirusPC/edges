import { Command } from "commander";
import type { CliContext } from "../context.js";
import { parseArtifactFromFlags } from "./utils/from.js";
import { publishArtifact } from "./utils/client.js";
import { collectPublishFiles } from "./utils/collect.js";
import { loadArtifactsConfig } from "./utils/config.js";
import { ArtifactsError, runArtifactsCommand, succeed } from "./utils/result.js";
import { parseTtlSeconds } from "./utils/ttl.js";

const PUBLISH_AFTER_HELP = `
FLAGS
  --ttl <duration>    Override TTL (24h, 90m, 3600). Default 24h
  --entry <relpath>   Entry file inside a directory publish
  --from-type <type>  Source type. v1 only allows task
  --from-id <id>      Task stem (filename without .md) when --from-type task
  --task-project <slug>  Task Project slug when publishing from a Task
  --config <path>     Config file (default: ~/.config/edges/artifacts.env)

--from-type, --from-id, and --task-project must be set together, or omit all three.
Reads EDGES_ARTIFACTS_TOKEN and EDGES_ARTIFACTS_BASE_URL from config or env.
Prints the public URL. Phone review needs a reachable base URL, not localhost.
Public base URL example: https://edges.viruspc.tech
POST /artifacts to that host returns Cloudflare 1010 without a browser User-Agent, and 201 with one. GET usually works either way. This command always sends a stable browser User-Agent; it does not use the Node/undici default.

EXAMPLES
  edges artifacts publish /tmp/review.html
  edges artifacts publish ./site --ttl 2h --entry index.html
  edges artifacts publish /tmp/review.html --from-type task --from-id 2026-09-18--example --task-project _default
`;

export function addArtifactsPublishCommand(artifacts: Command, ctx: CliContext): void {
  artifacts
    .command("publish")
    .description("Upload a file or directory and print the public URL")
    .argument("<path>", "File or directory to publish")
    .option("--ttl <duration>", "TTL duration (default 24h)", "24h")
    .option("--entry <relpath>", "Entry file for directory publishes")
    .option("--from-type <type>", "Source type (v1: task)")
    .option("--from-id <id>", "Task stem when --from-type task")
    .option("--task-project <slug>", "Task Project slug when --from-type task")
    .option("--config <path>", "Config file path")
    .addHelpText("after", PUBLISH_AFTER_HELP)
    .action(async (inputPath: string, opts: {
      ttl: string;
      entry?: string;
      fromType?: string;
      taskProject?: string;
      fromId?: string;
      config?: string;
    }) => {
      await runArtifactsCommand(ctx, async () => {
        const config = await loadArtifactsConfig(ctx.env, opts.config);
        if (!config.token) {
          throw new ArtifactsError(
            "AUTH_MISSING",
            "missing EDGES_ARTIFACTS_TOKEN; run edges artifacts init",
          );
        }
        if (!config.baseUrl) {
          throw new ArtifactsError(
            "VALIDATION_ERROR",
            "missing EDGES_ARTIFACTS_BASE_URL; run edges artifacts init",
          );
        }
        let ttlSeconds: number;
        try {
          ttlSeconds = parseTtlSeconds(opts.ttl);
        } catch (error) {
          throw new ArtifactsError(
            "VALIDATION_ERROR",
            error instanceof Error ? error.message : String(error),
          );
        }
        let files;
        try {
          files = await collectPublishFiles(inputPath);
        } catch (error) {
          throw new ArtifactsError(
            "VALIDATION_ERROR",
            error instanceof Error ? error.message : String(error),
          );
        }
        let from;
        try {
          from = parseArtifactFromFlags({
            type: opts.fromType,
            fromId: opts.fromId,
            taskProject: opts.taskProject,
          });
        } catch (error) {
          throw new ArtifactsError(
            "VALIDATION_ERROR",
            error instanceof Error ? error.message : String(error),
          );
        }
        const published = await publishArtifact({
          baseUrl: config.baseUrl,
          token: config.token,
          files,
          ttlSeconds,
          entry: opts.entry,
          from,
          fetch: globalThis.fetch,
        });
        return succeed({
          command: "artifacts.publish",
          id: published.id,
          url: published.url,
          expiresAt: published.expiresAt,
          ...(published.from ?? from ? { from: published.from ?? from } : {}),
        });
      });
    });
}
