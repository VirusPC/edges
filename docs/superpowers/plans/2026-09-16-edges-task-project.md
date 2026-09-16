# edges-task-project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `edges tasks` directory-first Task Project grouping: board path `knowledge/tasks/<project-slug>/<edges-tasks-status>/`, frontmatter `metadata.edges-task-project` dual-write, ungrouped `_default` ↔ `default`/omit, same-project `status` moves, explicit `update --project` reassignment, and a one-shot migrate of today’s root status folders — without Skill/MCP wrappers.

**Architecture:** Keep the current Commander → `run()` → `src/tasks/*.ts` + `src/tasks/utils/` layout from ADR 0005 / 0007. Add a focused `project.ts` helper (slug parse, `_default` ↔ `default`, dual-write assert, filter). Change path joiners and board discovery to walk project dirs, then status dirs. Thread `project` through `TaskListItem`, create/update JSON, and `--project` flags. `moveTaskStatus` stays inside one project. A one-shot `migrateLegacyBoard` helper (not a public verb) moves `knowledge/tasks/<status>/*` → `knowledge/tasks/_default/<status>/*`. Capability Surface remains CLI + Skill + MCP as three peers (ADR 0004); this round implements the CLI contract plus the live-board migrate.

**Tech Stack:** TypeScript, Node.js ≥20, existing `commander` + `zod`, `node:test` + `tsx` (not vitest), `node:fs/promises`. No new YAML library. No `simple-git`. No Multica daemon. No parent / sub-issue / stage.

**Spec:** `docs/adr/0009-edges-task-project-grouping.md` (accepted; amends ADR 0002). Glossary: `CONTEXT.md` terms **Task Project（edges）**, **edges-task-project**, **Task**, **edges-tasks-status**, **edges-task-priority**, **edges tasks（CLI）**. Command surface: `docs/adr/0005-edges-tasks-cli.md` and `extensions/clis/src/tasks/`. Priority orthogonality: `docs/adr/0007-edges-task-priority.md`. Status folders: `docs/adr/0002-knowledge-tasks-status-folders.md`. Capability Surface: `docs/adr/0004-capability-surface-cli-skill-mcp.md`. Verb alignment only: https://multica.ai/docs/cli ; `.memory/references/reference_multica_cli_tasks_reference.md`.

## Global Constraints

