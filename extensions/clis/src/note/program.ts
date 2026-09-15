import { Command, Option } from "commander";
import { NOTE_AFTER_HELP } from "./help.js";
import { VERSION } from "../utils/version.js";

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

export type NoteParseOk = {
  kind: "note";
  title: string;
  content: string;
  coAuthor: string;
  dryRun: boolean;
  mode?: "pr" | "direct";
  tokenFile?: string;
  tokenStdin: boolean;
};

/**
 * Auth flags (`--token-file`, `--token-stdin`) stay on `note` — same optional
 * gate as the new-note MCP HTTP server. Future `auth` subcommands can sit
 * beside `note` without moving these flags.
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

export function addNoteCommand(program: Command, onNote?: (opts: IngestCliOptions) => void): Command {
  const note = program
    .command("note")
    .description("Ingest a note into the Edges knowledge repo")
    .usage("--title <title> --content <content> --co-author <name-email> [options]")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .version(VERSION, "-v, --version", "Print version")
    .helpOption("-h, --help", "Show this help");

  addIngestOptions(note);
  note.action((opts: IngestCliOptions) => {
    onNote?.(opts);
  });
  note.addHelpText("after", NOTE_AFTER_HELP);
  return note;
}
