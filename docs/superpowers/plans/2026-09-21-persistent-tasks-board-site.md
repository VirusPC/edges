# Persistent `/tasks/` Board Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **This document is a plan.** Implementation is **blocked on human approval** of this plan. Do not land CLI / nginx / CI code until the human says the plan is OK.

**Goal:** After each `main` pull on the existing Aliyun ECS teach box, generate a static HTML board at a fixed public path `/tasks/` that always reflects the main-branch Task board, by reading `edges tasks list --group-by project`, thin-mapping into existing review-page `{groups,items}`, and rendering with `edges tasks project review-page`.

**Architecture:** No new product and no new workflow. `list --group-by project` emits a loose-coupled `edges.tasks.grouped/v1` snapshot. A small map in CLI utils (not inside review-page) turns that into generic groups+items. A generate helper runs that pipeline and writes `knowledge/tasks/_site/index.html`. `.github/workflows/deploy-teach.yml` runs the helper on the box after `git fetch` / `reset --hard origin/main`. nginx adds `location /tasks/` → that directory via a separate snippet included in the existing `teaching.conf` server that already serves `/teaching/` and artifacts `/health`+`/artifacts`.

**Tech Stack:** TypeScript, Node.js ≥20, existing `commander` + `runTasksCommand`, `node:test` + `tsx`, NodeNext ESM (relative imports end in `.js`). nginx snippet + bash setup (same one-time sudo pattern as artifacts `setup-nginx`). No Express. No new HTTP process. No embeddings. No browser automation in CI.

**Spec:** `docs/adr/0021-persistent-tasks-board-site.md` (accepted 2026-09-21; extends ADR 0012; hard boundary vs ADR 0013). Glossary: `CONTEXT.md` terms **`/tasks/` 持久看板站**, **分组列表 schema（edges.tasks.grouped）**, **Task Project 审阅页（edges）**, **教学站点（/teaching/）**, **Artifacts 预览服务**, **edges tasks（CLI）**. Prior plans to mirror: `docs/superpowers/plans/2026-09-19-artifacts-preview-service.md`, `docs/superpowers/plans/2026-09-17-task-project-review-page.md`. Test runner: `.memory/projects` under extensions — `project_clis_node_test_glob.md`, `project_node_esm_ts_import_js.md`. Deploy memory: `.memory/projects/project_teach_site_rsync_push.md`. nginx naming: `.memory/feedbacks/feedback_artifacts_inject_teaching_only.md`. Changelog shape: `.memory/projects/project_repo_changelog.md`.

## Non-goals (do not implement; do not reopen)

These are already decided in ADR 0021 / CONTEXT. This plan does not re-grill them.

- Auth (backlog: `knowledge/tasks/agent-clients-ux/backlog/2026-09-21--edges-衍生站点统一鉴权.md`)
- Git writeback, `--mode`, classify vs board drag split (backlog: `…/2026-09-21--Tasks-review-review-page-写回仓接口.md`)
- Per-project URL tree (one page, one site)
- New GitHub Actions workflow file
- tmp + persistent deploy-dir unification (backlog: `…/2026-09-21--云端服务统一入口tmp-persistent-部署目录.md`)
- Artifacts TTL / `publish` as the long-term entry (ADR 0013 hard boundary)
- Changing `edges tasks project review-page` from render-only (ADR 0012)
- Dual `/teach/` + `/teaching/` support (feedback: teaching.conf / `/teaching/` only)
- Moving Task board status under `knowledge/tasks/`
- Edits under `knowledge/posts/`
- New status-station product or a second HTML renderer

## Global Constraints

