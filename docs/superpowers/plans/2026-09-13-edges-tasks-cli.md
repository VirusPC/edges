# edges tasks CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `edges tasks` placeholder with a filesystem Task-board CLI: Issue-layer `list|get|create|update|status` plus read-only Run-layer `runs` / `run-messages`, against `knowledge/tasks/` and sidecar `.{stem}.log.md`.

**Architecture:** Keep the existing Commander → `parseArgv` → `run()` pipeline used by `edges note`. Add a `src/tasks/` module (board IO, frontmatter, status moves, run-log parse) and register seven subcommands on `tasks`. Writes are local files only (no `git add`/`commit`/`push`); callers (Task 记录员 / later Skill) own git. Run layer never appends. Skill and MCP are not built this round; they will call this same CLI contract later. Capability Surface remains CLI + Skill + MCP as three peers (ADR 0004).

**Tech Stack:** TypeScript, Node.js ≥20, existing `commander` + `zod`, `node:test` + `tsx` (not vitest), `node:fs/promises` + `node:path`. No new YAML library; no `simple-git`; no Multica daemon.

**Spec:** `docs/adr/0005-edges-tasks-cli.md` (accepted). Glossary: `CONTEXT.md` terms **edges tasks（CLI）**, **Task**, **edges-tasks-status**, **Task Run（edges）**, **Task Run Log**. Sidecar + seven-status folders: `docs/adr/0002-knowledge-tasks-status-folders.md`. Capability Surface: `docs/adr/0004-capability-surface-cli-skill-mcp.md`. Board layout: `knowledge/tasks/README.md`. Verb alignment only (no daemon): Multica `issue list|get|create|update|status|runs|run-messages` — https://multica.ai/docs/cli ; https://github.com/multica-ai/multica/blob/main/CLI_AND_DAEMON.md ; https://github.com/multica-ai/multica-cli ; https://github.com/multica-ai/multica/pull/314. In-tree index (may still be on PR #45, not `main`): `.memory/references/reference_multica_cli_tasks_reference.md`.

## Global Constraints

