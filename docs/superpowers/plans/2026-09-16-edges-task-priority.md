# edges-task-priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Issue-layer `edges-task-priority` to the existing `edges tasks` CLI so create/update can set `urgent|high|medium|low|none`, list can filter and opt-in sort, and every Issue-layer JSON payload exposes a normalized `priority` — without moving status folders or touching Skill/MCP.

**Architecture:** Keep the current Commander → `run()` → `src/tasks/*.ts` + `src/tasks/utils/` layout from ADR 0005. Add a focused `priority.ts` helper (enum, parse, read-normalization, filter, stable sort). Thread `priority` through `TaskListItem`, frontmatter, `createTask` / `updateTask`, and `list` flags. `status` / `moveTaskStatus` stay status-only. Capability Surface remains CLI + Skill + MCP as three peers (ADR 0004); this round implements the CLI contract only.

**Tech Stack:** TypeScript, Node.js ≥20, existing `commander` + `zod`, `node:test` + `tsx` (not vitest), `node:fs/promises`. No new YAML library. No `simple-git`. No Multica daemon. No P0–P3 aliases.

**Spec:** `docs/adr/0007-edges-task-priority.md` (accepted). Glossary: `CONTEXT.md` terms **edges-task-priority**, **edges-tasks-status**, **Task**, **edges tasks（CLI）**. Existing command surface: `docs/adr/0005-edges-tasks-cli.md` and `extensions/clis/src/tasks/`. Status folders: `docs/adr/0002-knowledge-tasks-status-folders.md`. Capability Surface: `docs/adr/0004-capability-surface-cli-skill-mcp.md`. Why words not P0: `knowledge/projects/tasks/2026-09-15--issue-priority-words-vs-p0.md`. Verb alignment only: https://multica.ai/docs/cli ; `.memory/references/reference_multica_cli_tasks_reference.md`.

## Global Constraints

