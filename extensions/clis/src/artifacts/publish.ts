import { Command } from "commander";
import type { CliContext } from "../context.js";
import { publishArtifact } from "./utils/client.js";
import { collectPublishFiles } from "./utils/collect.js";
import { loadArtifactsConfig } from "./utils/config.js";
import { ArtifactsError, runArtifactsCommand, succeed } from "./utils/result.js";
import { parseTtlSeconds } from "./utils/ttl.js";

const PUBLISH_AFTER_HELP = `
FLAGS
  --ttl <duration>    Override TTL (24h, 90m, 3600). Default 24h
  --entry <relpath>   Entry file inside a directory publish
  --config <path>     Config file (default: ~/.config/edges/artifacts.env)

Reads EDGES_ARTIFACTS_TOKEN and EDGES_ARTIFACTS_BASE_URL from config or env.
Prints the public URL. Phone review needs a reachable base URL, not localhost.

EXAMPLES
  edges artifacts publish /tmp/review.html
  edges artifacts publish ./site --ttl 2h --entry index.html
`;

export function addArtifactsPublishCommand(artifacts: Command, ctx: CliContext): void {
  artifacts
    .command("publish")
    .description("Upload a file or directory and print the public URL")
    .argument("<path>", "File or directory to publish")
    .option("--ttl <duration>", "TTL duration (default 24h)", "24h")
    .option("--entry <relpath>", "Entry file for directory publishes")
    .option("--config <path>", "Config file path")
    .addHelpText("after", PUBLISH_AFTER_HELP)
    .action(async (inputPath: string, opts: { ttl: string; entry?: string; config?: string }) => {
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
        const published = await publishArtifact({
          baseUrl: config.baseUrl,
          token: config.token,
          files,
          ttlSeconds,
          entry: opts.entry,
          fetch: globalThis.fetch,
        });
        return succeed({
          command: "artifacts.publish",
          id: published.id,
          url: published.url,
          expiresAt: published.expiresAt,
        });
      });
    });
}