- Co-authored-by on every commit: `Coding Agent 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Capability Surface wording, if mentioned: always **CLI + Skill + MCP** (three peers). Never “必要时 MCP”, never “CLI + Skill” as the Edges shorthand, never npm `package.json` `"bin"` as a layer
- This round is **CLI only**. Do not create Skill or MCP wrappers
- No hard delete of a Task file or sidecar. Cancel = `status cancelled` (frontmatter + move Task + move sidecar)
- GitHub linking / `edges-task-issue` sync is out of scope (do not add `--issue`, `--pr`, or GitHub API calls)
- Run layer is **read-only**. Do not append to `.{stem}.log.md`. Do not add `log` as a top-level verb
- Do not copy Multica daemon, claim/queue, `rerun`, `cancel-task`, `assign`, `--since`, or scheduling states (`deferred` / `queued` / `dispatched` / `waiting_local_directory`)
- Do not change `knowledge/tasks/` board status or task bodies as part of implementing this CLI (tests use a temp board)
- Do not auto-create/edit/move/delete `knowledge/posts/`
- Do not add `js-yaml` / `gray-matter` / `simple-git` / vitest. Stay on `commander` + `zod` + `node:test` + `tsx`
- Test glob is `extensions/clis/test/*.test.ts` (`package.json` `"test": "node --test --import tsx test/*.test.ts"`). New tests must match that glob (`test/tasks-*.test.ts`). Helpers may live at `test/tasks-helpers.ts` (not a `*.test.ts`)
- Reuse `EDGES_REPO` from `loadConfig()` as the repo root. Board lives at `<repoPath>/knowledge/tasks/`
- `edges note` auth flags stay on `note` only. Tasks commands do not read `--token-file` / `--token-stdin`
- Public repo: no credentials, tokens, or personal data in commits
- `pull` / `rebase` use `--autostash`. Do not commit `.obsidian/workspace.json`

---

## File map

**Create**

- `extensions/clis/src/tasks/types.ts` — `TaskStatus`, `RunStatus`, `TasksErrorCode`, records, parsed-command types
- `extensions/clis/src/tasks/paths.ts` — status dirs, stem/path resolve, sidecar path, skip `AGENTS.md` / `README.md` / `.memory/`
- `extensions/clis/src/tasks/slug.ts` — CJK-preserving file slug + ASCII `name` slug (do **not** reuse `git/slug.ts` `titleToSlug`, which strips CJK)
- `extensions/clis/src/tasks/frontmatter.ts` — parse/serialize project-memory shape; surgical metadata patch
- `extensions/clis/src/tasks/board.ts` — list/get over a temp or real board root
- `extensions/clis/src/tasks/write.ts` — create + update (files only)
- `extensions/clis/src/tasks/move.ts` — status move of Task + sidecar
- `extensions/clis/src/tasks/runlog.ts` — parse sidecar table, stable `run-id`, note→run attribution
- `extensions/clis/src/tasks/format.ts` — JSON envelope + `runs`/`run-messages` table
- `extensions/clis/src/tasks/service.ts` — command handlers (`listTasks`, `getTask`, …)
- `extensions/clis/src/tasks/program.ts` — attach Commander subtree to the `tasks` command
- `extensions/clis/src/tasks/run.ts` — `runTasks(parsed, io)` used by root `run()`
- `extensions/clis/test/tasks-helpers.ts` — temp board factory (not executed by the test glob)
- `extensions/clis/test/tasks-paths.test.ts`
- `extensions/clis/test/tasks-slug.test.ts`
- `extensions/clis/test/tasks-frontmatter.test.ts`
- `extensions/clis/test/tasks-board.test.ts`
- `extensions/clis/test/tasks-write.test.ts`
- `extensions/clis/test/tasks-move.test.ts`
- `extensions/clis/test/tasks-runlog.test.ts`
- `extensions/clis/test/tasks-parse.test.ts`
- `extensions/clis/test/tasks-run.test.ts`
- `extensions/clis/test/tasks-cli.test.ts`

**Modify**

- `extensions/clis/src/program.ts` — drop placeholder `onTasks`; call `addTasksCommands`; keep `note` unchanged
- `extensions/clis/src/parse.ts` — `ParseOk` grows seven `tasks-*` kinds; unknown `tasks` verb / missing subcommand = `VALIDATION_ERROR`
- `extensions/clis/src/run.ts` — dispatch `tasks-*` to `runTasks`; remove “not implemented yet”
- `extensions/clis/src/help.ts` — replace `TASKS_AFTER_HELP` placeholder with the contract below
- `extensions/clis/src/exit.ts` — `exitCodeForTasksError(code)` (2 = validation, 1 = not found / IO)
- `extensions/clis/README.md` — document the seven commands; say Skill/MCP follow later on this contract
- `extensions/clis/test/parse.test.ts` — rewrite placeholder assertions
- `extensions/clis/test/run.test.ts` — rewrite placeholder assertions
- `extensions/clis/test/cli.test.ts` — rewrite placeholder `--help` assertion
- `CHANGELOG.md` `[Unreleased]` — Added `edges tasks` CLI (when the implementation lands)

**Do not create/commit**

- `extensions/skills/edges-tasks/**` or any Skill wrapper
- MCP server / tool for tasks
- `edges tasks delete`, `edges tasks log`, Run append, GitHub sync
- Edits under `knowledge/posts/`
- Board status moves under `knowledge/tasks/` (implementation tests use `os.tmpdir()`)

---

## Locked design (read before Task 1)

Cite these as already decided. Do not reopen them in implementation tasks.

### Command surface (ADR 0005 + Multica verbs)

```
edges tasks list [--status <edges-tasks-status>]
edges tasks get <stem|path>
edges tasks create --title <title> [--description <text>] [--body <markdown>] [--status <status>] [--name <name>] [--assignee <text>]
edges tasks update <stem|path> [--title <title>] [--description <text>] [--body <markdown>] [--assignee <text>]
edges tasks status <stem|path> <status>
edges tasks runs <stem|path> [--output table|json]
edges tasks run-messages <run-id> [--task <stem>] [--output table|json]
```

- Missing `tasks` subcommand, unknown verb (`delete`, `log`, `append`), or unknown flag → JSON failure `VALIDATION_ERROR`, exit 2, no writes
- `create` default `--status` is `backlog` (ADR 0002 / `knowledge/tasks/README.md`)
- `update` never moves files and never renames the stem. Status changes go through `status` only
- `status cancelled` is the only retirement path. There is no `delete` command
- `runs` default `--output` is `table` (human summary). `--output json` is required by ADR 0005
- Issue-layer commands (`list|get|create|update|status`) always write a JSON envelope to stdout (same agent contract as `edges note`). `--json` is accepted and ignored (always on)
- Stderr is diagnostics only

### JSON envelope

Success:

```json
{"status":"success","command":"list","tasks":[]}
```

Failure (stdout, same as `edges note`):

```json
{"status":"failed","errorCode":"VALIDATION_ERROR","reason":"..."}
```

`errorCode` values: `VALIDATION_ERROR` | `TASK_NOT_FOUND` | `RUN_NOT_FOUND` | `AMBIGUOUS_TASK` | `BOARD_IO_ERROR` | `UNKNOWN_ERROR`.

Exit: `0` success, `2` `VALIDATION_ERROR`, `1` everything else.

### Board on disk (ADR 0002)

```
<repo>/knowledge/tasks/<edges-tasks-status>/<stem>.md
<repo>/knowledge/tasks/<edges-tasks-status>/.{stem}.log.md
```

`edges-tasks-status` = `backlog` | `todo` | `in_progress` | `in_review` | `done` | `blocked` | `cancelled`.

Skip while scanning: `AGENTS.md`, `README.md`, any `.memory/` tree, any file whose name does not end in `.md`, sidecar files (name starts with `.` and ends in `.log.md`).

**Identity:** `stem` is the Task file basename without `.md`. Existing example: `2026-09-11--tasks配套skill统一CRUD与状态流转`. `get` / `update` / `status` / `runs` accept either that stem or a path ending in `<stem>.md` (absolute or repo-relative).

If the same stem exists in two status folders → `AMBIGUOUS_TASK`. If none → `TASK_NOT_FOUND`.

### Frontmatter (ADR 0002 + project-memory shape)

Create writes (omit empty optional lines):

```markdown
---
name: <ascii_snake>
description: <one line>
metadata:
  edges-type: task
  edges-title: <title>
  edges-tasks-status: <status>
  edges-task-assignee: <optional>
  edges-updated-at: <ISO-8601>
---

<body>
```

Default body when `--body` omitted:

```markdown
<title>

**Why:**


**How to apply:**

```

`status` patches only `metadata.edges-tasks-status` (and `edges-updated-at`) without reordering other keys (ADR 0002 / Conclusion: do not reshuffle YAML). `update` patches named fields the same way. Stem / filename stay stable when `--title` changes.

### Create filename

`knowledge/tasks/<status>/<localYmd>--<fileSlug>.md` plus sidecar `.<stem>.log.md`.

`fileSlug` (this is **not** `git/titleToSlug`): keep ASCII letters/digits, CJK letters, hyphen; spaces → `-`; strip path-hostile `/\\:*?"<>|` and other non-letter symbols; collapse repeat hyphens; trim to 80 chars; if empty, use `task`. Reuse `localDateYmd` from `src/git/slug.ts`.

`name` (frontmatter): lowercase ASCII `[a-z0-9_]` from the title; if empty, `task`.

If the target path exists, suffix `-2`, `-3`, … before `.md`.

Empty sidecar on create (table + Notes; no run rows):

```markdown
# Run log: <stem>

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|

## Notes

```

### Filesystem only

`create` / `update` / `status` write/rename files under the board. They do **not** call `git`. This is intentional: `edges note` owns ingest git; Task 记录员 “只追加直接推 main” is a caller convention (`project_tasks_direct_main`), not a CLI side effect. Cloud Agent branches must not be forced onto `main`.

### Stable `run-id` (CONTEXT: do not use line number as the public key)

Existing sidecars look like:

```markdown
# Run log: 2026-09-11--CLI用Commanderjs重构

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | Coding Agent 专家 | 2026-09-11T19:15:00+08:00 | 2026-09-11T19:33:00+08:00 | completed |  |

## Notes

- 2026-09-11T19:16+08:00 Coding Agent 专家：已接 #16；…
```

Parse rules:

1. Read the first markdown table. Columns are matched by header name (case-insensitive). Required for a row: `#` (or implicit 1-based order) + the other cells default to `""`.
2. If a `run-id` column exists and the cell is non-empty, that is the public id.
3. Otherwise public id is `${stem}--${n}` where `n` is the integer `#` (or 1-based row order). Example: `2026-09-11--CLI用Commanderjs重构--1`.
4. CLI output never uses raw `#` as `run-id`. `#` stays a display/order column on disk.

`run-messages <run-id>`:

- Full id matches `/^(.*)--(\d+)$/` (greedy stem, last `--<digits>`).
- Bare digits (`1`) require `--task <stem>` and become `${stem}--${n}` (Multica short id + `--issue`).
- Otherwise `VALIDATION_ERROR`.

Run statuses on disk (ADR 0002 / README): `pending` | `running` | `completed` | `failed` | `cancelled`. Parser accepts unknown strings and passes them through; it does not coerce them into `edges-tasks-status`.

### `run-messages` attribution (read-only)

`## Notes` bullet lines become messages.

- If a line starts with a parseable timestamp (`YYYY-MM-DDTHH:mm` with optional seconds/offset), assign it to the last run whose `started_at <= ts`, and `ts < next.started_at` (last run has no upper bound).
- If there is no timestamp, assign to the last run in the file.
- If there are no runs, `run-messages` for any id is `RUN_NOT_FOUND`.
- `seq` is 1-based inside that run.

`--since` is **not** in this round.

### Help copy

`edges tasks --help` must list the seven subcommands, show examples, say stdout is JSON (except `runs`/`run-messages` table default), and state: this round is CLI only; Skill and MCP will use this same contract later; Capability Surface is CLI + Skill + MCP.

---

### Task 1: Status enum, paths, identity resolve

**Files:**
- Create: `extensions/clis/src/tasks/types.ts`
- Create: `extensions/clis/src/tasks/paths.ts`
- Create: `extensions/clis/test/tasks-paths.test.ts`

**Interfaces:**
- Consumes: `RuntimeConfig.repoPath` (later tasks pass it in)
- Produces:
  - `TASK_STATUSES` = `["backlog","todo","in_progress","in_review","done","blocked","cancelled"]`
  - `isTaskStatus(value: string): value is TaskStatus`
  - `boardRoot(repoPath: string): string` → `path.join(repoPath, "knowledge/tasks")`
  - `statusDir(repoPath: string, status: TaskStatus): string`
  - `taskRelPath(status: TaskStatus, stem: string): string` → `knowledge/tasks/${status}/${stem}.md`
  - `sidecarRelPath(status: TaskStatus, stem: string): string` → `knowledge/tasks/${status}/.${stem}.log.md`
  - `stemFromFilename(name: string): string | undefined` — `"foo.md"` → `"foo"`; `".foo.log.md"` → `undefined`; `"AGENTS.md"` → `undefined` when used via `isTaskMarkdownName`
  - `isTaskMarkdownName(name: string): boolean` — true only for `*.md` that are not sidecars and not `AGENTS.md`/`README.md`
  - `parseTarget(target: string): { kind: "stem"; stem: string } | { kind: "path"; stem: string }` — basename without `.md`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { TASK_STATUSES } from "../src/tasks/types.js";
import {
  isTaskStatus,
  boardRoot,
  taskRelPath,
  sidecarRelPath,
  isTaskMarkdownName,
  parseTarget,
} from "../src/tasks/paths.js";

test("TASK_STATUSES is the seven ADR 0002 values in folder order", () => {
  assert.deepEqual(TASK_STATUSES, [
    "backlog",
    "todo",
    "in_progress",
    "in_review",
    "done",
    "blocked",
    "cancelled",
  ]);
});

test("isTaskStatus rejects Run-layer and old enums", () => {
  assert.equal(isTaskStatus("in_progress"), true);
  assert.equal(isTaskStatus("completed"), false);
  assert.equal(isTaskStatus("open"), false);
  assert.equal(isTaskStatus("status"), false);
});

test("paths join knowledge/tasks and sidecar dotfile", () => {
  assert.equal(boardRoot("/repo"), "/repo/knowledge/tasks");
  assert.equal(
    taskRelPath("in_progress", "2026-09-11--cli"),
    "knowledge/tasks/in_progress/2026-09-11--cli.md",
  );
  assert.equal(
    sidecarRelPath("in_progress", "2026-09-11--cli"),
    "knowledge/tasks/in_progress/.2026-09-11--cli.log.md",
  );
});

test("isTaskMarkdownName skips sidecar, AGENTS, README", () => {
  assert.equal(isTaskMarkdownName("2026-09-11--cli.md"), true);
  assert.equal(isTaskMarkdownName(".2026-09-11--cli.log.md"), false);
  assert.equal(isTaskMarkdownName("AGENTS.md"), false);
  assert.equal(isTaskMarkdownName("README.md"), false);
});

test("parseTarget accepts stem or path", () => {
  assert.deepEqual(parseTarget("2026-09-11--cli"), { kind: "stem", stem: "2026-09-11--cli" });
  assert.deepEqual(parseTarget("knowledge/tasks/done/2026-09-11--cli.md"), {
    kind: "path",
    stem: "2026-09-11--cli",
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-paths.test.ts`

Expected: FAIL with `Cannot find module` / `TASK_STATUSES is not defined`.

- [ ] **Step 3: Write minimal implementation**

`types.ts`: export `TaskStatus`, `TASK_STATUSES`, `TasksErrorCode`, empty record types used later (`TaskIdentity`, `TaskListItem`).

`paths.ts`: import `TASK_STATUSES` from `./types.js`. Implement the functions above. `isTaskStatus` is `TASK_STATUSES.includes(value as TaskStatus)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-paths.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/types.ts extensions/clis/src/tasks/paths.ts \
  extensions/clis/test/tasks-paths.test.ts
git commit -m "feat(tasks): add status enum and board paths" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 2: CJK-preserving task slugs

**Files:**
- Create: `extensions/clis/src/tasks/slug.ts`
- Create: `extensions/clis/test/tasks-slug.test.ts`
- Modify: none of `src/git/slug.ts` (reuse `localDateYmd` only)

**Interfaces:**
- Consumes: `localDateYmd(now: Date): string` from `../git/slug.js`
- Produces:
  - `taskFileSlug(title: string): string`
  - `taskNameSlug(title: string): string`
  - `newTaskStem(title: string, now: Date): string` → `${localDateYmd(now)}--${taskFileSlug(title)}`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { taskFileSlug, taskNameSlug, newTaskStem } from "../src/tasks/slug.js";

test("taskFileSlug keeps CJK and hyphenates spaces", () => {
  assert.equal(taskFileSlug("tasks 配套 skill"), "tasks-配套skill");
  assert.equal(taskFileSlug("Hello World!"), "Hello-World");
  assert.equal(taskFileSlug("a/b:c"), "abc");
  assert.equal(taskFileSlug("???"), "task");
});

test("taskNameSlug is ascii snake and falls back", () => {
  assert.equal(taskNameSlug("CLI + Skill + MCP"), "cli_skill_mcp");
  assert.equal(taskNameSlug("中文标题"), "task");
});

test("newTaskStem uses local calendar date", () => {
  const now = new Date(2026, 8, 13, 15, 0, 0);
  assert.equal(newTaskStem("edges tasks CLI", now), "2026-09-13--edges-tasks-CLI");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-slug.test.ts`

Expected: FAIL `Cannot find module '../src/tasks/slug.js'`

- [ ] **Step 3: Write minimal implementation**

```ts
import { localDateYmd } from "../git/slug.js";

const HOSTILE = /[/\\:*?"<>|]/g;

export function taskFileSlug(title: string): string {
  const slug = title
    .replace(HOSTILE, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug.length > 0 ? slug : "task";
}

export function taskNameSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return slug.length > 0 ? slug : "task";
}

export function newTaskStem(title: string, now: Date): string {
  return `${localDateYmd(now)}--${taskFileSlug(title)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-slug.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/slug.ts extensions/clis/test/tasks-slug.test.ts
git commit -m "feat(tasks): add CJK-preserving task slugs" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 3: Project-memory frontmatter parse and surgical patch

**Files:**
- Create: `extensions/clis/src/tasks/frontmatter.ts`
- Create: `extensions/clis/test/tasks-frontmatter.test.ts`

**Interfaces:**
- Consumes: `TaskStatus` from `./types.js`
- Produces:
  - `ParsedTaskDoc = { name: string; description: string; metadata: Record<string, string>; body: string; rawFrontmatter: string }`
  - `parseTaskDoc(markdown: string): ParsedTaskDoc`
  - `setMetadataField(markdown: string, key: string, value: string): string` — replace or append `key: value` under `metadata:`; do not reorder other lines
  - `setTopLevelField(markdown: string, key: "name" | "description", value: string): string`
  - `replaceBody(markdown: string, body: string): string`
  - `renderNewTaskDoc(input: { name: string; description: string; title: string; status: TaskStatus; assignee?: string; updatedAt: string; body: string }): string`

- [ ] **Step 1: Write the failing test**

Use a fixture copied from the real board shape (do not write into `knowledge/tasks/`):

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskDoc, setMetadataField, renderNewTaskDoc } from "../src/tasks/frontmatter.js";

const SAMPLE = `---
name: cli_refactor_commanderjs
description: CLI 用 Commander.js 重构
metadata:
  edges-type: task
  edges-title: CLI 用 Commander.js 重构
  edges-tasks-status: done
  edges-task-pr: "https://github.com/VirusPC/edges/pull/37"
  edges-updated-at: "2026-09-11T20:08:00+08:00"
---

CLI 用 Commander.js（commander）重构。

**Why:**
reason

**How to apply:**
- do the thing
`;

test("parseTaskDoc reads name, description, nested edges-* metadata, body", () => {
  const doc = parseTaskDoc(SAMPLE);
  assert.equal(doc.name, "cli_refactor_commanderjs");
  assert.equal(doc.metadata["edges-tasks-status"], "done");
  assert.equal(doc.metadata["edges-title"], "CLI 用 Commander.js 重构");
  assert.match(doc.body, /Commander\.js/);
});

test("setMetadataField changes only that key and keeps neighbor order", () => {
  const next = setMetadataField(SAMPLE, "edges-tasks-status", "cancelled");
  assert.match(next, /edges-type: task\n  edges-title:/);
  assert.match(next, /edges-tasks-status: cancelled/);
  assert.match(next, /edges-task-pr:/);
  assert.equal(parseTaskDoc(next).metadata["edges-tasks-status"], "cancelled");
});

test("renderNewTaskDoc writes ADR 0002 shape and omits empty assignee", () => {
  const md = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "edges tasks CLI\n\n**Why:**\n\n\n**How to apply:**\n",
  });
  assert.match(md, /^---\nname: edges_tasks_cli\n/);
  assert.match(md, /edges-type: task/);
  assert.match(md, /edges-tasks-status: backlog/);
  assert.doesNotMatch(md, /edges-task-assignee/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-frontmatter.test.ts`

Expected: FAIL `Cannot find module`

- [ ] **Step 3: Write minimal implementation**

Hand-roll the subset this board uses:

- Split on the first and second `---` lines.
- Top-level `name:` / `description:` are `key: value` (strip one layer of double quotes).
- Lines indented under `metadata:` that match `/^  ([A-Za-z0-9_-]+):\s*(.*)$/` become `metadata[key]`.
- `setMetadataField`: if `^  ${key}:` exists, replace that line; else insert before the closing `---` after the last metadata line.
- Quote values that contain `:` or `#` or start with `{`.

Do not add a YAML dependency.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-frontmatter.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/frontmatter.ts extensions/clis/test/tasks-frontmatter.test.ts
git commit -m "feat(tasks): parse and patch task frontmatter" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 4: Board read — list and get (no Commander yet)

**Files:**
- Create: `extensions/clis/src/tasks/board.ts`
- Create: `extensions/clis/test/tasks-board.test.ts`
- Modify: `extensions/clis/test/tasks-helpers.ts`

**Interfaces:**
- Consumes: `boardRoot`, `TASK_STATUSES`, `isTaskMarkdownName`, `parseTaskDoc`, `sidecarRelPath`
- Produces:
  - `type BoardFs = { readFile(abs: string): Promise<string>; readdir(abs: string): Promise<string[]>; exists(abs: string): Promise<boolean> }`
  - `listTasks(repoPath: string, opts: { status?: TaskStatus }, fs: BoardFs): Promise<TaskListItem[]>`
  - `getTask(repoPath: string, target: string, fs: BoardFs): Promise<TaskRecord>` — throws `{ errorCode: TasksErrorCode; message: string }`
  - `TaskListItem = { stem, title, status, description, path, sidecarPath, runCount }`
  - `TaskRecord = TaskListItem & { name, metadata, body, sidecarExists, sidecarMarkdown?: string }`
  - `runCount` = number of table data rows in the sidecar, or `0` if missing (do not parse run-id yet; count `|` rows that are not the header/separator)

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nodeBoardFs } from "./tasks-helpers.js";
import { listTasks, getTask } from "../src/tasks/board.js";

async function seed() {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const dir = path.join(repo, "knowledge/tasks/todo");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "2026-09-13--demo.md"),
    `---
name: demo
description: demo task
metadata:
  edges-type: task
  edges-title: demo task
  edges-tasks-status: todo
---

body
`,
    "utf8",
  );
  await writeFile(
    path.join(dir, ".2026-09-13--demo.log.md"),
    `# Run log: 2026-09-13--demo

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | Agent | 2026-09-13T01:00:00Z |  | running |  |
`,
    "utf8",
  );
  await mkdir(path.join(repo, "knowledge/tasks/.memory"), { recursive: true });
  await writeFile(path.join(repo, "knowledge/tasks/AGENTS.md"), "# tasks\n", "utf8");
  return repo;
}

test("listTasks returns todo item and ignores AGENTS.md / .memory", async () => {
  const repo = await seed();
  try {
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items.length, 1);
    assert.equal(items[0]?.stem, "2026-09-13--demo");
    assert.equal(items[0]?.status, "todo");
    assert.equal(items[0]?.runCount, 1);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks --status backlog is empty when only todo exists", async () => {
  const repo = await seed();
  try {
    const items = await listTasks(repo, { status: "backlog" }, nodeBoardFs());
    assert.equal(items.length, 0);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("getTask by stem and by path", async () => {
  const repo = await seed();
  try {
    const byStem = await getTask(repo, "2026-09-13--demo", nodeBoardFs());
    const byPath = await getTask(repo, "knowledge/tasks/todo/2026-09-13--demo.md", nodeBoardFs());
    assert.equal(byStem.body.trim(), "body");
    assert.equal(byPath.stem, "2026-09-13--demo");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("getTask missing stem is TASK_NOT_FOUND", async () => {
  const repo = await seed();
  try {
    await getTask(repo, "nope", nodeBoardFs());
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "TASK_NOT_FOUND");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

`tasks-helpers.ts` exports `nodeBoardFs()` wrapping `fs/promises`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-board.test.ts`

Expected: FAIL `Cannot find module '../src/tasks/board.js'`

- [ ] **Step 3: Write minimal implementation**

Scan each status directory that exists. Ignore missing folders. `getTask` walks all seven dirs for a stem; if a path is given, verify the file exists (still require the stem to be unique if called as stem).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-board.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/board.ts extensions/clis/test/tasks-board.test.ts \
  extensions/clis/test/tasks-helpers.ts
git commit -m "feat(tasks): list and get task board files" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 5: Commander subtree + parseArgv kinds

**Files:**
- Create: `extensions/clis/src/tasks/program.ts`
- Create: `extensions/clis/test/tasks-parse.test.ts`
- Modify: `extensions/clis/src/program.ts` (replace placeholder `tasks.action`)
- Modify: `extensions/clis/src/parse.ts` (`ParseOk` union)
- Modify: `extensions/clis/test/parse.test.ts` (placeholder tests)

**Interfaces:**
- Consumes: `TASK_STATUSES`, Commander `Command`
- Put the seven `tasks-*` objects in `src/tasks/types.ts` as `TasksParseOk` so `program.ts` does not import `parse.ts`. `parse.ts` does `export type ParseOk = NoteParseOk | TasksParseOk | { kind: "help"; text: string } | { kind: "version" }`.
- Produces `TasksParseOk` (names must be used by Task 6+):

```ts
export type TasksOutput = "table" | "json";

export type ParseOk =
  | { kind: "help"; text: string }
  | { kind: "version" }
  | { kind: "note"; /* existing fields unchanged */ }
  | { kind: "tasks-list"; status?: TaskStatus }
  | { kind: "tasks-get"; target: string }
  | {
      kind: "tasks-create";
      title: string;
      description?: string;
      body?: string;
      status: TaskStatus;
      name?: string;
      assignee?: string;
    }
  | {
      kind: "tasks-update";
      target: string;
      title?: string;
      description?: string;
      body?: string;
      assignee?: string;
    }
  | { kind: "tasks-status"; target: string; next: TaskStatus }
  | { kind: "tasks-runs"; target: string; output: TasksOutput }
  | { kind: "tasks-run-messages"; runId: string; task?: string; output: TasksOutput };