- Co-authored-by on every commit: `Coding 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Capability Surface wording: always **CLI + Skill + MCP** (three peers)
- `edges tasks project review-page` stays render-only: no publish, no `--mode`, no board writes, no `/tasks/` hosting inside that verb
- Grouped list schema is **`edges.tasks.grouped/v1`**. Do **not** name it `review-page` or couple `list` to review-page types
- Default `edges tasks list` (no `--group-by`) stays a flat `{ status, command: "list", tasks: [...] }`
- Existing `--project` / `--status` / `--priority` / `--sort` still apply **before** grouping
- Generate path is read-only on the board: do **not** call `listProjects` / `ensureProjectMetadata` / `refreshProjectIndex` (those write `AGENTS.md` and would dirty the ECS checkout after `reset --hard`)
- Extend `.github/workflows/deploy-teach.yml` only; do not add a second workflow
- nginx: `teaching.conf` + `/teaching/` only; do not dual-recognize `teach.conf` or `/teach/`
- Do not break `/teaching/` or artifacts `/health` + `/artifacts`
- Public URL shape: `http(s)://<host>/tasks/` (same ECS origin as teaching; current public IP http is `http://182.92.131.89`)
- Output path: `knowledge/tasks/_site/index.html` (generated on the box; gitignored)
- Do not change Task board status
- Do not edit `knowledge/posts/`
- Do not put `ingest` / `fs` / `writer` / `now` / `repoPath` on `CliContext`
- Relative TypeScript imports use `.js` (nodenext)
- Test runner: `node --test --import tsx './test/**/*.test.ts'` (never `node --test --import tsx test`)
- This plan-only PR that first lands this document must **not** implement the CLI, nginx, or CI

---

## File map

Verified against `origin/main` after ADR 0021 (`af7986c`). Command tree: `extensions/clis/src/tasks.ts` + `extensions/clis/src/tasks/list.ts` + `extensions/clis/src/tasks/utils/`. README rule: **file = one command node**. review-page already exists (`src/tasks/project/review-page.ts` + `src/tasks/utils/review-page.ts`). Deploy file: `.github/workflows/deploy-teach.yml`. Artifacts nginx lives under `extensions/services/artifacts-preview/deploy/` and must stay `/teaching/`-only.

**Create — CLI grouped schema + map + generate**

- `extensions/clis/src/tasks/utils/grouped.ts` — `GROUPED_LIST_SCHEMA`, types, `buildGroupedList`, `parseGroupedList`, `groupedListToReviewPageInput`, `listGroupedByProject` (read-only)
- `extensions/clis/src/tasks/utils/generate-site.ts` — `generateTasksSite({ repoPath, outPath, env })` orchestrates list → map → `review-page --from -`
- `extensions/clis/scripts/generate-tasks-site.ts` — box/CI entry: `--out` (default `knowledge/tasks/_site/index.html`), `EDGES_REPO` or walk up to a dir that contains `knowledge/tasks`
- `extensions/clis/test/tasks/utils/grouped.test.ts` — schema shape + map
- `extensions/clis/test/tasks/grouped-list.test.ts` — CLI `--group-by project` / filters / help
- `extensions/clis/test/tasks/utils/generate-site.test.ts` — writes HTML that embeds review-page payload

**Create — nginx / ops (separate from artifacts injector)**

- `extensions/clis/deploy/nginx-tasks.conf` — `location = /tasks` 301 → `/tasks/`; `location /tasks/` alias to the generated `_site/`
- `extensions/clis/deploy/setup-nginx-tasks.sh` — one-time sudo: install snippet, include into `teaching.conf` server blocks that already contain `/teaching/`, `nginx -t`, reload
- `extensions/clis/deploy/inject_nginx_tasks_include.py` — sibling of artifacts injector; matches `/teaching/` only; looks for `edges-tasks.conf` (do **not** edit `inject_nginx_include.py` to dual-purpose or to recognize `/teach/`)
- `extensions/clis/deploy/README.md` — short ops note: public URL, generate command, one-time nginx, PATH on ECS

**Modify**

- `extensions/clis/src/tasks/list.ts` — add `--group-by project` and `--format json`; help documents `edges.tasks.grouped/v1` and must **not** say `review-page`
- `extensions/clis/src/tasks.ts` — `TASKS_AFTER_HELP` lists the new flags
- `extensions/clis/src/tasks/utils/format.ts` — `TasksSuccess` gains optional `schema?`, `groups?`, `items?`
- `extensions/clis/README.md` — list flags + generate pipeline + `/tasks/` pointer
- `.github/workflows/deploy-teach.yml` — after `reset --hard origin/main`, generate the site (always; fail the SSH script if generate fails); hoist PATH/`nvm` so generate does not depend on the artifacts-env branch
- `.gitignore` — `knowledge/tasks/_site/`
- `CHANGELOG.md` `[Unreleased]` — module **任务看板与项目** (human Chinese + real command names; link ADR 0021 only as a reader pointer if needed — do not dump the ADR)
- `CONTEXT.md` — `edges tasks（CLI）` drop “约定中的” from `list --group-by project` once the flag exists
- `.memory/projects/project_tasks_persistent_board_site.md` — via `$project-memory-remember` after implementation lands (How-to: generate path + nginx snippet). **Not** in the plan-only PR

