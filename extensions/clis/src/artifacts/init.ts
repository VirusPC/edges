import { randomBytes } from "node:crypto";
import { Command } from "commander";
import type { CliContext } from "../context.js";
import {
  defaultArtifactsConfigPath,
  loadArtifactsConfig,
  writeArtifactsConfig,
} from "./utils/config.js";
import { ArtifactsError, runArtifactsCommand, succeed } from "./utils/result.js";

const INIT_AFTER_HELP = `
FLAGS
  --base-url <url>   Public URL prefix printed by publish (default: http://127.0.0.1:8787)
  --config <path>    Config file (default: ~/.config/edges/artifacts.env)
  --force            Overwrite an existing token

Writes EDGES_ARTIFACTS_TOKEN and EDGES_ARTIFACTS_BASE_URL.
Phone review needs a reachable URL (not localhost).

EXAMPLES
  edges artifacts init
  edges artifacts init --base-url https://artifacts.example.com
`;

export function addArtifactsInitCommand(artifacts: Command, ctx: CliContext): void {
  artifacts
    .command("init")
    .description("Create a shared token and write local artifacts config")
    .option("--base-url <url>", "Public base URL for artifact links", "http://127.0.0.1:8787")
    .option("--config <path>", "Config file path")
    .option("--force", "Overwrite an existing token")
    .addHelpText("after", INIT_AFTER_HELP)
    .action(async (opts: { baseUrl: string; config?: string; force?: boolean }) => {
      await runArtifactsCommand(ctx, async () => {
        const configPath = opts.config?.trim() || defaultArtifactsConfigPath(ctx.env);
        const existingFile = await loadArtifactsConfig({}, configPath);
        if (existingFile.token && !opts.force) {
          throw new ArtifactsError(
            "VALIDATION_ERROR",
            `artifacts config already has a token: ${configPath} (pass --force to overwrite)`,
          );
        }
        const token = randomBytes(32).toString("hex");
        const baseUrl = opts.baseUrl.replace(/\/$/, "");
        await writeArtifactsConfig(configPath, { token, baseUrl });
        const stderr = [
          "Server needs:",
          `  EDGES_ARTIFACTS_TOKEN=${token}`,
          `  EDGES_ARTIFACTS_BASE_URL=${baseUrl}`,
          "  EDGES_ARTIFACTS_HOST=0.0.0.0   # ECS; local default is 127.0.0.1",
          "  EDGES_ARTIFACTS_PORT=8787",
          "Phone review needs a reachable URL (not localhost).",
          "",
        ].join("\n");
        return succeed(
          {
            command: "artifacts.init",
            configPath,
            baseUrl,
            tokenCreated: true,
          },
          stderr,
        );
      });
    });
}
