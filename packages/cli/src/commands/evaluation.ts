import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addEvaluationServerCommand } from "./evaluation/server.js";

const EVALUATION_AFTER_HELP = `
COMMANDS
  server install | start | stop | restart | status
    Host process on this machine. install does not start.
    start --dev runs in the foreground. Default start uses the user systemd unit.

Config: ~/.config/edges/edges.env
Create or migrate it with: edges config init
`;

export function addEvaluationCommand(program: Command, ctx: CliContext): void {
  const evaluation = program
    .command("evaluation")
    .description("Evaluation server (Langfuse experiment webhook)")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "Show this help");

  addEvaluationServerCommand(evaluation, ctx);
  evaluation.action(() => {
    ctx.result = usageError("missing evaluation subcommand. Use edges evaluation --help.", "evaluation");
  });
  evaluation.addHelpText("after", EVALUATION_AFTER_HELP);
}