**Do not create/commit**

- A new `.github/workflows/*.yml`
- `edges tasks site` / `edges tasks publish` / `--mode`
- Review-page changes (parse/render/HTML) unless a bug blocks feeding mapped `{groups,items}` — prefer fixing the map
- Dual `/teach/` locations
- Board status moves
- Files under `knowledge/posts/`
- Rewriting ADR 0021’s historical “本轮只定文档” as if that grill implemented the site

---

## Locked design (read before Task 1)

### CLI contract

```
edges tasks list
  [--status <edges-tasks-status>]
  [--priority <edges-task-priority>]...
  [--project <edges-task-project>]...
  [--sort priority]
  [--group-by project]
  [--format json]
  [--json]
```

- No flags: **unchanged**. stdout is the existing success envelope `{ status: "success", command: "list", tasks: TaskListItem[] }`.
- `--json` stays “accepted and ignored” (JSON is always on), same as today.
- `--format json` is optional and documents JSON. Only choice: `json`. `--format table` → `VALIDATION_ERROR` (exit 2).
- `--group-by` only choice: `project`. `--group-by status` (or anything else) → `VALIDATION_ERROR` (exit 2).
- `--group-by project` applies `--status` / `--priority` / `--project` / `--sort` first (same `TaskListOpts` as `listTasks`), then groups the **filtered** set.
- `--format json` without `--group-by` does **not** change the flat `tasks` envelope.

Commander options (match existing `.choices` style in `list.ts`):

```ts
.addOption(new Option("--group-by <field>", "group filtered tasks").choices(["project"]))
.addOption(new Option("--format <format>", "stdout format (always json)").choices(["json"]))
```

Help (`LIST_AFTER_HELP` and `tasks --help`) **must** spell `edges.tasks.grouped/v1` and the `{ schema, groups[], items[] }` shape. Help **must not** contain the string `review-page`.

### Schema `edges.tasks.grouped/v1`

Constant:

```ts
export const GROUPED_LIST_SCHEMA = "edges.tasks.grouped/v1";
```

Types (live in `grouped.ts`, **not** in `review-page.ts`):

```ts
export type GroupedListGroup = {
  id: string;          // Task Project id (`default` or kebab slug)
  title: string;
  description?: string;
};

export type GroupedListItem = {
  id: string;          // Task stem (filename without .md)
  stem?: string;       // same value as id when known; consumers may send either
  group: string;       // Task Project id
  title?: string;
  status?: string;     // edges-tasks-status
  description?: string;
  priority?: string;   // edges-task-priority
};

export type GroupedList = {
  schema: typeof GROUPED_LIST_SCHEMA;
  groups: GroupedListGroup[];
  items: GroupedListItem[];
};
```

CLI stdout when `--group-by project` (keep the existing success envelope so `runTasksCommand` / `succeed` stay consistent; the mapper accepts this envelope **or** a raw `{schema,groups,items}`):

```json
{
  "status": "success",
  "command": "list",
  "schema": "edges.tasks.grouped/v1",
  "groups": [
    { "id": "default", "title": "Default", "description": "Ungrouped tasks…" },
    { "id": "cli", "title": "CLI" }
  ],
  "items": [
    {
      "id": "2026-09-21--alpha",
      "stem": "2026-09-21--alpha",
      "group": "default",
      "title": "Alpha",
      "status": "todo",
      "description": "…",
      "priority": "high"
    }
  ]
}
```

Rules:

