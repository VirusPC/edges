# edges-cli (`edges`)

Multi-command Edges CLI. Humans and local agents share `edges`. Note ingest git lives in `src/services/note/git`. npm `package.json` `"bin"` is the install hook for the `edges` binary, not a separate layer.

## Consumption

`edges-cli` is **not** published to the npm registry. `package.json` sets `"private": true` for that reason: this package stays in the repo and is not an install target on npm.

The installable `edges` binary is the **local** `dist/` build. `"bin"` points at `./dist/index.js`. Produce that file with:

```bash
pnpm --filter edges-cli build
```

`prepack` runs the same `build`. A local `dist` binary exists only after `build` or `prepack` succeeds.

Day-to-day use can stay on `tsx`, as in [Run](#run). After a successful local build, the `edges` binary comes from `dist/index.js`.

## Directory is the command tree

- **File** = one command node: flags, after-help, `.action` (leaf) or register children (group)
- **Folder** under `src/commands/` = children of that command, plus command argument/output helpers
- Root extras: `index.ts` is the bin; `program.ts` is the `edges` node and also exports `run()` (only the root is invoked as a process); `context.ts` is the per-process `CliContext` (env / stdin snapshot + command result) passed down the tree

The command tree is built with [Commander.js](https://github.com/tj/commander.js):

```
edges note …          # ingest a note (required flags on this command)
edges tasks …         # Task board (list/get/create/update/status + project + read-only runs)
edges artifacts …     # short-lived preview publish / rm (thin client)
edges memory …        # init / remember / add-type / doctor / migrate / backup / restore
edges --help / -v
```

**Breaking rename:** the bin is `edges` only. There is no `edges-note` shim and no default ingest at the root. Callers must migrate to `edges note …`. Running `edges` without a subcommand is a usage error.

## Project Memory

Project Memory runs in TypeScript through `edges memory`; skills describe the workflow and invoke these commands. Select a content scope explicitly, independently of the installed CLI location:

```bash
edges --scope /absolute/project memory init --memory-types project feedback
edges --scope /absolute/project memory remember --type project --slug decision \
  --description 'Why the project chose this approach' --content-file /tmp/decision.md
edges --scope /absolute/project memory doctor
edges --scope /absolute/project memory doctor --apply
edges --scope /absolute/legacy-project memory migrate --recursive --dry-run
edges memory backup --repo-dir /absolute/project
edges memory restore --repo-dir /absolute/project --archive /private/archive.tar.gz
```

Commands return JSON. Init without a selection on a new scope returns recommendations without writing; remember does not initialize missing scopes. Doctor is read-only unless `--apply` is present. Ordinary commands reject the old `.memory` layout; only migrate converts it. Restore refuses occupied user memory unless replacement is explicitly authorized with `--force`; replacement failures roll back to the original tree. Archives are streamed with a 256 MiB expanded-tar limit (including headers, padding and metadata) and a 10,000-file limit, enforced by both backup and restore. Restore accepts raw tar and gzip tar; other compression formats are unsupported. Hardlinked source files are rejected. A process interruption between directory renames can require recovery from the ignored `.private-user-memory-*/previous` directory; do not delete that recovery copy.

The built CLI carries its canonical Markdown templates in `dist/assets/memory/templates`, so it can run outside the source checkout without sibling skills or Python. Business rules, source permissions and private ignore rules remain defined by [Project Memory LAYOUT](../skills/project-memory-init/references/LAYOUT.md).

Design decision: [`.memory/projects/project_cli_from_mcp.md`](../.harness/memory/projects/project_cli_from_mcp.md). Agent-CLI mechanics: [`.memory/references/reference_agent_oriented_cli.md`](../.harness/memory/references/reference_agent_oriented_cli.md).

## Run

```bash
pnpm --filter edges-cli exec tsx src/index.ts --help

pnpm --filter edges-cli exec tsx src/index.ts note \
  --title "Daily" \
  --content "Notes from the session." \
  --co-author "Codex <codex@openai.com>" \
  --json
```

Those examples use `tsx` and do not need a `dist/` build. The installed `edges` binary is the local `dist/` build in [Consumption](#consumption).

## Target scope

`edges --scope <directory> <command>` selects the content owner. Resolution order is `--scope`, `EDGES_SCOPE`, `EDGES_REPO`, then the nearest owning AGENTS scope or Git root above the process cwd. Relative paths resolve against cwd. The CLI install directory is never the default content target. An explicit directory does not initialize Project Memory.

Node models live together in [`src/models/`](src/models/), with domain syntax helpers beneath that directory. [`src/operations/`](src/operations/) contains the shared traversal kernel, generic lazy query chain and individual collection algorithms; traversal receives loading callbacks from the Service and performs no filesystem IO. Query, registered-node collection and proposed graph validation reuse it with their existing relation policies. [`NodeService`](src/services/node-service.ts) provides snapshot-checked document creation, loading, updates, deletion and ownership-index coordination. Task, Memory and Note business orchestration lives under `src/services/`; command handlers under `src/commands/` retain the directory-as-command-tree layout. Generic Markdown/YAML and filesystem primitives remain under `src/utils/`. There is no separate package or compatibility copy of the former `utils/node-tree` repository API.

[`src/services/scope.ts`](src/services/scope.ts) retains environment/argument precedence, Git fallback and directory exclusions. Readable AGENTS entries are eligible without a Memory marker or separate responsibility requirement; selection does not initialize Memory. Task lists and the global dashboard follow registered NodeService relations, with no discovery scan or missing-index fallback. Traversal defaults to localChildren; includeDescendants also follows descendantChildren. Only explicit includeHarness follows each node’s independent maintenance relation, recursively through all maintenance levels.

Normal Task create/update/status and Note ingest save actual TaskNode/NoteNode instances through NodeService. Memory remember uses MemoryNode or SkillNode, while index and scope documents save InternalNode instances. Typed mutations retain unknown vendor metadata. Task board/status movement, sidecar runlogs, Memory type privileges and Note Git/PR publishing remain business-service responsibilities. Task reads and mutations validate typed fields and status/project dual writes; malformed indexed entries fail instead of being silently repaired. Archive and migration remain batch workflows; the legacy migration implementation loads only when the migrate command runs.

NodeService.query returns a deferred chain backed by native AsyncIterable. Construction and filter/map/find/groupBy/toArray/mapValues/values/thru only describe computation; value() executes it. Repeating value() reruns the chain, without an implicit result cache. groupBy yields an ordinary object and supports further mapValues/values/filter/map operations; find supports thru and closes its upstream at the first match. Upstream toArray/groupBy/thru materialization still consumes its input before a downstream find can stop. Arbitrary filter predicates do not prune parents or children; there is no public enter/shouldEnter callback. Type conditions can exclude unrelated leaf bodies early while retaining required Internal navigation and maintenance discovery. No stream-processing library is used.

```ts
const tasks = service.query(scope, { types: ["task"] })
  .filter((node): node is TaskNode => node instanceof TaskNode)
  .filter(task => task.priority === "high").groupBy(task => task.status)
  .mapValues(rows => rows.map(task => task.title));
const memories = service.query(scope, { types: ["memory"], includeDescendants: true })
  .filter((node): node is MemoryNode => node instanceof MemoryNode)
  .groupBy(memory => memory.memoryType).mapValues(rows => rows.length);
const [taskGroups, memoryCounts] = await Promise.all([tasks.value(), memories.value()]);
```

query() initially loads entry snapshots only. Before directory move/destroy, use get(node.path) to add the resource snapshot to that same instance. get() and list() reuse existing resource snapshots without refreshing their baseline or discarding pending edits; get() does not recursively load harness bodies. list() results remain directly movable/deletable.

Within one NodeService, each normalized entry path has one mutable instance:

```ts
const a = await service.get(parentPath, InternalNode);
const b = await service.get(parentPath, InternalNode);
console.assert(a === b);
a!.setConstraints(["Keep authored context"]);
b!.description = "Updated parent";
await service.create(new NoteNode(childPath), { body: "New child" });
// When childPath belongs to parentPath, parent registration saves its pending
// constraints and description together with the new child reference.
```

update() saves the node's full current state. create/import/move/destroy also save the complete current state of indexes they actually affect, never unrelated dirty nodes. move retains identity; destroy invalidates it. Different Services retain separate snapshots and reject external content or identity changes; no three-way merge remains.

Services live within one command. Existing Task query/write and Memory factories keep their distinct managed roots and policy hooks; all Services used by a writing command share its lock, and none is retained across commands. Identity is shared within a Service, not across these separate views. Sharing identity across those views in future requires explicit boundary design.

Node-writing commands acquire a worktree lock before business reads and release it after success or failure: note (including its locally mutating dry-run), tasks create/update/status, tasks project create/update, memory init/add-type/remember/restore, doctor --apply, and migrate without --dry-run. Read-only commands do not acquire it; unrelated Artifacts operations are outside this node lock. --target-dir and restore --repo-dir determine the mutation target; Memory --root-dir is only a traversal boundary.

The lock belongs to the nearest Git worktree root, never the common Git directory. Non-Git trees use the outermost physical AGENTS.md ancestor, falling back to the actual target; discovery checks metadata only. Existing ancestors are canonicalized for missing targets and symlink aliases. The lock is stored outside the content tree at `<os.tmpdir()>/edges-node-write-locks/<sha256(canonical-root)>.lock`, so it cannot enter node resources, indexes or Git commits. Parent, child and sibling scopes share it; independent worktrees can write concurrently. Contention fails immediately with “Node write lock busy”. proper-lockfile's default compromised handler fails the process on detected heartbeat loss; it does not continue writing. Direct NodeService library calls do not automatically acquire a command lock.

Existing-file saves use write-file-atomic with fsync and rename; exclusive new-file creation retains its hardlink commit. Snapshots capture replacement identity before rename, validate the saved entry, and feed that identity back to the cached instance. External editors do not honor this cooperative lock: original source and identity checks remain, with a check-to-replace race window. Single-file atomic replacement does not make a multi-file operation transactional; recovery and retained-path reports remain in force.

Memory `initMemory`, `rememberMemory`, `addMemoryType`, `doctorMemory`, `refreshIndex` and the index-writing helpers now return promises. Programmatic callers must await them; CLI arguments, JSON and exit codes are unchanged. Note Git dependencies retain process/network substitution points; file operations use the real snapshot-checked service.

NodeService accepts model selection, write validation and read-only reference hooks. Read-only provenance cannot be removed by a hook. Managed mutations require physical containment within managedRoot; referenced sources remain read-only. Existing file permissions are preserved, without introducing a business permission policy.

NodeReference contains id (the normalized absolute entry path), optional name and optional description. Authored Markdown links remain relative to their source, with query/fragment preserved during rewriting; href is not a reference field. References support discovery, while physical parent directories determine ownership. Frontmatter uses gray-matter's default YAML parser; runtime node types are inferred from canonical entry layout and explicit context.

All content nodes use directory entries: index.md for Task/Memory/Note and SKILL.md for Skills. InternalNode uses AGENTS.md with separate local/descendant references; a co-located AGENTS is the content node's harness. Ordinary Markdown is not a runtime node. Moves preserve instance identity, move the complete directory, and relocate registered references and authored relative links. Resources remain opaque files.

NodeService requires managedRoot and accepts structured create/update inputs. Whole-directory import validates every managed entry before writing. Skill validation requires a standard name and nonempty description. Existing file modes are preserved without a business permission policy. Conflicts fail before writes; recovery errors identify retained paths.

Legacy tracked/public documents use the explicit [directory migration Skill](../skills/migrate-directory-nodes/SKILL.md): pnpm migrate:directory-nodes --root <worktree> previews; --apply converts. Existing legacy journals require manual review; this tool does not open their potentially private snapshots.

Whole-unit moves retain canonical entry layout and known business type. `NodeService` uses snapshots and recoverable file/index writes, but multi-file operations are not durable crash-atomic transactions. The repository has adopted directory entries and restored local public memories to their owners; per-clone private migration remains explicit. See the [migration guide](../../docs/recursive-layout-migration.md).

```bash
edges --scope ./projects/demo tasks list
edges --scope ./projects/demo tasks --purpose maintenance create --title "Repair build"
edges --scope ./projects/demo note --title "Decision" --content "..." --co-author "Codex <codex@openai.com>"
```

The new-note MCP snapshots its caller cwd when no target is configured; an explicit configured scope/repo wins over ambient child-process environment. Its CLI and Skill resources remain tied to the implementation checkout.

Notes go to the selected scope's `notes/`; Git operations run at its actual repository root. Artifacts server installation uses the CLI implementation checkout, independently of content scope; the existing server operations `repoRoot` source override remains available.

## `note` required flags

- `--title` (1–120)
- `--content` or `--content-file` (UTF-8, 1–50,000 chars)
- `--co-author` (3–200), e.g. `Name <email@domain>`

Optional: `--json`, `--dry-run`, `--mode`, `--token-file`, `--token-stdin`, `--markdown`, `--import-entry <path>`.

Use `--markdown` for an already authored document: its authored title and body are retained without an ingest template; frontmatter still uses normal gray-matter parsing/serialization (YAML formatting/comments are not preserved), while `--title` names the file and commit. Without it the existing ingest title/date template remains. `--import-entry` validates and copies a complete canonical entry directory into a new unit; it conflicts with body/file/markdown inputs. `--content-file --markdown` validates only the document and does not copy its neighbors. Git/PR/auth defaults are unchanged; `--dry-run` still makes a local commit.

`--content-file`, `--import-entry` and `--markdown` are local CLI options. The new-note HTTP/MCP adapter accepts only title, content and co-author and passes those values to `edges note`; remote requests cannot select local filesystem inputs or resource directories.

```bash
edges note --title "Decision" --content-file /tmp/reviewed-note.md --markdown \
  --co-author "Codex <noreply@openai.com>" --dry-run
edges memory remember --type project --slug decision --title "Decision" \
  --description "Reviewed decision" --content-file /tmp/body.md
```

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

Board root is `<scope>/.harness/tasks/` by default (`--purpose maintenance`); `tasks --purpose domain` explicitly selects `<scope>/tasks/`. The same default applies to root and nested scopes and to both reads and writes. Paths cannot escape the selected board. Writes are filesystem-only (no git). Cancel with `status cancelled`. There is no `delete` command and no top-level `log` verb.

```
edges tasks list [--all-scopes] [--status <edges-tasks-status>] [--priority <edges-task-priority>]... [--project <edges-task-project>]... [--sort priority] [--group-by project] [--format json]
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

Issue-layer stdout is always JSON (`--json` is accepted and ignored). `runs` / `run-messages` default to a table; pass `--output json` for JSON. Run layer is read-only (no append). `create` writes `<stem>/index.md` and `<stem>/.<stem>.log.md`; status/project changes move the complete directory.

`list --all-scopes` selects the Git root containing the resolved scope (including when invoked from a child cwd); without Git, the resolved scope is the range root. The root must have a valid AGENTS entry. Both purposes are included unless the user explicitly supplies `tasks --purpose domain|maintenance`; Commander's default does not become a filter. Only list accepts --all-scopes; create/update/status/project/runs retain their single-board target.

Explicit task/project writes register their board in an existing owning AGENTS entry, including a content node’s co-located AGENTS harness. Maintenance boards belong to localChildren; a new domain board uses descendantChildren while existing domain relations and authored labels are preserved. A fresh scope without AGENTS still supports local task/project creation without initializing Project Memory. Such a board is not globally discoverable until its owner and board are explicitly indexed; a missing global root entry remains an error.

```bash
edges tasks list                              # current scope maintenance
edges tasks list --all-scopes                 # repository, both purposes, every maintenance level
edges tasks --purpose domain list --all-scopes
edges tasks list --all-scopes --status todo --priority high --sort priority
edges tasks list --all-scopes --group-by project
```

An ungrouped global row retains its stored identity and root-relative entry, for example `{"source":{"scope":"extensions/cli","purpose":"maintenance"},"project":"default","stem":"2026-10-06--repair","path":"extensions/cli/.harness/tasks/_default/todo/2026-10-06--repair/index.md",…}`. It omits doc, just like local ungrouped rows. Global groups use scope + purpose + project identities, preserve registered empty projects, and global grouped items also expose their entry path. No cross-source name merging occurs.

Default `list` stays `{ status, command: "list", tasks: [...] }`. `list --group-by project` (optional `--format json`) emits loose-coupled `edges.tasks.grouped/v1`: `{ schema, groups[{id,title,description?}], items[{id|stem, group, title?, status?, …}] }`. Existing `--status` / `--priority` / `--project` / `--sort` still apply **before** grouping. That schema is not named for review-page.

`project review-page` still only renders. It reads `groups` + `items` JSON (`--from` file or `-` for stdin). It inlines the prebuilt shell (`pnpm --filter edges-cli run build:tasks-review-app` or `prepack`) into one HTML file. Data is `#edges-review-payload`. Items may omit `doc`. It writes that HTML (default: OS temp; `--out` overrides) and prints `{status, command: "project.review-page", path, groupCount, itemCount}`. It does not call `updateTask`, `createProject`, or any board mutator, and it does not open a browser. Open the printed `path` in a system browser. Local UI work uses `pnpm --filter edges-cli run dev:tasks-review-app`. There is no `edges tasks classify` / `--mode` / `--open`. `review-page` still only renders; publish is a separate step (`edges artifacts publish`).

Persistent public board (`http(s)://<host>/tasks/`, ADR 0021): generate maps the grouped list into review-page input and writes `tasks/_site/index.html` by default. Box/CI entry:

```bash
pnpm --filter edges-cli exec -- tsx scripts/generate-tasks-site.ts \
  --scope "$PWD" --purpose all --out "$PWD/tasks/_site/index.html"
```

The generator accepts `--purpose domain|maintenance|all`. `all` uses the same registered recursive query as CLI `list --all-scopes`, following composition and every maintenance level; it does not inventory physical directories. Grouped items and HTML use stable IDs containing scope, purpose, project and stem. `source.scope` is repository-relative (`.` for root), and `source.purpose` is explicit; stored stems, project slugs, Task schema and Run IDs stay unchanged. Source-aware groups and items must provide a valid real `project`; source-aware grouped items must also provide their stored `stem`. Transport IDs are never fallback project or stem values. Exports retain the real stem/project and source. The page permits classification only within one source board.

Ops (one-time nginx, curl checks, PATH): [deploy/README.md](deploy/README.md). `deploy.yml` generates after pull; it does not run setup-nginx.

classifyTasks Skill (`extensions/skills/project-tasks-classify`) uses these project verbs plus `update --project`. Generic tasks Skill/MCP CRUD is a later backlog on this same contract. Capability Surface is CLI + Skill + MCP.

## `artifacts`

Thin client for the Artifacts 预览服务 (`extensions/services/artifacts-preview`). `review-page` still only renders; publish is a separate step. 用例 × 能力（审阅页打开、首次托管、日常 publish/rm、部署后重启、轮换 token）见 [artifacts-preview README](../services/artifacts-preview/README.md#use-case-matrix)。

| 用例 | 主要调用 |
| --- | --- |
| 打开审阅页 | `tasks project review-page`（只渲染）→ `artifacts publish` |
| 首次托管 | `server install` → `start` →（nginx 对外时）`setup-nginx` → `status`；客户端 `init` |
| 日常 | `init`（一次）→ `publish` / `rm` |
| pull 后 | Action `deploy.yml`：`install` → `restart`（env 在才跑） |
| 轮换 token | `install --force` → `restart` → `init --force` |

```
edges artifacts init [--base-url <url>] [--config <path>] [--force]
edges artifacts publish <path> [--ttl <duration>] [--entry <relpath>] [--from-type <type>] [--from-id <id>] [--task-project <slug>] [--config <path>]
edges artifacts rm <id|url> [--config <path>]
edges artifacts server install | start | stop | restart | status | setup-nginx
```

`init` writes the **client** config `~/.config/edges/artifacts.env` (`EDGES_ARTIFACTS_TOKEN`, `EDGES_ARTIFACTS_BASE_URL`). Pass `--token` to reuse the value printed by `edges artifacts server install`. `publish` / `rm` read that file (env overrides). Success stdout is JSON (`command`: `artifacts.init` | `artifacts.publish` | `artifacts.rm`). `publish` prints the public `url`. Optional `from` is only written when `--from-type task --from-id <stem> --task-project <slug>` are all set (`id` is the task stem). Omit those flags when there is no task linkage. Do not use `--from-name` or `--task-stem`.

On the host, `edges artifacts server install` ensures `~/.config/edges/artifacts-preview.env` (creates a token if missing; `--force` may rotate), builds the service, and enables the user unit but does **not** start it. There is no `server init`. `start` / `stop` / `restart` are process lifecycle only; `status` is the unit plus `/health`. `setup-nginx` is the one-shot / idempotent :80 reverse proxy into `/etc/nginx/conf.d/teaching.conf` (`/health`, `POST /artifacts`, `/artifacts/…` → `127.0.0.1:8787`, leave `/teaching/` alone). **teaching.conf must contain `/teaching/`**. If the live box still has leftover `teach.conf` with `/teach/`, rename/replace to `teaching.conf` and run `deploy/migrate-teaching-nginx-prefix.py` first — do not dual-support the old names. If sudo is needed it prints the exact `sudo bash …/setup-nginx-artifacts.sh` command. After a repo pull: `install` if the build or unit changed, then `restart` (or `restart` only). Never combine install and start.

Phone review needs a reachable `EDGES_ARTIFACTS_BASE_URL`. The public example is `https://edges.viruspc.tech`, not a bare IP. Localhost is only for the same machine.

`POST /artifacts` to that host returns Cloudflare **1010** when the request has no browser-like `User-Agent`, and **201** when it does. `GET` of the printed URL usually works either way. `publish` and `rm` always send a stable browser User-Agent (`Chrome/131` in the client); they do not use Node/undici’s default `node`. This round has no artifacts MCP.

## Tests

```bash
pnpm --filter edges-cli test
```
