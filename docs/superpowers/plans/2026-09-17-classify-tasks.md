# classifyTasks + Task Project metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Task Project index/description metadata (`edges tasks project list|get|create|update`) and the independent classifyTasks Skill so an agent can run Embedding-based Nearest Centroid Classification (NCC) of the whole board onto **user-set** Task Project centroids, wait for a human-edited suggestion table, and apply moves only through existing `update --project` — without an embedding library in-repo, without an `edges tasks classify` verb, and without relocating the live board again.

**Architecture:** Keep the current Commander → `run()` → `src/tasks/*.ts` + `src/tasks/utils/` layout. Reuse `parseTaskProject` / `listProjectIds` / `updateTask(..., { project })` from ADR 0009. Add a focused `project-meta.ts` helper that owns lightweight per-project `AGENTS.md` and the root Task Projects index section **outside** project-memory managed markers. Register a nested `project` command group under `edges tasks` (one file per command node). classifyTasks is a SKILL.md-only workflow (no `scripts/`, no embedding or classification library): it calls the CLI, embeds via the host/runtime, proposes a table, waits, then applies via CLI. Capability Surface remains CLI + Skill + MCP as three peers (ADR 0004); this round implements the project CLI contract plus the project-tasks-classify Skill. Generic tasks Skill/MCP CRUD stays the separate backlog.

**Tech Stack:** TypeScript, Node.js ≥20, existing `commander` + `zod`, `node:test` + `tsx` (not vitest), `node:fs/promises`. No embeddings library. No new YAML library. No `simple-git`. No Multica daemon. No parent / sub-issue / stage.

**Spec:** `docs/adr/0010-classify-tasks-and-task-project-metadata.md` (accepted; extends ADR 0009). Also: `docs/adr/0009-edges-task-project-grouping.md`, `docs/adr/0005-edges-tasks-cli.md`, `docs/adr/0007-edges-task-priority.md`, `docs/adr/0004-capability-surface-cli-skill-mcp.md`. Glossary: `CONTEXT.md` terms **classifyTasks（edges）**, **Task Project 索引**, **Task Project AGENTS.md**, **Task Project（edges）**, **edges tasks（CLI）**, **edges-task-project**, **edges-tasks-status**, **edges-task-priority**. Prior implementation plan to mirror: `docs/superpowers/plans/2026-09-16-edges-task-project.md`. Verb alignment only: https://multica.ai/docs/cli ; `.memory/references/reference_multica_cli_tasks_reference.md`.

## Global Constraints

- Co-authored-by on every commit: `Coding Agent 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Capability Surface wording, if mentioned: always **CLI + Skill + MCP** (three peers). Never “必要时 MCP”, never “CLI + Skill” as the Edges shorthand, never npm `package.json` `"bin"` as a layer
- This round implements **CLI project subcommands + project-tasks-classify Skill**. Do not implement generic edges-tasks Skill/MCP CRUD (that backlog stays separate). Do not add a classify MCP
- Skill path is exactly `extensions/skills/project-tasks-classify/` (frontmatter `name: project-tasks-classify`). Display name in headings is classifyTasks
- Classification is **Embedding-based NCC** onto **already-set** Task Project centroids (slug + description). Whole-board classify, not only `_default`. Batch human-editable suggestion table, then CLI apply. Do not discover or iterate centroids
- Embeddings are a host/runtime capability described in the Skill, not an in-repo library or vector store. No `scripts/` under project-tasks-classify. No public `edges tasks classify` (or `classify-tasks`) verb
- CLI: `edges tasks project list|get|create|update`. `create` writes the project directory + lightweight `AGENTS.md` + refreshes the root `knowledge/tasks/AGENTS.md` Task Projects section **outside** `<!-- project-memory:start -->` … `<!-- project-memory:end -->`
- Every Task Project including `_default` has a lightweight `AGENTS.md` (title + description, optional `## Pointers`). Do **not** run `project-memory-init` on each project
- Task moves stay on existing `edges tasks update --project`. That path must **not** change `edges-tasks-status` or `edges-task-priority`
- Q18=A: index/description is like Project Memory; board markdown remains SoT. Do not treat Task as a Memory Type (Q18=B / `tasks-memory与看板语义合并`)
- Absorbs the first knife of `交互式主题聚类` and the in-progress `整理 _default project tasks 的 skill` (whole board, not `_default`-only). Iterative centroid discovery and “classify sunk into CLI” remain exploration cards — do not implement them
- Bootstrap metadata only. Do **not** relocate Task files or sidecars (ADR 0009 already moved the live board into `_default/<status>/`)
- Do not put `ingest` / `fs` / `writer` / `now` / `repoPath` on `CliContext` or `run()`’s second argument
- Do not add `js-yaml` / `gray-matter` / `simple-git` / vitest. Stay on `commander` + `zod` + `node:test` + `tsx`
- Test runner is `extensions/clis/package.json` `"test": "node --test --import tsx './test/**/*.test.ts'"`. New tests go under `extensions/clis/test/tasks/`
- Reuse `EDGES_REPO` from `loadConfig()` as the repo root. Board lives at `<repoPath>/knowledge/tasks/`
- Relative TypeScript imports use `.js` (nodenext)
- Invalid project slug / title / description = `VALIDATION_ERROR`, exit 2, no writes (except `ensure` which may write missing metadata files before a verb fails)
- Public repo: no credentials, tokens, or personal data in commits
- `pull` / `rebase` use `--autostash`. Do not commit `.obsidian/workspace.json`
- Do not auto-create/edit/move/delete `knowledge/posts/`
- This plan-only PR that first lands this document must **not** implement CLI or Skill behavior, must **not** write `extensions/skills/project-tasks-classify/**`, and must **not** seed live `knowledge/tasks/**/AGENTS.md`

---

## File map

Verified on `origin/main` after ADR 0010 (`1a5875a`). Command tree is `extensions/clis/src/tasks.ts` (group) + `extensions/clis/src/tasks/<verb>.ts` (leaf). `extensions/clis/README.md` says **file = one command node**, **folder = children**. Slug helpers already live at `extensions/clis/src/tasks/utils/project.ts` (`parseTaskProject`, `listProjectIds` is on `board.ts`). Do not rename those.

**Create**

- `extensions/clis/src/tasks/utils/project-meta.ts` — title/description validators; parse/render lightweight project `AGENTS.md`; rewrite root Task Projects section; `ensureProjectMetadata`; `listProjects` / `getProject` / `createProject` / `updateProject`
- `extensions/clis/src/tasks/project.ts` — `project` command group (register children; missing-subcommand action)
- `extensions/clis/src/tasks/project/list.ts` — `edges tasks project list`
- `extensions/clis/src/tasks/project/get.ts` — `edges tasks project get <project>`
- `extensions/clis/src/tasks/project/create.ts` — `edges tasks project create <project> --title --description`
- `extensions/clis/src/tasks/project/update.ts` — `edges tasks project update <project> [--title] [--description]`
- `extensions/clis/test/tasks/utils/project-meta.test.ts` — pure string + tmpdir helper tests
- `extensions/clis/test/tasks/project.test.ts` — domain CRUD via `createProject` / `listProjects` / `getProject` / `updateProject`
- `extensions/skills/project-tasks-classify/SKILL.md` — classifyTasks workflow (Task 6)
- `extensions/skills/project-tasks-classify/CHANGELOG.md` — skill-local 1.0.0 (Task 6)

**Modify**

- `extensions/clis/src/tasks/utils/types.ts` — `PROJECT_NOT_FOUND` on `TasksErrorCode`; `TaskProjectRecord` type
- `extensions/clis/src/tasks/utils/format.ts` — `TasksSuccess` gains `projects?` plus the flattened project-record fields
- `extensions/clis/src/tasks.ts` — `addProjectCommand`; `TASKS_AFTER_HELP` lists `project list|get|create|update`; still no `classify`
- `extensions/clis/src/tasks/utils/write.ts` — no behavior change required; Task 5 adds a CLI regression that `update --project` keeps status and priority (unit test already matches `edges-tasks-status` / `edges-task-priority` in `test/tasks/utils/write.test.ts`)
- `extensions/clis/README.md` — document `project` verbs; Capability Surface stays CLI + Skill + MCP
- `knowledge/tasks/README.md` — one short paragraph: each project including `_default` has lightweight `AGENTS.md`; root Task Projects section is CLI-maintained
- `extensions/clis/test/tasks/cli.test.ts` — help lists `project`; omits `classify`
- `extensions/clis/test/tasks/parse.test.ts` — `run(["tasks", "project", …])` happy/error paths
- `extensions/clis/test/tasks/run.test.ts` — tmpdir `EDGES_REPO` integration
- `CHANGELOG.md` `[Unreleased]` — Added lines when implementation lands (plan-only PR adds only the plan line)
- `.memory/projects/project_classify_tasks_and_project_metadata.md` — via `$project-memory-remember` (implementation updates How-to to “project CLI + project-tasks-classify Skill landed”; Capability Surface remains CLI + Skill + MCP)
- Live board metadata only, in Task 7: `knowledge/tasks/_default/AGENTS.md` (create) and the Task Projects section of `knowledge/tasks/AGENTS.md`

**Do not create/commit**

- `extensions/skills/edges-tasks/**` or any generic tasks Skill/MCP CRUD wrapper
- MCP server / tool for classify or for `tasks project`
- `edges tasks classify` / `edges tasks project classify`
- In-repo embedding library, iterative centroid discovery code, or project-tasks-classify `scripts/`
- Full `project-memory-init` trees under `knowledge/tasks/<project>/`
- Task-as-Memory-Type / Q18=B
- Parent / sub-issue / stage
- A second live-board relocate of Task `*.md` / sidecar `.{stem}.log.md`
- Edits under `knowledge/posts/`
- Edits to `docs/adr/0010-classify-tasks-and-task-project-metadata.md` or `CONTEXT.md` (already merged)
- This plan file’s own “implement CLI / write Skill / seed live AGENTS.md” work in the plan-only PR that first lands this document