- **No `tasks` array** in grouped mode.
- **No `current` / `suggested` / `action` / `note`** on grouped items. Those are review-page fields.
- Item identity is `id` or `stem` (same Task stem). Emit **both** `id` and `stem` with the same value so generic consumers and stem-oriented callers both work. `parseGroupedList` accepts either.
- `group` is the Task Project id (`default` for `_default`), not the directory name `_default`.
- Groups when `--project` is omitted: every id from read-only `listProjectIds` (registered on-disk project dirs), even if the filtered item set is empty for that project. Also include any `task.project` that somehow is not registered.
- Groups when `--project a --project b` is set: **exactly** those project ids (even if a group has zero items after other filters).
- Group order: `default` first, then `localeCompare` (same as `listProjectIds`).
- Item order: the already-filtered/sorted `listTasks` order (board order, or `--sort priority`).
- Group title/description: read `knowledge/tasks/<dir>/AGENTS.md` via `readProjectRecord` **if the file exists**. If missing, use `seedTitleFor` / `seedDescriptionFor`. Do **not** create AGENTS.md.
- Empty board (no project dirs): emit one fallback group `{ id: "default", title: "Default", description: <DEFAULT_PROJECT_DESCRIPTION> }` so a later review-page render still has `groups.length >= 1`.
- `parseGroupedList` rejects missing/unknown `schema`, missing `groups`/`items` arrays, empty group `id`/`title`, or items with neither `id` nor `stem`.

### Thin map → review-page

Keep review-page render-only. Map lives in `grouped.ts`:

```ts
export function groupedListToReviewPageInput(grouped: GroupedList): ReviewPageInput
```

Mapping:

| grouped | review-page |
| --- | --- |
| `groups[].id/title/description` | same (`description` default `""`) |
| `items[].id` or `items[].stem` | `items[].stem` |
| `items[].group` | `items[].current` **and** `items[].suggested` (board snapshot: no reassignment) |
| `items[].title` / `description` | same if present |

If `grouped.groups` is empty, insert the same default group as `buildGroupedList`. If an item’s `group` is not in `groups`, throw `TasksError("VALIDATION_ERROR", …)` — do not silently drop.

The mapped JSON that review-page already accepts:

```json
{
  "groups": [{ "id": "default", "title": "Default", "description": "" }],
  "items": [{
    "stem": "2026-09-21--alpha",
    "current": "default",
    "suggested": "default",
    "title": "Alpha",
    "description": "…"
  }]
}
```

Do **not** add `--mode` or change `parseReviewPageInput`.

### Generate path (CI / box)

Documented pipeline (also the implementation):

```
edges tasks list --group-by project --format json
  → parseGroupedList (envelope or raw)
  → groupedListToReviewPageInput
  → edges tasks project review-page --from - --out <path>
```

`generateTasksSite` in `src/tasks/utils/generate-site.ts` calls existing `run()` twice (list, then review-page with `stdinText`). That keeps review-page render-only and avoids a new board verb.

```ts
export const DEFAULT_TASKS_SITE_REL = "knowledge/tasks/_site/index.html";

export async function generateTasksSite(input: {
  repoPath: string;
  outPath: string;
  env?: NodeJS.ProcessEnv;
}): Promise<{ path: string; groupCount: number; itemCount: number }>
```

- `mkdir` the out parent (`knowledge/tasks/_site/`).
- On list or review-page non-zero exit: throw `TasksError("BOARD_IO_ERROR", …)` so the box script fails visibly.
- Script `extensions/clis/scripts/generate-tasks-site.ts`:
  - `--out <path>` optional; default `defaultTasksSiteOutPath(repoPath)`
  - `EDGES_REPO` or walk upward until `knowledge/tasks` exists
  - stdout JSON: `{ status, command: "generate-tasks-site", path, groupCount, itemCount }`
  - non-zero exit on failure (stderr reason)

Box invocation (repo root, after PATH is set):

```bash
pnpm --filter edges-cli exec -- tsx scripts/generate-tasks-site.ts \
  --out "$PWD/knowledge/tasks/_site/index.html"
```

Prefer this over a globally installed `edges` so the box uses the just-pulled tree. If `node_modules` is missing, `pnpm install --frozen-lockfile --filter edges-cli...` first.

`.gitignore`:

```
knowledge/tasks/_site/
```

Do not commit generated HTML.

### `deploy-teach.yml`

