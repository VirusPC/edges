import { Command } from "commander";
import type { CliContext } from "../context.js";
import { deleteArtifact, extractArtifactId } from "./utils/client.js";
import { loadArtifactsConfig } from "./utils/config.js";
import { ArtifactsError, runArtifactsCommand, succeed } from "./utils/result.js";

const RM_AFTER_HELP = `
Accepts an artifact UUID or a public URL containing /artifacts/<uuid>.
Reads EDGES_ARTIFACTS_TOKEN and EDGES_ARTIFACTS_BASE_URL from config or env.

EXAMPLES
  edges artifacts rm 2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab
  edges artifacts rm http://127.0.0.1:8787/artifacts/2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/
`;

export function addArtifactsRmCommand(artifacts: Command, ctx: CliContext): void {
  artifacts
    .command("rm")
    .description("Delete a published artifact by id or URL")
    .argument("<id-or-url>", "Artifact UUID or public URL")
    .option("--config <path>", "Config file path")
    .addHelpText("after", RM_AFTER_HELP)
    .action(async (idOrUrl: string, opts: { config?: string }) => {
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
        let id: string;
        try {
          id = extractArtifactId(idOrUrl);
        } catch (error) {
          throw new ArtifactsError(
            "VALIDATION_ERROR",
            error instanceof Error ? error.message : String(error),
          );
        }
        await deleteArtifact({
          baseUrl: config.baseUrl,
          token: config.token,
          id,
          fetch: globalThis.fetch,
        });
        return succeed({ command: "artifacts.rm", id });
      });
    });
}
