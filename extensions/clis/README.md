# edges-cli (`edges`)

Multi-command Edges CLI. Humans and local agents share `edges`. Note ingest git lives in `src/note/utils/git`. npm `package.json` `"bin"` is the install hook for the `edges` binary, not a separate layer.

## Directory is the command tree

- **File** = one command node: flags, after-help, `.action` (leaf) or register children (group)
- **Folder** = children of that command, plus `utils/`
- Root extras: `index.ts` is the bin; `program.ts` is the `edges` node and also exports `run()` (only the root is invoked as a process); `context.ts` is the per-process `CliContext` (env / stdin snapshot + command result) passed down the tree

The command tree is built with [Commander.js](https://github.com/tj/commander.js):

```
edges note …          # ingest a note (required flags on this command)
edges tasks …         # Task board (list/get/create/update/status + read-only runs)
edges --help / -v
```

**Breaking rename:** the bin is `edges` only. There is no `edges-note` shim and no default ingest at the root. Callers must migrate to `edges note …`. Running `edges` without a subcommand is a usage error.

Design decision: [`.memory/projects/project_clis_from_mcp.md`](../.memory/projects/project_clis_from_mcp.md). Agent-CLI mechanics: [`.memory/references/reference_agent_oriented_cli.md`](../.memory/references/reference_agent_oriented_cli.md).

## Run

```bash
pnpm --filter edges-cli exec tsx src/index.ts --help

pnpm --filter edges-cli exec tsx src/index.ts note \
  --title "Daily" \
  --content "Notes from the session." \
  --co-author "Codex <codex@openai.com>" \
  --json
```

After `pnpm --filter edges-cli build`, the bin is `edges` (`dist/index.js`).

## `note` required flags

- `--title` (1–120)
- `--content` (1–50,000)
- `--co-author` (3–200), e.g. `Name <email@domain>`

Optional: `--json`, `--dry-run`, `--mode`, `--token-file`, `--token-stdin`.

## Structured output

Stdout is always JSON (`--json` is documented and accepted). Diagnostics go to stderr.

Success includes `filePath`, `branch`, `prStatus` (`created` | `unavailable` | `direct_commit`), optional `prUrl`.
Failure includes `errorCode` and `reason`.

Exit codes: `0` success, `2` usage/validation, `4` auth, `1` runtime.

## Auth

Same optional gate as MCP HTTP. If `EDGES_AUTH_TOKEN` is set, present it with `--token-file` or `--token-stdin` (non-TTY) on `edges note`. Never pass the token on argv.

## Dry-run

`--dry-run` or `EDGES_DRY_RUN=true` writes and commits locally and does **not** push.

## `tasks`

Board root is `<EDGES_REPO>/knowledge/tasks/`. Writes are filesystem-only (no git). Cancel with `status cancelled`. There is no `delete` command and no top-level `log` verb.

```
edges tasks list [--status <edges-tasks-status>]
edges tasks get <stem|path>
edges tasks create --title <title> [--description] [--body] [--status] [--name] [--assignee]
edges tasks update <stem|path> [--title] [--description] [--body] [--assignee]
edges tasks status <stem|path> <edges-tasks-status>
edges tasks runs <stem|path> [--output table|json]
edges tasks run-messages <run-id> [--task <stem>] [--output table|json]
```

Issue-layer stdout is always JSON (`--json` is accepted and ignored). `runs` / `run-messages` default to a table; pass `--output json` for JSON. Run layer is read-only (no append). `create` writes the Task file plus an empty sidecar `.{stem}.log.md`.

Skill and MCP come later on this same contract. Capability Surface is CLI + Skill + MCP.

## Tests

```bash
pnpm --filter edges-cli test
```
