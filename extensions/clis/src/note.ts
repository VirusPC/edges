import { Command, Option } from "commander";
import { ZodError } from "zod";
import { type CliContext, type CliResult, usageError } from "./context.js";
import { loadConfig } from "./utils/config.js";
import { exitCodeFor, exitCodeForError } from "./utils/exit.js";
import { VERSION } from "./utils/version.js";
import { checkAuth } from "./note/utils/auth.js";
import { formatResult } from "./note/utils/format.js";
import { runNoteIngest } from "./note/utils/git/ingest.js";
import { runIngest } from "./note/utils/service.js";
import type { IngestFailure } from "./note/utils/types.js";
import { formatZodReason, validateInput } from "./note/utils/validation.js";

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
  Auth flags stay on the note command for now (no separate auth subcommand yet).
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
  EDGES_REPO          Target git repo (default: this Edges checkout)
  EDGES_BASE_BRANCH   Default main
  EDGES_MODE          direct | pr
  EDGES_DRY_RUN       true to skip checkout/pull/push
  EDGES_AUTH_TOKEN    Optional expected token
  GITHUB_TOKEN        Passed through to git ingest for PR creation

EXAMPLES
  edges note --title "Daily" --content "Notes from the session." --co-author "Codex <codex@openai.com>" --json
  edges note --dry-run --title "Daily" --content "..." --co-author "Codex <codex@openai.com>"
  edges note --help
`;

type IngestCliOptions = {
  title?: string;
  content?: string;
  coAuthor?: string;
  json?: boolean;
  dryRun?: boolean;
  mode?: string;
  tokenFile?: string;
  tokenStdin?: boolean;
};

function fail(failure: IngestFailure): CliResult {
  return {
    exitCode: exitCodeForError(failure.errorCode),
    stdout: formatResult(failure),
    stderr: "",
  };
}

function validateNoteOptions(opts: IngestCliOptions): CliResult | {
  title: string;
  content: string;
  coAuthor: string;
  dryRun: boolean;
  mode?: "pr" | "direct";
  tokenFile?: string;
  tokenStdin: boolean;
} {
  const mode = opts.mode;
  if (mode !== undefined && mode !== "pr" && mode !== "direct") {
    return usageError('--mode must be "direct" or "pr"', "note");
  }
  if (opts.tokenFile && opts.tokenStdin) {
    return usageError("use only one of --token-file or --token-stdin", "note");
  }
  const title = opts.title;
  const content = opts.content;
  const coAuthor = opts.coAuthor;
  const missing: string[] = [];
  if (!title) missing.push("--title");
  if (!content) missing.push("--content");
  if (!coAuthor) missing.push("--co-author");
  if (!title || !content || !coAuthor) {
    return usageError(`missing required flags: ${missing.join(", ")}`, "note");
  }
  return {
    title,
    content,
    coAuthor,
    dryRun: opts.dryRun === true,
    mode,
    tokenFile: opts.tokenFile,
    tokenStdin: opts.tokenStdin === true,
  };
}

/**
 * Auth flags (`--token-file`, `--token-stdin`) stay on `note` — same optional
 * gate as the new-note MCP HTTP server. Future `auth` subcommands can sit
 * beside `note` without moving these flags.
 */
export function addNoteCommand(program: Command, ctx: CliContext): Command {
  const note = program
    .command("note")
    .description("Ingest a note into the Edges knowledge repo")
    .usage("--title <title> --content <content> --co-author <name-email> [options]")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .version(VERSION, "-v, --version", "Print version")
    .helpOption("-h, --help", "Show this help")
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

  note.action(async (opts: IngestCliOptions) => {
    const parsed = validateNoteOptions(opts);
    if ("exitCode" in parsed) {
      ctx.result = parsed;
      return;
    }

    let request;
    try {
      request = validateInput({
        title: parsed.title,
        content: parsed.content,
        coAuthor: parsed.coAuthor,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        ctx.result = usageError(formatZodReason(error), "note");
        return;
      }
      throw error;
    }

    const env = ctx.env;
    const config = loadConfig(env);
    if (parsed.dryRun) {
      config.dryRun = true;
    }
    if (parsed.mode) {
      config.mode = parsed.mode;
    }

    const auth = await checkAuth({
      expectedToken: config.authToken,
      tokenFile: parsed.tokenFile,
      tokenStdin: parsed.tokenStdin,
      stdinText: ctx.stdinText,
      stdinIsTTY: ctx.stdinIsTTY,
    });
    if (!auth.ok) {
      ctx.result = fail({
        status: "failed",
        errorCode: auth.failure.errorCode,
        reason: auth.failure.reason,
      });
      return;
    }

    const result = await runIngest(request, config, runNoteIngest, env);
    const stderrLines = result.status === "success" ? result.diagnostics : result.stderrSummary;
    const stderr = stderrLines ? (stderrLines.endsWith("\n") ? stderrLines : `${stderrLines}\n`) : "";
    ctx.result = {
      exitCode: exitCodeFor(result),
      stdout: formatResult(result),
      stderr,
    };
  });
  note.addHelpText("after", NOTE_AFTER_HELP);
  return note;
}
