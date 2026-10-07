import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { VERSION } from "../utils/version.js";
import { addNoteCreateCommand } from "./notes/create.js";
import { addNoteDeleteCommand } from "./notes/delete.js";
import { addNoteGetCommand } from "./notes/get.js";
import { addNoteListCommand } from "./notes/list.js";
import { addNoteUpdateCommand } from "./notes/update.js";

const NOTE_AFTER_HELP = `
STRUCTURED OUTPUT
  Success and failure are JSON objects on stdout. Progress and diagnostics go to stderr.
  Get structured output with --json (default). Pipe stdout to jq.

  Success:
    {"status":"success","filePath":"...","branch":"...","prStatus":"created|unavailable|direct_commit"}

  Failure:
    {"status":"failed","errorCode":"VALIDATION_ERROR|AUTH_MISSING|AUTH_INVALID_FORMAT|AUTH_INVALID_TOKEN|GIT_FAILURE|PUSH_AUTH_FAILED|UNKNOWN_ERROR","reason":"..."}

AUTH
  Optional, same gate as the new-note MCP HTTP server.
  Auth flags stay on notes create (no separate auth subcommand yet).
  If EDGES_AUTH_TOKEN is unset, auth is skipped.
  If it is set, present the same value via --token-file or --token-stdin before git starts.
  Do not use a --token flag (it would leak into ps and shell history).

  AUTH_MISSING          token configured but not presented          exit 4
  AUTH_INVALID_FORMAT   token file unreadable/empty, or TTY stdin   exit 4
  AUTH_INVALID_TOKEN    presented value does not match              exit 4

EXIT CODES
  0  success
  1  runtime failure (git, missing script, unknown)
  2  usage or validation error (no git started)
  4  auth failure (no git started)

ENV
  EDGES_SCOPE         Target scope (after explicit --scope; default: cwd owner)
  EDGES_REPO          Fallback target scope before cwd discovery
  EDGES_BASE_BRANCH   Default main
  EDGES_MODE          direct | pr
  EDGES_DRY_RUN       true to skip checkout/pull/push
  EDGES_AUTH_TOKEN    Optional expected token
  GITHUB_TOKEN        Passed through to git ingest for PR creation

EXAMPLES
  edges notes create --title "Daily" --content "Notes from the session." --co-author "Codex <codex@openai.com>" --json
  edges notes create --dry-run --title "Daily" --content "..." --co-author "Codex <codex@openai.com>"
  edges notes --help
`;

export function addNotesCommand(program: Command, ctx: CliContext): Command {
  const notes = program
    .command("notes")
    .description("Note commands")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .version(VERSION, "-v, --version", "Print version")
    .helpOption("-h, --help", "Show this help");

  notes.action(() => {
    ctx.result = usageError("missing notes command. Use: edges notes create …", "notes");
  });
  addNoteCreateCommand(notes, ctx);
  addNoteListCommand(notes, ctx);
  addNoteGetCommand(notes, ctx);
  addNoteUpdateCommand(notes, ctx);
  addNoteDeleteCommand(notes, ctx);
  notes.addHelpText("after", NOTE_AFTER_HELP);
  return notes;
}
