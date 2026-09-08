export const HELP_TEXT = `edges-note — ingest a note into the Edges knowledge repo (agent-oriented)

USAGE
  edges-note --title <title> --content <content> --co-author <name-email> [--json] [--dry-run] [--mode direct|pr] [--token-file <path>]

REQUIRED
  --title          Note title (1–120 chars)
  --content        Note body (1–50,000 chars)
  --co-author      Git co-author, e.g. "Name <email@domain>" (3–200 chars)

OPTIONS
  --json           Write a machine-parseable JSON result to stdout (always on; flag kept for agents)
  --dry-run        Set EDGES_DRY_RUN=true: write and commit locally, do not push
  --mode           direct | pr  (default: EDGES_MODE or direct)
  --token-file     Present EDGES_AUTH_TOKEN from a file (never pass the token on argv)
  --token-stdin    Present EDGES_AUTH_TOKEN from a non-TTY stdin
  -h, --help       Show this help
  -v, --version    Print version

STRUCTURED OUTPUT
  Success and failure are JSON objects on stdout. Progress and diagnostics go to stderr.
  Get structured output with --json (default). Pipe stdout to jq.

  Success:
    {"status":"success","filePath":"...","branch":"...","prStatus":"created|unavailable|direct_commit"}

  Failure:
    {"status":"failed","errorCode":"VALIDATION_ERROR|AUTH_MISSING|AUTH_INVALID_FORMAT|AUTH_INVALID_TOKEN|SCRIPT_NOT_FOUND|GIT_FAILURE|PUSH_AUTH_FAILED|UNKNOWN_ERROR","reason":"..."}

AUTH
  Optional, same gate as the new-note MCP HTTP server.
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
  edges-note --title "Daily" --content "Notes from the session." --co-author "Codex <codex@openai.com>" --json
  edges-note --title "Daily" --content "..." --co-author "Codex <codex@openai.com>" --dry-run
  edges-note --help
`;