---

## Locked design (read before Task 1)

Cite these as already decided. Do not reopen them in implementation tasks.

### Command surface (ADR 0010 on top of ADR 0005 / 0007 / 0009)

Existing verbs are unchanged. New group:

```
edges tasks list [--status <edges-tasks-status>] [--priority <edges-task-priority>]... [--project <edges-task-project>]... [--sort priority]
edges tasks get <stem|path>
edges tasks create --title <title> [--description <text>] [--body <markdown>] [--status <status>] [--name <name>] [--assignee <text>] [--priority <priority>] [--project <project>]
edges tasks update <stem|path> [--title <title>] [--description <text>] [--body <markdown>] [--assignee <text>] [--priority <priority>] [--project <project>]
edges tasks status <stem|path> <status>
edges tasks runs <stem|path> [--output table|json]
edges tasks run-messages <run-id> [--task <stem>] [--output table|json]
edges tasks project list
edges tasks project get <project>
edges tasks project create <project> --title <title> --description <text>
edges tasks project update <project> [--title <title>] [--description <text>]
```

- `<project>` on the new verbs is `parseTaskProject`: `default` or a user kebab slug. `_default`, every `TASK_STATUSES` value, `Default`, `foo_bar`, `foo/bar`, empty, CJK-only, leading/trailing hyphen → `VALIDATION_ERROR`, exit 2
- Users never pass `_default` as a CLI id. Directory on disk is still `_default`. JSON `project` is `"default"`; JSON `dir` is `"_default"`
- Commander has **no** `.choices()` for `<project>` (open set). Gate with `parseTaskProject`
- `edges tasks classify` (any args) is an unknown command → `VALIDATION_ERROR`, exit 2, no writes
- `edges tasks project` with no subcommand → `VALIDATION_ERROR`, reason `missing project subcommand. Use edges tasks project --help.`
- `edges tasks project create` requires both `--title` and `--description`
- `edges tasks project update` requires at least one of `--title`, `--description`
- Issue-layer `create --project foo` still only writes the Task under `knowledge/tasks/foo/<status>/`. It does **not** write `foo/AGENTS.md`. The next `project list|get|create|update` `ensure` seeds that orphan
- Issue-layer `list` / `get` / `create` / `update` / `status` do **not** call `ensureProjectMetadata` (do not surprise-write AGENTS.md on every Task list)
- Task reassignment remains `edges tasks update --project`. classifyTasks apply uses that verb only. `status` still has no `--project`

### JSON envelope

Project-layer success payloads:

```json
{"status":"success","command":"project.list","projects":[{"project":"default","dir":"_default","title":"Default","description":"Ungrouped tasks that have not been assigned a named Task Project.","path":"knowledge/tasks/_default/AGENTS.md"}]}
{"status":"success","command":"project.get","project":"cli","dir":"cli","title":"CLI","description":"edges CLI work","path":"knowledge/tasks/cli/AGENTS.md"}
{"status":"success","command":"project.create","project":"cli","dir":"cli","title":"CLI","description":"edges CLI work","path":"knowledge/tasks/cli/AGENTS.md"}
{"status":"success","command":"project.update","project":"cli","dir":"cli","title":"CLI","description":"updated","path":"knowledge/tasks/cli/AGENTS.md"}
```

`command` values are exactly `project.list` | `project.get` | `project.create` | `project.update`.

`TaskProjectRecord`:

```ts
export type TaskProjectRecord = {
  project: TaskProjectId;
  dir: string;
  title: string;
  description: string;
  path: string;
};
```

Failure envelope is unchanged:

```json
{"status":"failed","errorCode":"VALIDATION_ERROR","reason":"..."}
{"status":"failed","errorCode":"PROJECT_NOT_FOUND","reason":"project not found: cli"}
```

Exit: `0` success, `2` `VALIDATION_ERROR`, `1` everything else including `PROJECT_NOT_FOUND`.

Add `"PROJECT_NOT_FOUND"` to `TasksErrorCode`. `exitCodeForTasksError` already maps non-`VALIDATION_ERROR` to `1`. Do not reuse `TASK_NOT_FOUND` for a missing project.

Issue-layer envelopes are unchanged. `update --project` JSON still includes `priority` and `project` and does **not** include a new status field; on-disk `edges-tasks-status` and `edges-task-priority` stay the pre-move values.

### Lightweight Task Project AGENTS.md

Path: `knowledge/tasks/<dir>/AGENTS.md` where `<dir>` is `_default` or the user slug.

Exact shape (UTF-8 markdown, no YAML frontmatter, no project-memory markers):

```markdown
# Default

Ungrouped tasks that have not been assigned a named Task Project.
```

Optional trailing section, preserved on `update` if the caller does not send pointers:

```markdown
# CLI

edges CLI work

## Pointers

- [edges-cli README](../../../extensions/clis/README.md)
```

Parse / render rules:

| Rule | Value |
| --- | --- |
| First line | exactly `# <title>` (one ATX H1, space after `#`) |
| Title | trimmed, length 1–120, no CR/LF |
| Description | text after the H1 until `## Pointers` or EOF, trim surrounding blank lines, length 1–2000 |
| Pointers | if a line equals `## Pointers`, the remainder of the file including that heading is `pointers: string` |
| Frontmatter | file starting with `---` → `VALIDATION_ERROR`, `Task Project AGENTS.md must not have YAML frontmatter` |
| project-memory markers | file containing `<!-- project-memory:` → `VALIDATION_ERROR`, `Task Project AGENTS.md must not contain project-memory markers` |
| Missing H1 / empty title / empty description | `VALIDATION_ERROR` with the title or description message below |

Exact validator messages:

- `invalid Task Project title (expected 1–120 characters, no newlines)`
- `invalid Task Project description (expected 1–2000 characters)`

`renderProjectAgents({ title, description, pointers })` writes:

```ts
let out = `# ${title}\n\n${description}\n`;
if (pointers !== undefined && pointers.length > 0) {
  const block = pointers.startsWith("## Pointers") ? pointers.trimEnd() : `## Pointers\n\n${pointers.trim()}`;
  out += `\n${block}\n`;
}
return out;
```

`create` this round has no `--pointers` flag. `update` rewrites title/description and passes through existing `pointers`.

Seed constants:

```ts
export const DEFAULT_PROJECT_TITLE = "Default";
export const DEFAULT_PROJECT_DESCRIPTION =
  "Ungrouped tasks that have not been assigned a named Task Project.";

export function seedTitleFor(id: TaskProjectId): string {
  return id === DEFAULT_TASK_PROJECT ? DEFAULT_PROJECT_TITLE : id;
}

export function seedDescriptionFor(id: TaskProjectId): string {
  return id === DEFAULT_TASK_PROJECT
    ? DEFAULT_PROJECT_DESCRIPTION
    : `Task Project ${id}.`;
}
```

### Root Task Projects section (Q18=A)

Markers (ASCII, exact):

```
<!-- task-projects:start -->
<!-- task-projects:end -->
```

Canonical block (note the blank line after the intro sentence):

```markdown
<!-- task-projects:start -->
## Task Projects

CLI-maintained index of Task Project titles and descriptions. Do not hand-edit this section.