- Co-authored-by on every commit: `Coding Agent 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Capability Surface wording, if mentioned: always **CLI + Skill + MCP** (three peers). Never “必要时 MCP”, never “CLI + Skill” as the Edges shorthand, never npm `package.json` `"bin"` as a layer
- This round is **CLI + one-shot board migrate**. Do not create Skill or MCP wrappers. They follow later on this same contract
- Path after this round: `knowledge/tasks/<project-slug>/<edges-tasks-status>/<stem>.md` with sidecar `.{stem}.log.md` in the same directory
- Ungrouped directory is exactly `_default`. JSON / CLI / frontmatter sentinel is `default`. Omit `metadata.edges-task-project` is valid only under `_default`
- After migrate, **no** `TASK_STATUSES` directory may remain directly under `knowledge/tasks/`
- Directory-first + dual-write: path and `metadata.edges-task-project` stay in sync. Do not relocate a file because frontmatter says something else
- `status` moves only within the same Task Project. Cross-project reassignment is `update --project` only
- Project, status, and priority are orthogonal. Changing project does not change `edges-tasks-status` or `edges-task-priority`. Changing priority still does not move folders
- Invalid project slug or dual-write mismatch = `VALIDATION_ERROR`, exit 2, no Task write and no sidecar write (except migrate, which only relocates existing files)
- `list` / `get` / `create` / `update` JSON always includes top-level `project` (normalized). `status` JSON stays `{ status, command, stem, from, to, path, sidecarPath }` — do not add `project` there
- Do not put `ingest` / `fs` / `writer` / `now` / `repoPath` on `CliContext` or `run()`’s second argument
- Do not add a public `edges tasks migrate` (or `migrate-projects`) verb
- Do not implement Multica parent / sub-issue / stage
- Do not auto-create/edit/move/delete `knowledge/posts/`
- Do not add `js-yaml` / `gray-matter` / `simple-git` / vitest. Stay on `commander` + `zod` + `node:test` + `tsx`
- Test runner is `extensions/clis/package.json` `"test": "node --test --import tsx test"` (recursive). New tests go under `extensions/clis/test/tasks/`
- Reuse `EDGES_REPO` from `loadConfig()` as the repo root. Board lives at `<repoPath>/knowledge/tasks/`
- Relative TypeScript imports use `.js` (nodenext)
- Public repo: no credentials, tokens, or personal data in commits
- `pull` / `rebase` use `--autostash`. Do not commit `.obsidian/workspace.json`
- The implementation PR that executes this plan **must** migrate the live board in the same PR as the CLI layout flip. A CLI-only half-merge would make `edges tasks list` miss every current Task
- This plan-only PR that first lands this document must **not** change CLI code or move `knowledge/tasks/{backlog,todo,in_progress,in_review,done,blocked,cancelled}/`

---

## File map

**Create**

- `extensions/clis/src/tasks/utils/project.ts` — `TASK_PROJECT_FIELD`, parse, dir ↔ id, dual-write assert, filter (re-exports `DEFAULT_TASK_PROJECT` / `DEFAULT_TASK_PROJECT_DIR` / `TaskProjectId` from `types.ts`)
- `extensions/clis/src/tasks/utils/migrate.ts` — `migrateLegacyBoard(repoPath, writer)` one-shot helper
- `extensions/clis/test/tasks/utils/project.test.ts` — pure helper tests
- `extensions/clis/test/tasks/utils/migrate.test.ts` — tmpdir migrate tests

**Modify**

- `extensions/clis/src/tasks/utils/types.ts` — `DEFAULT_TASK_PROJECT`, `DEFAULT_TASK_PROJECT_DIR`, `TaskProjectId`; add `project: TaskProjectId` on `TaskListItem` (and therefore `TaskRecord`)
- `extensions/clis/src/tasks/utils/paths.ts` — `taskRelPath` / `sidecarRelPath` / `statusDir` take a `TaskProjectId` (directory name comes from `projectDirName` in `project.ts`)
- `extensions/clis/src/tasks/utils/frontmatter.ts` — `renderNewTaskDoc` writes `edges-task-project` only when the project is not `default`
- `extensions/clis/src/tasks/utils/board.ts` — walk `tasks/<projectDir>/<status>/`; `readListItem` sets `project` via dual-write assert; `listTasks` gains `projects?`; `getTask` parses `<projectDir>/<status>`
- `extensions/clis/src/tasks/utils/write.ts` — `createTask` / `updateTask` accept `project`; create writes under the project dir; update `--project` moves Task + sidecar and dual-writes
- `extensions/clis/src/tasks/utils/move.ts` — dest paths stay inside `record.project`
- `extensions/clis/src/tasks/utils/service.ts` — pass the new `listTasks` opts through
- `extensions/clis/src/tasks/create.ts` — `--project <project>`
- `extensions/clis/src/tasks/update.ts` — `--project <project>` (reassignment); include it in the “at least one flag” rule
- `extensions/clis/src/tasks/list.ts` — repeatable `--project` (OR)
- `extensions/clis/src/tasks/status.ts` — help says same-project only; no `--project` flag
- `extensions/clis/src/tasks.ts` — `TASKS_AFTER_HELP` command surface
- `extensions/clis/src/tasks/utils/board.ts` `BoardWriter` — add `rmdir` for migrate
- `extensions/clis/test/tasks/utils/helpers.ts` — add `rmdir` on the writer double
- `extensions/clis/README.md` — document `--project`; keep Capability Surface as CLI + Skill + MCP
- `knowledge/tasks/README.md` — path is now `<project-slug>/<status>/`; `_default` for ungrouped
- `extensions/clis/test/tasks/utils/frontmatter.test.ts`
- `extensions/clis/test/tasks/utils/write.test.ts`
- `extensions/clis/test/tasks/utils/board.test.ts`
- `extensions/clis/test/tasks/utils/move.test.ts`
- `extensions/clis/test/tasks/utils/paths.test.ts`
- `extensions/clis/test/tasks/parse.test.ts`
- `extensions/clis/test/tasks/run.test.ts`
- `extensions/clis/test/tasks/cli.test.ts`
- `CHANGELOG.md` `[Unreleased]` — Added line for the CLI + migrate (when implementation lands)
- `.memory/projects/project_edges_task_project.md` — How-to: CLI has landed; point at this plan (via `$project-memory-remember`, do not hand-edit the index)
- `.memory/projects/project_tasks_with_status_not_todos.md` — How-to path becomes `knowledge/tasks/<project-slug>/<status>/`

**Do not create/commit**

- `extensions/skills/edges-tasks/**` or any Skill wrapper
- MCP server / tool for tasks project
- `--project` on `status`
- A public `edges tasks migrate` verb
- Parent / sub-issue / stage fields or directories deeper than `tasks/<project-slug>/<status>/`
- Edits under `knowledge/posts/`
- Edits to `docs/adr/0009-edges-task-project-grouping.md` or `CONTEXT.md` (already merged)
- This plan file’s own “implement CLI / migrate board” work in the plan-only PR that first lands this document

---

## Locked design (read before Task 1)

Cite these as already decided. Do not reopen them in implementation tasks.

### Command surface (ADR 0009 on top of ADR 0005 / 0007)

```
edges tasks list [--status <edges-tasks-status>] [--priority <edges-task-priority>]... [--project <edges-task-project>]... [--sort priority]
edges tasks get <stem|path>
edges tasks create --title <title> [--description <text>] [--body <markdown>] [--status <status>] [--name <name>] [--assignee <text>] [--priority <priority>] [--project <project>]
edges tasks update <stem|path> [--title <title>] [--description <text>] [--body <markdown>] [--assignee <text>] [--priority <priority>] [--project <project>]
edges tasks status <stem|path> <status>
edges tasks runs <stem|path> [--output table|json]
edges tasks run-messages <run-id> [--task <stem>] [--output table|json]
```

- `edges-task-project` CLI / JSON / field value is `default` or a user slug
- User slug = lowercase ASCII kebab-case: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, length 1–64
- Reserved (invalid as `--project` / field / directory slug): `_default`, every `TASK_STATUSES` value (`backlog|todo|in_progress|in_review|done|blocked|cancelled`). Directory `_default` is the ungrouped folder only; users pass `--project default`
- `create --project` omitted → treat as `default`. Write under `knowledge/tasks/_default/<status>/`. Do **not** write `metadata.edges-task-project`. JSON still has `"project":"default"`
- `create --project default` → same disk result as omitted (no field). JSON `"project":"default"`
- `create --project foo` → `knowledge/tasks/foo/<status>/` and `metadata.edges-task-project: foo`
- `update --project <value>` (including `default`) is a valid update by itself. It **does** move Task + sidecar to the dest project’s same status folder and dual-writes the field. `--project default` writes `edges-task-project: default` (same “update writes the sentinel” rule as `--priority none`)
- `update` without `--project` still never moves the file and never writes `edges-tasks-status`
- `status` does not grow a `--project` flag. `tasks status <stem> --project foo` is an unknown option → `VALIDATION_ERROR`, exit 2, no writes. `moveTaskStatus` dest is `taskRelPath(record.project, next, record.stem)`
- `list` without `--sort` walks projects then statuses: `_default` first, then other project dirs sorted by `localeCompare` (ASCII), then `TASK_STATUSES` declaration order, then `readdir` within each folder
- `list --project` is repeatable; multiple values are OR. `--project default` matches directory `_default` (missing field **and** explicit `default`)
- `--status` AND `--priority` AND `--project` combine: board walk, then each filter, then optional `--sort priority`
- Invalid slug (`_default`, `in_progress`, `Default`, `foo_bar`, `foo/bar`, empty, CJK-only, leading hyphen) on create/update/list → `VALIDATION_ERROR`, exit 2, no writes
- Commander has **no** `.choices()` for `--project` (open set). Gate with `parseTaskProject` in `.argParser` / the action, same `TasksError("VALIDATION_ERROR", ...)` so direct function calls cannot write garbage
- Stems stay **globally unique** across all projects × statuses (`uniqueStem` / `findByStem` walk every project). Same stem in two projects is `AMBIGUOUS_TASK`
- No `list --sort project`. No public migrate verb. No Skill/MCP this round

### JSON envelope

Issue-layer success payloads **must** include normalized `project` on `list` / `get` / `create` / `update`:

```json
{"status":"success","command":"list","tasks":[{"stem":"2026-09-13--demo","priority":"none","project":"default"}]}
{"status":"success","command":"get","task":{"stem":"2026-09-13--demo","priority":"high","project":"cli"}}
{"status":"success","command":"create","stem":"...","path":"...","sidecarPath":"...","priority":"none","project":"default"}
{"status":"success","command":"update","stem":"...","path":"...","priority":"low","project":"cli"}
```

`status` stays `{ status, command, stem, from, to, path, sidecarPath }` — do not add `project` to that envelope.

Failure envelope is unchanged:

```json
{"status":"failed","errorCode":"VALIDATION_ERROR","reason":"..."}
```

Exit: `0` success, `2` `VALIDATION_ERROR`, `1` everything else.

JSON field name is `project` (not `edges-task-project`). Values are `default` or the user slug, never `_default`.

### Read vs write

| Source | Behavior |
| --- | --- |
| Directory `_default` + missing / empty `edges-task-project` | Read as `default` |
| Directory `_default` + field `default` | Read as `default` |
| Directory `foo` + field `foo` | Read as `foo` |
| Directory `foo` + missing / empty / `default` / `bar` | Dual-write mismatch → `VALIDATION_ERROR` (list/get/update/status/runs all fail; no silent relocate) |
| Directory `_default` + field `foo` | Dual-write mismatch → `VALIDATION_ERROR` |
| On-disk directory named like a `TASK_STATUSES` value directly under `tasks/` | Legacy unmigrated. Discovery **skips** it. Not a project named `backlog` |
| On-disk directory `.memory` / any name starting with `.` / files `AGENTS.md` `README.md` | Skip |
| On-disk directory that fails the user-slug regex (except `_default`) | Skip (do not fail the whole board) |
| Write of any string that `parseTaskProject` rejects | `VALIDATION_ERROR`, no write |
| Exact match only | No case fold, no trim, no `_default` alias on the CLI, no CJK slugs this round |

### Disk placement

```
<repo>/knowledge/tasks/<project-dir>/<edges-tasks-status>/<stem>.md
<repo>/knowledge/tasks/<project-dir>/<edges-tasks-status>/.${stem}.log.md

project-dir = _default | <user-slug>
metadata:
  edges-tasks-status: <status>
  edges-task-project: cli    # omitted when default on create
  edges-task-priority: high  # unchanged rules from ADR 0007
```

`knowledge/tasks/AGENTS.md`, `knowledge/tasks/README.md`, and `knowledge/tasks/.memory/` stay at the board root. They are not projects.

### Layout flip + live migrate

Unit/integration tests use `os.tmpdir()` and the **new** layout from the first path-changing task onward. Grep and rewrite every fixture that currently writes `knowledge/tasks/<status>/` to `knowledge/tasks/_default/<status>/`.

The live board (as of ADR 0009 merge) still has root status dirs: `backlog/`, `done/`, `in_progress/`, plus possibly empty `todo/`, `in_review/`, `blocked/`, `cancelled/`. Task 8 tests the helper on tmpdir. Task 9 runs it once against this repo and deletes the leftover root status dirs, including hidden sidecar `.{stem}.log.md` files. Do not rewrite Task bodies during migrate. Omit `edges-task-project` on migrated files (valid for `_default`).

### Test commands

Single file (cwd = `extensions/clis`):

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/project.test.ts
```

Package suite after each implementation step:

```bash
pnpm --filter edges-cli test
```

---

### Task 1: Project id helpers

**Files:**
- Create: `extensions/clis/src/tasks/utils/project.ts`
- Create: `extensions/clis/test/tasks/utils/project.test.ts`
- Modify: `extensions/clis/src/tasks/utils/types.ts` — define `DEFAULT_TASK_PROJECT`, `DEFAULT_TASK_PROJECT_DIR`, and `TaskProjectId` next to `TASK_STATUSES` (avoids a `types.ts` ↔ `project.ts` cycle) and add `project: TaskProjectId` on `TaskListItem`

**Interfaces:**
- Consumes: `TasksError`, `TASK_STATUSES` from `./types.js`
- Produces:
  - `DEFAULT_TASK_PROJECT = "default"` and `DEFAULT_TASK_PROJECT_DIR = "_default"` live in `types.ts` (re-exported from `project.ts`)
  - `type TaskProjectId = typeof DEFAULT_TASK_PROJECT | string` — runtime values are `default` or a user slug that passed `isUserProjectSlug`
  - `TASK_PROJECT_FIELD = "edges-task-project"`
  - `isUserProjectSlug(raw: string): boolean` — kebab regex, length 1–64, not `default`, not `_default`, not a `TASK_STATUSES` value
  - `isTaskProjectId(raw: string): raw is TaskProjectId` — `raw === "default"` or `isUserProjectSlug(raw)`
  - `parseTaskProject(raw: string): TaskProjectId` — throws `TasksError("VALIDATION_ERROR", "invalid edges-task-project: ${raw} (expected default or lowercase ASCII kebab-case slug)")`
  - `projectDirName(id: TaskProjectId): string` — `default` → `_default`, else the slug
  - `projectIdFromDir(dirName: string): TaskProjectId` — `_default` → `default`; user slug → itself; anything else throws `VALIDATION_ERROR`
  - `assertProjectDualWrite(dirName: string, metadata: Record<string, string>): TaskProjectId` — rules in the Read vs write table; mismatch message `edges-task-project dual-write mismatch: dir=${dirName} field=${raw || "(missing)"}`
  - `filterTasksByProject<T extends { project: TaskProjectId }>(items: T[], allowed: readonly TaskProjectId[]): T[]` — empty `allowed` means no filter (return `items` unchanged)

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TASK_PROJECT,
  DEFAULT_TASK_PROJECT_DIR,
  TASK_PROJECT_FIELD,
  assertProjectDualWrite,
  filterTasksByProject,
  isTaskProjectId,
  isUserProjectSlug,
  parseTaskProject,
  projectDirName,
  projectIdFromDir,
} from "../../../src/tasks/utils/project.js";

test("sentinels and field name", () => {
  assert.equal(DEFAULT_TASK_PROJECT, "default");
  assert.equal(DEFAULT_TASK_PROJECT_DIR, "_default");
  assert.equal(TASK_PROJECT_FIELD, "edges-task-project");
});

test("parseTaskProject accepts default and kebab slugs; rejects reserved and junk", () => {
  assert.equal(parseTaskProject("default"), "default");
  assert.equal(parseTaskProject("cli"), "cli");
  assert.equal(parseTaskProject("task-board"), "task-board");
  assert.equal(isTaskProjectId("default"), true);
  assert.equal(isUserProjectSlug("default"), false);
  assert.equal(isUserProjectSlug("_default"), false);
  assert.equal(isUserProjectSlug("in_progress"), false);
  assert.equal(isUserProjectSlug("cli"), true);
  for (const raw of ["_default", "in_progress", "Default", "foo_bar", "foo/bar", "", "-cli", "cli-", "Foo"]) {
    assert.equal(isTaskProjectId(raw), false);
    try {
      parseTaskProject(raw);
      assert.fail(`expected throw for ${raw}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /edges-task-project/);
    }
  }
});

test("projectDirName and projectIdFromDir round-trip default and slugs", () => {
  assert.equal(projectDirName("default"), "_default");
  assert.equal(projectDirName("cli"), "cli");
  assert.equal(projectIdFromDir("_default"), "default");
  assert.equal(projectIdFromDir("cli"), "cli");
  try {
    projectIdFromDir("backlog");
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
  }
});

test("assertProjectDualWrite accepts default omit and matching slugs; rejects drift", () => {
  assert.equal(assertProjectDualWrite("_default", {}), "default");
  assert.equal(assertProjectDualWrite("_default", { "edges-task-project": "" }), "default");
  assert.equal(assertProjectDualWrite("_default", { "edges-task-project": "default" }), "default");
  assert.equal(assertProjectDualWrite("cli", { "edges-task-project": "cli" }), "cli");
  for (const [dir, field] of [
    ["_default", "cli"],
    ["cli", ""],
    ["cli", "default"],
    ["cli", "other"],
  ] as const) {
    try {
      assertProjectDualWrite(dir, field ? { "edges-task-project": field } : {});
      assert.fail(`expected mismatch for ${dir} / ${field || "(missing)"}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /dual-write mismatch/);
    }
  }
});

test("filterTasksByProject empty allowed is no-op; otherwise OR", () => {
  const items = [
    { id: "a", project: "default" as const },
    { id: "b", project: "cli" },
    { id: "c", project: "docs" },
  ];
  assert.deepEqual(
    filterTasksByProject(items, []).map((item) => item.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    filterTasksByProject(items, ["default", "docs"]).map((item) => item.id),
    ["a", "c"],
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/project.test.ts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `project.js`

- [ ] **Step 3: Write minimal implementation**

`types.ts` — after `TASK_PRIORITIES`:

```ts
export const DEFAULT_TASK_PROJECT = "default";
export const DEFAULT_TASK_PROJECT_DIR = "_default";
export type TaskProjectId = typeof DEFAULT_TASK_PROJECT | string;
```

Add `project: TaskProjectId` on `TaskListItem` next to `priority`.

`project.ts` — implement the signatures above. `isUserProjectSlug`:

```ts
const SLUG = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
export function isUserProjectSlug(raw: string): boolean {
  if (raw === DEFAULT_TASK_PROJECT || raw === DEFAULT_TASK_PROJECT_DIR) {
    return false;
  }
  if ((TASK_STATUSES as readonly string[]).includes(raw)) {
    return false;
  }
  return SLUG.test(raw) && raw.length <= 64;
}
```

`assertProjectDualWrite`: treat missing/empty field as `default`; compare to `projectIdFromDir(dirName)`; throw `VALIDATION_ERROR` on mismatch. Do not import `board.ts` / `write.ts`.

Adding `project` to `TaskListItem` will fail compile in `readListItem` until Task 2. If `pnpm --filter edges-cli test` cannot start because of that, keep Task 1’s suite as the gate (`project.test.ts` only) and land Task 2 in the next commit immediately.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/project.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/types.ts \
  extensions/clis/src/tasks/utils/project.ts \
  extensions/clis/test/tasks/utils/project.test.ts
git commit -m "feat(tasks): add edges-task-project helpers" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 2: Project-aware paths and board discovery

**Files:**
- Modify: `extensions/clis/src/tasks/utils/paths.ts`
- Modify: `extensions/clis/src/tasks/utils/board.ts` — walker, `getTask` path parse, `TaskListOpts.projects`, `readListItem.project`
- Modify: `extensions/clis/src/tasks/utils/write.ts` — call 3-arg path helpers with `input.project ?? "default"` so create still compiles (CLI flag comes in Task 4; default path must already be `_default/<status>/`)
- Modify: `extensions/clis/src/tasks/utils/move.ts` — dest = `taskRelPath(record.project, next, record.stem)`
- Modify: `extensions/clis/src/tasks/utils/service.ts` — pass `projects` through
- Modify: `extensions/clis/test/tasks/utils/paths.test.ts`
- Modify: `extensions/clis/test/tasks/utils/board.test.ts`
- Modify: every fixture under `extensions/clis/test/tasks/` that still writes `knowledge/tasks/<status>/` — rewrite to `knowledge/tasks/_default/<status>/` (see grep below)
- Modify: `extensions/clis/test/tasks/utils/write.test.ts` — path assertions
- Modify: `extensions/clis/test/tasks/utils/move.test.ts` — path assertions
- Modify: `extensions/clis/test/tasks/run.test.ts`
- Modify: `extensions/clis/test/tasks/parse.test.ts`

**Interfaces:**
- Consumes: `projectDirName`, `assertProjectDualWrite`, `filterTasksByProject`, `isUserProjectSlug`, `DEFAULT_TASK_PROJECT` from `./project.js`
- Produces:
  - `statusDir(repoPath: string, project: TaskProjectId, status: TaskStatus): string`
  - `taskRelPath(project: TaskProjectId, status: TaskStatus, stem: string): string` → `knowledge/tasks/${projectDirName(project)}/${status}/${stem}.md`
  - `sidecarRelPath(project: TaskProjectId, status: TaskStatus, stem: string): string` → same dir, `.{stem}.log.md`
  - `listProjectIds(repoPath: string, fs: BoardFs): Promise<TaskProjectId[]>` — skip dot-dirs, `AGENTS.md`, `README.md`, root `TASK_STATUSES` dirs, non-dirs, invalid slugs; `_default` first then `localeCompare`
  - `listTasks` walks `listProjectIds` × (`opts.status` or `TASK_STATUSES`), then `filterTasksByPriority`, then `filterTasksByProject`, then optional priority sort
  - `getTask` path form: relative dirname from board root must be exactly `<projectDir>/<status>`
  - `findByStem` searches every project × status; `AMBIGUOUS_TASK` message: `stem ${stem} exists in multiple project/status folders`
  - `uniqueStem(repoPath, project, status, base, fs)` — dest path is `taskRelPath(project, status, stem)`; a stem is taken if that path exists **or** `findByStem` finds it in any other project
  - `readListItem` / `loadRecord` call `assertProjectDualWrite(projectDirName(project), doc.metadata)` and set `item.project`
  - Detect directories without a new `BoardFs` method: `readdir` on the candidate path succeeds ⇒ directory; failure ⇒ file or missing
  - Delete the old 2-arg `taskRelPath(status, stem)` / `statusDir(repo, status)` — no compatibility wrappers

- [ ] **Step 1: Write the failing test**

`paths.test.ts` — replace the old 2-arg assertions:

```ts
test("paths join knowledge/tasks/<project-dir>/<status> and sidecar dotfile", () => {
  assert.equal(boardRoot("/repo"), "/repo/knowledge/tasks");
  assert.equal(
    taskRelPath("default", "in_progress", "2026-09-11--cli"),
    "knowledge/tasks/_default/in_progress/2026-09-11--cli.md",
  );
  assert.equal(
    sidecarRelPath("default", "in_progress", "2026-09-11--cli"),
    "knowledge/tasks/_default/in_progress/.2026-09-11--cli.log.md",
  );
  assert.equal(
    taskRelPath("cli", "todo", "2026-09-11--cli"),
    "knowledge/tasks/cli/todo/2026-09-11--cli.md",
  );
});

test("parseTarget still accepts stem or new-layout path", () => {
  assert.deepEqual(parseTarget("2026-09-11--cli"), { kind: "stem", stem: "2026-09-11--cli" });
  assert.deepEqual(parseTarget("knowledge/tasks/_default/done/2026-09-11--cli.md"), {
    kind: "path",
    stem: "2026-09-11--cli",
  });
  assert.deepEqual(parseTarget("knowledge/tasks/cli/todo/2026-09-11--cli.md"), {
    kind: "path",
    stem: "2026-09-11--cli",
  });
});
```

`board.test.ts` — change `seed()` to write `knowledge/tasks/_default/todo/2026-09-13--demo.md` (and its sidecar). Change `getTask` by-path to `knowledge/tasks/_default/todo/2026-09-13--demo.md`. Add:

```ts
test("listTasks and getTask expose project default when field is missing under _default", async () => {
  const repo = await seed();
  try {
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items[0]?.project, "default");
    const got = await getTask(repo, "2026-09-13--demo", nodeBoardFs());
    assert.equal(got.project, "default");
    assert.equal(got.metadata["edges-task-project"], undefined);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks sees named project dirs and ignores root status folders", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const named = path.join(repo, "knowledge/tasks/cli/backlog");
    const legacy = path.join(repo, "knowledge/tasks/backlog");
    await mkdir(named, { recursive: true });
    await mkdir(legacy, { recursive: true });
    await writeFile(
      path.join(named, "2026-09-16--named.md"),
      `---
name: named
description: named
metadata:
  edges-type: task
  edges-title: named
  edges-tasks-status: backlog
  edges-task-project: cli
---

body
`,
      "utf8",
    );
    await writeFile(
      path.join(legacy, "2026-09-16--legacy.md"),
      `---
name: legacy
description: legacy
metadata:
  edges-type: task
  edges-title: legacy
  edges-tasks-status: backlog
---

body
`,
      "utf8",
    );
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items.length, 1);
    assert.equal(items[0]?.stem, "2026-09-16--named");
    assert.equal(items[0]?.project, "cli");
    assert.equal(items[0]?.path, "knowledge/tasks/cli/backlog/2026-09-16--named.md");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks throws VALIDATION_ERROR on dual-write mismatch", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/cli/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-16--drift.md"),
      `---
name: drift
description: drift
metadata:
  edges-type: task
  edges-title: drift
  edges-tasks-status: todo
  edges-task-project: other
---

body
`,
      "utf8",
    );
    try {
      await listTasks(repo, {}, nodeBoardFs());
      assert.fail("expected throw");
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /dual-write mismatch/);
    }
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks --project default OR cli filters after board walk", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    for (const spec of [
      { project: "default" as const, dir: "_default", field: "", stem: "2026-09-16--def" },
      { project: "cli", dir: "cli", field: "  edges-task-project: cli\n", stem: "2026-09-16--cli" },
      { project: "docs", dir: "docs", field: "  edges-task-project: docs\n", stem: "2026-09-16--docs" },
    ]) {
      const folder = path.join(repo, "knowledge/tasks", spec.dir, "backlog");
      await mkdir(folder, { recursive: true });
      await writeFile(
        path.join(folder, `${spec.stem}.md`),
        `---
name: ${spec.stem}
description: ${spec.stem}
metadata:
  edges-type: task
  edges-title: ${spec.stem}
  edges-tasks-status: backlog
${spec.field}---

body
`,
        "utf8",
      );
    }
    const filtered = await listTasks(repo, { projects: ["default", "cli"] }, nodeBoardFs());
    assert.deepEqual(
      filtered.map((item) => `${item.project}:${item.stem}`),
      ["default:2026-09-16--def", "cli:2026-09-16--cli"],
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

Rewrite the existing priority fixtures in `board.test.ts` (`seedPriorities` and the P0/urgent files) from `knowledge/tasks/<status>/` to `knowledge/tasks/_default/<status>/`. Same for `run.test.ts`, `write.test.ts`, `move.test.ts`, `parse.test.ts`. Find them with:

```bash
rg -n "knowledge/tasks/(backlog|todo|in_progress|in_review|done|blocked|cancelled)" extensions/clis/test/tasks
```

Every leftover old path in tests is a bug after this task.

`getTask` by the old path `knowledge/tasks/todo/stem.md` must be `TASK_NOT_FOUND` (one path segment under the board root is not `<project>/<status>`). Add that assertion to `board.test.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/paths.test.ts test/tasks/utils/board.test.ts`

Expected: FAIL — `taskRelPath` still has the 2-arg signature / old path strings; `project` is missing on list items; root `backlog/` is still listed

- [ ] **Step 3: Write minimal implementation**

`paths.ts`:

```ts
export function statusDir(repoPath: string, project: TaskProjectId, status: TaskStatus): string {
  return path.join(boardRoot(repoPath), projectDirName(project), status);
}

export function taskRelPath(project: TaskProjectId, status: TaskStatus, stem: string): string {
  return path.join("knowledge/tasks", projectDirName(project), status, `${stem}.md`);
}

export function sidecarRelPath(project: TaskProjectId, status: TaskStatus, stem: string): string {
  return path.join("knowledge/tasks", projectDirName(project), status, `.${stem}.log.md`);
}
```

`board.ts` `listProjectIds`: `readdir` board root; skip `AGENTS.md`, `README.md`, names starting with `.`, names in `TASK_STATUSES`; keep a name if `readdir(path.join(root, name))` succeeds and (`name === "_default"` or `isUserProjectSlug(name)`). Sort: `"default"` first, then `localeCompare`.

`listStatusDir(repo, project, status, fs)` uses `statusDir(repo, project, status)` and `readListItem(repo, project, status, stem, fs)`.

`readListItem` sets `project: assertProjectDualWrite(projectDirName(project), doc.metadata)` and builds paths with the 3-arg helpers.

`TaskListOpts` gains `projects?: TaskProjectId[]`. After the priority filter, call `filterTasksByProject(filtered, opts.projects ?? [])`.

`getTask` path branch:

```ts
const rel = path.relative(boardRoot(repoPath), path.dirname(abs));
const parts = rel.split(path.sep).filter(Boolean);
if (parts.length !== 2 || !TASK_STATUSES.includes(parts[1] as TaskStatus)) {
  throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
}
const project = parts[0] === DEFAULT_TASK_PROJECT_DIR ? DEFAULT_TASK_PROJECT : parts[0];
if (project !== DEFAULT_TASK_PROJECT && !isUserProjectSlug(project)) {
  throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
}
return loadRecord(repoPath, project, parts[1] as TaskStatus, parsed.stem, fs);
```

`findByStem` loops `listProjectIds` × `TASK_STATUSES`.

`write.ts` / `move.ts`: switch every `taskRelPath` / `sidecarRelPath` / `statusDir` call to pass `record.project` or `input.project ?? "default"`. `uniqueStem` must check `taskRelPath(project, status, stem)` **and** treat a stem as taken if it exists in any project (loop `listProjectIds` × `TASK_STATUSES`, plus the dest path). Do not add `--project` CLI flags yet.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter edges-cli test
```

Expected: PASS. If a leftover fixture still points at `knowledge/tasks/todo/`, list/get will miss it — fix the fixture, do not add a legacy walker.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/paths.ts \
  extensions/clis/src/tasks/utils/board.ts \
  extensions/clis/src/tasks/utils/write.ts \
  extensions/clis/src/tasks/utils/move.ts \
  extensions/clis/src/tasks/utils/service.ts \
  extensions/clis/test/tasks
git commit -m "feat(tasks): discover tasks under project status folders" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 3: Frontmatter writes project only when not default

**Files:**
- Modify: `extensions/clis/src/tasks/utils/frontmatter.ts` — `renderNewTaskDoc` input gains `project?: TaskProjectId`
- Modify: `extensions/clis/test/tasks/utils/frontmatter.test.ts`

**Interfaces:**
- Consumes: `TaskProjectId` from `./types.js`; `TASK_PROJECT_FIELD` from `./project.js`
- Produces: `renderNewTaskDoc` writes `  edges-task-project: ${project}` immediately after `edges-tasks-status` when `project` is present and not `"default"`; omits the line when `project` is omitted or `"default"`

- [ ] **Step 1: Write the failing test**

```ts
test("renderNewTaskDoc omits edges-task-project when default or omitted", () => {
  const omitted = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.doesNotMatch(omitted, /edges-task-project/);

  const explicitDefault = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    project: "default",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.doesNotMatch(explicitDefault, /edges-task-project/);
});

test("renderNewTaskDoc writes edges-task-project after status when not default", () => {
  const md = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "todo",
    project: "cli",
    priority: "high",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.match(md, /edges-tasks-status: todo\n  edges-task-project: cli\n  edges-task-priority: high\n/);
  assert.equal(parseTaskDoc(md).metadata["edges-task-project"], "cli");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/frontmatter.test.ts`

Expected: FAIL — `renderNewTaskDoc` does not accept / write `project`

- [ ] **Step 3: Write minimal implementation**

```ts
export function renderNewTaskDoc(input: {
  name: string;
  description: string;
  title: string;
  status: TaskStatus;
  project?: TaskProjectId;
  priority?: TaskPriority;
  assignee?: string;
  updatedAt: string;
  body: string;
}): string {
  const lines = [
    `name: ${input.name}`,
    `description: ${input.description}`,
    "metadata:",
    "  edges-type: task",
    `  edges-title: ${quoteYamlValue(input.title)}`,
    `  edges-tasks-status: ${input.status}`,
  ];
  if (input.project && input.project !== "default") {
    lines.push(`  edges-task-project: ${input.project}`);
  }
  if (input.priority && input.priority !== "none") {
    lines.push(`  edges-task-priority: ${input.priority}`);
  }
  if (input.assignee) {
    lines.push(`  edges-task-assignee: ${quoteYamlValue(input.assignee)}`);
  }
  lines.push(`  edges-updated-at: ${quoteYamlValue(input.updatedAt)}`);
  return joinDoc(lines, input.body);
}
```

Do not add a `removeMetadataField` helper this round.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/frontmatter.test.ts`

Expected: PASS. Then `pnpm --filter edges-cli test`.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/frontmatter.ts \
  extensions/clis/test/tasks/utils/frontmatter.test.ts
git commit -m "feat(tasks): dual-write edges-task-project on create docs" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 4: create --project (JSON + disk, no git)

**Files:**
- Modify: `extensions/clis/src/tasks/utils/write.ts` — `TasksCreateInput.project?: string`; return `{ ..., priority, project }`
- Modify: `extensions/clis/src/tasks/create.ts` — `--project <project>`
- Modify: `extensions/clis/test/tasks/utils/write.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts`
- Modify: `extensions/clis/test/tasks/parse.test.ts`

**Interfaces:**
- Consumes: `parseTaskProject` from `./project.js`; `renderNewTaskDoc` `project` from Task 3; 3-arg paths from Task 2
- Produces: `createTask` parses `input.project === undefined ? "default" : parseTaskProject(input.project)` **before** any `writeFile`; `mkdirp(statusDir(repo, project, status))`; JSON `project`; disk field omitted iff `project === "default"`

- [ ] **Step 1: Write the failing test**

`write.test.ts`:

```ts
test("createTask omits edges-task-project on disk and returns project default", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const created = await createTask(
      repo,
      { title: "No Proj", status: "backlog" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 12, 0, 0) },
    );
    assert.equal(created.project, "default");
    assert.equal(created.path, "knowledge/tasks/_default/backlog/2026-09-16--No-Proj.md");
    const md = await readFile(path.join(repo, created.path), "utf8");
    assert.doesNotMatch(md, /edges-task-project/);
    assert.match(md, /edges-tasks-status: backlog/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createTask --project cli writes field and named directory", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const created = await createTask(
      repo,
      { title: "Named", status: "todo", project: "cli" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 12, 0, 0) },
    );
    assert.equal(created.project, "cli");
    assert.equal(created.path, "knowledge/tasks/cli/todo/2026-09-16--Named.md");
    const md = await readFile(path.join(repo, created.path), "utf8");
    assert.match(md, /edges-task-project: cli/);
    await access(path.join(repo, created.sidecarPath));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createTask --project in_progress is VALIDATION_ERROR and writes nothing", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await assert.rejects(
      () =>
        createTask(
          repo,
          { title: "Bad", status: "backlog", project: "in_progress" },
          { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 12, 0, 0) },
        ),
      (error: unknown) => (error as { errorCode: string }).errorCode === "VALIDATION_ERROR",
    );
    const root = path.join(repo, "knowledge/tasks");
    const names = await readdir(root).catch(() => []);
    assert.equal(names.filter((name) => name !== "_default").length, names.includes("_default") ? names.length - 1 : names.length);
    assert.equal(names.includes("in_progress"), false);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

`run.test.ts`:

```ts
test("run tasks create --project cli returns JSON project and writes the field", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    const created = await run(["tasks", "create", "--title", "Pri", "--project", "cli"], { env });
    assert.equal(created.exitCode, 0);
    const body = JSON.parse(created.stdout) as { command: string; project: string; path: string };
    assert.equal(body.command, "create");
    assert.equal(body.project, "cli");
    const md = await readFile(path.join(repo, body.path), "utf8");
    assert.match(md, /edges-task-project: cli/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create --project _default is VALIDATION_ERROR and writes nothing", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const result = await run(["tasks", "create", "--title", "Pri", "--project", "_default"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create without --project JSON project is default", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const result = await run(["tasks", "create", "--title", "None"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 0);
    assert.equal(JSON.parse(result.stdout).project, "default");
    assert.match(JSON.parse(result.stdout).path, /knowledge\/tasks\/_default\/backlog\//);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

`parse.test.ts` — add `run tasks create --project Default` / `--project in_progress` → exit 2 `VALIDATION_ERROR`.

Keep existing create `--priority` tests; they must still write under `_default` and include both `priority` and `project` in JSON.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/write.test.ts test/tasks/run.test.ts test/tasks/parse.test.ts`

Expected: FAIL — `created.project` is undefined; `--project` is an unknown option

- [ ] **Step 3: Write minimal implementation**

`write.ts` `TasksCreateInput` gains `project?: string`. After parsing priority:

```ts
const project = input.project === undefined ? "default" : parseTaskProject(input.project);
await io.fs.mkdirp(statusDir(repoPath, project, input.status));
const stem = await uniqueStem(repoPath, project, input.status, newTaskStem(input.title, io.now), io.fs);
const rel = taskRelPath(project, input.status, stem);
```

Pass `project` into `renderNewTaskDoc`. Return `{ stem, path: rel, sidecarPath: sidecarRel, priority, project }`.

`create.ts`:

```ts
.option("--project <project>", "edges-task-project (default, or lowercase kebab slug)")
```

In the action, pass `project: opts.project` into `createTask`. Validate with `parseTaskProject` inside `createTask` (not only Commander) so a direct call cannot write `in_progress`.

Do not add `--project` to `status`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/write.ts \
  extensions/clis/src/tasks/create.ts \
  extensions/clis/test/tasks/utils/write.test.ts \
  extensions/clis/test/tasks/run.test.ts \
  extensions/clis/test/tasks/parse.test.ts
git commit -m "feat(tasks): add create --project" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 5: update --project reassigns (same status, move + dual-write)

**Files:**
- Modify: `extensions/clis/src/tasks/utils/write.ts` — `updateTask` patch gains `project?: string`; return includes `project`
- Modify: `extensions/clis/src/tasks/update.ts` — `--project <project>`; “at least one flag” includes `--project`; help no longer says the file never moves
- Modify: `extensions/clis/test/tasks/utils/write.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts`
- Modify: `extensions/clis/test/tasks/parse.test.ts`

**Interfaces:**
- Consumes: `parseTaskProject`, `projectDirName`, `setMetadataField`, 3-arg paths, `getTask`
- Produces: `updateTask` — if `patch.project` is set, parse it, move Task + sidecar from `record.path` to `taskRelPath(nextProject, record.status, record.stem)`, write `edges-task-project` (including `default`), keep `edges-tasks-status` and `edges-task-priority` unchanged; dest-exists → `BOARD_IO_ERROR`; same project → no rename, still write the field when `--project` was passed; `--project` alone is a valid update

- [ ] **Step 1: Write the failing test**

`write.test.ts`:

```ts
test("updateTask --project cli moves Task + sidecar and dual-writes", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const created = await createTask(
      repo,
      { title: "Move me", status: "todo", priority: "high" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 12, 0, 0) },
    );
    const updated = await updateTask(
      repo,
      created.stem,
      { project: "cli" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 13, 0, 0) },
    );
    assert.equal(updated.project, "cli");
    assert.equal(updated.path, "knowledge/tasks/cli/todo/2026-09-16--Move-me.md");
    const md = await readFile(path.join(repo, updated.path), "utf8");
    assert.match(md, /edges-task-project: cli/);
    assert.match(md, /edges-tasks-status: todo/);
    assert.match(md, /edges-task-priority: high/);
    await access(path.join(repo, "knowledge/tasks/cli/todo/.2026-09-16--Move-me.log.md"));
    await assert.rejects(access(path.join(repo, created.path)));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("updateTask --project default writes the field and does not require other flags", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const created = await createTask(
      repo,
      { title: "Home", status: "in_progress", project: "cli" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 12, 0, 0) },
    );
    const updated = await updateTask(
      repo,
      created.stem,
      { project: "default" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 13, 0, 0) },
    );
    assert.equal(updated.project, "default");
    assert.equal(updated.path, "knowledge/tasks/_default/in_progress/2026-09-16--Home.md");
    const md = await readFile(path.join(repo, updated.path), "utf8");
    assert.match(md, /edges-task-project: default/);
    assert.match(md, /edges-tasks-status: in_progress/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("updateTask --project in_progress is VALIDATION_ERROR and does not move", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const created = await createTask(
      repo,
      { title: "Stay", status: "todo" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 12, 0, 0) },
    );
    await assert.rejects(
      () =>
        updateTask(
          repo,
          created.stem,
          { project: "in_progress" },
          { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 13, 0, 0) },
        ),
      (error: unknown) => (error as { errorCode: string }).errorCode === "VALIDATION_ERROR",
    );
    await access(path.join(repo, created.path));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

`run.test.ts`:

```ts
test("run tasks update --project cli JSON and new path", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    const created = await run(["tasks", "create", "--title", "Go", "--status", "todo"], { env });
    const stem = JSON.parse(created.stdout).stem as string;
    const updated = await run(["tasks", "update", stem, "--project", "cli"], { env });
    assert.equal(updated.exitCode, 0);
    const body = JSON.parse(updated.stdout) as { command: string; project: string; path: string };
    assert.equal(body.command, "update");
    assert.equal(body.project, "cli");
    assert.equal(body.path, `knowledge/tasks/cli/todo/${stem}.md`);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks update --project Default is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "update", "stem", "--project", "Default"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/write.test.ts test/tasks/run.test.ts`

Expected: FAIL — update still requires the old flag set; `--project` unknown; path stays under `_default`

- [ ] **Step 3: Write minimal implementation**

`updateTask` empty-patch rule becomes:

```ts
if (
  !patch.title &&
  !patch.description &&
  !patch.body &&
  !patch.assignee &&
  patch.priority === undefined &&
  patch.project === undefined
) {
  throw new TasksError(
    "VALIDATION_ERROR",
    "update requires at least one of --title, --description, --body, --assignee, --priority, --project",
  );
}
```

Parse `patch.project` with `parseTaskProject` **before** `getTask` / any write. Apply title/description/body/assignee/priority patches on the in-memory markdown first. If `parsedProject` is set:

```ts
markdown = setMetadataField(markdown, "edges-task-project", parsedProject);
const destRel = taskRelPath(parsedProject, record.status, record.stem);
const destSidecarRel = sidecarRelPath(parsedProject, record.status, record.stem);
if (destRel !== record.path) {
  if (await io.fs.exists(path.join(repoPath, destRel))) {
    throw new TasksError("BOARD_IO_ERROR", `destination already exists: ${destRel}`);
  }
  await io.fs.mkdirp(statusDir(repoPath, parsedProject, record.status));
  await io.fs.writeFile(path.join(repoPath, destRel), markdown);
  const sourceSidecarAbs = path.join(repoPath, record.sidecarPath);
  if (await io.fs.exists(sourceSidecarAbs)) {
    await io.fs.rename(sourceSidecarAbs, path.join(repoPath, destSidecarRel));
  }
  await io.fs.unlink(path.join(repoPath, record.path));
} else {
  await io.fs.writeFile(path.join(repoPath, record.path), markdown);
}
```

Always bump `edges-updated-at`. Return `{ stem, path: destRel, priority: ..., project: parsedProject ?? record.project }`.

`update.ts` add `.option("--project <project>", "reassign Task Project (moves files, same status)")` and pass `project: opts.project`. Rewrite AFTER_HELP: “Does not change edges-tasks-status. Use status to change status (same project). --project moves Task + sidecar to another Task Project.”

Move algorithm must not change `edges-tasks-status`. Do not call `moveTaskStatus` from update.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/write.ts \
  extensions/clis/src/tasks/update.ts \
  extensions/clis/test/tasks/utils/write.test.ts \
  extensions/clis/test/tasks/run.test.ts \
  extensions/clis/test/tasks/parse.test.ts
git commit -m "feat(tasks): add update --project reassignment" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 6: status stays same-project; reject --project

**Files:**
- Modify: `extensions/clis/src/tasks/utils/move.ts` — dest stays in `record.project`; preserve `edges-task-project` and `edges-task-priority` by copying the patched markdown
- Modify: `extensions/clis/src/tasks/status.ts` — AFTER_HELP: same-project only; no `--project` option
- Modify: `extensions/clis/test/tasks/utils/move.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts`

**Interfaces:**
- Consumes: `taskRelPath(record.project, next, record.stem)` from Task 2
- Produces: `moveTaskStatus` never reads a project flag; dest directory is `statusDir(repo, record.project, next)`; return envelope unchanged (no `project` key)

- [ ] **Step 1: Write the failing test**

`move.test.ts` — rewrite existing dest assertions from `knowledge/tasks/in_progress/` to `knowledge/tasks/_default/in_progress/`. Add:

```ts
test("moveTaskStatus stays inside a named project and preserves edges-task-project", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "knowledge/tasks/cli/todo");
    await mkdir(fromDir, { recursive: true });
    await writeFile(
      path.join(fromDir, "2026-09-16--keep.md"),
      `---
name: keep
description: keep
metadata:
  edges-type: task
  edges-title: keep
  edges-tasks-status: todo
  edges-task-project: cli
  edges-task-priority: urgent
---

body
`,
      "utf8",
    );
    await writeFile(path.join(fromDir, ".2026-09-16--keep.log.md"), "# Run log: 2026-09-16--keep\n", "utf8");
    const result = await moveTaskStatus(repo, "2026-09-16--keep", "in_progress", {
      fs: nodeBoardWriter(),
      now: new Date("2026-09-16T12:00:00Z"),
    });
    assert.equal(result.to, "in_progress");
    assert.equal(result.path, "knowledge/tasks/cli/in_progress/2026-09-16--keep.md");
    const md = await readFile(path.join(repo, result.path), "utf8");
    assert.match(md, /edges-tasks-status: in_progress/);
    assert.match(md, /edges-task-project: cli/);
    assert.match(md, /edges-task-priority: urgent/);
    await access(path.join(repo, "knowledge/tasks/cli/in_progress/.2026-09-16--keep.log.md"));
    await assert.rejects(access(path.join(fromDir, "2026-09-16--keep.md")));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

`run.test.ts`:

```ts
test("run tasks status rejects --project and does not move", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/_default/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-16--stay.md"),
      `---
name: stay
description: stay
metadata:
  edges-type: task
  edges-title: stay
  edges-tasks-status: todo
---

body
`,
      "utf8",
    );
    const result = await run(["tasks", "status", "2026-09-16--stay", "--project", "cli"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
    const md = await readFile(path.join(dir, "2026-09-16--stay.md"), "utf8");
    assert.match(md, /edges-tasks-status: todo/);
    await assert.rejects(access(path.join(repo, "knowledge/tasks/cli/todo/2026-09-16--stay.md")));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks status JSON has no project key and stays under _default", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    const created = await run(["tasks", "create", "--title", "Stat", "--status", "todo"], { env });
    const stem = JSON.parse(created.stdout).stem as string;
    const moved = await run(["tasks", "status", stem, "in_progress"], { env });
    assert.equal(moved.exitCode, 0);
    const body = JSON.parse(moved.stdout) as { path: string; project?: string };
    assert.equal(body.path, `knowledge/tasks/_default/in_progress/${stem}.md`);
    assert.equal(body.project, undefined);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/move.test.ts test/tasks/run.test.ts`

Expected: FAIL — named-project move still aims at `_default` or the help/status case is not asserted. If `status --project` already fails as an unknown Commander option (exit 2), keep that case as a regression; the named-project move test is the one that must fail until Step 3.

- [ ] **Step 3: Write minimal implementation**

`move.ts` dest paths:

```ts
const destRel = taskRelPath(record.project, next, record.stem);
const destSidecarRel = sidecarRelPath(record.project, next, record.stem);
await io.fs.mkdirp(statusDir(repoPath, record.project, next));
```

Do not call `setMetadataField(..., "edges-task-project", ...)`. Copying the markdown already preserves the field. Still set `edges-tasks-status` and `edges-updated-at`.

`status.ts` AFTER_HELP add: “Moves inside the same Task Project. Reassign with: edges tasks update <stem> --project <slug>.” Do not register `--project`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/move.ts \
  extensions/clis/src/tasks/status.ts \
  extensions/clis/test/tasks/utils/move.test.ts \
  extensions/clis/test/tasks/run.test.ts
git commit -m "feat(tasks): keep status moves inside one project" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 7: list --project CLI, help, README, CHANGELOG

**Files:**
- Modify: `extensions/clis/src/tasks/list.ts` — repeatable `--project`
- Modify: `extensions/clis/src/tasks.ts` — `TASKS_AFTER_HELP`
- Modify: `extensions/clis/src/tasks/create.ts` / `update.ts` AFTER_HELP (if not already complete)
- Modify: `extensions/clis/README.md`
- Modify: `knowledge/tasks/README.md`
- Modify: `CHANGELOG.md` `[Unreleased]` Added
- Modify: `extensions/clis/test/tasks/cli.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts`
- Modify: `extensions/clis/test/tasks/parse.test.ts`

**Interfaces:**
- Consumes: `parseTaskProject`, `listTasks({ projects })` from Tasks 1–2
- Produces: CLI `--project` OR filter; help documents `--project` on list/create/update and not on status; docs say Capability Surface is CLI + Skill + MCP

- [ ] **Step 1: Write the failing test**

`cli.test.ts` — keep the seven-verb test and the priority help test; add:

```ts
test("tasks help documents project on list create update and not on status", async () => {
  const root = await run(["tasks", "--help"]);
  assert.match(root.stdout, /--project/);

  const list = await run(["tasks", "list", "--help"]);
  assert.match(list.stdout, /--project/);

  const create = await run(["tasks", "create", "--help"]);
  assert.match(create.stdout, /--project/);

  const update = await run(["tasks", "update", "--help"]);
  assert.match(update.stdout, /--project/);

  const status = await run(["tasks", "status", "--help"]);
  assert.doesNotMatch(status.stdout, /--project/);
});
```

`run.test.ts`:

```ts
test("run tasks list --project default --project cli ANDs with --status", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    await run(["tasks", "create", "--title", "A", "--status", "backlog"], { env });
    await run(["tasks", "create", "--title", "B", "--status", "todo", "--project", "cli"], { env });
    await run(["tasks", "create", "--title", "C", "--status", "todo", "--project", "docs"], { env });
    const result = await run(
      ["tasks", "list", "--status", "todo", "--project", "default", "--project", "cli"],
      { env },
    );
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { tasks: Array<{ project: string; stem: string }> };
    assert.deepEqual(
      body.tasks.map((task) => task.project),
      ["cli"],
    );
    assert.ok(body.tasks.every((task) => task.project !== undefined));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

`parse.test.ts`:

```ts
test("run tasks list --project in_progress is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "list", "--project", "in_progress"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});
```

Also extend the existing `run tasks list returns JSON` test to `assert.equal(body.tasks[0]?.project, "default")`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/cli.test.ts test/tasks/run.test.ts test/tasks/parse.test.ts`

Expected: FAIL — help text does not mention `--project`; list filter flag missing

- [ ] **Step 3: Write minimal implementation**

`list.ts`:

```ts
.addOption(
  new Option("--project <project>", "edges-task-project (repeatable, OR)")
    .argParser((value: string, previous: TaskProjectId[]) => [
      ...(previous ?? []),
      parseTaskProject(value),
    ]),
)
```

Pass `projects: opts.project` into `listTasksService`. AFTER_HELP FLAGS add: `--project <project>  Repeatable OR filter: default or kebab slug`.

`tasks.ts` `TASKS_AFTER_HELP` command list:

```
  list [--status <edges-tasks-status>] [--priority <edges-task-priority>]... [--project <edges-task-project>]... [--sort priority]
  get <stem|path>
  create --title <title> [--description] [--body] [--status] [--name] [--assignee] [--priority] [--project]
  update <stem|path> [--title] [--description] [--body] [--assignee] [--priority] [--project]
  status <stem|path> <edges-tasks-status>
  runs <stem|path> [--output table|json]
  run-messages <run-id> [--task <stem>] [--output table|json]
```

Keep the Capability Surface sentence: `Capability Surface is CLI + Skill + MCP.`

`extensions/clis/README.md` `tasks` block — same command surface. Keep: `Skill and MCP come later on this same contract. Capability Surface is CLI + Skill + MCP.`

`knowledge/tasks/README.md` — replace the Issue-layer path `knowledge/tasks/<edges-tasks-status>/` with `knowledge/tasks/<project-slug>/<edges-tasks-status>/`. After the 状态夹 section, add:

```markdown
## Issue 层 Task Project

看板分组单位是 Task Project：directory-first，路径 `knowledge/tasks/<project-slug>/<edges-tasks-status>/`，并与 frontmatter `metadata.edges-task-project` 双写。未分组用保留目录 `_default`（字段为 `default` 或不写）。与 `edges-tasks-status`、`edges-task-priority` 正交。`status` 只在同一 project 内搬家；跨 project 用 `update --project`。详见 `docs/adr/0009-edges-task-project-grouping.md`。
```

Update the two-layer table “落点” cell to `knowledge/tasks/<project-slug>/<edges-tasks-status>/`.

`CHANGELOG.md` `[Unreleased]` → `### Added` (implementation landing, not this plan-only PR):

```
- `edges tasks` Issue 层 `--project` 与看板路径 `knowledge/tasks/<project-slug>/<status>/`（ADR-0009）。未分组 `_default` ↔ 字段 `default`/省略；目录与 `metadata.edges-task-project` 双写。`status` 只在同一 project 内移动；跨 project 用 `update --project`。一次性把根下 status 夹迁入 `_default/`。无 Skill/MCP 封装。
```

Do not implement Skill/MCP. Do not edit `knowledge/posts/`. Do not move the live board yet (Task 9).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/list.ts \
  extensions/clis/src/tasks.ts \
  extensions/clis/src/tasks/create.ts \
  extensions/clis/src/tasks/update.ts \
  extensions/clis/README.md \
  knowledge/tasks/README.md \
  CHANGELOG.md \
  extensions/clis/test/tasks/cli.test.ts \
  extensions/clis/test/tasks/run.test.ts \
  extensions/clis/test/tasks/parse.test.ts
git commit -m "feat(tasks): add list --project and document the contract" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 8: One-shot migrate helper (tmpdir only)

**Files:**
- Create: `extensions/clis/src/tasks/utils/migrate.ts`
- Create: `extensions/clis/test/tasks/utils/migrate.test.ts`
- Modify: `extensions/clis/src/tasks/utils/board.ts` — `BoardWriter` gains `rmdir(abs: string): Promise<void>`
- Modify: `extensions/clis/src/tasks/utils/helpers` path: `extensions/clis/test/tasks/utils/helpers.ts` — implement `rmdir`

**Interfaces:**
- Consumes: `TASK_STATUSES`, `boardRoot`, `statusDir`, `DEFAULT_TASK_PROJECT`, `BoardWriter`
- Produces:
  - `migrateLegacyBoard(repoPath: string, fs: BoardWriter): Promise<{ moved: number; removedStatusDirs: string[] }>`
  - For each `status` in `TASK_STATUSES`, if `knowledge/tasks/<status>/` exists as a directory: move **every file** in that directory (including hidden `.{stem}.log.md` and any other non-directory entry) to `knowledge/tasks/_default/<status>/` via `mkdirp` + `rename`; if a dest file exists → `BOARD_IO_ERROR`; if a subdirectory exists inside the legacy status dir → `BOARD_IO_ERROR` (`unexpected subdirectory: ...`); then `rmdir` the now-empty legacy status dir
  - Do **not** rewrite file bytes (no frontmatter patch). Omit-field remains valid under `_default`
  - Do **not** touch `AGENTS.md`, `README.md`, `.memory/`, or existing `_default/` / named project dirs
  - Re-running after a clean migrate is a no-op (`moved: 0`, `removedStatusDirs: []`)
  - Not registered as a Commander command

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { migrateLegacyBoard } from "../../../src/tasks/utils/migrate.js";
import { listTasks } from "../../../src/tasks/utils/board.js";
import { nodeBoardFs, nodeBoardWriter } from "./helpers.js";

test("migrateLegacyBoard moves Task + hidden sidecar and removes root status dirs", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const backlog = path.join(repo, "knowledge/tasks/backlog");
    const done = path.join(repo, "knowledge/tasks/done");
    await mkdir(backlog, { recursive: true });
    await mkdir(done, { recursive: true });
    await mkdir(path.join(repo, "knowledge/tasks/.memory"), { recursive: true });
    await writeFile(path.join(repo, "knowledge/tasks/AGENTS.md"), "# tasks\n", "utf8");
    await writeFile(path.join(repo, "knowledge/tasks/README.md"), "# board\n", "utf8");
    await writeFile(
      path.join(backlog, "2026-09-16--open.md"),
      `---
name: open
description: open
metadata:
  edges-type: task
  edges-title: open
  edges-tasks-status: backlog
---

body
`,
      "utf8",
    );
    await writeFile(path.join(backlog, ".2026-09-16--open.log.md"), "# Run log: 2026-09-16--open\n", "utf8");
    await writeFile(
      path.join(done, "2026-09-16--closed.md"),
      `---
name: closed
description: closed
metadata:
  edges-type: task
  edges-title: closed
  edges-tasks-status: done
---

body
`,
      "utf8",
    );
    const result = await migrateLegacyBoard(repo, nodeBoardWriter());
    assert.equal(result.moved, 3);
    assert.deepEqual(new Set(result.removedStatusDirs), new Set(["backlog", "done"]));
    await access(path.join(repo, "knowledge/tasks/_default/backlog/2026-09-16--open.md"));
    await access(path.join(repo, "knowledge/tasks/_default/backlog/.2026-09-16--open.log.md"));
    await access(path.join(repo, "knowledge/tasks/_default/done/2026-09-16--closed.md"));
    await assert.rejects(access(backlog));
    await assert.rejects(access(done));
    const agents = await readFile(path.join(repo, "knowledge/tasks/AGENTS.md"), "utf8");
    assert.equal(agents, "# tasks\n");
    await access(path.join(repo, "knowledge/tasks/.memory"));
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.deepEqual(
      items.map((item) => `${item.project}:${item.status}:${item.stem}`).sort(),
      ["default:backlog:2026-09-16--open", "default:done:2026-09-16--closed"],
    );
    const open = await readFile(
      path.join(repo, "knowledge/tasks/_default/backlog/2026-09-16--open.md"),
      "utf8",
    );
    assert.doesNotMatch(open, /edges-task-project/);
    const again = await migrateLegacyBoard(repo, nodeBoardWriter());
    assert.equal(again.moved, 0);
    assert.deepEqual(again.removedStatusDirs, []);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("migrateLegacyBoard refuses dest collision and unexpected subdirectory", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const legacy = path.join(repo, "knowledge/tasks/todo");
    const dest = path.join(repo, "knowledge/tasks/_default/todo");
    await mkdir(legacy, { recursive: true });
    await mkdir(dest, { recursive: true });
    await writeFile(path.join(legacy, "2026-09-16--dup.md"), "legacy\n", "utf8");
    await writeFile(path.join(dest, "2026-09-16--dup.md"), "kept\n", "utf8");
    await assert.rejects(
      () => migrateLegacyBoard(repo, nodeBoardWriter()),
      (error: unknown) => (error as { errorCode: string }).errorCode === "BOARD_IO_ERROR",
    );
    assert.equal(await readFile(path.join(dest, "2026-09-16--dup.md"), "utf8"), "kept\n");
    await rm(path.join(dest, "2026-09-16--dup.md"));
    await mkdir(path.join(legacy, "nested"), { recursive: true });
    await assert.rejects(
      () => migrateLegacyBoard(repo, nodeBoardWriter()),
      (error: unknown) => {
        const err = error as { errorCode: string; message: string };
        return err.errorCode === "BOARD_IO_ERROR" && /unexpected subdirectory/.test(err.message);
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("migrateLegacyBoard rmdirs empty root status folders", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/blocked"), { recursive: true });
    const result = await migrateLegacyBoard(repo, nodeBoardWriter());
    assert.equal(result.moved, 0);
    assert.deepEqual(result.removedStatusDirs, ["blocked"]);
    const names = await readdir(path.join(repo, "knowledge/tasks"));
    assert.equal(names.includes("blocked"), false);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/migrate.test.ts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `migrate.js`

- [ ] **Step 3: Write minimal implementation**

`board.ts` `BoardWriter` and `createNodeBoardWriter`:

```ts
import { rmdir, stat } from "node:fs/promises";

export type BoardWriter = BoardFs & {
  writeFile(abs: string, contents: string): Promise<void>;
  mkdirp(abs: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  unlink(abs: string): Promise<void>;
  rmdir(abs: string): Promise<void>;
};

// in createNodeBoardWriter:
async rmdir(abs: string): Promise<void> {
  await rmdir(abs);
}
```

`helpers.ts` writer double gets the same `rmdir`. Detect directories in migrate with `stat` via `readdir` try/catch on the child path (same rule as Task 2) or add `isDir` only on the writer if you already imported `stat` — do not invent a second BoardFs shape.

`migrate.ts`:

```ts
import path from "node:path";
import type { BoardWriter } from "./board.js";
import { boardRoot } from "./paths.js";
import { DEFAULT_TASK_PROJECT, TASK_STATUSES, TasksError } from "./types.js";
import { projectDirName } from "./project.js";

export async function migrateLegacyBoard(
  repoPath: string,
  fs: BoardWriter,
): Promise<{ moved: number; removedStatusDirs: string[] }> {
  let moved = 0;
  const removedStatusDirs: string[] = [];
  for (const status of TASK_STATUSES) {
    const legacyAbs = path.join(boardRoot(repoPath), status);
    if (!(await fs.exists(legacyAbs))) {
      continue;
    }
    let names: string[];
    try {
      names = await fs.readdir(legacyAbs);
    } catch {
      continue;
    }
    const destDir = path.join(boardRoot(repoPath), projectDirName(DEFAULT_TASK_PROJECT), status);
    for (const name of names) {
      const fromAbs = path.join(legacyAbs, name);
      let isDirectory = false;
      try {
        await fs.readdir(fromAbs);
        isDirectory = true;
      } catch {
        isDirectory = false;
      }
      if (isDirectory) {
        throw new TasksError("BOARD_IO_ERROR", `unexpected subdirectory: knowledge/tasks/${status}/${name}`);
      }
      const destAbs = path.join(destDir, name);
      if (await fs.exists(destAbs)) {
        throw new TasksError(
          "BOARD_IO_ERROR",
          `destination already exists: knowledge/tasks/_default/${status}/${name}`,
        );
      }
      await fs.mkdirp(destDir);
      await fs.rename(fromAbs, destAbs);
      moved += 1;
    }
    await fs.rmdir(legacyAbs);
    removedStatusDirs.push(status);
  }
  return { moved, removedStatusDirs };
}
```

Do not register this on `tasks.ts`. Do not run it against the live board in this task.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/migrate.test.ts
pnpm --filter edges-cli test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/migrate.ts \
  extensions/clis/src/tasks/utils/board.ts \
  extensions/clis/test/tasks/utils/migrate.test.ts \
  extensions/clis/test/tasks/utils/helpers.ts
git commit -m "feat(tasks): add one-shot board migrate helper" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 9: Live board migrate + memory pointers

**Files:**
- Modify: every file currently under `knowledge/tasks/{backlog,todo,in_progress,in_review,done,blocked,cancelled}/` — git mv into `knowledge/tasks/_default/<same-status>/` (Task files **and** hidden `.{stem}.log.md` sidecars). Empty leftover status dirs must disappear
- Do not modify: `knowledge/tasks/AGENTS.md`, `knowledge/tasks/README.md` (already updated in Task 7), `knowledge/tasks/.memory/**`
- Modify via `$project-memory-remember` (do not hand-edit indexes):
  - `.memory/projects/project_edges_task_project.md`
  - `.memory/projects/project_tasks_with_status_not_todos.md`
- Modify: `CHANGELOG.md` only if Task 7’s Added line is not already there

**Interfaces:**
- Consumes: `migrateLegacyBoard` from Task 8
- Produces: live board matches ADR 0009; `edges tasks list` against `EDGES_REPO=<this repo>` returns the same stems as before, each with `"project":"default"`; no root status directory remains

- [ ] **Step 1: Write the failing test**

Do **not** add a unit test that points at the real `knowledge/tasks/` tree. Use a shell probe that must fail before the move:

```bash
test -d knowledge/tasks/backlog && test ! -d knowledge/tasks/_default/backlog
test -f knowledge/tasks/in_progress/2026-09-11--task进一步分组类需求管理.md
test -f knowledge/tasks/in_progress/.2026-09-11--task进一步分组类需求管理.log.md
```

Expected before migrate: all three succeed (legacy layout still present).

After Step 3 the inverse must hold:

```bash
test ! -d knowledge/tasks/backlog
test ! -d knowledge/tasks/todo
test ! -d knowledge/tasks/in_progress
test ! -d knowledge/tasks/in_review
test ! -d knowledge/tasks/done
test ! -d knowledge/tasks/blocked
test ! -d knowledge/tasks/cancelled
test -d knowledge/tasks/_default/backlog
test -d knowledge/tasks/_default/done
test -d knowledge/tasks/_default/in_progress
test -f knowledge/tasks/_default/in_progress/2026-09-11--task进一步分组类需求管理.md
test -f knowledge/tasks/_default/in_progress/.2026-09-11--task进一步分组类需求管理.log.md
test -f knowledge/tasks/AGENTS.md
test -f knowledge/tasks/README.md
test -d knowledge/tasks/.memory
```

Count check (run from repo root; adjust only if the board changed under you):

```bash
# before: files directly under each root status dir
# after: same basenames under _default/<status>/
python3 - <<'PY'
from pathlib import Path
root = Path("knowledge/tasks")
legacy = ["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"]
print("legacy_present", [name for name in legacy if (root / name).is_dir()])
print("default_present", (root / "_default").is_dir())
PY
```

- [ ] **Step 2: Run probe to verify it fails the post-migrate shape**

Run the “after” `test ! -d knowledge/tasks/backlog` block **now**.

Expected: FAIL (`knowledge/tasks/backlog` still exists)

- [ ] **Step 3: Write minimal implementation**

From repo root, apply the helper once to this checkout. Do not hand-`mv` file-by-file if the helper already covers hidden files — call it:

```bash
pnpm --filter edges-cli exec tsx -e '
import { migrateLegacyBoard } from "./src/tasks/utils/migrate.ts";
import { createNodeBoardWriter } from "./src/tasks/utils/board.ts";
const repo = process.cwd();
const result = await migrateLegacyBoard(repo, createNodeBoardWriter());
console.log(JSON.stringify(result));
'
```

`tsx -e` with `.ts` imports may not resolve; if it fails, add a throwaway runner `extensions/clis/scripts/migrate-legacy-board.ts` that prints the JSON result, run it with `pnpm --filter edges-cli exec tsx scripts/migrate-legacy-board.ts` from `extensions/clis` while passing the **repository root** (parent of `extensions/`) as `EDGES_REPO` or `process.argv[2]`. Delete that runner in the same commit after it succeeds — it is not a public CLI.

Alternatively, if you prefer not to add a temp script: `git mv` every file the helper would move, matching Task 8’s rules exactly (all files in each root status dir, including `.{stem}.log.md`; `git mv` the directories into `_default/<status>/`; `rmdir` leftovers). Do not edit Task bodies. Do not add `edges-task-project` lines. Do not touch `.memory/`, `AGENTS.md`, or `README.md`.

Then remember (from repo root):

```bash
python3 .agents/skills/project-memory-init/scripts/memory.py remember \
  --target-dir . \
  --type project \
  --slug edges_task_project \
  --title "Task 看板按 Task Project 目录优先分组" \
  --description "看板 Task Project 为 directory-first + frontmatter 双写；未分组用 _default。决策见 docs/adr/0009-edges-task-project-grouping.md。CLI 已按 docs/superpowers/plans/2026-09-16-edges-task-project.md 落地；status 只在同 project 内移动。" \
  --content "$(cat <<'EOF'
看板内 Task 分组单位是 Task Project：directory-first（路径 `knowledge/tasks/<project-slug>/<edges-tasks-status>/`）并与 frontmatter `metadata.edges-task-project` 双写；未分组用保留目录 `_default`（字段 `default` 或不写）。与 status、priority 正交。用户所述、grill 确认于 2026-09-16；CLI 已按 `docs/superpowers/plans/2026-09-16-edges-task-project.md` 落地（create/update/list `--project`，`status` 只在同 project 内搬家，一次性迁入 `_default`）。Skill / MCP 后做同一契约。

**Why:**
2026-09-16 grill 确认要对齐 Multica Project，但不能把状态夹当 project，也不能只改标签不改路径。ADR 0009 修订 ADR 0002 的路径。实现后 tasks 根下不再直接放 status 夹。本轮不做 parent/sub-issue/stage，也不改写 Skill/MCP。能力面仍是 CLI + Skill + MCP。

**How to apply:**
- 改看板路径、CLI 或 glossary 时按 ADR 0009 与 CONTEXT 术语；目录与 `edges-task-project` 必须一起改。
- 现网路径是 `knowledge/tasks/<project-slug>/<status>/`；未分组 `_default`。
- 不要把 `edges-tasks-status` 当 project，不要用任意深层目录当 project，不要在 `knowledge/tasks/` 根下直接放 status 夹。
- 不要只用 frontmatter 或只改路径；不要用 `status` 跨 project 搬家。
- 不要做 parent/sub-issue/stage、不要全量改写 Skill/MCP。
- 对照 ADR `docs/adr/0009-edges-task-project-grouping.md` 与计划 `docs/superpowers/plans/2026-09-16-edges-task-project.md`；叠 ADR 0002 / 0005 / 0007。
EOF
)"
```

```bash
python3 .agents/skills/project-memory-init/scripts/memory.py remember \
  --target-dir . \
  --type project \
  --slug tasks_with_status_not_todos \
  --title "工作项叫 tasks，支持状态流转" \
  --description "idea→专家→Cloud 工作流下，目录与概念用 knowledge/tasks/（非 todos），按 Task Project 再按 edges-tasks-status 分夹流转" \
  --content "$(cat <<'EOF'
在 idea → 专家细聊 → Cursor Cloud Agent 开发 → 改状态 的工作模式下，工作项应叫 tasks（不是 todos），先按 Task Project 分组，再按 `edges-tasks-status` 分夹存放。

**Why:**
todo 暗示一次性勾选清单；这套流程是跨 Agent 接力的工作项，需要状态机。ADR 0009 把状态夹嵌进 project-slug 下。

**How to apply:**
- 新工作项落到 `knowledge/tasks/<project-slug>/<status>/`，未分组用 `_default/`，默认 `backlog/`
- 状态字段只用 `metadata.edges-tasks-status`（backlog | todo | in_progress | in_review | done | blocked | cancelled）
- 分组字段 `metadata.edges-task-project` 与目录 slug 双写
- 不要再写 `knowledge/todos/`，也不要在 `knowledge/tasks/` 根下直接放 status 夹
- 角色文案用 Task 记录员
EOF
)"
```

Smoke the real repo (read-only list; do not create extra Tasks):

```bash
EDGES_REPO="$(pwd)" pnpm --filter edges-cli exec tsx src/index.ts tasks list --status in_progress
```

Expected: JSON includes `2026-09-11--task进一步分组类需求管理` with `"project":"default"`. Do not change that Task’s body or status in this commit.

- [ ] **Step 4: Run test to verify it passes**

Run the post-migrate `test ! -d knowledge/tasks/backlog` block from Step 1.

Run:

```bash
pnpm --filter edges-cli test
```

Expected: PASS; every `test ! -d knowledge/tasks/<status>` succeeds; `AGENTS.md` / `README.md` / `.memory` still at `knowledge/tasks/`.

- [ ] **Step 5: Commit**

```bash
git add knowledge/tasks/_default \
  knowledge/tasks/backlog \
  knowledge/tasks/todo \
  knowledge/tasks/in_progress \
  knowledge/tasks/in_review \
  knowledge/tasks/done \
  knowledge/tasks/blocked \
  knowledge/tasks/cancelled \
  .memory/projects/project_edges_task_project.md \
  .memory/projects/project_tasks_with_status_not_todos.md \
  .memory/PROJECT.md \
  CHANGELOG.md
git commit -m "refactor(tasks): move board into _default project folders" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

If git treats the directory moves as renames, that is correct. Do not commit a leftover `extensions/clis/scripts/migrate-legacy-board.ts`. Do not commit `.obsidian/workspace.json`.

---

## Self-review vs ADR 0009

Run after the plan is written. Fixed inline while drafting; this is the coverage map.

| ADR 0009 decision | Task |
| --- | --- |
| Directory-first Multica-like Project; no full parent / sub-issue / stage | File map “Do not create”; Tasks 2–5 only add `<project-slug>/<status>/` |
| Path `knowledge/tasks/<project-slug>/<edges-tasks-status>/<stem>.md`; sidecar same dir | Tasks 2, 4, 6, 8, 9 |
| Ungrouped `_default`; after migrate no root status folders | Tasks 2 (skip root status dirs), 8 (helper), 9 (live move) |
| Field `metadata.edges-task-project`; `_default` ↔ `default` or omit | Tasks 1, 3, 4; update `--project default` writes `default` (Task 5) |
| Directory + frontmatter dual-write; reject missing/mismatched named-project field | Task 1 `assertProjectDualWrite`; Task 2 list/get throw; Task 4/5 write both |
| `status` only inside the same project | Task 6 |
| Cross-project via explicit `update --project` | Task 5 |
| One-shot migrate `tasks/<status>/*` → `tasks/_default/<status>/*` including hidden sidecars | Tasks 8–9 |
| Orthogonal to `edges-tasks-status` and `edges-task-priority` | Tasks 4–6 preserve the other fields; no folder encoding of priority or project-as-status |
| Skill / MCP full rewrite out of scope; Capability Surface still CLI + Skill + MCP | File map + Task 7 README wording |
| CLI must follow the new path in the implementation round | Tasks 2–7; Task 9 same PR so main is never half-migrated |
| No GitHub linking / Multica daemon | File map “Do not create” |
| Invalid project slug rejected | Tasks 1, 4, 5, 7 parse tests (`_default`, `in_progress`, `Default`) |
| JSON always includes `project` (like `priority`) | Tasks 2, 4, 5, 7; status envelope excluded in Task 6 |

Placeholder scan: no TBD / “add validation later” / “write tests for the above” without code. No “similar to Task N” without repeating the needed signatures.

Type consistency: `TaskProjectId`, `DEFAULT_TASK_PROJECT`, `DEFAULT_TASK_PROJECT_DIR`, `TASK_PROJECT_FIELD`, `parseTaskProject`, `assertProjectDualWrite`, `filterTasksByProject`, `projectDirName`, `projectIdFromDir`, `TaskListOpts.projects`, `migrateLegacyBoard`, JSON key `project`, disk key `edges-task-project`, directory `_default`.