- Co-authored-by on every commit: `Coding Agent 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Capability Surface wording, if mentioned: always **CLI + Skill + MCP** (three peers). Never “必要时 MCP”, never “CLI + Skill” as the Edges shorthand, never npm `package.json` `"bin"` as a layer
- This round is **CLI only**. Do not create Skill or MCP wrappers. They follow later on this same contract
- Enum is exactly `urgent | high | medium | low | none`. Do not add P0–P3, `Urgent`, or aliases
- Disk field is `metadata.edges-task-priority`. Missing or empty on read = `none`
- Invalid write values = `VALIDATION_ERROR`, exit 2, no Task file write and no sidecar write
- Changing priority must **never** move `knowledge/tasks/<status>/` or rename the stem. `status` does not accept `--priority`
- `list` default order stays the current board walk (`TASK_STATUSES` then `readdir`). `--sort priority` is opt-in
- Repeatable `list --priority` is OR. Combined with `--status` it is AND
- `list` / `get` / `create` / `update` JSON always includes top-level `priority` (normalized). `status` JSON stays as it is today
- Do not put `ingest` / `fs` / `writer` / `now` / `repoPath` on `CliContext` or `run()`’s second argument
- Do not change `knowledge/tasks/` board status or task bodies (tests use `os.tmpdir()`)
- Do not auto-create/edit/move/delete `knowledge/posts/`
- Do not add `js-yaml` / `gray-matter` / `simple-git` / vitest. Stay on `commander` + `zod` + `node:test` + `tsx`
- Test runner is `extensions/clis/package.json` `"test": "node --test --import tsx test"` (recursive). New tests go under `extensions/clis/test/tasks/`
- Reuse `EDGES_REPO` from `loadConfig()` as the repo root. Board lives at `<repoPath>/knowledge/tasks/`
- Public repo: no credentials, tokens, or personal data in commits
- `pull` / `rebase` use `--autostash`. Do not commit `.obsidian/workspace.json`

---

## File map

**Create**

- `extensions/clis/src/tasks/utils/priority.ts` — `TASK_PRIORITY_FIELD`, parse, read-normalize, compare, filter, stable sort (re-exports `TASK_PRIORITIES` / `TaskPriority` from `types.ts`)
- `extensions/clis/test/tasks/utils/priority.test.ts` — pure helper tests

**Modify**

- `extensions/clis/src/tasks/utils/types.ts` — `TASK_PRIORITIES` / `TaskPriority`; add `priority: TaskPriority` on `TaskListItem` (and therefore `TaskRecord`)
- `extensions/clis/src/tasks/utils/frontmatter.ts` — `renderNewTaskDoc` writes `edges-task-priority` only when the value is not `none`
- `extensions/clis/src/tasks/utils/write.ts` — `createTask` / `updateTask` accept `priority`; return `priority`; `update` may be `--priority` alone
- `extensions/clis/src/tasks/utils/board.ts` — `readListItem` sets `priority` via `priorityFromMetadata`; `listTasks` gains `priorities?` + `sort?`
- `extensions/clis/src/tasks/utils/service.ts` — pass the new `listTasks` opts through
- `extensions/clis/src/tasks/create.ts` — `--priority <priority>` with Commander `.choices`
- `extensions/clis/src/tasks/update.ts` — `--priority <priority>`; include it in the “at least one flag” rule
- `extensions/clis/src/tasks/list.ts` — repeatable `--priority` (OR) and `--sort priority`
- `extensions/clis/src/tasks.ts` — `TASKS_AFTER_HELP` command surface
- `extensions/clis/README.md` — document the new flags; keep Capability Surface as CLI + Skill + MCP
- `knowledge/tasks/README.md` — one short paragraph: priority is metadata, not a folder
- `extensions/clis/test/tasks/utils/frontmatter.test.ts`
- `extensions/clis/test/tasks/utils/write.test.ts`
- `extensions/clis/test/tasks/utils/board.test.ts`
- `extensions/clis/test/tasks/utils/move.test.ts` — status move preserves an existing priority field and still moves folders
- `extensions/clis/test/tasks/parse.test.ts`
- `extensions/clis/test/tasks/run.test.ts`
- `extensions/clis/test/tasks/cli.test.ts`
- `CHANGELOG.md` `[Unreleased]` — Added line for the CLI feature (when implementation lands)

**Do not create/commit**

- `extensions/skills/edges-tasks/**` or any Skill wrapper
- MCP server / tool for tasks priority
- `--priority` on `status`
- P0–P3 aliases, case folding, or folder/filename encoding of priority
- Edits under `knowledge/posts/`
- Board status moves under `knowledge/tasks/` (implementation tests use `os.tmpdir()`)
- Edits to `docs/adr/0007-edges-task-priority.md` or `CONTEXT.md` (already merged)
- This plan file’s own “implement CLI” work in the plan-only PR that first lands this document

---

## Locked design (read before Task 1)

Cite these as already decided. Do not reopen them in implementation tasks.

### Command surface (ADR 0007 on top of ADR 0005)

```
edges tasks list [--status <edges-tasks-status>] [--priority <edges-task-priority>]... [--sort priority]
edges tasks get <stem|path>
edges tasks create --title <title> [--description <text>] [--body <markdown>] [--status <status>] [--name <name>] [--assignee <text>] [--priority <priority>]
edges tasks update <stem|path> [--title <title>] [--description <text>] [--body <markdown>] [--assignee <text>] [--priority <priority>]
edges tasks status <stem|path> <status>
edges tasks runs <stem|path> [--output table|json]
edges tasks run-messages <run-id> [--task <stem>] [--output table|json]
```

- `edges-task-priority` = `urgent | high | medium | low | none`
- `create --priority` omitted → treat as `none`. Do **not** write `metadata.edges-task-priority` (same “omit empty optional lines” rule as assignee). JSON still has `"priority":"none"`
- `create --priority none` → same disk result as omitted (no field). JSON `"priority":"none"`
- `create --priority urgent|high|medium|low` → write `metadata.edges-task-priority: <value>`
- `update --priority <value>` (including `none`) → `setMetadataField(..., "edges-task-priority", value)` in place. `--priority` alone is a valid update
- `update` still never moves the file, never renames the stem, never writes `edges-tasks-status`
- `status` does not grow a `--priority` flag. `tasks status <stem> --priority high` is an unknown option → `VALIDATION_ERROR`, exit 2, no writes
- `list` without `--sort` keeps today’s order: walk `TASK_STATUSES` in declaration order, then `readdir` within each folder
- `list --sort priority` is the only allowed `--sort` value: `urgent` → `high` → `medium` → `low` → `none`. Use a stable sort so equal priorities keep board order
- `list --priority` is repeatable; multiple values are OR. `--priority none` matches missing field **and** explicit `none`
- `--status` AND `--priority` combine: status filter first (or board walk), then priority OR filter, then optional sort
- Invalid enum (`P0`, `Urgent`, `HIGH`, `critical`, empty) on create/update/list → `VALIDATION_ERROR`, exit 2, no writes
- Invalid `--sort` (anything other than `priority`) → `VALIDATION_ERROR`, exit 2
- Commander `.choices([...TASK_PRIORITIES])` / `.choices(["priority"])` is the CLI gate (same pattern as `--status` today). Domain helpers still throw `TasksError("VALIDATION_ERROR", ...)` so direct function calls cannot write garbage

### JSON envelope

Issue-layer success payloads **must** include normalized `priority` on `list` / `get` / `create` / `update`:

```json
{"status":"success","command":"list","tasks":[{"stem":"2026-09-13--demo","priority":"none"}]}
{"status":"success","command":"get","task":{"stem":"2026-09-13--demo","priority":"high"}}
{"status":"success","command":"create","stem":"...","path":"...","sidecarPath":"...","priority":"high"}
{"status":"success","command":"update","stem":"...","path":"...","priority":"low"}
```

`status` stays `{ status, command, stem, from, to, path, sidecarPath }` — do not add `priority` to that envelope.

Failure envelope is unchanged:

```json
{"status":"failed","errorCode":"VALIDATION_ERROR","reason":"..."}
```

Exit: `0` success, `2` `VALIDATION_ERROR`, `1` everything else.

JSON field name is `priority` (not `edges-task-priority`). Values are the five lowercase words, never Linear’s numeric ranks.

### Read vs write

| Source | Behavior |
| --- | --- |
| Missing `metadata.edges-task-priority` | Read as `none` |
| Empty value | Read as `none` |
| Exact `urgent\|high\|medium\|low\|none` | That value |
| Any other on-disk string (`P0`, `Urgent`) | Read as `none` so `list` cannot fail the whole board. JSON stays a valid enum |
| Write of any other string | `VALIDATION_ERROR`, no write |
| Exact match only | No case fold, no trim, no `P0→urgent` map |

### Disk placement

```
<repo>/knowledge/tasks/<edges-tasks-status>/<stem>.md
metadata:
  edges-tasks-status: <status>
  edges-task-priority: high    # omitted when none on create
```

Priority never appears in the folder name or stem. `moveTaskStatus` may copy a file that already has the field; it must not add, remove, or require it.

### Test commands

Single file (cwd = `extensions/clis`):

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/priority.test.ts
```

Package suite after each implementation step:

```bash
pnpm --filter edges-cli test
```

---

### Task 1: Priority enum and pure helpers

**Files:**
- Create: `extensions/clis/src/tasks/utils/priority.ts`
- Create: `extensions/clis/test/tasks/utils/priority.test.ts`
- Modify: `extensions/clis/src/tasks/utils/types.ts` — define `TASK_PRIORITIES` / `TaskPriority` next to `TASK_STATUSES` (avoids a `types.ts` ↔ `priority.ts` cycle) and add `priority: TaskPriority` on `TaskListItem`

**Interfaces:**
- Consumes: `TasksError`, `TASK_PRIORITIES`, `TaskPriority` from `./types.js`
- Produces:
  - `TASK_PRIORITIES` / `TaskPriority` live in `types.ts` (re-exported from `priority.ts` for callers that already import helpers)
  - `TASK_PRIORITY_FIELD = "edges-task-priority"`
  - `isTaskPriority(raw: string): raw is TaskPriority`
  - `parseTaskPriority(raw: string): TaskPriority` — throws `TasksError("VALIDATION_ERROR", "invalid edges-task-priority: ${raw} (expected urgent|high|medium|low|none)")`
  - `priorityFromMetadata(metadata: Record<string, string>): TaskPriority` — missing/empty/unknown → `"none"`
  - `compareTaskPriority(a: TaskPriority, b: TaskPriority): number` — urgent first (0), none last (4)
  - `filterTasksByPriority<T extends { priority: TaskPriority }>(items: T[], allowed: readonly TaskPriority[]): T[]` — empty `allowed` means no filter (return `items` unchanged)
  - `sortTasksByPriority<T extends { priority: TaskPriority }>(items: T[]): T[]` — stable, does not mutate `items`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  TASK_PRIORITIES,
  compareTaskPriority,
  filterTasksByPriority,
  isTaskPriority,
  parseTaskPriority,
  priorityFromMetadata,
  sortTasksByPriority,
} from "../../../src/tasks/utils/priority.js";

test("TASK_PRIORITIES is urgent high medium low none", () => {
  assert.deepEqual([...TASK_PRIORITIES], ["urgent", "high", "medium", "low", "none"]);
});

test("parseTaskPriority accepts the five words and rejects P0 / Urgent", () => {
  assert.equal(parseTaskPriority("none"), "none");
  assert.equal(parseTaskPriority("urgent"), "urgent");
  assert.equal(isTaskPriority("high"), true);
  assert.equal(isTaskPriority("P0"), false);
  assert.equal(isTaskPriority("Urgent"), false);
  try {
    parseTaskPriority("P0");
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /P0/);
  }
  try {
    parseTaskPriority("Urgent");
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
  }
});

test("priorityFromMetadata treats missing empty and unknown as none", () => {
  assert.equal(priorityFromMetadata({}), "none");
  assert.equal(priorityFromMetadata({ "edges-task-priority": "" }), "none");
  assert.equal(priorityFromMetadata({ "edges-task-priority": "P0" }), "none");
  assert.equal(priorityFromMetadata({ "edges-task-priority": "Urgent" }), "none");
  assert.equal(priorityFromMetadata({ "edges-task-priority": "high" }), "high");
});

test("sortTasksByPriority is urgent-to-none and stable", () => {
  const items = [
    { id: "b-none", priority: "none" as const },
    { id: "a-high", priority: "high" as const },
    { id: "c-urgent", priority: "urgent" as const },
    { id: "d-high", priority: "high" as const },
    { id: "e-low", priority: "low" as const },
    { id: "f-medium", priority: "medium" as const },
  ];
  const sorted = sortTasksByPriority(items);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["c-urgent", "a-high", "d-high", "f-medium", "e-low", "b-none"],
  );
  assert.equal(items[0]?.id, "b-none");
  assert.equal(compareTaskPriority("urgent", "none") < 0, true);
});

test("filterTasksByPriority ORs the allowed set; empty means no filter", () => {
  const items = [
    { id: "u", priority: "urgent" as const },
    { id: "h", priority: "high" as const },
    { id: "n", priority: "none" as const },
  ];
  assert.deepEqual(
    filterTasksByPriority(items, ["urgent", "high"]).map((item) => item.id),
    ["u", "h"],
  );
  assert.deepEqual(
    filterTasksByPriority(items, ["none"]).map((item) => item.id),
    ["n"],
  );
  assert.equal(filterTasksByPriority(items, []).length, 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/priority.test.ts`

Expected: FAIL `Cannot find module` for `priority.js`

- [ ] **Step 3: Write minimal implementation**

In `types.ts`, next to `TASK_STATUSES`:

```ts
export const TASK_PRIORITIES = ["urgent", "high", "medium", "low", "none"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
```

Add `priority: TaskPriority` to `TaskListItem`.

`priority.ts`:

```ts
import { TASK_PRIORITIES, TasksError, type TaskPriority } from "./types.js";

export { TASK_PRIORITIES, type TaskPriority };
export const TASK_PRIORITY_FIELD = "edges-task-priority";

const RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

export function isTaskPriority(raw: string): raw is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(raw);
}

export function parseTaskPriority(raw: string): TaskPriority {
  if (!isTaskPriority(raw)) {
    throw new TasksError(
      "VALIDATION_ERROR",
      `invalid edges-task-priority: ${raw} (expected urgent|high|medium|low|none)`,
    );
  }
  return raw;
}

export function priorityFromMetadata(metadata: Record<string, string>): TaskPriority {
  const raw = metadata[TASK_PRIORITY_FIELD];
  if (raw === undefined || raw === "") {
    return "none";
  }
  return isTaskPriority(raw) ? raw : "none";
}

export function compareTaskPriority(a: TaskPriority, b: TaskPriority): number {
  return RANK[a] - RANK[b];
}

export function filterTasksByPriority<T extends { priority: TaskPriority }>(
  items: T[],
  allowed: readonly TaskPriority[],
): T[] {
  if (allowed.length === 0) {
    return items;
  }
  const set = new Set(allowed);
  return items.filter((item) => set.has(item.priority));
}

export function sortTasksByPriority<T extends { priority: TaskPriority }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const byRank = compareTaskPriority(left.item.priority, right.item.priority);
      return byRank !== 0 ? byRank : left.index - right.index;
    })
    .map((entry) => entry.item);
}
```

In `board.ts` `readListItem`, add the required field (do not add list flags yet):

```ts
import { priorityFromMetadata } from "./priority.js";

return {
  stem,
  title: doc.metadata["edges-title"] || doc.name || stem,
  status,
  description: doc.description,
  path: rel,
  sidecarPath: sidecarRel,
  runCount,
  priority: priorityFromMetadata(doc.metadata),
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/priority.test.ts
pnpm --filter edges-cli test
```

Expected: PASS (existing board tests keep working once `readListItem` sets `priority`)

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/priority.ts \
  extensions/clis/src/tasks/utils/types.ts \
  extensions/clis/src/tasks/utils/board.ts \
  extensions/clis/test/tasks/utils/priority.test.ts
git commit -m "feat(tasks): add edges-task-priority helpers" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 2: Frontmatter writes priority only when not none

**Files:**
- Modify: `extensions/clis/src/tasks/utils/frontmatter.ts`
- Modify: `extensions/clis/test/tasks/utils/frontmatter.test.ts`

**Interfaces:**
- Consumes: `TaskPriority` from `./types.js`
- Produces: `renderNewTaskDoc(input: { name: string; description: string; title: string; status: TaskStatus; priority?: TaskPriority; assignee?: string; updatedAt: string; body: string }): string`
  - After `edges-tasks-status`, if `priority` is present and not `"none"`, write `  edges-task-priority: ${priority}`
  - If `priority` is omitted or `"none"`, omit the line
  - Assignee and `edges-updated-at` stay where they are today
- `setMetadataField` already patches an arbitrary metadata key; do not add a second writer

- [ ] **Step 1: Write the failing test**

Append to `extensions/clis/test/tasks/utils/frontmatter.test.ts` (keep the three existing tests):

```ts
test("renderNewTaskDoc omits edges-task-priority when none or omitted", () => {
  const omitted = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.doesNotMatch(omitted, /edges-task-priority/);

  const explicitNone = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    priority: "none",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.doesNotMatch(explicitNone, /edges-task-priority/);
});

test("renderNewTaskDoc writes edges-task-priority after status when high", () => {
  const md = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "todo",
    priority: "high",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.match(md, /edges-tasks-status: todo\n  edges-task-priority: high\n/);
  assert.equal(parseTaskDoc(md).metadata["edges-task-priority"], "high");
});

test("setMetadataField can set edges-task-priority to none", () => {
  const withHigh = renderNewTaskDoc({
    name: "n",
    description: "d",
    title: "t",
    status: "todo",
    priority: "high",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  const next = setMetadataField(withHigh, "edges-task-priority", "none");
  assert.equal(parseTaskDoc(next).metadata["edges-task-priority"], "none");
  assert.match(next, /edges-tasks-status: todo/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/frontmatter.test.ts`

Expected: FAIL because `renderNewTaskDoc` does not accept / write `priority`

- [ ] **Step 3: Write minimal implementation**

In `renderNewTaskDoc`, extend the input type and insert the line after status:

```ts
export function renderNewTaskDoc(input: {
  name: string;
  description: string;
  title: string;
  status: TaskStatus;
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

Import `TaskPriority`. Do not add a YAML dependency.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/frontmatter.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/frontmatter.ts \
  extensions/clis/test/tasks/utils/frontmatter.test.ts
git commit -m "feat(tasks): write edges-task-priority in new Task docs" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 3: list/get expose normalized priority

**Files:**
- Modify: `extensions/clis/src/tasks/utils/board.ts`
- Modify: `extensions/clis/test/tasks/utils/board.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts` — existing `list` / `get` fixtures without the field must still succeed and report `"priority":"none"`

**Interfaces:**
- Consumes: `priorityFromMetadata` from `./priority.js`; `TaskListItem.priority` from Task 1
- Produces: `readListItem` / `getTask` include `priority: priorityFromMetadata(doc.metadata)`
- `listTasks` signature stays `opts: { status?: TaskStatus }` until Task 6

- [ ] **Step 1: Write the failing test**

Append to `board.test.ts`. Keep `seed()` as the no-field fixture. Add a second file in the same test for an explicit value:

```ts
test("listTasks and getTask expose priority none when the field is missing", async () => {
  const repo = await seed();
  try {
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items[0]?.priority, "none");
    const got = await getTask(repo, "2026-09-13--demo", nodeBoardFs());
    assert.equal(got.priority, "none");
    assert.equal(got.metadata["edges-task-priority"], undefined);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks and getTask expose written edges-task-priority", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/backlog");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-16--hot.md"),
      `---
name: hot
description: hot
metadata:
  edges-type: task
  edges-title: hot
  edges-tasks-status: backlog
  edges-task-priority: urgent
---

body
`,
      "utf8",
    );
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items[0]?.priority, "urgent");
    const got = await getTask(repo, "2026-09-16--hot", nodeBoardFs());
    assert.equal(got.priority, "urgent");
    assert.equal(got.metadata["edges-task-priority"], "urgent");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks treats on-disk P0 as none so the board still lists", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-16--legacy.md"),
      `---
name: legacy
description: legacy
metadata:
  edges-type: task
  edges-title: legacy
  edges-tasks-status: todo
  edges-task-priority: P0
---

body
`,
      "utf8",
    );
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items.length, 1);
    assert.equal(items[0]?.priority, "none");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

Also extend the existing `run.test.ts` list/get tests:

```ts
assert.equal(body.tasks[0]?.priority, "none");
// and in get:
assert.equal(body.task.priority, "none");
```

Those assertions fail only if `readListItem` still omits `priority` (JSON `undefined`). If Task 1 already set the field, this step’s new tests are the ones that fail until fixtures with `urgent` / `P0` are handled — they already will be if Task 1 wired `priorityFromMetadata`. In that case Step 2 is: run the new tests; they should FAIL only if `readListItem` is not using `priorityFromMetadata` yet. Wire it here.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/board.test.ts`

Expected: FAIL on `items[0]?.priority` if `readListItem` does not set it from metadata (or FAIL on the `urgent` fixture if it hard-codes `"none"`)

- [ ] **Step 3: Write minimal implementation**

In `readListItem`, after `parseTaskDoc`:

```ts
import { priorityFromMetadata } from "./priority.js";

return {
  stem,
  title: doc.metadata["edges-title"] || doc.name || stem,
  status,
  description: doc.description,
  path: rel,
  sidecarPath: sidecarRel,
  runCount,
  priority: priorityFromMetadata(doc.metadata),
};
```

Do not change scan order. Do not add `--priority` / `--sort` yet.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/board.test.ts test/tasks/run.test.ts
pnpm --filter edges-cli test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/board.ts \
  extensions/clis/test/tasks/utils/board.test.ts \
  extensions/clis/test/tasks/run.test.ts
git commit -m "feat(tasks): expose normalized priority on list and get" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 4: create --priority (JSON + disk, no git)

**Files:**
- Modify: `extensions/clis/src/tasks/utils/write.ts`
- Modify: `extensions/clis/src/tasks/create.ts`
- Modify: `extensions/clis/test/tasks/utils/write.test.ts`
- Modify: `extensions/clis/test/tasks/parse.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts`

**Interfaces:**
- Consumes: `parseTaskPriority`, `renderNewTaskDoc` with `priority?`
- Produces:
  - `TasksCreateInput.priority?: TaskPriority | string` — validate with `parseTaskPriority` when present
  - `createTask(...)` returns `{ stem, path, sidecarPath, priority: TaskPriority }` where `priority` is the effective value (`"none"` when omitted)
  - CLI: `.addOption(new Option("--priority <priority>", "edges-task-priority").choices([...TASK_PRIORITIES]))`
  - Success JSON: `{ status: "success", command: "create", stem, path, sidecarPath, priority }`

- [ ] **Step 1: Write the failing test**

Append to `write.test.ts`:

```ts
test("createTask omits edges-task-priority on disk and returns priority none", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const created = await createTask(
      repo,
      { title: "No Pri", status: "backlog" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 12, 0, 0) },
    );
    assert.equal(created.priority, "none");
    const md = await readFile(path.join(repo, created.path), "utf8");
    assert.doesNotMatch(md, /edges-task-priority/);
    assert.match(md, /edges-tasks-status: backlog/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createTask writes high and does not move status", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/todo"), { recursive: true });
    const created = await createTask(
      repo,
      { title: "Hot", status: "todo", priority: "high" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 12, 0, 0) },
    );
    assert.equal(created.priority, "high");
    assert.match(created.path, /knowledge\/tasks\/todo\//);
    const md = await readFile(path.join(repo, created.path), "utf8");
    assert.match(md, /edges-task-priority: high/);
    assert.match(md, /edges-tasks-status: todo/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createTask rejects P0 before writing Task or sidecar", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    await assert.rejects(
      () =>
        createTask(
          repo,
          { title: "Bad", status: "backlog", priority: "P0" },
          { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 12, 0, 0) },
        ),
      (error: { errorCode?: string }) => error.errorCode === "VALIDATION_ERROR",
    );
    const names = await readdir(path.join(repo, "knowledge/tasks/backlog"));
    assert.deepEqual(names, []);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

`TasksCreateInput.priority` must be `string | TaskPriority | undefined` so the `P0` call type-checks. Validate inside `createTask` with `parseTaskPriority`.

CLI tests in `parse.test.ts` / `run.test.ts`:

```ts
test("run tasks create --priority high returns JSON priority and writes the field", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const env = { ...process.env, EDGES_REPO: repo };
    const created = await run(["tasks", "create", "--title", "Pri", "--priority", "high"], { env });
    assert.equal(created.exitCode, 0);
    const body = JSON.parse(created.stdout) as { command: string; priority: string; path: string };
    assert.equal(body.command, "create");
    assert.equal(body.priority, "high");
    const md = await readFile(path.join(repo, body.path), "utf8");
    assert.match(md, /edges-task-priority: high/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create --priority P0 is VALIDATION_ERROR and writes nothing", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const result = await run(["tasks", "create", "--title", "Pri", "--priority", "P0"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
    const names = await readdir(path.join(repo, "knowledge/tasks/backlog"));
    assert.deepEqual(names, []);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create without --priority JSON priority is none", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const result = await run(["tasks", "create", "--title", "From CLI"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 0);
    assert.equal(JSON.parse(result.stdout).priority, "none");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

Import `readFile` / `readdir` in the parse/run test files if they are not already imported.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/write.test.ts test/tasks/run.test.ts test/tasks/parse.test.ts`

Expected: FAIL — `createTask` has no `priority` return / `--priority` is an unknown option

- [ ] **Step 3: Write minimal implementation**

`write.ts`:

```ts
export type TasksCreateInput = {
  title: string;
  description?: string;
  body?: string;
  status: TaskStatus;
  name?: string;
  assignee?: string;
  priority?: string;
};

export async function createTask(
  repoPath: string,
  input: TasksCreateInput,
  io: { fs: BoardWriter; now: Date },
): Promise<{ stem: string; path: string; sidecarPath: string; priority: TaskPriority }> {
  const priority = input.priority === undefined ? "none" : parseTaskPriority(input.priority);
  await io.fs.mkdirp(statusDir(repoPath, input.status));
  const stem = await uniqueStem(repoPath, input.status, newTaskStem(input.title, io.now), io.fs);
  const rel = taskRelPath(input.status, stem);
  const sidecarRel = sidecarRelPath(input.status, stem);
  const markdown = renderNewTaskDoc({
    name: input.name ?? taskNameSlug(input.title),
    description: input.description ?? input.title,
    title: input.title,
    status: input.status,
    priority,
    assignee: input.assignee,
    updatedAt: io.now.toISOString(),
    body: input.body ?? defaultBody(input.title),
  });
  await io.fs.writeFile(path.join(repoPath, rel), markdown);
  await io.fs.writeFile(path.join(repoPath, sidecarRel), emptyRunLog(stem));
  return { stem, path: rel, sidecarPath: sidecarRel, priority };
}
```

Call `parseTaskPriority` **before** `mkdirp` / `writeFile`.

`create.ts`: import `TASK_PRIORITIES` and `Option` (already imported). Add the choice option; pass `opts.priority` into `createTask`; spread `created` into `succeed` so JSON includes `priority`.

Update `CREATE_AFTER_HELP`:

```
  --priority <priority>    edges-task-priority: urgent | high | medium | low | none
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/write.test.ts test/tasks/run.test.ts test/tasks/parse.test.ts
pnpm --filter edges-cli test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/write.ts \
  extensions/clis/src/tasks/create.ts \
  extensions/clis/test/tasks/utils/write.test.ts \
  extensions/clis/test/tasks/parse.test.ts \
  extensions/clis/test/tasks/run.test.ts
git commit -m "feat(tasks): add create --priority" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 5: update --priority in place (never move status)

**Files:**
- Modify: `extensions/clis/src/tasks/utils/write.ts`
- Modify: `extensions/clis/src/tasks/update.ts`
- Modify: `extensions/clis/test/tasks/utils/write.test.ts`
- Modify: `extensions/clis/test/tasks/parse.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts`

**Interfaces:**
- Consumes: `parseTaskPriority`, `setMetadataField`, `getTask`
- Produces:
  - `updateTask(..., patch: { title?: string; description?: string; body?: string; assignee?: string; priority?: string })`
  - At least one of those five keys required; error text: `update requires at least one of --title, --description, --body, --assignee, --priority`
  - Returns `{ stem, path, priority }` where `priority` is the effective value after the patch (`parseTaskPriority(patch.priority)` when set, else `priorityFromMetadata` / `record.priority`)
  - Writes only the existing `record.path`. Does not call `rename`. Does not write `edges-tasks-status`
  - CLI: `--priority` with `.choices([...TASK_PRIORITIES])`

- [ ] **Step 1: Write the failing test**

```ts
test("updateTask --priority high keeps path and edges-tasks-status", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const now = new Date(2026, 8, 16, 12, 0, 0);
    await mkdir(path.join(repo, "knowledge/tasks/todo"), { recursive: true });
    const created = await createTask(
      repo,
      { title: "Stay", status: "todo" },
      { fs: nodeBoardWriter(), now },
    );
    const updated = await updateTask(
      repo,
      created.stem,
      { priority: "high" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 16, 13, 0, 0) },
    );
    assert.equal(updated.path, created.path);
    assert.equal(updated.priority, "high");
    assert.match(updated.path, /knowledge\/tasks\/todo\//);
    const md = await readFile(path.join(repo, updated.path), "utf8");
    assert.match(md, /edges-task-priority: high/);
    assert.match(md, /edges-tasks-status: todo/);
    await assert.rejects(access(path.join(repo, "knowledge/tasks/backlog", path.basename(created.path))));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("updateTask --priority none writes the field and does not require other flags", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const now = new Date(2026, 8, 16, 12, 0, 0);
    await mkdir(path.join(repo, "knowledge/tasks/in_progress"), { recursive: true });
    const created = await createTask(
      repo,
      { title: "Cool", status: "in_progress", priority: "urgent" },
      { fs: nodeBoardWriter(), now },
    );
    const updated = await updateTask(
      repo,
      created.stem,
      { priority: "none" },
      { fs: nodeBoardWriter(), now },
    );
    assert.equal(updated.priority, "none");
    const md = await readFile(path.join(repo, updated.path), "utf8");
    assert.match(md, /edges-task-priority: none/);
    assert.match(md, /edges-tasks-status: in_progress/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("updateTask rejects P0 and leaves the file unchanged", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const now = new Date(2026, 8, 16, 12, 0, 0);
    await mkdir(path.join(repo, "knowledge/tasks/todo"), { recursive: true });
    const created = await createTask(
      repo,
      { title: "Stay", status: "todo", priority: "low" },
      { fs: nodeBoardWriter(), now },
    );
    const before = await readFile(path.join(repo, created.path), "utf8");
    await assert.rejects(
      () =>
        updateTask(
          repo,
          created.stem,
          { priority: "P0" },
          { fs: nodeBoardWriter(), now },
        ),
      (error: { errorCode?: string }) => error.errorCode === "VALIDATION_ERROR",
    );
    assert.equal(await readFile(path.join(repo, created.path), "utf8"), before);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

Import `access` from `node:fs/promises` in `write.test.ts`.

CLI:

```ts
test("run tasks update --priority high JSON and in-place path", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const created = await run(["tasks", "create", "--title", "PatchPri"], { env });
    const stem = JSON.parse(created.stdout).stem as string;
    const updated = await run(["tasks", "update", stem, "--priority", "high"], { env });
    assert.equal(updated.exitCode, 0);
    const body = JSON.parse(updated.stdout) as { command: string; priority: string; path: string };
    assert.equal(body.command, "update");
    assert.equal(body.priority, "high");
    assert.match(body.path, /knowledge\/tasks\/backlog\//);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks update --priority Urgent is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "update", "stem", "--priority", "Urgent"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});
```

Keep the existing “update without flags is VALIDATION_ERROR” test; it must still pass.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/write.test.ts test/tasks/run.test.ts`

Expected: FAIL — update still requires one of the old four flags / unknown `--priority`

- [ ] **Step 3: Write minimal implementation**

```ts
export async function updateTask(
  repoPath: string,
  target: string,
  patch: { title?: string; description?: string; body?: string; assignee?: string; priority?: string },
  io: { fs: BoardWriter; now: Date },
): Promise<{ stem: string; path: string; priority: TaskPriority }> {
  if (!patch.title && !patch.description && !patch.body && !patch.assignee && patch.priority === undefined) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "update requires at least one of --title, --description, --body, --assignee, --priority",
    );
  }
  const parsedPriority = patch.priority === undefined ? undefined : parseTaskPriority(patch.priority);
  const record = await getTask(repoPath, target, io.fs);
  let markdown = await io.fs.readFile(path.join(repoPath, record.path));
  if (patch.title !== undefined) {
    markdown = setMetadataField(markdown, "edges-title", patch.title);
  }
  if (patch.description !== undefined) {
    markdown = setTopLevelField(markdown, "description", patch.description);
  }
  if (patch.body !== undefined) {
    markdown = replaceBody(markdown, patch.body);
  }
  if (patch.assignee !== undefined) {
    markdown = setMetadataField(markdown, "edges-task-assignee", patch.assignee);
  }
  if (parsedPriority !== undefined) {
    markdown = setMetadataField(markdown, "edges-task-priority", parsedPriority);
  }
  markdown = setMetadataField(markdown, "edges-updated-at", io.now.toISOString());
  await io.fs.writeFile(path.join(repoPath, record.path), markdown);
  return {
    stem: record.stem,
    path: record.path,
    priority: parsedPriority ?? record.priority,
  };
}
```

Validate `parseTaskPriority` **before** `readFile` / `writeFile` so a bad value cannot touch disk.

`update.ts`: add the choice option; pass `opts.priority`; `succeed({ status: "success", command: "update", ...updated })`.

`UPDATE_AFTER_HELP` gains `--priority` and keeps “Does not move the file; use status to change edges-tasks-status.”

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/write.test.ts test/tasks/run.test.ts test/tasks/parse.test.ts
pnpm --filter edges-cli test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/write.ts \
  extensions/clis/src/tasks/update.ts \
  extensions/clis/test/tasks/utils/write.test.ts \
  extensions/clis/test/tasks/parse.test.ts \
  extensions/clis/test/tasks/run.test.ts
git commit -m "feat(tasks): add update --priority without moving status" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 6: list --priority OR filter, --sort priority, AND --status

**Files:**
- Modify: `extensions/clis/src/tasks/utils/board.ts`
- Modify: `extensions/clis/src/tasks/utils/service.ts`
- Modify: `extensions/clis/src/tasks/list.ts`
- Modify: `extensions/clis/test/tasks/utils/board.test.ts`
- Modify: `extensions/clis/test/tasks/parse.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts`

**Interfaces:**
- Consumes: `filterTasksByPriority`, `sortTasksByPriority`, `TASK_PRIORITIES`, `parseTaskPriority`
- Produces:
  - `type TaskListOpts = { status?: TaskStatus; priorities?: TaskPriority[]; sort?: "priority" }`
  - `listTasks(repoPath, opts: TaskListOpts, fs): Promise<TaskListItem[]>`
  - `listTasksService(repoPath, opts: TaskListOpts, fs)` — same opts, no extra logic
  - Walk + status filter first (today’s behavior), then `filterTasksByPriority(items, opts.priorities ?? [])`, then if `opts.sort === "priority"` run `sortTasksByPriority`
  - Any other `opts.sort` string → throw `TasksError("VALIDATION_ERROR", "invalid --sort: ${opts.sort} (expected priority)")`
  - CLI `--priority` is repeatable OR via Commander `argParser` that accumulates `TaskPriority[]`
  - CLI `--sort` uses `.choices(["priority"])`

- [ ] **Step 1: Write the failing test**

```ts
async function seedPriorities() {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const docs: Array<{ status: "backlog" | "todo"; stem: string; priorityLine: string }> = [
    { status: "backlog", stem: "2026-09-16--none-one", priorityLine: "" },
    { status: "backlog", stem: "2026-09-16--high-one", priorityLine: "  edges-task-priority: high\n" },
    { status: "todo", stem: "2026-09-16--urgent-one", priorityLine: "  edges-task-priority: urgent\n" },
    { status: "todo", stem: "2026-09-16--high-two", priorityLine: "  edges-task-priority: high\n" },
    { status: "todo", stem: "2026-09-16--low-one", priorityLine: "  edges-task-priority: low\n" },
  ];
  for (const doc of docs) {
    const dir = path.join(repo, "knowledge/tasks", doc.status);
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${doc.stem}.md`),
      `---
name: ${doc.stem}
description: ${doc.stem}
metadata:
  edges-type: task
  edges-title: ${doc.stem}
  edges-tasks-status: ${doc.status}
${doc.priorityLine}---

body
`,
      "utf8",
    );
  }
  return repo;
}

test("listTasks default order is board walk not priority", async () => {
  const repo = await seedPriorities();
  try {
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.deepEqual(
      items.map((item) => item.stem),
      [
        "2026-09-16--none-one",
        "2026-09-16--high-one",
        "2026-09-16--urgent-one",
        "2026-09-16--high-two",
        "2026-09-16--low-one",
      ],
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks --sort priority is urgent to none and stable", async () => {
  const repo = await seedPriorities();
  try {
    const items = await listTasks(repo, { sort: "priority" }, nodeBoardFs());
    assert.deepEqual(
      items.map((item) => `${item.priority}:${item.stem}`),
      [
        "urgent:2026-09-16--urgent-one",
        "high:2026-09-16--high-one",
        "high:2026-09-16--high-two",
        "low:2026-09-16--low-one",
        "none:2026-09-16--none-one",
      ],
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks repeatable --priority is OR and ANDs with --status", async () => {
  const repo = await seedPriorities();
  try {
    const or = await listTasks(repo, { priorities: ["urgent", "high"] }, nodeBoardFs());
    assert.deepEqual(
      or.map((item) => item.stem),
      ["2026-09-16--high-one", "2026-09-16--urgent-one", "2026-09-16--high-two"],
    );
    const and = await listTasks(
      repo,
      { status: "todo", priorities: ["high"] },
      nodeBoardFs(),
    );
    assert.deepEqual(
      and.map((item) => item.stem),
      ["2026-09-16--high-two"],
    );
    const none = await listTasks(repo, { priorities: ["none"] }, nodeBoardFs());
    assert.deepEqual(
      none.map((item) => item.stem),
      ["2026-09-16--none-one"],
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

Default-order stems assume `readdir` returns the two backlog files in create order (`none-one` then `high-one`). If a filesystem returns them unsorted, pin the assertion to: first two stems are the backlog pair in `readdir` order, then the three todo stems in `readdir` order — and still **not** urgent-first. The `--sort priority` test is the one that requires urgent-first.

CLI:

```ts
test("run tasks list --priority urgent --priority high --sort priority", async () => {
  const repo = await seedPriorities();
  try {
    const result = await run(
      ["tasks", "list", "--priority", "urgent", "--priority", "high", "--sort", "priority"],
      { env: { ...process.env, EDGES_REPO: repo } },
    );
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { tasks: Array<{ stem: string; priority: string }> };
    assert.deepEqual(
      body.tasks.map((task) => task.priority),
      ["urgent", "high", "high"],
    );
    assert.equal(body.tasks[0]?.stem, "2026-09-16--urgent-one");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks list --sort status is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "list", "--sort", "status"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks list --priority P0 is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "list", "--priority", "P0"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});
```

Move `seedPriorities` into `test/tasks/utils/helpers.ts` if both board and run tests need it, or duplicate the seed in `run.test.ts`. Duplicating 15 lines is fine; do not invent a shared factory unless both files already import helpers.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/board.test.ts`

Expected: FAIL — `listTasks` does not accept `sort` / `priorities`

- [ ] **Step 3: Write minimal implementation**

```ts
import {
  filterTasksByPriority,
  sortTasksByPriority,
  type TaskPriority,
} from "./priority.js";

export type TaskListOpts = {
  status?: TaskStatus;
  priorities?: TaskPriority[];
  sort?: "priority";
};

export async function listTasks(
  repoPath: string,
  opts: TaskListOpts,
  fs: BoardFs,
): Promise<TaskListItem[]> {
  const statuses = opts.status ? [opts.status] : [...TASK_STATUSES];
  const items: TaskListItem[] = [];
  for (const status of statuses) {
    items.push(...(await listStatusDir(repoPath, status, fs)));
  }
  const filtered = filterTasksByPriority(items, opts.priorities ?? []);
  if (opts.sort === "priority") {
    return sortTasksByPriority(filtered);
  }
  if (opts.sort !== undefined) {
    throw new TasksError("VALIDATION_ERROR", `invalid --sort: ${String(opts.sort)} (expected priority)`);
  }
  return filtered;
}
```

`service.ts`:

```ts
export async function listTasksService(
  repoPath: string,
  opts: TaskListOpts,
  fs: BoardFs,
): Promise<TaskListItem[]> {
  return listTasks(repoPath, opts, fs);
}
```

`list.ts` — Commander accumulate (do not mutate the previous array in place):

```ts
.addOption(
  new Option("--priority <priority>", "edges-task-priority (repeatable, OR)")
    .choices([...TASK_PRIORITIES])
    .argParser((value: string, previous: TaskPriority[]) => [...(previous ?? []), value as TaskPriority]),
)
.addOption(new Option("--sort <field>", "sort list").choices(["priority"]))
```

Action:

```ts
.action(async (opts: { status?: TaskStatus; priority?: TaskPriority[]; sort?: "priority" }) => {
  await runTasksCommand(ctx, async (runtime) => {
    const listed = await listTasksService(
      runtime.repoPath,
      { status: opts.status, priorities: opts.priority, sort: opts.sort },
      runtime.fs,
    );
    return succeed({ status: "success", command: "list", tasks: listed });
  });
});
```

Commander names a repeatable `--priority` as `opts.priority` (singular). Map that array to `priorities`. If Commander yields `undefined` when the flag is absent, pass `undefined` / `[]` — `filterTasksByPriority` treats empty as no filter.

`LIST_AFTER_HELP`:

```
  --priority <priority>  Repeatable OR filter: urgent | high | medium | low | none
  --sort priority        urgent → high → medium → low → none (stable). Default stays board order

EXAMPLES
  edges tasks list --sort priority
  edges tasks list --priority urgent --priority high
  edges tasks list --status todo --priority high
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/board.test.ts test/tasks/run.test.ts test/tasks/parse.test.ts
pnpm --filter edges-cli test
```

Expected: PASS. If the default-order test flakes on `readdir` sorting, relax only that assertion as specified in Step 1; do not change production to sort by stem.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/board.ts \
  extensions/clis/src/tasks/utils/service.ts \
  extensions/clis/src/tasks/list.ts \
  extensions/clis/test/tasks/utils/board.test.ts \
  extensions/clis/test/tasks/parse.test.ts \
  extensions/clis/test/tasks/run.test.ts \
  extensions/clis/test/tasks/utils/helpers.ts
git commit -m "feat(tasks): filter and sort list by priority" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 7: status untouched, help, README, CHANGELOG

**Files:**
- Modify: `extensions/clis/src/tasks.ts` — `TASKS_AFTER_HELP`
- Modify: `extensions/clis/src/tasks/status.ts` — help text only if needed to say priority is not a status flag; **do not** add `--priority`
- Modify: `extensions/clis/test/tasks/cli.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts` — status + unknown `--priority`
- Modify: `extensions/clis/test/tasks/utils/move.test.ts` — preserve an existing priority field across a status move
- Modify: `extensions/clis/README.md`
- Modify: `knowledge/tasks/README.md`
- Modify: `CHANGELOG.md` `[Unreleased]` Added

**Interfaces:**
- Consumes: the command surface from Locked design
- Produces: docs and help that match the flags; `status` / `moveTaskStatus` still do not read or write `edges-task-priority` except by copying the whole markdown body

- [ ] **Step 1: Write the failing test**

`cli.test.ts` — keep the seven-verb test; add:

```ts
test("tasks help documents priority on list create update and not on status", async () => {
  const root = await run(["tasks", "--help"]);
  assert.match(root.stdout, /--priority/);
  assert.match(root.stdout, /--sort priority/);

  const list = await run(["tasks", "list", "--help"]);
  assert.match(list.stdout, /--priority/);
  assert.match(list.stdout, /--sort/);

  const create = await run(["tasks", "create", "--help"]);
  assert.match(create.stdout, /--priority/);

  const update = await run(["tasks", "update", "--help"]);
  assert.match(update.stdout, /--priority/);

  const status = await run(["tasks", "status", "--help"]);
  assert.doesNotMatch(status.stdout, /--priority/);
});
```

`run.test.ts`:

```ts
test("run tasks status rejects --priority and does not move", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/todo");
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
  edges-task-priority: high
---

body
`,
      "utf8",
    );
    const result = await run(["tasks", "status", "2026-09-16--stay", "--priority", "low"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
    const md = await readFile(path.join(dir, "2026-09-16--stay.md"), "utf8");
    assert.match(md, /edges-tasks-status: todo/);
    assert.match(md, /edges-task-priority: high/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

`move.test.ts`:

```ts
test("moveTaskStatus preserves edges-task-priority and still moves folders", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "knowledge/tasks/todo");
    await mkdir(fromDir, { recursive: true });
    await mkdir(path.join(repo, "knowledge/tasks/in_progress"), { recursive: true });
    await writeFile(
      path.join(fromDir, "2026-09-16--keep.md"),
      `---
name: keep
description: keep
metadata:
  edges-type: task
  edges-title: keep
  edges-tasks-status: todo
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
    const md = await readFile(path.join(repo, result.path), "utf8");
    assert.match(md, /edges-tasks-status: in_progress/);
    assert.match(md, /edges-task-priority: urgent/);
    await access(path.join(repo, "knowledge/tasks/in_progress/.2026-09-16--keep.log.md"));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/cli.test.ts test/tasks/run.test.ts test/tasks/utils/move.test.ts`

Expected: FAIL — help text does not mention `--priority` / `--sort priority`; the status `--priority` case may already fail as unknown option (exit 2). If that CLI case already PASSes via Commander unknown-option handling, keep it as a regression. The help test is the one that must fail until Step 3.

- [ ] **Step 3: Write minimal implementation**

`tasks.ts` `TASKS_AFTER_HELP` command list:

```
  list [--status <edges-tasks-status>] [--priority <edges-task-priority>]... [--sort priority]
  get <stem|path>
  create --title <title> [--description] [--body] [--status] [--name] [--assignee] [--priority]
  update <stem|path> [--title] [--description] [--body] [--assignee] [--priority]
  status <stem|path> <edges-tasks-status>
  runs <stem|path> [--output table|json]
  run-messages <run-id> [--task <stem>] [--output table|json]
```

Keep the Capability Surface sentence: `Capability Surface is CLI + Skill + MCP.`

`extensions/clis/README.md` `tasks` block — same command surface. Keep: `Skill and MCP come later on this same contract. Capability Surface is CLI + Skill + MCP.`

`knowledge/tasks/README.md` — after the Issue 层状态夹 section, add:

```markdown
## Issue 层优先级

需求先后用 frontmatter `metadata.edges-task-priority`：`urgent` | `high` | `medium` | `low` | `none`。与 `edges-tasks-status` 正交：改 priority 不搬状态夹，也不用文件夹或文件名编码优先级。缺省或旧文件无字段视为 `none`。CLI：`create` / `update --priority`，`list --priority`（可重复 OR）与 `list --sort priority`。详见 `docs/adr/0007-edges-task-priority.md`。
```

`CHANGELOG.md` `[Unreleased]` → `### Added` (implementation landing, not this plan-only PR):

```
- `edges tasks` Issue 层 `--priority` / `list --sort priority`（ADR-0007）。枚举 `urgent|high|medium|low|none`，写在 `metadata.edges-task-priority`；缺省为 `none`。`status` 不改 priority；改 priority 不搬状态夹。无 Skill/MCP 封装。
```

Do not implement Skill/MCP. Do not edit `knowledge/posts/`. Do not move `knowledge/tasks/in_progress/2026-09-13--tasks补充需求优先级.md`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter edges-cli test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks.ts \
  extensions/clis/src/tasks/status.ts \
  extensions/clis/README.md \
  knowledge/tasks/README.md \
  CHANGELOG.md \
  extensions/clis/test/tasks/cli.test.ts \
  extensions/clis/test/tasks/run.test.ts \
  extensions/clis/test/tasks/utils/move.test.ts
git commit -m "docs(tasks): document edges-task-priority CLI contract" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

## Self-review vs ADR 0007

Run after the plan is written. Fixed inline while drafting; this is the coverage map.

| ADR 0007 decision | Task |
| --- | --- |
| Enum `urgent \| high \| medium \| low \| none`; no P0–P3 | Task 1 parse tests reject `P0` / `Urgent`; CLI choices in Tasks 4–6 |
| Disk `metadata.edges-task-priority`; missing = `none` | Task 1 `priorityFromMetadata`; Task 2 omit on create none; Task 3 list/get |
| Illegal value = validation failure, no write | Tasks 4–6 create/update/list; parse before `writeFile` |
| Orthogonal to status; no folder/filename encoding; changing priority does not move status dirs | Tasks 4–5 path assertions; Task 5 rejects move; Task 7 status `--priority` + `moveTaskStatus` preserve-field |
| `create --priority`, `update --priority` | Tasks 4–5 |
| `status` does not accept priority | Task 7 |
| `list` default board order unchanged | Task 6 default-order test |
| `list --sort priority` = urgent→high→medium→low→none | Tasks 1 + 6 |
| Repeatable `--priority` OR; combinable with `--status` | Task 6 |
| `list` / `get` / `create` / `update` JSON always includes `priority` | Tasks 3–6 |
| Skill / MCP later, same contract; Capability Surface still CLI + Skill + MCP | File map + Task 7 README wording |
| No epic/需求二层 priority, no GitHub, no Multica daemon | File map “Do not create” |
| CLI implementation is a later round from the ADR-only PR | This plan is that later round’s instructions; the plan-only PR that adds this file still does not implement the CLI |

Placeholder scan: no TBD / “add validation later” / “write tests for the above” without code.

Type consistency: `TaskPriority`, `TASK_PRIORITIES`, `TASK_PRIORITY_FIELD`, `priorityFromMetadata`, `parseTaskPriority`, `filterTasksByPriority`, `sortTasksByPriority`, `TaskListOpts.priorities` / `sort`, JSON key `priority`, disk key `edges-task-priority`.
