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
  --token <hex>      Reuse the server token (do not mint a new one)
  --config <path>    Config file (default: ~/.config/edges/artifacts.env)
  --force            Overwrite an existing token

Writes EDGES_ARTIFACTS_TOKEN and EDGES_ARTIFACTS_BASE_URL.
Phone review needs a reachable URL (not localhost).
On ECS, copy the token printed by edges artifacts server install.

EXAMPLES
  edges artifacts init
  edges artifacts init --base-url https://edges.viruspc.tech --token <server-token>
`;

export function addArtifactsInitCommand(artifacts: Command, ctx: CliContext): void {
  artifacts
    .command("init")
    .description("Create a shared token and write local artifacts config")
    .option("--base-url <url>", "Public base URL for artifact links", "http://127.0.0.1:8787")
    .option("--token <hex>", "Reuse the shared server token")
    .option("--config <path>", "Config file path")
    .option("--force", "Overwrite an existing token")
    .addHelpText("after", INIT_AFTER_HELP)
    .action(async (opts: { baseUrl: string; token?: string; config?: string; force?: boolean }) => {
      await runArtifactsCommand(ctx, async () => {
        const configPath = opts.config?.trim() || defaultArtifactsConfigPath(ctx.env);
        const existingFile = await loadArtifactsConfig({}, configPath);
        if (existingFile.token && !opts.force) {
          throw new ArtifactsError(
            "VALIDATION_ERROR",
            `artifacts config already has a token: ${configPath} (pass --force to overwrite)`,
          );
        }
        const provided = opts.token?.trim();
        if (provided && !/^[0-9a-f]{32,}$/i.test(provided)) {
          throw new ArtifactsError("VALIDATION_ERROR", "token must be a hex string of at least 32 characters");
        }
        const token = provided || randomBytes(32).toString("hex");
        const baseUrl = opts.baseUrl.replace(/\/$/, "");
        await writeArtifactsConfig(configPath, { token, baseUrl });
        const minted = !provided;
        const stderr = minted
          ? [
              "Created a new client token.",
              `  EDGES_ARTIFACTS_TOKEN=${token}`,
              `  EDGES_ARTIFACTS_BASE_URL=${baseUrl}`,
              "For ECS, reuse the server token instead:",
              `  edges artifacts init --base-url ${baseUrl} --token <server-token>`,
              "Phone review needs a reachable URL (not localhost).",
              "",
            ].join("\n")
          : [
              "Wrote client config using the shared server token.",
              `  EDGES_ARTIFACTS_BASE_URL=${baseUrl}`,
              "Phone review needs a reachable URL (not localhost).",
              "",
            ].join("\n");
        return succeed(
          {
            command: "artifacts.init",
            configPath,
            baseUrl,
            tokenCreated: minted,
          },
          stderr,
        );
      });
    });
}