- [`_default`](_default/AGENTS.md) — Ungrouped tasks that have not been assigned a named Task Project.
- [`cli`](cli/AGENTS.md) — edges CLI work
<!-- task-projects:end -->
```

Index line format: `- [\`<dir>\`](<dir>/AGENTS.md) — <one-line description>`

- `<dir>` is `_default` or the user slug (never `default`)
- one-line description = project description with `/[\r\n]+/g` → `" "` and `/[ \t]+/g` collapsed to one space, then trim
- Order: `_default` first, then other dirs by `localeCompare` (ASCII)
- Intro sentence is exactly `CLI-maintained index of Task Project titles and descriptions. Do not hand-edit this section.`

`rewriteRootAgents(existing: string, projects: TaskProjectRecord[]): string`:

1. If `existing` contains `<!-- task-projects:start -->` but not `<!-- task-projects:end -->` (or end before start) → `VALIDATION_ERROR`, `malformed Task Projects markers in knowledge/tasks/AGENTS.md`
2. If both markers exist: replace the span from start marker through end marker (inclusive) with the canonical block. Leave every other byte unchanged — including the entire project-memory region
3. If markers are absent and `<!-- project-memory:end -->` exists: insert `\n` + canonical block + `\n` immediately after the first `<!-- project-memory:end -->` line
4. If neither task-projects markers nor `<!-- project-memory:end -->` exist (tmpdir): the file becomes the canonical block plus a trailing newline
5. After building the result, if the substring between the first `<!-- project-memory:start -->` and its matching `<!-- project-memory:end -->` (when both exist) differs from the same span in `existing` → `VALIDATION_ERROR`, `refusing to write Task Projects section inside project-memory markers`

Never write `<!-- task-projects:* -->` inside the project-memory span. Never hand-edit the Task Projects section; CLI owns it.

### Bootstrap / metadata migrate (no Task relocate)

`ensureProjectMetadata(repoPath, writer): Promise<TaskProjectRecord[]>` runs at the start of **every** `project list|get|create|update`. It does **not** run for Issue-layer verbs.

Steps:

1. `mkdirp(knowledge/tasks/_default)` — do not create status folders
2. `listProjectIds(repoPath, writer)` (existing helper). If the array does not include `"default"`, still treat `_default` as present after step 1
3. For each id in `{ default } ∪ listProjectIds`: if `knowledge/tasks/<dir>/AGENTS.md` is missing, write `renderProjectAgents({ title: seedTitleFor(id), description: seedDescriptionFor(id) })`
4. If a present `AGENTS.md` fails parse → `VALIDATION_ERROR` (do not skip; metadata is CLI-owned)
5. Read `knowledge/tasks/AGENTS.md` if it exists, else `""`
6. `writeFile` the result of `rewriteRootAgents(existing, records)`
7. Return the records in index order

What this does **not** do:

- rename, move, or rewrite any `*.md` Task file
- touch any `.{stem}.log.md` sidecar
- create `backlog|todo|…` folders
- add project-memory markers to `_default/AGENTS.md` or any project AGENTS.md
- invent a second `migrateLegacyBoard`

Live board as of this plan (post-ADR 0009): Tasks already live under `knowledge/tasks/_default/<status>/`. There is no `_default/AGENTS.md`. Root `knowledge/tasks/AGENTS.md` is only the project-memory managed file. Task 7 runs `ensure` once against this repo and commits those two metadata files only.

`createProject` after `ensure`:

- `parseTaskProject(input.project)`, `parseProjectTitle`, `parseProjectDescription`
- if dest `AGENTS.md` already exists → `VALIDATION_ERROR`, `project already exists: ${id}`
- `mkdirp(knowledge/tasks/<dir>)`, write AGENTS.md, rewrite root index, return the record
- `create default` is allowed only when `_default/AGENTS.md` was missing **before** this create. Because `ensure` seeds `_default` first, `project create default` after a fresh ensure is `project already exists: default`. To create the default project explicitly in tests, call `createProject` on a board that has no `_default/AGENTS.md` **without** going through `ensure`, or delete the seeded file in the test and call `createProject({ project: "default", ... })` which must succeed when the file is absent. Lock: `createProject` itself does **not** seed the target it is creating; it calls `ensure` for **other** missing projects, then writes the requested one. Implementation: `ensure` seeds every discovered id **except** the `skipId` argument. `createProject` calls `ensure(repo, writer, parseTaskProject(input.project))` so it can create `default` on a virgin board

```ts
export async function ensureProjectMetadata(
  repoPath: string,
  writer: BoardWriter,
  skipId?: TaskProjectId,
): Promise<TaskProjectRecord[]>;
```

When `skipId` is set, do not write that project’s AGENTS.md even if missing (create will write it). Still include other projects and still rewrite the root index **after** create writes the new file (create calls ensure, writes, then `refreshProjectIndex`).

```ts
export async function refreshProjectIndex(repoPath: string, writer: BoardWriter): Promise<TaskProjectRecord[]>;
```

`refreshProjectIndex` re-reads every `AGENTS.md` for `listProjectIds ∪ { default }` and rewrites the root section. It does not seed missing files (caller already wrote them).

`getProject` / `updateProject`: `ensure` then lookup. Missing → `PROJECT_NOT_FOUND`, `project not found: ${id}`.

`listProjects`: `ensure` then return records.

### classifyTasks workflow (Skill, not CLI)

No code algorithm. The agent:

1. `edges tasks project list` — **already-set** centroids (slug + title + description)
2. `edges tasks list` — whole board (every project × status)
3. Embed centroids and tasks via the host/runtime; assign each Task to the **nearest existing centroid** (NCC), or `default` when far from named centroids. Do **not** invent a new slug
4. Print the suggestion table
5. **Stop and wait** for the human to edit the table
6. Apply with CLI only. `project create` only if the human **explicitly** added a new centroid first, then `update --project`

Locked table (markdown, one Task per row):

```markdown
| stem | current | suggested | action | note |
| --- | --- | --- | --- | --- |
| 2026-09-13--demo | default | cli | move | matches CLI centroid |
| 2026-09-15--x | default | default | keep | stay ungrouped |
| 2026-09-16--y | default | docs | create-then-move | human confirmed new project |
```

- `current` / `suggested` use CLI ids (`default` or kebab slug), never `_default`
- `action` is exactly `keep` | `move` | `create-then-move`
- After the human returns the table:
  - For each distinct `suggested` that is **not** in `project list` and is not `default`: the skill **asks the human for title + description**, then runs `edges tasks project create <slug> --title "..." --description "..."`. It does **not** batch-create from invented copy
  - Then, for each row where `suggested !== current`: `edges tasks update <stem> --project <suggested>`
  - `keep` / `suggested === current` → no write
- Forbidden apply paths: `mkdir`, `mv`, editing Task files, editing `AGENTS.md` by hand, `edges tasks status`, `update --priority`, `edges tasks classify`
- Whole board: rows include Tasks already in named projects, not only `_default`
- Embeddings come from the host/runtime (same model for tasks and centroids). Distance is cosine similarity or Euclidean in that space. Do not add an in-repo embedding library. Do not recompute centroids from assigned members

Capability Surface paragraph in the Skill (required wording): hosts with a shell use the CLI; this Skill is the workflow entry; MCP remains a peer (ADR 0004) but **generic tasks Skill/MCP CRUD is a separate backlog** and this Skill must not invent a classify MCP. Always name CLI + Skill + MCP.

### Absorbed backlogs (do not implement the leftover cards)

- First knife of `knowledge/tasks/_default/backlog/2026-09-15--交互式主题聚类参考K-means.md` (human-set themes + human confirm). Iterative centroid discovery stays on that card
- In-progress `knowledge/tasks/_default/in_progress/2026-09-16--整理default-project的tasks-skill.md` is the same knife, widened to the whole board
- Leave `knowledge/tasks/_default/backlog/2026-09-17--classify沉到edges-tasks-CLI.md` and `knowledge/tasks/_default/backlog/2026-09-16--edges-tasks的Skill与MCP封装.md` untouched as exploration / later CRUD

### Test commands

Single file (cwd = `extensions/clis`):

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/project-meta.test.ts
```

Package suite after each implementation step:

```bash
pnpm --filter edges-cli test
```

---

### Task 1: Parse and render Task Project AGENTS.md

**Files:**
- Modify: `extensions/clis/src/tasks/utils/types.ts` — add `PROJECT_NOT_FOUND` to `TasksErrorCode`; add `TaskProjectRecord`
- Create: `extensions/clis/src/tasks/utils/project-meta.ts` — validators + parse/render only (no fs yet)
- Create: `extensions/clis/test/tasks/utils/project-meta.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_TASK_PROJECT`, `DEFAULT_TASK_PROJECT_DIR`, `TaskProjectId`, `TasksError` from `./types.js`; `projectDirName` from `./project.js`
- Produces:
  - `PROJECT_NOT_FOUND` on `TasksErrorCode`
  - `TaskProjectRecord` as in Locked design (lives in `types.ts`, re-exported from `project-meta.ts`)
  - `DEFAULT_PROJECT_TITLE`, `DEFAULT_PROJECT_DESCRIPTION`, `seedTitleFor`, `seedDescriptionFor`
  - `parseProjectTitle(raw: string): string`
  - `parseProjectDescription(raw: string): string`
  - `parseProjectAgents(markdown: string): { title: string; description: string; pointers?: string }`
  - `renderProjectAgents(input: { title: string; description: string; pointers?: string }): string`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PROJECT_DESCRIPTION,
  DEFAULT_PROJECT_TITLE,
  parseProjectAgents,
  parseProjectDescription,
  parseProjectTitle,
  renderProjectAgents,
  seedDescriptionFor,
  seedTitleFor,
} from "../../../src/tasks/utils/project-meta.js";

test("seed copy for default and user slugs", () => {
  assert.equal(DEFAULT_PROJECT_TITLE, "Default");
  assert.equal(
    DEFAULT_PROJECT_DESCRIPTION,
    "Ungrouped tasks that have not been assigned a named Task Project.",
  );
  assert.equal(seedTitleFor("default"), "Default");
  assert.equal(seedTitleFor("cli"), "cli");
  assert.equal(seedDescriptionFor("default"), DEFAULT_PROJECT_DESCRIPTION);
  assert.equal(seedDescriptionFor("cli"), "Task Project cli.");
});

test("parseProjectTitle and parseProjectDescription accept trimmed bounds", () => {
  assert.equal(parseProjectTitle("  CLI  "), "CLI");
  assert.equal(parseProjectDescription("  edges CLI work  "), "edges CLI work");
  for (const raw of ["", "   ", "x".repeat(121), "has\nnewline"]) {
    try {
      parseProjectTitle(raw);
      assert.fail(`expected title throw for ${JSON.stringify(raw)}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /invalid Task Project title/);
    }
  }
  for (const raw of ["", "   ", "x".repeat(2001)]) {
    try {
      parseProjectDescription(raw);
      assert.fail(`expected description throw for ${JSON.stringify(raw)}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /invalid Task Project description/);
    }
  }
});

test("render and parse round-trip title, description, and optional pointers", () => {
  const rendered = renderProjectAgents({
    title: "Default",
    description: DEFAULT_PROJECT_DESCRIPTION,
  });
  assert.equal(
    rendered,
    `# Default\n\nUngrouped tasks that have not been assigned a named Task Project.\n`,
  );
  assert.deepEqual(parseProjectAgents(rendered), {
    title: "Default",
    description: DEFAULT_PROJECT_DESCRIPTION,
  });

  const withPointers = renderProjectAgents({
    title: "CLI",
    description: "edges CLI work",
    pointers: "## Pointers\n\n- [readme](../../../extensions/clis/README.md)",
  });
  const parsed = parseProjectAgents(withPointers);
  assert.equal(parsed.title, "CLI");
  assert.equal(parsed.description, "edges CLI work");
  assert.match(parsed.pointers ?? "", /README.md/);
});