```

Remove `{ kind: "tasks" }` and `ProgramHandlers.onTasks`.

- [ ] **Step 1: Write the failing tests**

In `test/tasks-parse.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { parseArgv } from "../src/parse.js";

test("parseArgv tasks list [--status]", () => {
  const listed = parseArgv(["tasks", "list"]);
  assert.equal(listed.kind, "tasks-list");
  const filtered = parseArgv(["tasks", "list", "--status", "in_progress"]);
  assert.equal(filtered.kind, "tasks-list");
  if (filtered.kind === "tasks-list") assert.equal(filtered.status, "in_progress");
});

test("parseArgv tasks list rejects Run status values", () => {
  const parsed = parseArgv(["tasks", "list", "--status", "completed"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") assert.equal(parsed.errorCode, "VALIDATION_ERROR");
});

test("parseArgv tasks get/create/update/status/runs/run-messages", () => {
  assert.equal(parseArgv(["tasks", "get", "stem-1"]).kind, "tasks-get");
  const created = parseArgv(["tasks", "create", "--title", "Hello"]);
  assert.equal(created.kind, "tasks-create");
  if (created.kind === "tasks-create") assert.equal(created.status, "backlog");
  assert.equal(parseArgv(["tasks", "update", "stem-1", "--title", "N"]).kind, "tasks-update");
  const moved = parseArgv(["tasks", "status", "stem-1", "cancelled"]);
  assert.equal(moved.kind, "tasks-status");
  const runs = parseArgv(["tasks", "runs", "stem-1"]);
  assert.equal(runs.kind, "tasks-runs");
  if (runs.kind === "tasks-runs") assert.equal(runs.output, "table");
  const jsonRuns = parseArgv(["tasks", "runs", "stem-1", "--output", "json"]);
  assert.equal(jsonRuns.kind, "tasks-runs");
  if (jsonRuns.kind === "tasks-runs") assert.equal(jsonRuns.output, "json");
  const msgs = parseArgv(["tasks", "run-messages", "stem-1--1"]);
  assert.equal(msgs.kind, "tasks-run-messages");
});

test("parseArgv rejects tasks delete, log, and missing subcommand", () => {
  for (const argv of [["tasks"], ["tasks", "delete", "x"], ["tasks", "log", "x"]] as string[][]) {
    const parsed = parseArgv(argv);
    assert.equal(parsed.kind, "error");
    if (parsed.kind === "error") assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  }
});

test("parseArgv tasks --help is help and lists subcommands", () => {
  const parsed = parseArgv(["tasks", "--help"]);
  assert.equal(parsed.kind, "help");
  if (parsed.kind === "help") {
    assert.match(parsed.text, /\blist\b/);
    assert.match(parsed.text, /\brun-messages\b/);
    assert.doesNotMatch(parsed.text, /not implemented/i);
  }
});
```

Rewrite `test/parse.test.ts` tests named `parseArgv tasks --help is help` and `parseArgv tasks without flags is the placeholder command`:

```ts
test("parseArgv tasks --help is help", () => {
  const parsed = parseArgv(["tasks", "--help"]);
  assert.equal(parsed.kind, "help");
});

test("parseArgv tasks without a subcommand is a validation error", () => {
  const parsed = parseArgv(["tasks"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-parse.test.ts test/parse.test.ts`

Expected: FAIL (`kind` is still `"tasks"` / help still says not implemented).

- [ ] **Step 3: Write minimal implementation**

`src/tasks/program.ts`:

```ts
import { Command, Option } from "commander";
import { TASK_STATUSES } from "./types.js";

export function addTasksCommands(
  tasks: Command,
  onCommand: (parsed: Exclude<ParseOk, { kind: "help" } | { kind: "version" } | { kind: "note" }>) => void,
): void {
  const statusOpt = new Option("--status <status>", "edges-tasks-status").choices([...TASK_STATUSES]);
  tasks.command("list").addOption(statusOpt).action((opts) => onCommand({ kind: "tasks-list", status: opts.status }));
  tasks.command("get").argument("<target>", "stem or path").action((target) => onCommand({ kind: "tasks-get", target }));
  tasks
    .command("create")
    .requiredOption("--title <title>", "Task title")
    .option("--description <text>", "One-line description")
    .option("--body <markdown>", "Body after frontmatter")
    .addOption(new Option("--status <status>", "initial edges-tasks-status").choices([...TASK_STATUSES]))
    .option("--name <name>", "frontmatter name")
    .option("--assignee <text>", "edges-task-assignee")
    .action((opts) =>
      onCommand({
        kind: "tasks-create",
        title: opts.title,
        description: opts.description,
        body: opts.body,
        status: opts.status ?? "backlog",
        name: opts.name,
        assignee: opts.assignee,
      }),
    );
  tasks
    .command("update")
    .argument("<target>", "stem or path")
    .option("--title <title>")
    .option("--description <text>")
    .option("--body <markdown>")
    .option("--assignee <text>")
    .action((target, opts) => onCommand({ kind: "tasks-update", target, ...opts }));
  tasks
    .command("status")
    .argument("<target>", "stem or path")
    .argument("<status>", "next edges-tasks-status")
    .action((target, status) => {
      if (!TASK_STATUSES.includes(status)) throw new Error(`invalid edges-tasks-status: ${status}`);
      onCommand({ kind: "tasks-status", target, next: status });
    });
  const output = new Option("--output <format>", "table or json").choices(["table", "json"]).default("table");
  tasks
    .command("runs")
    .argument("<target>", "stem or path")
    .addOption(output)
    .action((target, opts) => onCommand({ kind: "tasks-runs", target, output: opts.output }));
  tasks
    .command("run-messages")
    .argument("<run-id>", "stable run-id or numeric n with --task")
    .option("--task <stem>", "scope a short run-id")
    .addOption(new Option("--output <format>", "table or json").choices(["table", "json"]).default("table"))
    .action((runId, opts) =>
      onCommand({ kind: "tasks-run-messages", runId, task: opts.task, output: opts.output }),
    );
}
```

Wire from `createProgram`: delete `onTasks` / `tasks.action`. After creating `tasks`, call `addTasksCommands`. `parseArgv` collects the `tasks-*` object the same way it collects `onNote`.

`create` without `--title` → Commander missing-option error → `VALIDATION_ERROR`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-parse.test.ts test/parse.test.ts`

Expected: PASS. Then `pnpm --filter edges-cli test` — `run.test.ts` / `cli.test.ts` still expect the placeholder; they fail until Task 6. **Do not** “fix” them by keeping the placeholder. Task 6 updates those files immediately after this commit if you prefer one commit; otherwise this commit may leave `run.test.ts` red. Preferred: finish Step 5 here only if `tasks-parse` + `parse` pass, then Task 6 in the next commit updates `run`/`cli` tests **before** changing `run.ts` (TDD). If `pnpm --filter edges-cli test` is red because of the old placeholder tests, that is expected until Task 6 Step 1 rewrites them.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/program.ts extensions/clis/src/program.ts \
  extensions/clis/src/parse.ts extensions/clis/test/tasks-parse.test.ts \
  extensions/clis/test/parse.test.ts
git commit -m "feat(tasks): parse list get create update status runs" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 6: `run()` dispatch + `edges tasks list`

**Files:**
- Create: `extensions/clis/src/tasks/format.ts`
- Create: `extensions/clis/src/tasks/service.ts`
- Create: `extensions/clis/src/tasks/run.ts`
- Create: `extensions/clis/test/tasks-run.test.ts`
- Modify: `extensions/clis/src/run.ts`
- Modify: `extensions/clis/src/exit.ts`
- Modify: `extensions/clis/src/help.ts`
- Modify: `extensions/clis/test/run.test.ts`
- Modify: `extensions/clis/test/cli.test.ts`

**Interfaces:**
- Consumes: `listTasks`, `ParseOk` `tasks-list`, `loadConfig(env).repoPath`
- Produces:
  - `formatTasksResult(payload: TasksSuccess | TasksFailure): string` — `JSON.stringify(payload) + "\n"`
  - `exitCodeForTasksError(code: TasksErrorCode): number`
  - `runTasks(parsed: TasksParseOk, io: TasksRunIo): Promise<RunResult>`
  - `TasksRunIo = { env?: NodeJS.ProcessEnv; repoPath?: string; fs?: BoardFs; now?: Date; writer?: BoardWriter }` (`writer` unused until Task 8)

- [ ] **Step 1: Write the failing tests**

Replace placeholder tests in `run.test.ts` and `cli.test.ts`:

```ts
test("run tasks --help lists subcommands and not the placeholder", async () => {
  const result = await run(["tasks", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /\blist\b/);
  assert.match(result.stdout, /\brun-messages\b/);
  assert.doesNotMatch(result.stdout, /not implemented/i);
});

test("run tasks without subcommand is usage JSON", async () => {
  const result = await run(["tasks"]);
  assert.equal(result.exitCode, 2);
  const parsed = JSON.parse(result.stdout) as { status: string; errorCode: string };
  assert.equal(parsed.status, "failed");
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
});
```

`cli.test.ts`: `real entry tasks --help` must match `/Commands:/` or `list` and must not match `/not implemented/i`.

New `test/tasks-run.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../src/run.js";

test("run tasks list returns JSON tasks from EDGES_REPO", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/backlog");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-13--listed.md"),
      `---
name: listed
description: listed
metadata:
  edges-type: task
  edges-title: listed
  edges-tasks-status: backlog
---

x
`,
      "utf8",
    );
    const result = await run(["tasks", "list"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { status: string; command: string; tasks: { stem: string }[] };
    assert.equal(body.status, "success");
    assert.equal(body.command, "list");
    assert.equal(body.tasks[0]?.stem, "2026-09-13--listed");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-run.test.ts test/run.test.ts`

Expected: FAIL (`tasks is not implemented yet` or `command` missing).

- [ ] **Step 3: Write minimal implementation**

`run.ts` (root): if `parsed.kind` starts with `tasks-`, `return runTasks(parsed, { env, repoPath: loadConfig(env).repoPath })`.

`runTasks`: switch on `kind`. For this task implement `tasks-list` only; other `tasks-*` kinds return `VALIDATION_ERROR` `"not implemented"` **only if you have not reached those tasks yet**. Prefer implementing the switch with `TASK_NOT_FOUND`-style stubs that Task 7–14 replace. Cleaner: implement `tasks-list` and let other kinds fall through to a single `assert.fail` in tests you have not written — but production `runTasks` must handle every kind by Task 14. For this commit, other kinds may return `VALIDATION_ERROR` `"<kind> not wired"` so `edges tasks get` fails closed. Task 7 replaces that branch.

`exitCodeForTasksError`: `VALIDATION_ERROR` → 2; else 1.

`TASKS_AFTER_HELP`:

```
COMMANDS
  list [--status <edges-tasks-status>]
  get <stem|path>
  create --title <title> [--description] [--body] [--status] [--name] [--assignee]
  update <stem|path> [--title] [--description] [--body] [--assignee]
  status <stem|path> <edges-tasks-status>
  runs <stem|path> [--output table|json]
  run-messages <run-id> [--task <stem>] [--output table|json]

Issue layer stdout is JSON. runs / run-messages default to a table; pass --output json.

Cancel a Task with: edges tasks status <stem> cancelled
There is no delete command.

Run layer is read-only (no append). Skill and MCP will use this same contract later.
Capability Surface is CLI + Skill + MCP.

EXAMPLES
  edges tasks list --status in_progress
  edges tasks get 2026-09-11--cli
  edges tasks runs 2026-09-11--cli --output json
  edges tasks run-messages 2026-09-11--cli--1
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter edges-cli test`

Expected: PASS for list/help/parse. `tasks get` without wiring still exits 2 until Task 7.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/format.ts extensions/clis/src/tasks/service.ts \
  extensions/clis/src/tasks/run.ts extensions/clis/src/run.ts extensions/clis/src/exit.ts \
  extensions/clis/src/help.ts extensions/clis/test/tasks-run.test.ts \
  extensions/clis/test/run.test.ts extensions/clis/test/cli.test.ts
git commit -m "feat(tasks): wire run() to tasks list" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 7: `edges tasks get`

**Files:**
- Modify: `extensions/clis/src/tasks/run.ts`
- Modify: `extensions/clis/src/tasks/service.ts`
- Modify: `extensions/clis/test/tasks-run.test.ts`

**Interfaces:**
- Consumes: `getTask(repoPath, target, fs)`
- Produces: stdout `{ status: "success", command: "get", task: TaskRecord }` (omit huge `sidecarMarkdown` from JSON; include `sidecarExists` and `runCount` only)

- [ ] **Step 1: Write the failing test**

```ts
test("run tasks get returns the task body", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-13--got.md"),
      `---
name: got
description: got
metadata:
  edges-type: task
  edges-title: got
  edges-tasks-status: todo
---

hello body
`,
      "utf8",
    );
    const result = await run(["tasks", "get", "2026-09-13--got"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { command: string; task: { body: string; stem: string } };
    assert.equal(body.command, "get");
    assert.equal(body.task.stem, "2026-09-13--got");
    assert.match(body.task.body, /hello body/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks get missing exits 1 with TASK_NOT_FOUND", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const result = await run(["tasks", "get", "missing"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 1);
    const body = JSON.parse(result.stdout) as { errorCode: string };
    assert.equal(body.errorCode, "TASK_NOT_FOUND");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-run.test.ts`

Expected: FAIL (`get` still `not wired` / exit 2).

- [ ] **Step 3: Write minimal implementation**

`runTasks` case `tasks-get`: `getTask` → success envelope; map thrown `errorCode` to JSON + `exitCodeForTasksError`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-run.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/run.ts extensions/clis/src/tasks/service.ts \
  extensions/clis/test/tasks-run.test.ts
git commit -m "feat(tasks): add edges tasks get" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 8: `edges tasks create` (file + empty sidecar, no git)

**Files:**
- Create: `extensions/clis/src/tasks/write.ts`
- Create: `extensions/clis/test/tasks-write.test.ts`
- Modify: `extensions/clis/src/tasks/service.ts`
- Modify: `extensions/clis/src/tasks/run.ts`
- Modify: `extensions/clis/test/tasks-run.test.ts`

**Interfaces:**
- Consumes: `newTaskStem`, `taskNameSlug`, `renderNewTaskDoc`, `taskRelPath`, `sidecarRelPath`
- Produces:
  - `type BoardWriter = BoardFs & { writeFile(abs: string, contents: string): Promise<void>; mkdirp(abs: string): Promise<void> }`
  - `createTask(repoPath: string, input: TasksCreateInput, io: { fs: BoardWriter; now: Date }): Promise<{ stem: string; path: string; sidecarPath: string }>`
  - `TasksCreateInput = { title: string; description?: string; body?: string; status: TaskStatus; name?: string; assignee?: string }`
  - Empty sidecar text: `emptyRunLog(stem: string): string` (export from `write.ts` or `runlog.ts`; Task 12 must accept this fixture)

- [ ] **Step 1: Write the failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createTask } from "../src/tasks/write.js";
import { nodeBoardWriter } from "./tasks-helpers.js";

test("createTask writes Task + empty sidecar under backlog and does not need git", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const now = new Date(2026, 8, 13, 12, 0, 0);
    const created = await createTask(
      repo,
      { title: "New CLI work", status: "backlog" },
      { fs: nodeBoardWriter(), now },
    );
    assert.equal(created.stem, "2026-09-13--New-CLI-work");
    const md = await readFile(path.join(repo, created.path), "utf8");
    assert.match(md, /edges-tasks-status: backlog/);
    assert.match(md, /\*\*Why:\*\*/);
    const log = await readFile(path.join(repo, created.sidecarPath), "utf8");
    assert.match(log, /# Run log: 2026-09-13--New-CLI-work/);
    assert.match(log, /## Notes/);
    assert.doesNotMatch(log, /^\| 1 \|/m);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createTask suffixes -2 when stem exists", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const now = new Date(2026, 8, 13, 12, 0, 0);
    const io = { fs: nodeBoardWriter(), now };
    const first = await createTask(repo, { title: "Dup", status: "backlog" }, io);
    const second = await createTask(repo, { title: "Dup", status: "backlog" }, io);
    assert.equal(first.stem, "2026-09-13--Dup");
    assert.equal(second.stem, "2026-09-13--Dup-2");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

In `tasks-run.test.ts`:

```ts
test("run tasks create is JSON and skips git", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const result = await run(["tasks", "create", "--title", "From CLI"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { command: string; path: string; stem: string };
    assert.equal(body.command, "create");
    assert.match(body.path, /knowledge\/tasks\/backlog\//);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-write.test.ts test/tasks-run.test.ts`

Expected: FAIL `createTask` missing / `create` not wired.

- [ ] **Step 3: Write minimal implementation**

`createTask`: `mkdirp` the status dir; pick stem; `writeFile` task + sidecar. **No `execFile("git")`.**

Default body = `` `${title}\n\n**Why:**\n\n\n**How to apply:**\n` ``.

`description` defaults to `title`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-write.test.ts test/tasks-run.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/write.ts extensions/clis/src/tasks/service.ts \
  extensions/clis/src/tasks/run.ts extensions/clis/test/tasks-write.test.ts \
  extensions/clis/test/tasks-run.test.ts extensions/clis/test/tasks-helpers.ts
git commit -m "feat(tasks): create task file and empty sidecar" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 9: `edges tasks update` (no move, no stem rename)

**Files:**
- Modify: `extensions/clis/src/tasks/write.ts`
- Modify: `extensions/clis/src/tasks/service.ts`
- Modify: `extensions/clis/src/tasks/run.ts`
- Modify: `extensions/clis/test/tasks-write.test.ts`
- Modify: `extensions/clis/test/tasks-run.test.ts`

**Interfaces:**
- Consumes: `getTask`, `setMetadataField`, `setTopLevelField`, `replaceBody`
- Produces: `updateTask(repoPath, target, patch: { title?: string; description?: string; body?: string; assignee?: string }, io): Promise<{ stem: string; path: string }>`
- If `patch` has no fields → throw `VALIDATION_ERROR` `"update requires at least one of --title, --description, --body, --assignee"`
- `--title` updates `metadata.edges-title` only (and `description` if `--description` omitted and you choose not to; **do not** infer). Only listed flags change. Stem unchanged.

- [ ] **Step 1: Write the failing test**

```ts
test("updateTask changes title and body and keeps path", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const now = new Date(2026, 8, 13, 12, 0, 0);
    await mkdir(path.join(repo, "knowledge/tasks/todo"), { recursive: true });
    const created = await createTask(
      repo,
      { title: "Stay", status: "todo" },
      { fs: nodeBoardWriter(), now },
    );
    const updated = await updateTask(
      repo,
      created.stem,
      { title: "New title", body: "replaced\n" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 13, 13, 0, 0) },
    );
    assert.equal(updated.path, created.path);
    const md = await readFile(path.join(repo, updated.path), "utf8");
    assert.match(md, /edges-title: New title/);
    assert.match(md, /^replaced$/m);
    assert.match(md, /edges-tasks-status: todo/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks update without flags is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "update", "stem"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-write.test.ts`

Expected: FAIL `updateTask is not defined`.

- [ ] **Step 3: Write minimal implementation**

Read file → apply field patches → write same path. Update `edges-updated-at`. Do not call `move`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-write.test.ts test/tasks-run.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/write.ts extensions/clis/src/tasks/service.ts \
  extensions/clis/src/tasks/run.ts extensions/clis/test/tasks-write.test.ts \
  extensions/clis/test/tasks-run.test.ts
git commit -m "feat(tasks): update task fields without moving" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 10: `edges tasks status` moves Task + sidecar

**Files:**
- Create: `extensions/clis/src/tasks/move.ts`
- Create: `extensions/clis/test/tasks-move.test.ts`
- Modify: `extensions/clis/src/tasks/service.ts`
- Modify: `extensions/clis/src/tasks/run.ts`
- Modify: `extensions/clis/test/tasks-run.test.ts`

**Interfaces:**
- Consumes: `getTask`, `setMetadataField`, `taskRelPath`, `sidecarRelPath`
- Produces: `moveTaskStatus(repoPath, target, next: TaskStatus, io: { fs: BoardWriter & { rename(from: string, to: string): Promise<void> }; now: Date }): Promise<{ stem: string; from: TaskStatus; to: TaskStatus; path: string; sidecarPath: string }>`
- Same status → success no-op (still refresh `edges-updated-at` or skip write; pick **no-op without rewrite** to keep diffs quiet)
- Destination exists → `BOARD_IO_ERROR`
- Sidecar missing → move the Task file only; do not invent a sidecar
- Sidecar present → `rename` both files into the destination folder

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { moveTaskStatus } from "../src/tasks/move.js";
import { nodeBoardWriter } from "./tasks-helpers.js";

test("moveTaskStatus updates frontmatter and moves Task + sidecar", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "knowledge/tasks/todo");
    await mkdir(fromDir, { recursive: true });
    await mkdir(path.join(repo, "knowledge/tasks/in_progress"), { recursive: true });
    await writeFile(
      path.join(fromDir, "2026-09-13--mv.md"),
      `---
name: mv
description: mv
metadata:
  edges-type: task
  edges-title: mv
  edges-tasks-status: todo
---

body
`,
      "utf8",
    );
    await writeFile(path.join(fromDir, ".2026-09-13--mv.log.md"), "# Run log: 2026-09-13--mv\n", "utf8");
    const result = await moveTaskStatus(repo, "2026-09-13--mv", "in_progress", {
      fs: nodeBoardWriter(),
      now: new Date("2026-09-13T12:00:00Z"),
    });
    assert.equal(result.from, "todo");
    assert.equal(result.to, "in_progress");
    const md = await readFile(path.join(repo, result.path), "utf8");
    assert.match(md, /edges-tasks-status: in_progress/);
    await access(path.join(repo, "knowledge/tasks/in_progress/.2026-09-13--mv.log.md"));
    await assert.rejects(access(path.join(fromDir, "2026-09-13--mv.md")));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

`tasks-run.test.ts`: `run(["tasks","status","2026-09-13--mv","done"], { env: { EDGES_REPO: repo }})` exit 0 and `command === "status"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-move.test.ts`

Expected: FAIL `Cannot find module`

- [ ] **Step 3: Write minimal implementation**

Patch frontmatter in memory → write to destination path (or rename then patch). Prefer: write new Task file → rename sidecar → unlink old Task. `mkdirp` destination. No git.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-move.test.ts test/tasks-run.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/move.ts extensions/clis/src/tasks/service.ts \
  extensions/clis/src/tasks/run.ts extensions/clis/test/tasks-move.test.ts \
  extensions/clis/test/tasks-run.test.ts extensions/clis/test/tasks-helpers.ts
git commit -m "feat(tasks): status moves task and sidecar" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 11: No hard delete — `status cancelled` only

**Files:**
- Modify: `extensions/clis/test/tasks-move.test.ts`
- Modify: `extensions/clis/test/tasks-parse.test.ts`
- Modify: `extensions/clis/test/tasks-cli.test.ts` (create this file if Task 6 did not)
- Modify: `extensions/clis/src/tasks/move.ts` only if unlink-of-task exists (it must not)

**Interfaces:**
- Consumes: `moveTaskStatus(..., "cancelled")`, `parseArgv`
- Produces: same `moveTaskStatus`. Add `unlink` to `BoardWriter` **only** if you need it for tests; production `move.ts` must not `unlink` the Task or sidecar except the leftover **source** path after a successful move (that is a move, not a delete-of-record).

- [ ] **Step 1: Write the failing tests**

```ts
test("parseArgv has no delete command", () => {
  const parsed = parseArgv(["tasks", "delete", "stem"]);
  assert.equal(parsed.kind, "error");
});

test("status cancelled keeps both files under cancelled/", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "knowledge/tasks/backlog");
    await mkdir(fromDir, { recursive: true });
    await mkdir(path.join(repo, "knowledge/tasks/cancelled"), { recursive: true });
    await writeFile(
      path.join(fromDir, "2026-09-13--stop.md"),
      `---
name: stop
description: stop
metadata:
  edges-type: task
  edges-title: stop
  edges-tasks-status: backlog
---

body
`,
      "utf8",
    );
    await writeFile(path.join(fromDir, ".2026-09-13--stop.log.md"), "# Run log: 2026-09-13--stop\n", "utf8");
    await moveTaskStatus(repo, "2026-09-13--stop", "cancelled", {
      fs: nodeBoardWriter(),
      now: new Date("2026-09-13T12:00:00Z"),
    });
    await access(path.join(repo, "knowledge/tasks/cancelled/2026-09-13--stop.md"));
    await access(path.join(repo, "knowledge/tasks/cancelled/.2026-09-13--stop.log.md"));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-move.test.ts test/tasks-parse.test.ts`

Expected: FAIL if `cancelled` move is missing or `delete` is accidentally registered.

- [ ] **Step 3: Write minimal implementation**

No new command. Ensure `TASK_STATUSES` includes `cancelled` (Task 1) and `moveTaskStatus` treats it like any other status. Do not add `tasks.command("delete")`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter edges-cli test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/test/tasks-move.test.ts extensions/clis/test/tasks-parse.test.ts \
  extensions/clis/src/tasks/move.ts
git commit -m "test(tasks): cancel via status, never delete" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 12: Run-log parser and stable `run-id`

**Files:**
- Create: `extensions/clis/src/tasks/runlog.ts`
- Create: `extensions/clis/test/tasks-runlog.test.ts`

**Interfaces:**
- Consumes: sidecar markdown + `stem`
- Produces:

```ts
export type TaskRun = {
  runId: string;
  stem: string;
  n: number;
  agent: string;
  startedAt: string;
  endedAt: string;
  status: string;
  errorCode: string;
};

export type TaskRunNote = { at?: string; text: string; raw: string };

export function parseRunLog(markdown: string, stem: string): { runs: TaskRun[]; notes: TaskRunNote[] };
export function resolveRunId(runId: string, taskStem?: string): { stem: string; n: number; runId: string };
export function messagesForRun(parsed: { runs: TaskRun[]; notes: TaskRunNote[] }, runId: string): Array<{
  seq: number;
  at?: string;
  text: string;
}>;
```

`resolveRunId("2026-09-11--CLI用Commanderjs重构--1")` → stem `2026-09-11--CLI用Commanderjs重构`, n `1`.
`resolveRunId("1", "2026-09-11--CLI用Commanderjs重构")` → same.
`resolveRunId("1")` throws `VALIDATION_ERROR`.

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { messagesForRun, parseRunLog, resolveRunId } from "../src/tasks/runlog.js";

const STEM = "2026-09-11--CLI用Commanderjs重构";
const LOG = `# Run log: ${STEM}

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | Coding Agent 专家 | 2026-09-11T19:15:00+08:00 | 2026-09-11T19:33:00+08:00 | completed |  |

## Notes

- 2026-09-11T19:16+08:00 Coding Agent 专家：已接 #16
- leftover without timestamp
`;

test("parseRunLog derives stem--n and does not use # as run-id", () => {
  const parsed = parseRunLog(LOG, STEM);
  assert.equal(parsed.runs.length, 1);
  assert.equal(parsed.runs[0]?.runId, `${STEM}--1`);
  assert.equal(parsed.runs[0]?.n, 1);
  assert.equal(parsed.runs[0]?.status, "completed");
});

test("explicit run-id column wins over derived id", () => {
  const md = `| run-id | # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|---|
| run_abc | 1 | A | 2026-09-11T19:15:00+08:00 |  | running |  |
`;
  const parsed = parseRunLog(md, "stem");
  assert.equal(parsed.runs[0]?.runId, "run_abc");
});

test("resolveRunId splits on the last --<digits>", () => {
  const resolved = resolveRunId(`${STEM}--1`);
  assert.equal(resolved.stem, STEM);
  assert.equal(resolved.n, 1);
  const short = resolveRunId("1", STEM);
  assert.equal(short.runId, `${STEM}--1`);
});

test("messagesForRun attributes timestamped notes to the covering run", () => {
  const msgs = messagesForRun(parseRunLog(LOG, STEM), `${STEM}--1`);
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0]?.seq, 1);
  assert.match(msgs[0]?.text ?? "", /已接 #16/);
});
```

Also test empty sidecar from Task 8: `parseRunLog(empty, stem).runs` is `[]`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-runlog.test.ts`

Expected: FAIL `Cannot find module`

- [ ] **Step 3: Write minimal implementation**

Split lines; find a table (header row containing `started_at` or `#`); skip separator `---` cells; parse pipes. Notes: lines after a heading matching `/^##\s+Notes\b/i` that start with `- `. Timestamp = `/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:[+-]\d{2}:\d{2}|Z)?)/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-runlog.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/runlog.ts extensions/clis/test/tasks-runlog.test.ts
git commit -m "feat(tasks): parse run log with stable run-id" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 13: `edges tasks runs` summary + `--output json`

**Files:**
- Modify: `extensions/clis/src/tasks/format.ts`
- Modify: `extensions/clis/src/tasks/service.ts`
- Modify: `extensions/clis/src/tasks/run.ts`
- Modify: `extensions/clis/test/tasks-run.test.ts`

**Interfaces:**
- Consumes: `getTask`, `parseRunLog`
- Produces:
  - `formatRunsTable(runs: TaskRun[]): string` — columns `run-id`, `agent`, `status`, `started_at`, `ended_at` (aligned spaces, one header line)
  - JSON: `{ status: "success", command: "runs", stem, runs: TaskRun[] }`
  - Missing sidecar → success with `runs: []` (not `TASK_NOT_FOUND`)
  - Missing Task → `TASK_NOT_FOUND`

- [ ] **Step 1: Write the failing test**

```ts
test("run tasks runs --output json lists derived run-id", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const stem = "2026-09-13--with-run";
  try {
    const dir = path.join(repo, "knowledge/tasks/done");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${stem}.md`),
      `---
name: with_run
description: with run
metadata:
  edges-type: task
  edges-title: with run
  edges-tasks-status: done
---

body
`,
      "utf8",
    );
    await writeFile(
      path.join(dir, `.${stem}.log.md`),
      `# Run log: ${stem}

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | Agent | 2026-09-13T01:00:00Z | 2026-09-13T02:00:00Z | completed |  |
`,
      "utf8",
    );
    const json = await run(["tasks", "runs", stem, "--output", "json"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(json.exitCode, 0);
    const body = JSON.parse(json.stdout) as { command: string; runs: { runId: string }[] };
    assert.equal(body.command, "runs");
    assert.equal(body.runs[0]?.runId, `${stem}--1`);

    const table = await run(["tasks", "runs", stem], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(table.exitCode, 0);
    assert.match(table.stdout, /run-id/);
    assert.match(table.stdout, new RegExp(`${stem}--1`));
    assert.doesNotMatch(table.stdout, /"command":"runs"/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks runs missing task is TASK_NOT_FOUND", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const result = await run(["tasks", "runs", "nope"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 1);
    assert.equal(JSON.parse(result.stdout).errorCode, "TASK_NOT_FOUND");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-run.test.ts`

Expected: FAIL (`runs` still `not wired` or no table formatter).

- [ ] **Step 3: Write minimal implementation**

`runTasks` case `tasks-runs`: `getTask` → `parseRunLog(sidecar or "", stem)` → if `output === "json"` use `formatTasksResult`; else write `formatRunsTable` to stdout (no JSON). Do not write the sidecar. Do not add a `log` alias.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-run.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/format.ts extensions/clis/src/tasks/service.ts \
  extensions/clis/src/tasks/run.ts extensions/clis/test/tasks-run.test.ts
git commit -m "feat(tasks): add read-only tasks runs" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 14: `edges tasks run-messages`

**Files:**
- Modify: `extensions/clis/src/tasks/format.ts`
- Modify: `extensions/clis/src/tasks/service.ts`
- Modify: `extensions/clis/src/tasks/run.ts`
- Modify: `extensions/clis/src/tasks/runlog.ts` (lookup helper if needed)
- Modify: `extensions/clis/test/tasks-run.test.ts`
- Create: `extensions/clis/test/tasks-cli.test.ts` if not already created

**Interfaces:**
- Consumes: `resolveRunId`, `parseRunLog`, `messagesForRun`, `listTasks` (to find the stem's sidecar when a full `run-id` is given)
- Produces:
  - `findRun(repoPath, runId, taskStem?, fs): Promise<{ run: TaskRun; messages: Array<{ seq: number; at?: string; text: string }> }>`
  - Full `run-id` → `resolveRunId` → `getTask(stem)` → parse sidecar → match `runId`
  - Short `n` without `--task` → `VALIDATION_ERROR`
  - Known Task, unknown n → `RUN_NOT_FOUND`
  - JSON: `{ status: "success", command: "run-messages", run, messages }`
  - Table default: first a one-line run summary (`run-id status agent started_at`), then numbered messages
  - No `--since`. No append. No `log` verb

- [ ] **Step 1: Write the failing test**

```ts
test("run tasks run-messages returns notes for a stable run-id", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const stem = "2026-09-13--msg";
  try {
    const dir = path.join(repo, "knowledge/tasks/in_progress");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${stem}.md`),
      `---
name: msg
description: msg
metadata:
  edges-type: task
  edges-title: msg
  edges-tasks-status: in_progress
---

body
`,
      "utf8",
    );
    await writeFile(
      path.join(dir, `.${stem}.log.md`),
      `# Run log: ${stem}

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | Agent | 2026-09-13T01:00:00Z |  | running |  |

## Notes

- 2026-09-13T01:05:00Z hello from the run
`,
      "utf8",
    );
    const full = await run(["tasks", "run-messages", `${stem}--1`, "--output", "json"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(full.exitCode, 0);
    const body = JSON.parse(full.stdout) as {
      command: string;
      run: { runId: string };
      messages: { text: string }[];
    };
    assert.equal(body.command, "run-messages");
    assert.equal(body.run.runId, `${stem}--1`);
    assert.match(body.messages[0]?.text ?? "", /hello from the run/);

    const short = await run(["tasks", "run-messages", "1", "--task", stem, "--output", "json"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(short.exitCode, 0);
    assert.equal(JSON.parse(short.stdout).run.runId, `${stem}--1`);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks run-messages 1 without --task is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "run-messages", "1"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks run-messages unknown id is RUN_NOT_FOUND", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const stem = "2026-09-13--msg";
  try {
    const dir = path.join(repo, "knowledge/tasks/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${stem}.md`),
      `---
name: msg
description: msg
metadata:
  edges-type: task
  edges-title: msg
  edges-tasks-status: todo
---

body
`,
      "utf8",
    );
    await writeFile(path.join(dir, `.${stem}.log.md`), `# Run log: ${stem}\n\n## Notes\n`, "utf8");
    const result = await run(["tasks", "run-messages", `${stem}--9`, "--output", "json"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 1);
    assert.equal(JSON.parse(result.stdout).errorCode, "RUN_NOT_FOUND");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/tasks-run.test.ts`

Expected: FAIL (`run-messages` not wired).

- [ ] **Step 3: Write minimal implementation**

`runTasks` case `tasks-run-messages`: wrap `resolveRunId` errors as `VALIDATION_ERROR`. Load the Task by resolved stem, parse sidecar, `messagesForRun`. Never open a write handle on the sidecar.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli test`

Expected: PASS (all prior tasks + this one)

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/format.ts extensions/clis/src/tasks/service.ts \
  extensions/clis/src/tasks/run.ts extensions/clis/src/tasks/runlog.ts \
  extensions/clis/test/tasks-run.test.ts extensions/clis/test/tasks-cli.test.ts
git commit -m "feat(tasks): add read-only run-messages" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 15: CLI docs + implementation CHANGELOG

**Files:**
- Modify: `extensions/clis/README.md`
- Modify: `extensions/clis/src/help.ts` (only if examples drifted)
- Modify: `CHANGELOG.md` `[Unreleased]` Added

**Interfaces:**
- Consumes: the command surface locked above
- Produces: human docs that match the implemented flags; no Skill/MCP implementation text beyond “later, same contract; Capability Surface is CLI + Skill + MCP”

- [ ] **Step 1: Write the failing test**

`test/cli.test.ts` / `test/run.test.ts` already assert `--help` text. Add:

```ts
test("real entry tasks --help names all seven verbs and forbids delete/log", async () => {
  const result = await launch(["tasks", "--help"]);
  assert.equal(result.status, 0);
  for (const verb of ["list", "get", "create", "update", "status", "runs", "run-messages"]) {
    assert.match(result.stdout, new RegExp(`\\b${verb}\\b`));
  }
  assert.doesNotMatch(result.stdout, /^\s+delete\b/m);
  assert.doesNotMatch(result.stdout, /^\s+log\b/m);
  assert.match(result.stdout, /CLI \+ Skill \+ MCP/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/cli.test.ts`

Expected: FAIL if help/README still omit the Capability Surface sentence.

- [ ] **Step 3: Write minimal implementation**

Replace the `tasks` section in `extensions/clis/README.md` (currently “Placeholder only”) with the seven commands, JSON/table rules, cancel-via-status, read-only Run layer, filesystem-only writes, and: Skill and MCP come later on this contract; Capability Surface is CLI + Skill + MCP.

`CHANGELOG.md` under `[Unreleased]` → `### Added`:

```markdown
- `edges tasks` CLI：Issue 层 list/get/create/update/status；Run 层只读 `runs` / `run-messages`（ADR-0005）。无硬删除、无 GitHub 同步、无 Skill/MCP 封装。
```

Do not bump `package.json` version.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter edges-cli test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/README.md extensions/clis/src/help.ts extensions/clis/test/cli.test.ts \
  CHANGELOG.md
git commit -m "docs(tasks): document edges tasks CLI contract" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

## Out of scope (do not add tasks)

- Skill wrapper (`extensions/skills/edges-tasks/` or similar)
- MCP tool/server that spawns `edges tasks`
- Run append / write path / `--since`
- GitHub Issue/PR sync (`edges-task-issue`, `issue pull-requests`)
- Multica daemon, `assign`, `rerun`, `cancel-task`, `search`, `comment`
- Changing `knowledge/tasks/` board status as part of the implementation PR
- `edges tasks delete` or a top-level `log` verb

---

## Self-review

### 1. Spec coverage (ADR 0005 + CONTEXT + ADR 0002/0004)

| Requirement | Task |
| --- | --- |
| CLI only this round; Skill/MCP later, same contract | Global Constraints, File map “Do not create”, Task 15 wording |
| Capability Surface is CLI + Skill + MCP | Global Constraints, Task 15 help assertion |
| `list\|get\|create\|update\|status` | Tasks 5–11 |
| No hard delete → `status cancelled` (frontmatter + move Task + sidecar) | Tasks 10–11 |
| GitHub linking out of scope | Global Constraints, Locked design (no `--issue`/`--pr`) |
| Run store remains ADR 0002 `.{stem}.log.md` | File map, Tasks 4, 8, 12–14 |
| Run layer read-only; no CLI append | Tasks 12–14; no write in `runlog.ts` |
| Stable `run-id`; do not use `#` as the public key | Locked design + Task 12 |
| `runs` = summary + `--output json` | Task 13 |
| Verbs `runs` / `run-messages`, not `log` | Tasks 5, 13–15 |
| No Multica daemon | Global Constraints |
| Seven `edges-tasks-status` folders | Task 1 |
| Frontmatter `edges-type: task` + `edges-task-*` + surgical status patch | Tasks 3, 9–10 |
| Sidecar moves with the Task | Task 10 |
| CJK stems (existing board), not `git/titleToSlug` | Task 2 |
| Commander tree next to `edges note`; `node:test` + `tsx` | Tasks 5–6, 15 |
| Filesystem only (note git stays on `note`) | Locked design, Task 8 |

### 2. Placeholder scan

No `TBD`, `TODO`, “implement later”, “add validation”, or “similar to Task N” leftovers. Each code step has a concrete snippet or a complete flag list. Types named in later tasks are defined in Task 1/3/4/5/12.

### 3. Type consistency

| Name | Defined | Used |
| --- | --- | --- |
| `TaskStatus` / `TASK_STATUSES` / `isTaskStatus` | Task 1 | 3, 4, 5, 8–11 |
| `TasksErrorCode` | Task 1 | 4, 6, 7, 13, 14 |
| `BoardFs` / `BoardWriter` | Task 4 / 8 | 8–11 |
| `TaskListItem` / `TaskRecord` | Task 4 | 6, 7 |
| `TasksParseOk` / `ParseOk` `tasks-*` kinds | Task 5 (`types.ts` + `parse.ts`) | 6–14 |
| `TasksOutput` | Task 5 | 13, 14 |
| `TaskRun` / `parseRunLog` / `resolveRunId` / `messagesForRun` | Task 12 | 13, 14 |
| `createTask` / `updateTask` | Task 8 / 9 | 9, run() |
| `moveTaskStatus` | Task 10 | 11, run() |
| `runTasks` / `formatTasksResult` | Task 6 | 7–14 |

`{ kind: "tasks" }` is deleted in Task 5 and must not reappear.

### 4. Test runner check

`edges-cli` uses `node --test --import tsx test/*.test.ts`, not vitest. All new tests are `extensions/clis/test/tasks-*.test.ts`. Helpers stay in `test/tasks-helpers.ts`.