Keep: `environment: production`, concurrency `ecs-edges-pull`, same SSH secrets, same checkout `/home/cheng-dev/projects/edges`, same `git fetch` / `checkout main` / `reset --hard origin/main`. Do **not** `git clean -fd`. Do **not** call `setup-nginx` from the Action (nginx is one-time on the box).

Reorder the remote script to:

1. `git fetch` / `checkout` / `reset --hard origin/main` (unchanged)
2. **Hoist** PATH + optional nvm (today this is only inside the artifacts `if`):

```bash
export PATH="${HOME}/.local/share/pnpm:${HOME}/.local/bin:/usr/local/bin:${PATH}"
if [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  . "$NVM_DIR/nvm.sh"
fi
```

3. **Always** generate the tasks site. Failure fails the SSH script (`set -euo pipefail`) and therefore the job:

```bash
if [ ! -d node_modules ]; then
  pnpm install --frozen-lockfile --filter edges-cli...
fi
pnpm --filter edges-cli exec -- tsx scripts/generate-tasks-site.ts \
  --out "$PWD/knowledge/tasks/_site/index.html"
test -s knowledge/tasks/_site/index.html
```

4. Existing artifacts bootstrap (unchanged): only if `~/.config/edges/artifacts-preview.env` has a real token; `install` then `restart`; skip message otherwise.

Do not gate generate on the artifacts env. Teach files are already new after reset; a generate failure must be visible even when artifacts is skipped.

### nginx `/tasks/`

Public:

```
http(s)://<host>/tasks/
```

Same `:80` server as `/teaching/` (`/etc/nginx/conf.d/teaching.conf`, `TEACHING_CONF`). Snippet installed to `/etc/nginx/snippets/edges-tasks.conf`.

Snippet (setup script substitutes `__SITE_DIR__` with `<repo>/knowledge/tasks/_site`, trailing slash required for `alias`):

```nginx
# Persistent /tasks/ board (ADR 0021). Generated HTML only.
# Do not proxy to 8787. Do not add /teach/ aliases.

location = /tasks {
    return 301 /tasks/;
}

location /tasks/ {
    alias __SITE_DIR__/;
    index index.html;
}
```

`setup-nginx-tasks.sh` (run with sudo, once):

1. Resolve `SITE_DIR` from script location (`…/extensions/clis/deploy` → repo root → `knowledge/tasks/_site`) or `EDGES_REPO`.
2. `install` the rendered snippet to `/etc/nginx/snippets/edges-tasks.conf`.
3. Backup `TEACHING_CONF` (default `/etc/nginx/conf.d/teaching.conf`).
4. Run `inject_nginx_tasks_include.py` to insert `include /etc/nginx/snippets/edges-tasks.conf;` into every `server {` that already contains `/teaching/`.
5. `nginx -t` or restore backup; then reload.
6. Print curl checks: `/teaching/`, `/tasks/`, `/health`.

Injector rules (copy the artifacts injector shape, do **not** edit that file):

- Match `/teaching/` only.
- Idempotent if `edges-tasks.conf` is already mentioned.
- If no `/teaching/` server block: exit 1 and tell the operator to migrate leftover `teach.conf` / `/teach/` with `migrate-teaching-nginx-prefix.py`, then re-run. Do not dual-recognize old names.

Do **not** add `/tasks/` into `nginx-artifacts.conf`. Do **not** invent `/teach/` support.

### Tests

`pnpm --filter edges-cli test` must cover:

1. Flat list unchanged without `--group-by` (`tasks` present, no `schema` / `groups`).
2. `--group-by project --format json` → `schema === "edges.tasks.grouped/v1"`, `groups[{id,title,description?}]`, `items[{id|stem, group, title?, status?}]`, no `tasks`.
3. `--status` / `--project` / `--priority` / `--sort` applied before grouping (example: `--status todo --project cli --project docs --priority high --sort priority` yields only the matching items and only those two groups).
4. `--group-by status` and `--format table` → exit 2 `VALIDATION_ERROR`.
5. `edges tasks list --help` matches `--group-by` and `edges.tasks.grouped/v1`, does not match `review-page`.
6. `buildGroupedList` does not invent `current` / `suggested`.
7. `groupedListToReviewPageInput` sets `current === suggested === group`; mapped object has no `schema`.
8. `parseGroupedList` accepts CLI envelope or raw schema, and `id` or `stem`.
9. `generateTasksSite` writes HTML containing `edges-review-payload` and a created task title.

