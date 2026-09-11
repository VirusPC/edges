import { Command, Option } from "commander";
import { AFTER_HELP } from "./help.js";
import { VERSION } from "./version.js";

export type IngestCliOptions = {
  title?: string;
  content?: string;
  coAuthor?: string;
  json?: boolean;
  dryRun?: boolean;
  mode?: string;
  tokenFile?: string;
  tokenStdin?: boolean;
};

export type ProgramHandlers = {
  onIngest?: (opts: IngestCliOptions) => void;
};

/**
 * Auth flags (`--token-file`, `--token-stdin`) stay on ingest / the default
 * command — same optional gate as the new-note MCP HTTP server. Future
 * `auth` subcommands can sit beside `ingest` without moving these flags.
 */
export function addIngestOptions(cmd: Command): Command {
  return cmd
    .option("--title <title>", "Note title (1–120 chars)")
    .option("--content <content>", "Note body (1–50,000 chars)")
    .option("--co-author <name-email>", 'Git co-author, e.g. "Name <email@domain>" (3–200 chars)')
    .option("--json", "Write a machine-parseable JSON result to stdout (always on; flag kept for agents)")
    .option("--dry-run", "Set EDGES_DRY_RUN=true: write and commit locally, do not push")
    .addOption(
      new Option("--mode <mode>", "direct | pr  (default: EDGES_MODE or direct)").choices(["pr", "direct"]),
    )
    .addOption(
      new Option("--token-file <path>", "Present EDGES_AUTH_TOKEN from a file (never pass the token on argv)"),
    )
    .addOption(
      new Option("--token-stdin", "Present EDGES_AUTH_TOKEN from a non-TTY stdin").conflicts("tokenFile"),
    );
}

function applyOutput(
  cmd: Command,
  output?: { writeOut: (str: string) => void; writeErr: (str: string) => void },
): void {
  if (!output) {
    return;
  }
  cmd.configureOutput(output);
  for (const child of cmd.commands) {
    applyOutput(child, output);
  }
}

export function createProgram(
  handlers: ProgramHandlers = {},
  output?: { writeOut: (str: string) => void; writeErr: (str: string) => void },
): Command {
  const program = new Command();
  program
    .name("edges-note")
    .description("ingest a note into the Edges knowledge repo (agent-oriented)")
    .usage("--title <title> --content <content> --co-author <name-email> [options]")
    .version(VERSION, "-v, --version", "Print version")
    .helpOption("-h, --help", "Show this help")
    .enablePositionalOptions()
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpCommand(false);

  addIngestOptions(program);
  program.action((opts: IngestCliOptions) => {
    handlers.onIngest?.(opts);
  });

  const ingest = program
    .command("ingest")
    .description("Ingest a note (same flags as the default invocation)")
    .usage("--title <title> --content <content> --co-author <name-email> [options]")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .version(VERSION, "-v, --version", "Print version")
    .helpOption("-h, --help", "Show this help");

  addIngestOptions(ingest);
  ingest.action((opts: IngestCliOptions) => {
    handlers.onIngest?.(opts);
  });

  program.addHelpText("after", AFTER_HELP);
  applyOutput(program, output);
  return program;
}

export function formatHelp(): string {
  let out = "";
  const program = createProgram(undefined, {
    writeOut: (str) => {
      out += str;
    },
    writeErr: (str) => {
      out += str;
    },
  });
  program.outputHelp();
  return out.endsWith("\n") ? out : `${out}\n`;
}