test("parseProjectAgents rejects frontmatter and project-memory markers", () => {
  try {
    parseProjectAgents("---\nname: x\n---\n# T\n\nD\n");
    assert.fail("expected frontmatter throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /must not have YAML frontmatter/);
  }
  try {
    parseProjectAgents("# T\n\nD\n\n<!-- project-memory:start -->\n");
    assert.fail("expected project-memory throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /must not contain project-memory markers/);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/project-meta.test.ts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `project-meta.js`

- [ ] **Step 3: Write minimal implementation**

`types.ts` — add `"PROJECT_NOT_FOUND"` to the `TasksErrorCode` union (keep existing members). After `TaskProjectId`:

```ts
export type TaskProjectRecord = {
  project: TaskProjectId;
  dir: string;
  title: string;
  description: string;
  path: string;
};
```

`project-meta.ts` — implement the signatures in Interfaces. `parseProjectTitle` / `parseProjectDescription` trim first, then check length and (for title) `/[\r\n]/`. `parseProjectAgents`: reject `markdown.startsWith("---")`; reject `markdown.includes("<!-- project-memory:")`; first line must match `/^# (.+)$/`; split the rest on a line that equals `## Pointers`. Do not import `board.ts` / `write.ts` / `format.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/project-meta.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/types.ts \
  extensions/clis/src/tasks/utils/project-meta.ts \
  extensions/clis/test/tasks/utils/project-meta.test.ts
git commit -m "feat(tasks): parse Task Project AGENTS.md metadata" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 2: Rewrite root Task Projects index outside project-memory markers

**Files:**
- Modify: `extensions/clis/src/tasks/utils/project-meta.ts` — add marker constants + `rewriteRootAgents` + `oneLineDescription`
- Modify: `extensions/clis/test/tasks/utils/project-meta.test.ts`

**Interfaces:**
- Consumes: `TaskProjectRecord`, `parseProjectDescription` from Task 1; `projectDirName` from `./project.js`
- Produces:
  - `TASK_PROJECTS_START = "<!-- task-projects:start -->"`
  - `TASK_PROJECTS_END = "<!-- task-projects:end -->"`
  - `PROJECT_MEMORY_START = "<!-- project-memory:start -->"`
  - `PROJECT_MEMORY_END = "<!-- project-memory:end -->"`
  - `oneLineDescription(description: string): string` — `\r?\n` → space, collapse `[ \t]+`, trim
  - `renderTaskProjectsSection(projects: TaskProjectRecord[]): string` — the canonical block including both markers, no extra wrapping newline
  - `rewriteRootAgents(existing: string, projects: TaskProjectRecord[]): string` — rules in Locked design

- [ ] **Step 1: Write the failing test**

Append to `project-meta.test.ts`:

```ts
import {
  PROJECT_MEMORY_END,
  PROJECT_MEMORY_START,
  TASK_PROJECTS_END,
  TASK_PROJECTS_START,
  oneLineDescription,
  rewriteRootAgents,
} from "../../../src/tasks/utils/project-meta.js";

const defaultRecord = {
  project: "default" as const,
  dir: "_default",
  title: "Default",
  description: "Ungrouped tasks that have not been assigned a named Task Project.",
  path: "knowledge/tasks/_default/AGENTS.md",
};
const cliRecord = {
  project: "cli",
  dir: "cli",
  title: "CLI",
  description: "edges CLI\nwork",
  path: "knowledge/tasks/cli/AGENTS.md",
};

test("oneLineDescription collapses newlines", () => {
  assert.equal(oneLineDescription("edges CLI\nwork"), "edges CLI work");
});

test("rewriteRootAgents inserts after project-memory end and does not touch the managed block", () => {
  const existing = `# tasks\n\n${PROJECT_MEMORY_START}\n\n## 本层硬约束\n\n- keep me\n${PROJECT_MEMORY_END}\n`;
  const next = rewriteRootAgents(existing, [cliRecord, defaultRecord]);
  const managed = existing.slice(
    existing.indexOf(PROJECT_MEMORY_START),
    existing.indexOf(PROJECT_MEMORY_END) + PROJECT_MEMORY_END.length,
  );
  const nextManaged = next.slice(
    next.indexOf(PROJECT_MEMORY_START),
    next.indexOf(PROJECT_MEMORY_END) + PROJECT_MEMORY_END.length,
  );
  assert.equal(nextManaged, managed);
  assert.match(next, /<!-- task-projects:start -->/);
  assert.ok(next.indexOf(PROJECT_MEMORY_END) < next.indexOf(TASK_PROJECTS_START));
  assert.match(next, /- \[`_default`\]\(_default\/AGENTS.md\) — Ungrouped tasks that have not been assigned a named Task Project\./);
  assert.match(next, /- \[`cli`\]\(cli\/AGENTS.md\) — edges CLI work/);
  const defaultLine = next.indexOf("[`_default`]");
  const cliLine = next.indexOf("[`cli`]");
  assert.ok(defaultLine < cliLine);
});

test("rewriteRootAgents replaces an existing Task Projects span only", () => {
  const existing = `${PROJECT_MEMORY_START}\nkeep\n${PROJECT_MEMORY_END}\n\n${TASK_PROJECTS_START}\n## Task Projects\n\nold\n${TASK_PROJECTS_END}\n\n# trailing\n`;
  const next = rewriteRootAgents(existing, [defaultRecord]);
  assert.match(next, /# trailing/);
  assert.doesNotMatch(next, /^old$/m);
  assert.equal(
    next.slice(next.indexOf(PROJECT_MEMORY_START), next.indexOf(PROJECT_MEMORY_END) + PROJECT_MEMORY_END.length),
    `${PROJECT_MEMORY_START}\nkeep\n${PROJECT_MEMORY_END}`,
  );
});

test("rewriteRootAgents on empty file writes only the Task Projects block", () => {
  const next = rewriteRootAgents("", [defaultRecord]);
  assert.ok(next.startsWith(TASK_PROJECTS_START));
  assert.doesNotMatch(next, /project-memory/);
});

test("rewriteRootAgents rejects a start marker without an end marker", () => {
  try {
    rewriteRootAgents(`${TASK_PROJECTS_START}\n## Task Projects\n`, [defaultRecord]);
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /malformed Task Projects markers/);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/project-meta.test.ts`

Expected: FAIL — `oneLineDescription` / `rewriteRootAgents` not exported

- [ ] **Step 3: Write minimal implementation**

Implement the functions from Interfaces. Sort a copy of `projects` with `default` / `_default` first, then `dir.localeCompare`. Build each bullet with `oneLineDescription(record.description)`. When both memory markers exist, compute `managedBefore` and `managedAfter` and throw `refusing to write Task Projects section inside project-memory markers` if they differ.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/project-meta.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/project-meta.ts \
  extensions/clis/test/tasks/utils/project-meta.test.ts
git commit -m "feat(tasks): rewrite Task Projects index outside memory markers" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 3: ensureProjectMetadata bootstrap (tmpdir only)

**Files:**
- Modify: `extensions/clis/src/tasks/utils/project-meta.ts` — `ensureProjectMetadata`, `refreshProjectIndex`, `readProjectRecord`
- Modify: `extensions/clis/test/tasks/utils/project-meta.test.ts`
- Consumes `BoardWriter` from `./board.js` (same type `write.ts` uses)

**Interfaces:**
- Consumes: `listProjectIds` from `./board.js`; `boardRoot` from `./paths.js`; `projectDirName` from `./project.js`; `rewriteRootAgents` / `renderProjectAgents` / `parseProjectAgents` / `seedTitleFor` / `seedDescriptionFor` from Task 1–2
- Produces:
  - `projectAgentsRelPath(id: TaskProjectId): string` → `knowledge/tasks/${projectDirName(id)}/AGENTS.md`
  - `readProjectRecord(repoPath, id, fs): Promise<TaskProjectRecord>` — read + parse; missing file throws `PROJECT_NOT_FOUND`, `project not found: ${id}`
  - `ensureProjectMetadata(repoPath, writer, skipId?: TaskProjectId): Promise<TaskProjectRecord[]>`
  - `refreshProjectIndex(repoPath, writer): Promise<TaskProjectRecord[]>`
  - Neither function moves Task files. Prove it in the test

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nodeBoardWriter } from "./helpers.js";
import { ensureProjectMetadata, projectAgentsRelPath } from "../../../src/tasks/utils/project-meta.js";

test("projectAgentsRelPath uses _default for default", () => {
  assert.equal(projectAgentsRelPath("default"), "knowledge/tasks/_default/AGENTS.md");
  assert.equal(projectAgentsRelPath("cli"), "knowledge/tasks/cli/AGENTS.md");
});

test("ensureProjectMetadata seeds _default and root index without moving Task files", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-proj-"));
  try {
    const taskRel = "knowledge/tasks/_default/backlog/2026-09-13--keep.md";
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    await writeFile(path.join(repo, taskRel), "# keep\n", "utf8");
    await mkdir(path.join(repo, "knowledge/tasks/cli/todo"), { recursive: true });
    await writeFile(
      path.join(repo, "knowledge/tasks/cli/todo/2026-09-13--other.md"),
      "---\nmetadata:\n  edges-task-project: cli\n  edges-tasks-status: todo\n---\n\nx\n",
      "utf8",
    );
    const rootAgents = path.join(repo, "knowledge/tasks/AGENTS.md");
    await writeFile(
      rootAgents,
      `# tasks\n\n<!-- project-memory:start -->\n\n- keep-index\n<!-- project-memory:end -->\n`,
      "utf8",
    );

    const records = await ensureProjectMetadata(repo, nodeBoardWriter());
    assert.equal(records[0]?.project, "default");
    assert.equal(records.some((item) => item.project === "cli"), true);

    const seeded = await readFile(path.join(repo, "knowledge/tasks/_default/AGENTS.md"), "utf8");
    assert.match(seeded, /^# Default\n/);
    const cliAgents = await readFile(path.join(repo, "knowledge/tasks/cli/AGENTS.md"), "utf8");
    assert.match(cliAgents, /^# cli\n/);
    assert.match(cliAgents, /Task Project cli\./);

    const root = await readFile(rootAgents, "utf8");
    assert.match(root, /- keep-index/);
    assert.match(root, /<!-- task-projects:start -->/);
    assert.ok(root.indexOf("<!-- project-memory:end -->") < root.indexOf("<!-- task-projects:start -->"));

    const task = await readFile(path.join(repo, taskRel), "utf8");
    assert.equal(task, "# keep\n");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("ensureProjectMetadata skipId leaves that AGENTS.md missing", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-proj-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks"), { recursive: true });
    await ensureProjectMetadata(repo, nodeBoardWriter(), "default");
    await assert.rejects(readFile(path.join(repo, "knowledge/tasks/_default/AGENTS.md"), "utf8"));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

Import `assert` / `test` the same way as Task 1. The `nodeBoardWriter` import path from `test/tasks/utils/project-meta.test.ts` is `./helpers.js`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/utils/project-meta.test.ts`

Expected: FAIL — `ensureProjectMetadata` not exported

- [ ] **Step 3: Write minimal implementation**

Use `path.join(repoPath, projectAgentsRelPath(id))`. `mkdirp` the project dir. Skip writing when `skipId === id`. After seeding, `refreshProjectIndex`: `listProjectIds`, always include `default` if `_default` exists or was just created, `readProjectRecord` each, `rewriteRootAgents`, `writeFile` root AGENTS.md. Do not `rename` / `unlink` Task files.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd extensions/clis && node --test --import tsx test/tasks/utils/project-meta.test.ts
pnpm --filter edges-cli test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/project-meta.ts \
  extensions/clis/test/tasks/utils/project-meta.test.ts
git commit -m "feat(tasks): bootstrap Task Project metadata without moving tasks" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 4: Domain list/get/create/update

**Files:**
- Modify: `extensions/clis/src/tasks/utils/project-meta.ts` — `listProjects`, `getProject`, `createProject`, `updateProject`
- Modify: `extensions/clis/src/tasks/utils/format.ts` — extend `TasksSuccess` (used in Task 5; add the fields now so domain tests can `JSON.stringify` the record shape)
- Create: `extensions/clis/test/tasks/project.test.ts`

**Interfaces:**
- Consumes: `parseTaskProject` from `./project.js`; helpers from Tasks 1–3; `BoardWriter` from `./board.js`
- Produces:
  - `listProjects(repoPath, writer): Promise<TaskProjectRecord[]>` — `ensureProjectMetadata` then return
  - `getProject(repoPath, raw, writer): Promise<TaskProjectRecord>` — `parseTaskProject(raw)`, `ensure`, then `readProjectRecord` (missing → `PROJECT_NOT_FOUND`)
  - `createProject(repoPath, input: { project: string; title: string; description: string }, writer): Promise<TaskProjectRecord>`
  - `updateProject(repoPath, raw, patch: { title?: string; description?: string }, writer): Promise<TaskProjectRecord>`
  - `createProject` calls `ensureProjectMetadata(repoPath, writer, parseTaskProject(input.project))`, then writes, then `refreshProjectIndex`
  - `updateProject`: at least one of title/description; missing file → `PROJECT_NOT_FOUND`; preserve `pointers` from `parseProjectAgents`
  - Neither function writes `edges-tasks-status` or `edges-task-priority` on any Task file

`format.ts` `TasksSuccess` add:

```ts
  projects?: TaskProjectRecord[];
  project?: TaskProjectId;
  dir?: string;
  title?: string;
  description?: string;
```

Import `TaskProjectId` and `TaskProjectRecord` from `./types.js`.

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nodeBoardWriter } from "./utils/helpers.js";
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "../../src/tasks/utils/project-meta.js";

async function virginRepo(): Promise<string> {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-proj-"));
  await mkdir(path.join(repo, "knowledge/tasks"), { recursive: true });
  return repo;
}

test("create/list/get/update project metadata; create default on virgin board", async () => {
  const repo = await virginRepo();
  try {
    const createdDefault = await createProject(
      repo,
      {
        project: "default",
        title: "Default",
        description: "Ungrouped tasks that have not been assigned a named Task Project.",
      },
      nodeBoardWriter(),
    );
    assert.equal(createdDefault.project, "default");
    assert.equal(createdDefault.dir, "_default");
    assert.equal(createdDefault.path, "knowledge/tasks/_default/AGENTS.md");

    const created = await createProject(
      repo,
      { project: "cli", title: "CLI", description: "edges CLI work" },
      nodeBoardWriter(),
    );
    assert.equal(created.project, "cli");
    assert.equal(created.path, "knowledge/tasks/cli/AGENTS.md");

    const listed = await listProjects(repo, nodeBoardWriter());
    assert.deepEqual(
      listed.map((item) => item.project),
      ["default", "cli"],
    );

    const got = await getProject(repo, "cli", nodeBoardWriter());
    assert.equal(got.title, "CLI");
    assert.equal(got.description, "edges CLI work");

    const updated = await updateProject(
      repo,
      "cli",
      { description: "updated CLI" },
      nodeBoardWriter(),
    );
    assert.equal(updated.description, "updated CLI");
    assert.equal(updated.title, "CLI");

    const root = await readFile(path.join(repo, "knowledge/tasks/AGENTS.md"), "utf8");
    assert.match(root, /updated CLI/);
    assert.match(root, /<!-- task-projects:start -->/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createProject duplicate and getProject missing", async () => {
  const repo = await virginRepo();
  try {
    await createProject(
      repo,
      { project: "cli", title: "CLI", description: "edges CLI work" },
      nodeBoardWriter(),
    );
    await assert.rejects(
      () =>
        createProject(
          repo,
          { project: "cli", title: "CLI", description: "edges CLI work" },
          nodeBoardWriter(),
        ),
      (error: unknown) => {
        assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
        assert.match((error as Error).message, /project already exists: cli/);
        return true;
      },
    );
    await assert.rejects(
      () => getProject(repo, "docs", nodeBoardWriter()),
      (error: unknown) => {
        assert.equal((error as { errorCode: string }).errorCode, "PROJECT_NOT_FOUND");
        assert.match((error as Error).message, /project not found: docs/);
        return true;
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("updateProject preserves pointers and does not rewrite a Task file", async () => {
  const repo = await virginRepo();
  try {
    await createProject(
      repo,
      { project: "cli", title: "CLI", description: "edges CLI work" },
      nodeBoardWriter(),
    );
    await writeFile(
      path.join(repo, "knowledge/tasks/cli/AGENTS.md"),
      "# CLI\n\nedges CLI work\n\n## Pointers\n\n- keep\n",
      "utf8",
    );
    const taskRel = "knowledge/tasks/_default/backlog/2026-09-13--keep.md";
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    await writeFile(
      path.join(repo, taskRel),
      "---\nmetadata:\n  edges-tasks-status: backlog\n  edges-task-priority: high\n---\n\nbody\n",
      "utf8",
    );
    await updateProject(repo, "cli", { title: "CLI work" }, nodeBoardWriter());
    const agents = await readFile(path.join(repo, "knowledge/tasks/cli/AGENTS.md"), "utf8");
    assert.match(agents, /^# CLI work\n/);
    assert.match(agents, /## Pointers\n\n- keep\n/);
    const task = await readFile(path.join(repo, taskRel), "utf8");
    assert.match(task, /edges-tasks-status: backlog/);
    assert.match(task, /edges-task-priority: high/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createProject rejects _default as the CLI id", async () => {
  const repo = await virginRepo();
  try {
    await assert.rejects(
      () =>
        createProject(
          repo,
          { project: "_default", title: "Default", description: "x" },
          nodeBoardWriter(),
        ),
      (error: unknown) => {
        assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
        return true;
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/project.test.ts`

Expected: FAIL — `createProject` not exported

- [ ] **Step 3: Write minimal implementation**

```ts
export async function createProject(
  repoPath: string,
  input: { project: string; title: string; description: string },
  writer: BoardWriter,
): Promise<TaskProjectRecord> {
  const id = parseTaskProject(input.project);
  const title = parseProjectTitle(input.title);
  const description = parseProjectDescription(input.description);
  await ensureProjectMetadata(repoPath, writer, id);
  const rel = projectAgentsRelPath(id);
  if (await writer.exists(path.join(repoPath, rel))) {
    throw new TasksError("VALIDATION_ERROR", `project already exists: ${id}`);
  }
  await writer.mkdirp(path.join(repoPath, "knowledge/tasks", projectDirName(id)));
  await writer.writeFile(path.join(repoPath, rel), renderProjectAgents({ title, description }));
  await refreshProjectIndex(repoPath, writer);
  return {
    project: id,
    dir: projectDirName(id),
    title,
    description,
    path: rel,
  };
}
```

`updateProject`: if `patch.title === undefined && patch.description === undefined` throw `VALIDATION_ERROR`, `project update requires at least one of --title, --description`. Read existing, merge, render with `pointers: parsed.pointers`, write, refresh.

`getProject`: `ensureProjectMetadata(repoPath, writer)` (no skip), then `readProjectRecord`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd extensions/clis && node --test --import tsx test/tasks/project.test.ts
pnpm --filter edges-cli test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/project-meta.ts \
  extensions/clis/src/tasks/utils/format.ts \
  extensions/clis/test/tasks/project.test.ts
git commit -m "feat(tasks): add Task Project metadata domain CRUD" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 5: Wire `edges tasks project` + help/README + orthogonality

**Files:**
- Create: `extensions/clis/src/tasks/project.ts`
- Create: `extensions/clis/src/tasks/project/list.ts`
- Create: `extensions/clis/src/tasks/project/get.ts`
- Create: `extensions/clis/src/tasks/project/create.ts`
- Create: `extensions/clis/src/tasks/project/update.ts`
- Modify: `extensions/clis/src/tasks.ts` — `addProjectCommand(tasks, ctx)` after `addUpdateCommand`; extend `TASKS_AFTER_HELP`
- Modify: `extensions/clis/README.md` — add the four verbs under `## tasks`; Capability Surface stays CLI + Skill + MCP
- Modify: `knowledge/tasks/README.md` — after “Issue 层 Task Project”, add that each project including `_default` has lightweight `AGENTS.md` and that `knowledge/tasks/AGENTS.md` has a CLI-maintained Task Projects section outside project-memory markers
- Modify: `extensions/clis/test/tasks/cli.test.ts`
- Modify: `extensions/clis/test/tasks/parse.test.ts`
- Modify: `extensions/clis/test/tasks/run.test.ts`

**Interfaces:**
- Consumes: `listProjects` / `getProject` / `createProject` / `updateProject`; `runTasksCommand` / `succeed` from `./utils/result.js` (project leaves import `../utils/result.js`); `CliContext` / `usageError`
- Produces: nested Commander group `project` with four leaves; JSON `command` values from Locked design; help text that lists `project list|get|create|update` and does not list `classify`

`TASKS_AFTER_HELP` COMMANDS block becomes:

```
COMMANDS
  list [--status <edges-tasks-status>] [--priority <edges-task-priority>]... [--project <edges-task-project>]... [--sort priority]
  get <stem|path>
  create --title <title> [--description] [--body] [--status] [--name] [--assignee] [--priority] [--project]
  update <stem|path> [--title] [--description] [--body] [--assignee] [--priority] [--project]
  status <stem|path> <edges-tasks-status>
  runs <stem|path> [--output table|json]
  run-messages <run-id> [--output table|json]
  project list
  project get <project>
  project create <project> --title <title> --description <text>
  project update <project> [--title] [--description]

There is no classify command. Task moves stay on update --project (same status and priority).
```

Keep the existing “Skill and MCP come later on this same contract. Capability Surface is CLI + Skill + MCP.” sentence. After this round the project metadata Skill (classifyTasks) exists; generic tasks Skill/MCP CRUD is still later. Rewrite that pair to:

```
classifyTasks Skill (extensions/skills/project-tasks-classify) uses these project verbs plus update --project.
Generic tasks Skill/MCP CRUD is a later backlog on this same contract.
Capability Surface is CLI + Skill + MCP.
```

Group file `src/tasks/project.ts`:

```ts
import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addProjectCreateCommand } from "./project/create.js";
import { addProjectGetCommand } from "./project/get.js";
import { addProjectListCommand } from "./project/list.js";
import { addProjectUpdateCommand } from "./project/update.js";

const PROJECT_AFTER_HELP = `
COMMANDS
  list
  get <project>
  create <project> --title <title> --description <text>
  update <project> [--title] [--description]

<project> is default or a lowercase kebab slug (not _default).
create writes knowledge/tasks/<dir>/AGENTS.md and refreshes the root Task Projects section.
update changes title/description only. Task files move with: edges tasks update --project
There is no edges tasks classify verb.

EXAMPLES
  edges tasks project list
  edges tasks project create cli --title "CLI" --description "edges CLI work"
`;

export function addProjectCommand(tasks: Command, ctx: CliContext): void {
  const project = tasks
    .command("project")
    .description("Task Project metadata (index/description layer)")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "Show this help");
  addProjectListCommand(project, ctx);
  addProjectGetCommand(project, ctx);
  addProjectCreateCommand(project, ctx);
  addProjectUpdateCommand(project, ctx);
  project.action(() => {
    ctx.result = usageError("missing project subcommand. Use edges tasks project --help.", "tasks");
  });
  project.addHelpText("after", PROJECT_AFTER_HELP);
}
```

List leaf (others follow the same `runTasksCommand` + `succeed` pattern as `src/tasks/list.ts`):

```ts
export function addProjectListCommand(project: Command, ctx: CliContext): void {
  project
    .command("list")
    .description("List Task Project metadata")
    .option("--json", "Write JSON to stdout (always on)")
    .action(async () => {
      await runTasksCommand(ctx, async (runtime) => {
        const projects = await listProjects(runtime.repoPath, runtime.writer);
        return succeed({ status: "success", command: "project.list", projects });
      });
    });
}
```

Create leaf: `.argument("<project>", "default or kebab slug")` + required `--title` / `--description`. Get: argument only. Update: argument + optional `--title` / `--description`.

- [ ] **Step 1: Write the failing test**

`cli.test.ts` — change the seven-verbs test to also require `project` and forbid `classify`:

```ts
test("tasks help lists project group and omits delete/log/classify", async () => {
  const result = await run(["tasks", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["list", "get", "create", "update", "status", "runs", "run-messages", "project"]) {
    assert.match(result.stdout, new RegExp(`\\b${verb}\\b`));
  }
  assert.doesNotMatch(result.stdout, /^\s+delete\b/m);
  assert.doesNotMatch(result.stdout, /^\s+log\b/m);
  assert.doesNotMatch(result.stdout, /^\s+classify\b/m);
});

test("tasks project help lists list get create update", async () => {
  const result = await run(["tasks", "project", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["list", "get", "create", "update"]) {
    assert.match(result.stdout, new RegExp(`\\b${verb}\\b`));
  }
  assert.doesNotMatch(result.stdout, /\bclassify\b/);
});
```

Keep the existing `--project` / `--priority` help tests.

`parse.test.ts` — append:

```ts
test("run tasks classify is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "classify"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks project without subcommand is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "project"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
  assert.match(JSON.parse(result.stdout).reason, /missing project subcommand/);
});
```

`run.test.ts` — append:

```ts
test("run tasks project create/list/get/update and update --project keeps status and priority", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    const createdProj = await run(
      ["tasks", "project", "create", "cli", "--title", "CLI", "--description", "edges CLI work"],
      { env },
    );
    assert.equal(createdProj.exitCode, 0);
    const createdBody = JSON.parse(createdProj.stdout);
    assert.equal(createdBody.command, "project.create");
    assert.equal(createdBody.project, "cli");
    assert.equal(createdBody.dir, "cli");

    const listed = await run(["tasks", "project", "list"], { env });
    assert.equal(listed.exitCode, 0);
    const listedBody = JSON.parse(listed.stdout) as {
      command: string;
      projects: Array<{ project: string }>;
    };
    assert.equal(listedBody.command, "project.list");
    assert.deepEqual(
      listedBody.projects.map((item) => item.project),
      ["default", "cli"],
    );

    const got = await run(["tasks", "project", "get", "default"], { env });
    assert.equal(got.exitCode, 0);
    assert.equal(JSON.parse(got.stdout).command, "project.get");
    assert.equal(JSON.parse(got.stdout).dir, "_default");

    const updatedMeta = await run(
      ["tasks", "project", "update", "cli", "--description", "updated"],
      { env },
    );
    assert.equal(updatedMeta.exitCode, 0);
    assert.equal(JSON.parse(updatedMeta.stdout).description, "updated");

    const createdTask = await run(
      ["tasks", "create", "--title", "Keep fields", "--status", "todo", "--priority", "high"],
      { env },
    );
    assert.equal(createdTask.exitCode, 0);
    const stem = JSON.parse(createdTask.stdout).stem as string;
    const moved = await run(["tasks", "update", stem, "--project", "cli"], { env });
    assert.equal(moved.exitCode, 0);
    const movedBody = JSON.parse(moved.stdout);
    assert.equal(movedBody.project, "cli");
    assert.equal(movedBody.priority, "high");
    const gotTask = await run(["tasks", "get", stem], { env });
    const task = JSON.parse(gotTask.stdout).task as {
      status: string;
      priority: string;
      project: string;
    };
    assert.equal(task.status, "todo");
    assert.equal(task.priority, "high");
    assert.equal(task.project, "cli");

    const missing = await run(["tasks", "project", "get", "docs"], { env });
    assert.equal(missing.exitCode, 1);
    assert.equal(JSON.parse(missing.stdout).errorCode, "PROJECT_NOT_FOUND");

    const badSlug = await run(
      ["tasks", "project", "create", "_default", "--title", "Default", "--description", "nope"],
      { env },
    );
    assert.equal(badSlug.exitCode, 2);
    assert.equal(JSON.parse(badSlug.stdout).errorCode, "VALIDATION_ERROR");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/clis && node --test --import tsx test/tasks/cli.test.ts test/tasks/parse.test.ts test/tasks/run.test.ts`

Expected: FAIL — unknown command `project` / help does not list `project`

- [ ] **Step 3: Write minimal implementation**

Register the group and four leaves. Do not add `fs` to `CliContext`. Use `runtime.writer` for all four verbs.

`knowledge/tasks/README.md` paragraph to append under “Issue 层 Task Project”:

```
每个 Task Project（含 `_default`）有一份轻量 `AGENTS.md`（标题 + 描述，可选 Pointers），不是对该目录做完整 project-memory-init。根 `knowledge/tasks/AGENTS.md` 在 project-memory 受管标记之外有 CLI 维护的 Task Projects 节。读写走 `edges tasks project list|get|create|update`。跨 project 搬家仍用 `update --project`，不得改 status 或 priority。能力面是 CLI + Skill + MCP。
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks.ts \
  extensions/clis/src/tasks/project.ts \
  extensions/clis/src/tasks/project \
  extensions/clis/README.md \
  knowledge/tasks/README.md \
  extensions/clis/test/tasks/cli.test.ts \
  extensions/clis/test/tasks/parse.test.ts \
  extensions/clis/test/tasks/run.test.ts
git commit -m "feat(tasks): add edges tasks project list|get|create|update" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 6: project-tasks-classify Skill (workflow only)

**Files:**
- Create: `extensions/skills/project-tasks-classify/SKILL.md`
- Create: `extensions/skills/project-tasks-classify/CHANGELOG.md`
- Modify: run `pnpm skills:link` so `.agents/skills/project-tasks-classify` is a relative symlink to `../../extensions/skills/project-tasks-classify` (script is `scripts/link-agent-skills`; commit the symlink if git tracks `.agents/skills` links — if `.agents/skills` ignores Edges-owned links, still run the script and commit only the skill directory)
- Do not create: `extensions/skills/project-tasks-classify/scripts/`

**Interfaces:**
- Consumes: CLI from Task 5 (`project list|get|create|update`, `tasks list`, `tasks update --project`)
- Produces: a loadable Agent Skill whose `name` equals the directory name `project-tasks-classify`; display heading classifyTasks; no in-repo embedding or classification code

Frontmatter (required):

```markdown
---
name: project-tasks-classify
description: 对整板 Task 做基于 Embedding 的最近质心分类（NCC）：以用户已设的 Task Project（slug + 描述）为质心，把每条 Task 分到最近质心，等人改建议表后再用 edges tasks CLI 落地。不要发现新簇、不要迭代质心、不要手改路径、不要当通用 edges-tasks Skill+MCP CRUD。
version: 1.0.0
---
```

- [ ] **Step 1: Write the failing test**

There is no skill test runner. Use a file probe that must fail before the directory exists:

```bash
test ! -f extensions/skills/project-tasks-classify/SKILL.md
```

Expected before Step 3: exit 1 (file missing). After Step 3 the inverse plus content gates:

```bash
test -f extensions/skills/project-tasks-classify/SKILL.md
test -f extensions/skills/project-tasks-classify/CHANGELOG.md
test ! -d extensions/skills/project-tasks-classify/scripts
python3 - <<'PY'
from pathlib import Path
text = Path("extensions/skills/project-tasks-classify/SKILL.md").read_text()
assert text.startswith("---\nname: project-tasks-classify\n")
assert "version: 1.0.0" in text.split("---", 2)[1]
for needle in [
    "classifyTasks",
    "edges tasks project list",
    "edges tasks list",
    "create-then-move",
    "edges tasks update",
    "--project",
    "CLI + Skill + MCP",
    "Whole-board",
    "wait",
    "NCC",
    "最近质心",
]:
    assert needle in text, needle
assert "edges tasks classify" in text  # 禁止句必须点名这个不存在的动词
for banned in ["openai.embeddings", "kmeans", "KMeans", "K-means", "k-means"]:
    assert banned not in text, banned
assert "手改" in text or "hand-edit" in text or "不要手" in text
PY
```

- [ ] **Step 2: Run probe to verify it fails**

Run: `test ! -f extensions/skills/project-tasks-classify/SKILL.md`

Expected: the `test ! -f` succeeds (file absent) **before** implementation. The python gate is the post-condition.

- [ ] **Step 3: Write the Skill**

Write `extensions/skills/project-tasks-classify/SKILL.md` with **exactly** this body after the frontmatter above (executor may wrap lines but must keep every required needle):

```markdown
# classifyTasks

独立工作流 Skill，不是通用 edges-tasks Skill+MCP CRUD。方法是 **Nearest Centroid Classifier（最近质心分类器，NCC）**，具体为 **Embedding-based Nearest Centroid Classification（基于 Embedding 的最近质心分类）**。质心由人预先设定（已有 Task Project + 描述 / AGENTS.md），本 Skill 只做归类，不发现簇、不迭代更新质心。

能力面是 CLI + Skill + MCP 三者并列：有 shell 的宿主走 `edges` CLI；本文件是工作流入口；无 shell 宿主的 generic tasks MCP 是另卡 backlog，本 Skill **不**发明 classify MCP，也 **不**手改看板路径。

## 什么时候用

- 用户要按主题整理 Task 看板：整板分类（含已有 named project，不只 `_default`）。
- Task Project 与描述 / AGENTS.md **已经设好**，要把它们当 NCC 质心。
- 不要用它做单条 CRUD（那是后续 generic tasks Skill/MCP）；不要调用不存在的 `edges tasks classify`；不要从任务集合里自动长出新质心。

## 步骤（必须按序，第 4 步要停）

1. **读已有质心。** 在仓库根：

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks project list
```

已 build 时把 `tsx src/index.ts` 换成 `node dist/index.js`。解析 stdout JSON：`command` 为 `project.list`，`projects[].project|title|description` 是用户已设的质心（slug + 描述；描述来自 project AGENTS.md / 根索引）。若 `_default` 还没有 AGENTS.md，这条命令会 bootstrap 元数据，**不会**搬 Task 文件。质心集合以这次 list 为准；缺描述就先停，让人用 `project update` 补描述，不要自己编质心。

2. **读整板 Task。**

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks list
```

对需要正文的行再 `tasks get <stem>`。必须包含所有 project，禁止 `list --project default` 当作唯一输入。

3. **Embedding-based NCC。** 用宿主 / runtime 已有的 embedding 能力（同一模型）把质心文本与每条 Task 编成向量，再把每条 Task 分到**最近质心**：
   - 质心文本：`project` slug + `title` + `description`（来自步骤 1）。
   - Task 文本：title + description，必要时补 body。
   - 距离：余弦相似度（越大越近）或同一空间下的欧氏距离（越小越近）。同一批次只用一种度量。
   - 每条 Task 只建议一个 `suggested`：已有质心的 CLI id，或 `default`。
   - 离所有 named 质心都远时，建议 `default`，不要发明新 slug。
   - 不要从已分配成员重算质心，不要多轮移动质心，不要在本目录写 `scripts/`，不要新增 embedding 库或服务。
   - 宿主没有 embedding 能力时：说明需要 embedding、停下问人用哪条 runtime 路径；不要改用「读标题瞎分」冒充 NCC，也不要调用不存在的 `edges tasks classify`。

4. **出表并等待人类修改。** 只输出这一张表，然后 **停止**，等人改 `suggested` / `action` / `note` 后再继续：

| stem | current | suggested | action | note |
| --- | --- | --- | --- | --- |
| 2026-09-13--demo | default | cli | move | nearest to CLI centroid |

`current` / `suggested` 用 CLI id（`default` 或 kebab），不用 `_default`。`action` 只能是 `keep` | `move` | `create-then-move`。人可以改目标、留 `default`、丢掉建议。**只有人先明确补一个新质心**（title + description）时，才把该行标成 `create-then-move`；NCC 步骤本身不建议新质心。

5. **经 CLI 应用（禁止手改路径）。** 人改完表之后：
   - 每个还不在 `project list` 里的 `suggested`（且不是 `default`）：必须是人明确新增的质心。先问人要 title 与 description，再

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks project create <slug> --title "<title>" --description "<description>"
```

     不要自动批量编造 description，不要一次 create 未经人确认的一串 project，不要把「发现新簇」当成默认路径。
   - 再对 `suggested !== current` 的每一行：

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks update <stem> --project <suggested>
```

   - `keep` 或 `suggested === current`：不写盘。

## 禁止

- 不要 `edges tasks classify`（没有这个动词）。
- 不要改 `edges-tasks-status` 或 `edges-task-priority`（不要 `status`，不要 `update --priority`）。
- 不要 `mkdir` / `mv` / 手改 Task 文件 / 手改 `AGENTS.md` / 手改根 Task Projects 节。
- 不要只用 `_default` 分类；不要自动发现或迭代质心；不要把 Task 升成 Memory Type。
- 不要在本 skill 下写 `scripts/`，不要加仓内 embedding 库或服务。
- 不要把 npm `bin` 说成能力面的一层。能力面是 CLI + Skill + MCP。

## 能力面

- **CLI：** `edges tasks project list|get|create|update` 与 `edges tasks list` / `edges tasks update --project`
- **Skill：** 本文件（classifyTasks）
- **MCP：** 对等入口；本轮没有 classify MCP，也没有 generic tasks MCP。缺 shell 时说明 generic tasks Skill/MCP CRUD 仍在 backlog，不要假装 MCP 已能搬 Task

Whole-board classification onto user-set centroids; wait for the human-edited table before apply.
```

`extensions/skills/project-tasks-classify/CHANGELOG.md`:

```markdown
# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-17

### Added

- classifyTasks：整板 Embedding-based NCC 建议表，人改后再用 `edges tasks project` 与 `update --project` 落地。质心由用户预先设定；embedding 走宿主 / runtime。无 `classify` 动词。能力面 CLI + Skill + MCP。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-tasks-classify@1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-tasks-classify@1.0.0
```

Then:

```bash
pnpm skills:link
```

Do **not** `git tag skill/project-tasks-classify@1.0.0` in the implementation PR unless the human asks to release the skill. The changelog still records 1.0.0 as the first version.

- [ ] **Step 4: Run probe to verify it passes**

Run the python gate from Step 1. Expected: exit 0. Also `test ! -d extensions/skills/project-tasks-classify/scripts`.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/project-tasks-classify
git add -u .agents/skills/project-tasks-classify 2>/dev/null || true
git commit -m "feat(skills): add classifyTasks workflow skill" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

If `git add -u .agents/skills/project-tasks-classify` stages nothing (ignored vendor hub), that is fine — `pnpm skills:link` still ran.

---

### Task 7: Live metadata seed + CHANGELOG + memory

**Files:**
- Create: `knowledge/tasks/_default/AGENTS.md` (via CLI `ensure`, not by inventing a second format)
- Modify: `knowledge/tasks/AGENTS.md` — insert the Task Projects section **after** `<!-- project-memory:end -->` only
- Modify: `CHANGELOG.md` `[Unreleased]` → `### Added` (implementation lines)
- Modify via `$project-memory-remember` (do not hand-edit indexes): `.memory/projects/project_classify_tasks_and_project_metadata.md` (update How-to: project CLI + project-tasks-classify Skill landed; Capability Surface remains CLI + Skill + MCP; point at this plan)

**Interfaces:**
- Consumes: `ensureProjectMetadata` / `edges tasks project list` from Tasks 3–5
- Produces: live `_default` has lightweight AGENTS.md; root index lists `_default`; **zero** Task `*.md` or sidecar moves; project-memory block in `knowledge/tasks/AGENTS.md` is byte-identical to before

- [ ] **Step 1: Write the failing probe**

Do **not** add a unit test that points at the real `knowledge/tasks/` tree. From repo root, before seed:

```bash
test ! -f knowledge/tasks/_default/AGENTS.md
test -f knowledge/tasks/AGENTS.md
grep -q '<!-- project-memory:end -->' knowledge/tasks/AGENTS.md
! grep -q '<!-- task-projects:start -->' knowledge/tasks/AGENTS.md
test -f knowledge/tasks/_default/backlog/2026-09-17--classify沉到edges-tasks-CLI.md
```

Expected before Step 3: all succeed (metadata missing, Tasks still under `_default`).

After Step 3 the inverse for metadata, and the Task file **unmoved**:

```bash
test -f knowledge/tasks/_default/AGENTS.md
grep -q '^# Default$' knowledge/tasks/_default/AGENTS.md
grep -q '<!-- task-projects:start -->' knowledge/tasks/AGENTS.md
python3 - <<'PY'
from pathlib import Path
text = Path("knowledge/tasks/AGENTS.md").read_text()
mem_start = text.index("<!-- project-memory:start -->")
mem_end = text.index("<!-- project-memory:end -->")
tp_start = text.index("<!-- task-projects:start -->")
assert mem_end < tp_start
assert "<!-- task-projects:start -->" not in text[mem_start:mem_end]
assert "- [`_default`](_default/AGENTS.md)" in text
PY
test -f knowledge/tasks/_default/backlog/2026-09-17--classify沉到edges-tasks-CLI.md
test ! -d knowledge/tasks/backlog
```

- [ ] **Step 2: Run probe to verify it fails**

Run the “before” block. Expected: `_default/AGENTS.md` missing and no task-projects markers (probes succeed). The “after” block must fail until Step 3.

- [ ] **Step 3: Seed via CLI, then changelog + memory**

From repo root, against this checkout (not a tmpdir):

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks project list
```

That `ensure`s `_default/AGENTS.md` and the root section. Confirm `git diff --name-only -- knowledge/tasks` is only:

```
knowledge/tasks/AGENTS.md
knowledge/tasks/_default/AGENTS.md
```

If any Task `*.md` or `.{stem}.log.md` appears, **stop and revert those files**. Do not relocate the board.

`CHANGELOG.md` `[Unreleased]` / `### Added` — prepend (do not delete the ADR-0010 docs line or this plan’s plan-only line):

```
- `edges tasks project list|get|create|update`：Task Project 元数据（每 project 含 `_default` 的轻量 AGENTS.md + 根 `knowledge/tasks/AGENTS.md` Task Projects 节，写在 project-memory 受管标记外）。Q18=A；看板 markdown 仍是 Task 真源。无仓内 embedding 库，无 `edges tasks classify`。
- `extensions/skills/project-tasks-classify`：classifyTasks 整板 Embedding-based NCC 工作流 Skill；人改建议表后经 CLI 落地。能力面 CLI + Skill + MCP。Generic tasks Skill/MCP CRUD 仍是另卡 backlog。
```

Update the existing project memory via `$project-memory-remember` (do not hand-edit `.memory/PROJECT.md`). Reuse slug `classify_tasks_and_project_metadata` if the plan-only PR already created it; otherwise create it. Body shape:

```
ADR 0010 的 CLI project 子命令与 classifyTasks Skill 已按 docs/superpowers/plans/2026-09-17-classify-tasks.md 落地。元数据只在索引/描述层；apply 走 update --project，不改 status / priority。

**Why:**
grill 锁定 Q18=A、Embedding-based NCC（用户已设质心）、无仓内 embedding 库、无 classify 动词。能力面始终是 CLI + Skill + MCP。

**How to apply:**
- 改 project 标题/描述用 `edges tasks project update`；新建用 `project create`。
- 整理看板用 project-tasks-classify Skill，禁止手改路径。
- 不要把 Task 升成 Memory Type；不要实现 `edges tasks classify`；不要把 generic tasks Skill/MCP CRUD 塞进本 Skill。
```

`--title` `classifyTasks 与 Task Project 元数据`；`--description` 必须写清适用场景：实现或改 `edges tasks project` / project-tasks-classify Skill 时打开；点名 CLI + Skill + MCP、本计划路径、Embedding-based NCC / 无 classify 动词。

Do not edit `knowledge/posts/`. Do not change status of the interactive-clustering or classify-into-CLI backlog cards in this task unless the human asks; a one-line run-log on `整理default-project的tasks-skill` is optional and not required for the gate.

- [ ] **Step 4: Run probe to verify it passes**

Run the “after” block from Step 1, then:

```bash
pnpm --filter edges-cli test
git diff --name-only -- knowledge/tasks | sort
```

Expected: probes PASS; CLI suite PASS; `knowledge/tasks` names are only `AGENTS.md` and `_default/AGENTS.md`.

Also confirm the project-memory span is unchanged:

```bash
python3 - <<'PY'
from pathlib import Path
import subprocess
old = subprocess.check_output(["git", "show", "HEAD:knowledge/tasks/AGENTS.md"], text=True)
# After commit this compare is vs the pre-seed commit; during the working tree:
# use `git show HEAD:knowledge/tasks/AGENTS.md` against the file, extracting the memory span.
new = Path("knowledge/tasks/AGENTS.md").read_text()
def span(text: str) -> str:
    a = text.index("<!-- project-memory:start -->")
    b = text.index("<!-- project-memory:end -->") + len("<!-- project-memory:end -->")
    return text[a:b]
assert span(old) == span(new)
PY
```

Expected: PASS (memory block byte-identical to `HEAD`).

- [ ] **Step 5: Commit**

```bash
git add knowledge/tasks/_default/AGENTS.md \
  knowledge/tasks/AGENTS.md \
  CHANGELOG.md \
  .memory/projects/project_classify_tasks_and_project_metadata.md \
  .memory/PROJECT.md
git commit -m "feat(tasks): seed Task Project metadata and record classifyTasks" \
  --trailer "Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

Only stage `.memory/PROJECT.md` if the remember script refreshed the index. Do not `git add` `.memory/USER.md` or `.memory/users/`.

---

## Self-review (author)

**Spec coverage (ADR 0010):**

| Decision | Task |
| --- | --- |
| Skill `extensions/skills/project-tasks-classify/`, display classifyTasks | Task 6 |
| Embedding-based NCC onto user-set project centroids; whole-board classify; batch editable table; CLI apply | Task 6 Locked design |
| Host/runtime embeddings (no in-repo library); no `edges tasks classify` | Global Constraints; Tasks 5–6 tests |
| `edges tasks project list\|get\|create\|update`; create writes dir + AGENTS.md + root index outside project-memory markers | Tasks 2–5 |
| Every project including `_default` has lightweight AGENTS.md | Tasks 1, 3, 7 |
| Task moves via existing `update --project`; must not change status or priority | Task 5 CLI test; existing `write.test.ts` |
| Q18=A index/description; board files remain SoT; not Task-as-Memory-Type | Locked design; Skill 禁止 |
| Capability Surface CLI + Skill + MCP; this plan = project CLI + project-tasks-classify Skill; generic CRUD backlog separate | Header, Global Constraints, Task 5/6 copy |
| Absorbs interactive theme-clustering first knife; iterative centroid discovery / classify-in-CLI out of scope | Locked design “Absorbed backlogs” |
| Bootstrap metadata without relocating Tasks | Tasks 3, 7 |

**Placeholder scan:** no TBD / TODO / “implement later” / “similar to Task N” left in steps.

**Type consistency:** `TaskProjectRecord`, `project.list|get|create|update`, `PROJECT_NOT_FOUND`, `ensureProjectMetadata(..., skipId?)`, `parseProjectTitle` / `parseProjectDescription` names are used the same way in later tasks as defined in Task 1–4.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-17-classify-tasks.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. REQUIRED SUB-SKILL: superpowers:subagent-driven-development
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints. REQUIRED SUB-SKILL: superpowers:executing-plans
