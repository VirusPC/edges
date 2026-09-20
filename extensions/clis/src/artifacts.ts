import { Command } from "commander";
import { type CliContext, usageError } from "./context.js";
import { addArtifactsInitCommand } from "./artifacts/init.js";
import { addArtifactsPublishCommand } from "./artifacts/publish.js";
import { addArtifactsRmCommand } from "./artifacts/rm.js";
import { addArtifactsServerCommand } from "./artifacts/server.js";

const ARTIFACTS_AFTER_HELP = `
COMMANDS
  init [--base-url <url>] [--config <path>] [--force]
  publish <path> [--ttl <duration>] [--entry <relpath>] [--config <path>]
  rm <id|url> [--config <path>]
  server install | start | stop | restart | status | setup-nginx
    Host process on this machine. install does not start.
    setup-nginx is the one-shot :80 reverse proxy.

Local config default: ~/.config/edges/artifacts.env
Write (publish / rm) needs the shared token. Browser GET of artifact URLs does not.

Phone review needs a reachable EDGES_ARTIFACTS_BASE_URL (not localhost).
edges tasks project review-page still only renders; publish separately.
Capability Surface is CLI + Skill + MCP. This round has no artifacts MCP.

EXAMPLES
  edges artifacts init --base-url http://182.92.131.89 --token <server-token>
  edges artifacts publish /tmp/review.html
  edges artifacts rm <id-or-url>
  edges artifacts server install
  edges artifacts server start
  edges artifacts server setup-nginx
  edges artifacts server status
`;

export function addArtifactsCommand(program: Command, ctx: CliContext): void {
  const artifacts = program
    .command("artifacts")
    .description("Short-lived artifact preview publish / rm")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "Show this help");

  addArtifactsInitCommand(artifacts, ctx);
  addArtifactsPublishCommand(artifacts, ctx);
  addArtifactsRmCommand(artifacts, ctx);
  addArtifactsServerCommand(artifacts, ctx);
  artifacts.action(() => {
    ctx.result = usageError("missing artifacts subcommand. Use edges artifacts --help.", "artifacts");
  });
  artifacts.addHelpText("after", ARTIFACTS_AFTER_HELP);
}
