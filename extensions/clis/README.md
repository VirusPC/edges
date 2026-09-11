# edges-cli (`edges-note`)

Agent-oriented CLI for ingesting a note into the Edges repo. Local agents should call this instead of the MCP server. Git still lives in `bin/new-note`.

The command tree is built with [Commander.js](https://github.com/tj/commander.js). The default command is ingest: existing flat flags still work. `edges-note ingest ...` is an equivalent alias so later subcommands (for example `auth`) can be added without breaking callers.

Design decision: [`.memory/projects/project_clis_from_mcp.md`](../.memory/projects/project_clis_from_mcp.md). Agent-CLI mechanics: [`.memory/references/reference_agent_oriented_cli.md`](../.memory/references/reference_agent_oriented_cli.md).

## Run

```bash
pnpm --filter edges-cli exec tsx src/index.ts --help

pnpm --filter edges-cli exec tsx src/index.ts \
  --title "Daily" \
  --content "Notes from the session." \
  --co-author "Codex <codex@openai.com>" \
  --json
```

`ingest` is optional and does the same thing:

```bash
pnpm --filter edges-cli exec tsx src/index.ts ingest \
  --title "Daily" \
  --content "Notes from the session." \
  --co-author "Codex <codex@openai.com>" \
  --json
```

After `pnpm --filter edges-cli build`, the bin is `edges-note` (`dist/index.js`).

## Required flags

- `--title` (1–120)
- `--content` (1–50,000)
- `--co-author` (3–200), e.g. `Name <email@domain>`

## Structured output

Stdout is always JSON (`--json` is documented and accepted). Diagnostics go to stderr.

Success includes `filePath`, `branch`, `prStatus` (`created` | `unavailable` | `direct_commit`), optional `prUrl`.
Failure includes `errorCode` and `reason`.

Exit codes: `0` success, `2` usage/validation, `4` auth, `1` runtime.

## Auth

Same optional gate as MCP HTTP. If `EDGES_AUTH_TOKEN` is set, present it with `--token-file` or `--token-stdin` (non-TTY). Never pass the token on argv.

## Dry-run

`--dry-run` or `EDGES_DRY_RUN=true` writes and commits locally and does **not** push.

## Tests

```bash
pnpm --filter edges-cli test
```