No live ECS / nginx test in CI. nginx is reviewed as committed snippet + setup script + ops note.

### Rollout

1. Land implementation PR (after this plan is approved). Do not merge the plan PR until the human says so.
2. One-time on ECS (sudo), **after** leftover teach→teaching migration if still needed:

```bash
sudo bash /home/cheng-dev/projects/edges/extensions/clis/deploy/setup-nginx-tasks.sh
```

3. Merge implementation to `main` → existing `deploy-teach.yml` pull + generate.
4. Checks (do not put tokens in the repo):

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://182.92.131.89/teaching/
curl -fsS -o /dev/null -w '%{http_code}\n' http://182.92.131.89/tasks/
curl -fsS http://182.92.131.89/health
```

`/teaching/` still the teach site. `/tasks/` is the generated board. `/health` still artifacts JSON `{"ok":true}`.

If generate fails after merge, the Action fails; the previous `_site/index.html` remains on disk until a successful generate (nginx keeps serving the last good file). Document that.

---

### Task 1: Grouped list schema + `list --group-by project`

**Files:**
- Create: `extensions/clis/src/tasks/utils/grouped.ts`
- Create: `extensions/clis/test/tasks/utils/grouped.test.ts`
- Create: `extensions/clis/test/tasks/grouped-list.test.ts`
- Modify: `extensions/clis/src/tasks/list.ts`
- Modify: `extensions/clis/src/tasks.ts`
- Modify: `extensions/clis/src/tasks/utils/format.ts`

**Interfaces:**
- Consumes: `listTasks`, `listProjectIds`, `readProjectRecord`, `seedTitleFor`, `seedDescriptionFor`, existing `TaskListOpts`
- Produces: `GROUPED_LIST_SCHEMA`, `GroupedList`, `buildGroupedList`, `parseGroupedList`, `listGroupedByProject`
- Produces: `run(["tasks", "list", "--group-by", "project", "--format", "json"])` stdout as locked above

- [ ] **Step 1: Write failing unit tests** in `test/tasks/utils/grouped.test.ts`

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  GROUPED_LIST_SCHEMA,
  buildGroupedList,
  parseGroupedList,
} from "../../../src/tasks/utils/grouped.js";

test("buildGroupedList emits edges.tasks.grouped/v1 with groups and items", () => {
  const grouped = buildGroupedList(
    [{
      stem: "2026-09-21--alpha",
      title: "Alpha",
      status: "todo",
      description: "first",
      path: "knowledge/tasks/_default/todo/2026-09-21--alpha.md",
      sidecarPath: "knowledge/tasks/_default/todo/.2026-09-21--alpha.log.md",
      runCount: 0,
      priority: "high",
      project: "default",
    }],
    [{ id: "default", title: "Default", description: "ungrouped" }],
  );
  assert.equal(grouped.schema, "edges.tasks.grouped/v1");
  assert.equal(grouped.schema, GROUPED_LIST_SCHEMA);
  assert.equal(grouped.groups[0]?.id, "default");
  assert.equal(grouped.items[0]?.id, "2026-09-21--alpha");
  assert.equal(grouped.items[0]?.group, "default");
  assert.equal(grouped.items[0]?.status, "todo");
  assert.equal("current" in grouped.items[0]!, false);
});

test("parseGroupedList accepts envelope or raw schema and id or stem", () => {
  const fromStem = parseGroupedList({
    status: "success",
    command: "list",
    schema: "edges.tasks.grouped/v1",
    groups: [{ id: "default", title: "Default" }],
    items: [{ stem: "2026-09-21--alpha", group: "default" }],
  });
  assert.equal(fromStem.items[0]?.id, "2026-09-21--alpha");
});
```

