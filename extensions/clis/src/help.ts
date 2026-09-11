/** Extra `--help` sections. Option names and the command tree come from Commander. */

export const ROOT_AFTER_HELP = `
EXAMPLES
  edges note --title "Daily" --content "Notes from the session." --co-author "Codex <codex@openai.com>" --json
  edges note --help
  edges tasks --help

BREAKING RENAME
  The bin is edges only (not edges-note). There is no shim.
  Callers must migrate to: edges note --title … --content … --co-author …
`;

export const NOTE_AFTER_HELP = `
STRUCTURED OUTPUT
  Success and failure are JSON objects on stdout. Progress and diagnostics go to stderr.
  Get structured output with --json (default). Pipe stdout to jq.

  Success:
    {"status":"success","filePath":"...","branch":"...","prStatus":"created|unavailable|direct_commit"}

  Failure:
    {"status":"failed","errorCode":"VALIDATION_ERROR|AUTH_MISSING|AUTH_INVALID_FORMAT|AUTH_INVALID_TOKEN|SCRIPT_NOT_FOUND|GIT_FAILURE|PUSH_AUTH_FAILED|UNKNOWN_ERROR","reason":"..."}

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
  EDGES_SCRIPT        Path to bin/new-note (default: <Edges>/bin/new-note)
  EDGES_BASE_BRANCH   Default main
  EDGES_MODE          direct | pr
  EDGES_DRY_RUN       true to skip checkout/pull/push
  EDGES_AUTH_TOKEN    Optional expected token
  GITHUB_TOKEN        Passed through to bin/new-note for PR creation

EXAMPLES
  edges note --title "Daily" --content "Notes from the session." --co-author "Codex <codex@openai.com>" --json
  edges note --dry-run --title "Daily" --content "..." --co-author "Codex <codex@openai.com>"
  edges note --help
`;

export const TASKS_AFTER_HELP = `
Not implemented yet. This command is a placeholder for future task-board work.
`;
