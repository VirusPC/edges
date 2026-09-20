# edges-cli (`edges`)

Multi-command Edges CLI. Humans and local agents share `edges`. Note ingest git lives in `src/note/utils/git`. npm `package.json` `"bin"` is the install hook for the `edges` binary, not a separate layer.

## Directory is the command tree

- **File** = one command node: flags, after-help, `.action` (leaf) or register children (group)
- **Folder** = children of that command, plus `utils/`
- Root extras: `index.ts` is the bin; `program.ts` is the `edges` node and also exports `run()` (only the root is invoked as a process); `context.ts` is the per-process `CliContext` (env / stdin snapshot + command result) passed down the tree

The command tree is built with [Commander.js](https://github.com/tj/commander.js):

```
edges note …          # ingest a note (required flags on this command)
edges tasks …         # Task board (list/get/create/update/status + project + read-only runs)
edges artifacts …     # short-lived preview publish / rm (thin client)
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
edges tasks list [--status <edges-tasks-status>] [--priority <edges-task-priority>]... [--project <edges-task-project>]... [--sort priority]
edges tasks get <stem|path>
edges tasks create --title <title> [--description] [--body] [--status] [--name] [--assignee] [--priority] [--project]
edges tasks update <stem|path> [--title] [--description] [--body] [--assignee] [--priority] [--project]
edges tasks status <stem|path> <edges-tasks-status>
edges tasks runs <stem|path> [--output table|json]
edges tasks run-messages <run-id> [--task <stem>] [--output table|json]
edges tasks project list
edges tasks project get <project>
edges tasks project create <project> --title <title> --description <text>
edges tasks project update <project> [--title] [--description]
edges tasks project review-page --from <path|-> [--out <path>]
```

Issue-layer stdout is always JSON (`--json` is accepted and ignored). `runs` / `run-messages` default to a table; pass `--output json` for JSON. Run layer is read-only (no append). `create` writes the Task file plus an empty sidecar `.{stem}.log.md`.

`project review-page` is render-only: it reads generic `groups` + `items` JSON (`--from` file or `-` for stdin), writes a single-file HTML page (default: OS temp; `--out` overrides), and prints `{status, command: "project.review-page", path, groupCount, itemCount}`. It does not call `updateTask`, `createProject`, or any board mutator, and it does not open a browser. Open the printed `path` in a system browser. There is no `edges tasks classify` / `--mode` / `--open`.

classifyTasks Skill (`extensions/skills/project-tasks-classify`) uses these project verbs plus `update --project`. Generic tasks Skill/MCP CRUD is a later backlog on this same contract. Capability Surface is CLI + Skill + MCP.

## `artifacts`

Thin client for the Artifacts 预览服务 (`extensions/services/artifacts-preview`). `review-page` still only renders; publish is a separate step.

```
edges artifacts init [--base-url <url>] [--config <path>] [--force]
edges artifacts publish <path> [--ttl <duration>] [--entry <relpath>] [--from-kind <kind>] [--from-name <name>] [--task-project <slug>] [--task-stem <stem>] [--config <path>]
edges artifacts rm <id|url> [--config <path>]
```

`init` writes `~/.config/edges/artifacts.env` (`EDGES_ARTIFACTS_TOKEN`, `EDGES_ARTIFACTS_BASE_URL`) and prints the env the **server** process needs. `publish` / `rm` read that file (env overrides). Success stdout is JSON (`command`: `artifacts.init` | `artifacts.publish` | `artifacts.rm`). `publish` prints the public `url` and records `from` (defaults `--from-kind cli --from-name edges-cli`). `--from-kind task` requires `--task-project` / `--task-stem` and does not send `name`.

Phone review needs a reachable `EDGES_ARTIFACTS_BASE_URL` (ECS / public host). Localhost is only for the same machine. This round has no artifacts MCP.

## Tests

```bash
pnpm --filter edges-cli test
```