- [ ] **Step 2: Write failing CLI tests** in `test/tasks/grouped-list.test.ts` covering: flat list unchanged; `--group-by project --format json` schema; filters before grouping; `--group-by status` and `--format table` → exit 2; `list --help` documents `edges.tasks.grouped/v1` and does not mention `review-page`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd extensions/clis && node --test --import tsx './test/tasks/utils/grouped.test.ts' './test/tasks/grouped-list.test.ts'`

Expected: FAIL module not found / unknown option / help missing `--group-by`.

- [ ] **Step 4: Implement `grouped.ts` + list flags**

`listGroupedByProject` must use `listTasks` + `listProjectIds` + optional `readProjectRecord`. Never `ensureProjectMetadata`. Wire `list.ts` so `--group-by project` returns `{ status, command: "list", schema, groups, items }` and the default path still returns `{ tasks }`.

- [ ] **Step 5: Run tests to verify they pass**

Run: same command as Step 3. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add extensions/clis/src/tasks/utils/grouped.ts \
  extensions/clis/src/tasks/list.ts \
  extensions/clis/src/tasks.ts \
  extensions/clis/src/tasks/utils/format.ts \
  extensions/clis/test/tasks/utils/grouped.test.ts \
  extensions/clis/test/tasks/grouped-list.test.ts
git commit -m "feat(tasks): list --group-by project emits edges.tasks.grouped/v1"
```

Trailer: `Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>`

---

### Task 2: Thin map + generate helper

**Files:**
- Modify: `extensions/clis/src/tasks/utils/grouped.ts` (`groupedListToReviewPageInput`)
- Create: `extensions/clis/src/tasks/utils/generate-site.ts`
- Create: `extensions/clis/scripts/generate-tasks-site.ts`
- Modify: `extensions/clis/test/tasks/utils/grouped.test.ts`
- Create: `extensions/clis/test/tasks/utils/generate-site.test.ts`

**Interfaces:**
- Consumes: `GroupedList`, `parseGroupedList`, existing `run()`, `parseReviewPageInput` contract (`groups` + `items` with `stem` / `current` / `suggested`)
- Produces: `groupedListToReviewPageInput(grouped: GroupedList): ReviewPageInput`
- Produces: `generateTasksSite({ repoPath, outPath, env }): Promise<{ path, groupCount, itemCount }>`
- Produces: `DEFAULT_TASKS_SITE_REL = "knowledge/tasks/_site/index.html"`

- [ ] **Step 1: Write failing map + generate tests**

```ts
test("groupedListToReviewPageInput maps group → current/suggested without renaming schema", () => {
  const page = groupedListToReviewPageInput({
    schema: "edges.tasks.grouped/v1",
    groups: [{ id: "cli", title: "CLI" }],
    items: [{ id: "2026-09-21--beta", group: "cli", title: "Beta" }],
  });
  assert.equal(page.items[0]?.stem, "2026-09-21--beta");
  assert.equal(page.items[0]?.current, "cli");
  assert.equal(page.items[0]?.suggested, "cli");
  assert.equal("schema" in page, false);
});
```

Generate test: `edges tasks create` a card, call `generateTasksSite`, assert the HTML file exists and matches `/edges-review-payload/` and the card title.

- [ ] **Step 2: Run to verify fail**
- [ ] **Step 3: Implement map + `generateTasksSite` + script** (`list --group-by project --format json` → map → `review-page --from - --out`)
- [ ] **Step 4: Tests green**
- [ ] **Step 5: Commit** `feat(tasks): map grouped list to review-page HTML for /tasks/`

---

### Task 3: deploy-teach.yml generate step + gitignore

**Files:**
- Modify: `.github/workflows/deploy-teach.yml`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `extensions/clis/scripts/generate-tasks-site.ts` from Task 2
- Produces: after `reset --hard origin/main`, a failed generate fails the job; PATH is set even when artifacts env is missing

- [ ] **Step 1: Hoist PATH/nvm** out of the artifacts `if` in the remote SSH script (copy the existing exports verbatim).
- [ ] **Step 2: Insert the generate block** immediately after `git rev-parse HEAD`, before artifacts env detection. Include `test -s knowledge/tasks/_site/index.html`. Keep artifacts skip/install/restart unchanged.
- [ ] **Step 3: Add** `knowledge/tasks/_site/` to root `.gitignore`.
- [ ] **Step 4: Commit** `ci(teach): generate /tasks/ site after ECS pull`

No live SSH in CI for this task. Review the workflow diff against the locked script above.

---

### Task 4: nginx snippet + one-time setup

**Files:**
- Create: `extensions/clis/deploy/nginx-tasks.conf`
- Create: `extensions/clis/deploy/setup-nginx-tasks.sh`
- Create: `extensions/clis/deploy/inject_nginx_tasks_include.py`
- Create: `extensions/clis/deploy/README.md`

**Interfaces:**
- Produces: `/etc/nginx/snippets/edges-tasks.conf` with `/tasks/` → `__SITE_DIR__/`
- Produces: include inserted only into `teaching.conf` server blocks that contain `/teaching/`
- Does not modify `extensions/services/artifacts-preview/deploy/inject_nginx_include.py`

- [ ] **Step 1: Write the snippet, injector, and setup script** as locked in “nginx `/tasks/`”. Injector: Python 3.6 compatible (no annotations), same brace-matching approach as artifacts.
- [ ] **Step 2: Write ops note** (`deploy/README.md`): public URL `http(s)://<host>/tasks/`; generate command; one-time `sudo bash …/setup-nginx-tasks.sh`; leftover `teach.conf` must be migrated first; curl checks for `/teaching/`, `/tasks/`, `/health`; Action does not re-run setup-nginx.
- [ ] **Step 3: Commit** `chore(tasks): add nginx /tasks/ snippet and one-time setup`

---

### Task 5: Docs + changelog

**Files:**
- Modify: `extensions/clis/README.md`
- Modify: `CHANGELOG.md` `[Unreleased]`
- Modify: `CONTEXT.md` (`edges tasks（CLI）` — drop “约定中的” on `list --group-by project`)
- Point ops note from clis README to `extensions/clis/deploy/README.md` and ADR 0021

Root changelog (human Chinese + real command names; module **任务看板与项目**; do not dump ADR text):

```
### 任务看板与项目

- 可以用 `edges tasks list --group-by project`（可选 `--format json`）按任务项目分组列出看板，stdout 是松耦合的 `edges.tasks.grouped/v1`（`{ schema, groups[{id,title,description?}], items[{id|stem, group, title?, status?, …}] }`），不是审阅页格式。现有 `--status` / `--priority` / `--project` / `--sort` 仍先过滤再分组。部署链把这份 JSON 薄映射后交给 `edges tasks project review-page`，在盒上写成 `knowledge/tasks/_site/index.html`，公网固定入口是 `http(s)://<host>/tasks/`（与 `/teaching/` 同机，见 ADR 0021）。`review-page` 仍只渲染。
```

- [ ] **Step 1: Write the docs listed above**
- [ ] **Step 2: Commit** `docs(tasks): document list --group-by project and /tasks/ site`

---

### Task 6: Memory pointer + verify (implementation PR only)

- After code lands, update `.memory/projects/project_tasks_persistent_board_site.md` via `$project-memory-remember` (same slug): generate path, nginx snippet path, “Action generates after pull; setup-nginx is one-time”.
- Run `pnpm --filter edges-cli test`.
- Do **not** change Task board status.
- Leave the implementation PR open; do not merge unless the human asks.

---

## Self-review

1. **Spec coverage (ADR 0021):** not a new status station — Task 2 feeds existing review-page. Hard boundary vs Artifacts — generate + `/tasks/` alias, no `publish`. Same ECS path prefix — Task 4. Content from deploy-teach after pull — Task 3. Option B list → grouped schema → thin map → review-page — Tasks 1–2. No auth / writeback / `--mode` / new workflow / URL tree / board status — Non-goals + Global Constraints.
2. **Placeholders:** none; schema, flags, paths, nginx snippet, SSH generate block, curl checks, and changelog sentence are spelled out.
3. **Types:** `GROUPED_LIST_SCHEMA`, `GroupedList`, `groupedListToReviewPageInput`, `generateTasksSite`, `DEFAULT_TASKS_SITE_REL` are consistent across tasks. review-page still uses `stem` / `current` / `suggested` only after the map.
4. **Grill fidelity:** no dual `/teach/`, no new workflow, no review-page hosting, no Artifacts-as-permanent-board.
