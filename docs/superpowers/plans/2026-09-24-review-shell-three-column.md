# Review Shell Three-Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Written with the writing-plans skill.** This document is the plan. Do not treat it as the implementation.

**Goal:** Ship one Vite + React review shell for classifyTasks, proposeTypes, `edges tasks project review-page`, and `/tasks/`, with a project column, read-only status columns, a Markdown pane, and a grouped item `doc` that the page reads only from injected JSON.

**Architecture:** Source lives in `extensions/clis/review-app/`. Vite writes gitignored `index.html`, `review.js`, and `review.css` under `extensions/clis/src/tasks/project/assets/review-page/`. `review-page.ts` reads those three files, inlines the JS and CSS into one HTML file, and injects `#edges-review-payload`. Generators attach a Schema-aligned `doc` from `parseTaskDoc`. The browser never reads a Task markdown file. Navigation is hash or hash+query.

**Tech Stack:** Vite 8 + React 19 + Tailwind 4 + shadcn/ui (radix-nova, as scaffolded by `shadcn@4`), `@dnd-kit/core`, `react-markdown` + `remark-gfm`, Vitest 5 + Testing Library. CLI stays Node ≥20, TypeScript nodenext, `node:test` + `tsx`. Relative CLI imports end in `.js`.

**Spec:** `docs/adr/0022-review-shell-three-column-task-doc.md` (Amended pointers on `docs/adr/0012-task-project-review-page-is-render-only-cli.md` and `docs/adr/0021-persistent-tasks-board-site.md`). Schema: `extensions/clis/schemas/task-doc.v1.json` (`$id`: `edges.task-doc/v1`). Glossary in `CONTEXT.md`: **Task Doc（edges）**, **Task Project 审阅页（edges）**, **审阅壳（Review Shell）**, **`/tasks/` 持久看板站**, **分组列表 schema（edges.tasks.grouped）**, **doc（看板条目）**, **edges-task-assignee**, **edges tasks（CLI）**. Process note: `knowledge/notes/2026-09-24--Tasks审阅壳三列布局-grill与Playwright嵌入调研.md`. Task card (do not move): `knowledge/tasks/agent-clients-ux/in_progress/2026-09-21--review-page-改造三列布局-顶栏-filter.md`. Playwright evidence used below: `packages/html-reporter/vite.config.ts` (`inlineDynamicImports`, `entryFileNames: 'report.js'`, `assetFileNames` → `report.css`, `cssCodeSplit: false`, `assetsInlineLimit: 100000000`) and `packages/playwright/src/reporters/html.ts` `_writeStaticAssets` (inline `report.js` / `report.css`; data is a separate zip template that this plan does not copy). Hash shape: `packages/html-reporter/src/links.tsx` (`new URLSearchParams(window.location.hash.slice(1))`, links `#?` + params).

## Scope check

Packaging, the grouped `doc` field, and the three-column UI are one shell. A page without the inlined asset, or an asset without `doc`, is not a testable `/tasks/` or classify gate. Keep this as one plan.

The in-progress card still says the center board may reuse an open-source kanban component. ADR 0022 supersedes that sentence: draw the status columns in this app, and do not put Task, project, or status into a kanban library.

## Non-goals (do not implement; do not reopen)

- Git write-back and status-column drag (`knowledge/tasks/agent-clients-ux/backlog/2026-09-21--Tasks-review-review-page-写回仓接口.md`)
- Semantic search (`knowledge/tasks/agent-clients-ux/backlog/2026-09-23--Tasks审阅页-tasks站点语义检索.md`)
- Site auth, a unified agent helper, Artifacts → Pages
- `--mode`, a review-page MCP, public `classify` / `apply-review`
- Playwright zip+base64 payload, `doNotInlineAssets`, a second static tree, CLI-embedded Vite HMR
- Path history or react-router
- Moving the in-progress card, editing `knowledge/posts/`, or rewriting ADR 0022
- Committing `extensions/clis/src/tasks/project/assets/review-page/`

## Global Constraints

- One shell for classifyTasks, proposeTypes, local `edges tasks project review-page`, and persistent `/tasks/`. No `--mode`. No second page.
- Left column is Task Project. Click = filter and drop target (same meaning as today). Drag onto the left column changes **project only**. The「全部」row filters and is not a drop target.
- Center columns are the seven `edges-tasks-status` values, read-only. This round does not write status.
- Right column renders the selected item's `doc.body` with react-markdown + remark-gfm. No precompiled `bodyHtml`. Missing `doc` leaves the pane empty. The page does not read disk `.md`.
- Top bar filters: full-text search, `edges-task-priority`, assignee, `edges-tasks-status`. Full text searches the item title and description plus `doc.name` / `doc.description` / `doc.body`. Status and priority use the item fields and align with the same keys on `doc.metadata`. Assignee is only `doc.metadata["edges-task-assignee"]`. Do not add a parallel required assignee field on the item.
- Drag library is `@dnd-kit/core` and only for the left-column project change. Copy JSON stays `{ stem, current, suggested, action, note }` with `action` `keep` or `move`.
- Schema `$id` is `edges.task-doc/v1`. Required doc fields: `name`, `description`, `metadata`, `body`. `metadata` may contain unknown keys. `edges-tasks-status` is `backlog | todo | in_progress | in_review | done | blocked | cancelled`. `edges-task-priority` is `urgent | high | medium | low | none`. Absent priority reads as `none`.
- Grouped list stays `edges.tasks.grouped/v1` (`groups[]` + `items[]`). `doc` is optional on items. Do not add a second board schema. Flat `edges tasks list` (no `--group-by`) stays `{ status, command: "list", tasks: [...] }` and must not grow a `doc` field.
- Existing `--status` / `--priority` / `--project` / `--sort` still apply before grouping.
- Build output directory is gitignored. Generate it with `build:review-app`, `prepack`, CI, or the ECS deploy chain before writing `/tasks/`. Do not commit the built files.
- Runtime inlines `review.js` and `review.css`. Payload is `<script type="application/json" id="edges-review-payload">`. Not a zip. Not Playwright's `<template id="playwrightReportBase64">`.
- Navigation is hash or hash+query (`#?q=&priority=&assignee=&status=&project=&stem=`). No path history. No server rewrite.
- `edges tasks project review-page` stays render-only: no board writes, no browser open, no publish.
- CLI relative imports use `.js`. Tests: `node --test --import tsx './test/**/*.test.ts'` from `extensions/clis` (never `node --test --import tsx test`).
- Co-authored-by on every commit: `Coding 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Capability surface wording stays CLI + Skill + MCP.
- Root changelog, when the feature lands, is human Chinese under `### 任务看板与项目`. No schema field table. This plan file is not a changelog entry.
- Design A (2026-09-17): selected project uses accent `#5b9fd4` solid border; unselected project opacity is 0.6 (inside 0.55–0.7) and hover returns to 1; drag-over uses an outline offset from the border. Tokens: panel `#1a2332`, background `#0f1419`, text `#e7ecf3`, muted `#9aa8bc`, border `#334155`.
- Do not put `ingest` / `fs` / `writer` / `now` on `CliContext`.

---

## File map

**Create — review app**

- `extensions/clis/review-app/` — Vite app scaffolded by `shadcn init -t vite`, then edited. Package name `edges-review-app`. Not a nested pnpm workspace.
- `extensions/clis/review-app/vite.config.ts` — Playwright-aligned `build` (`outDir`, `inlineDynamicImports`, fixed `review.js` / `review.css`).
- `extensions/clis/review-app/src/statuses.ts` — status and priority enums read from `task-doc.v1.json`.
- `extensions/clis/review-app/src/types.ts` — `TaskDoc`, `ReviewGroup`, `ReviewItem`, `ReviewPayload`.
- `extensions/clis/review-app/src/filter.ts` — `matchesReviewFilter`, `itemStatus`, `itemPriority`, `itemAssignee`, `itemSearchText`.
- `extensions/clis/review-app/src/hash.ts` — `parseReviewHash`, `buildReviewHash`, `navigateReviewHash`.
- `extensions/clis/review-app/src/export.ts` — `exportReviewRows`, `applyProjectDrop`.
- `extensions/clis/review-app/src/dev-mock.ts` — dev-only payload. Production bundle must not contain its marker stem.
- `extensions/clis/review-app/src/components/TopBar.tsx` — search, priority, assignee, status, Copy JSON.
- `extensions/clis/review-app/src/components/ProjectColumn.tsx` — filter + drop targets.
- `extensions/clis/review-app/src/components/StatusBoard.tsx` — seven read-only columns plus an optional `未标注` column.
- `extensions/clis/review-app/src/components/TaskCard.tsx` — stem, title, project tag, updated time; draggable.
- `extensions/clis/review-app/src/components/MarkdownPane.tsx` — `doc.body` preview.
- `extensions/clis/review-app/src/App.tsx` — wires the four regions, hash, and dnd-kit.
- `extensions/clis/review-app/test/*.test.ts(x)` — Vitest.

**Create — CLI doc mapping**

- `extensions/clis/src/tasks/utils/task-doc.ts` — `TaskDoc`, `taskDocFromParsed`, `taskDocFromMarkdown`.
- `extensions/clis/test/tasks/review-app-build.test.ts` — fixed filenames, gitignore, dev-mock excluded from `review.js`.

**Modify — CLI**

- `extensions/clis/src/tasks/utils/board.ts` — `readListItem` also returns `doc`; `listTasks` still strips it; grouped listing keeps it.
- `extensions/clis/src/tasks/utils/grouped.ts` — optional `doc` on items; map passes `doc`, `status`, `priority`.
- `extensions/clis/src/tasks/utils/review-page.ts` — optional `doc` / `status` / `priority`; load three assets; inline JS/CSS; inject payload.
- `extensions/clis/src/tasks/project/review-page.ts` — call the asset loader instead of the handwritten HTML file.
- `extensions/clis/src/tasks/list.ts` — one help sentence: grouped items may include optional `doc`.
- `extensions/clis/package.json` — `build:review-app`, `prepack`, test depends on the app build, `edges-review-app` workspace devDependency.
- `extensions/clis/scripts/copy-review-page-asset.mjs` — still copies `src/tasks/project/assets` onto `dist` (the built directory is inside that tree).
- `extensions/clis/test/tasks/utils/grouped.test.ts`, `review-page.test.ts`, `grouped-list.test.ts` — `doc` present on grouped list, absent on flat list, optional on review-page input.
- Delete `extensions/clis/src/tasks/project/assets/review-page.html` once the inlined shell replaces it.

**Modify — repo wiring**

- `pnpm-workspace.yaml` — add `extensions/clis/review-app`.
- `.gitignore` — `extensions/clis/src/tasks/project/assets/review-page/`.
- `.github/workflows/deploy.yml` — install the new package and `pnpm --filter edges-review-app run build` before `generate-tasks-site.ts`.
- `extensions/clis/README.md`, `extensions/clis/deploy/README.md` — build-before-generate.
- `extensions/skills/project-tasks-classify/SKILL.md` + `CHANGELOG.md` — optional thin `doc`; export row unchanged. Version `1.2.0` (tag `1.1.0` already exists; `SKILL.md` on this branch is still `1.0.0`).
- `CHANGELOG.md` — one Chinese Unreleased bullet under `### 任务看板与项目` when the feature lands.
- Root `pnpm-lock.yaml` — the only lockfile to update. Delete any `pnpm-lock.yaml` or `pnpm-workspace.yaml` the shadcn scaffold writes inside `review-app/`.

---

### Task 1: Scaffold the review app and lock the Playwright build

**Files:**
- Create: `extensions/clis/review-app/**` (shadcn Vite scaffold, then the edits in this task)
- Create: `extensions/clis/test/tasks/review-app-build.test.ts`
- Modify: `pnpm-workspace.yaml`
- Modify: `.gitignore`
- Modify: `extensions/clis/package.json`
- Modify: `pnpm-lock.yaml`
- Test: `extensions/clis/test/tasks/review-app-build.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `pnpm --filter edges-review-app run build` writes exactly these three files into `extensions/clis/src/tasks/project/assets/review-page/`: `index.html`, `review.js`, `review.css`. `index.html` references `review.js` and `review.css` (the CLI inlines them in Task 4). `review.js` does not contain the string `DEV-MOCK-STEM-NOT-IN-PROD`. Package script `build:review-app` on `edges-cli` runs that build. `prepack` runs `pnpm run build`.

- [ ] **Step 1: Write the failing test**

Create `extensions/clis/test/tasks/review-app-build.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const assetDir = path.join(
  repoRoot,
  "extensions/clis/src/tasks/project/assets/review-page",
);

test("build:review-app emits index.html, review.js, and review.css only", () => {
  const built = spawnSync("pnpm", ["--filter", "edges-review-app", "run", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(built.status, 0, built.stderr || built.stdout);
  assert.deepEqual(readdirSync(assetDir).sort(), ["index.html", "review.css", "review.js"]);
  const html = readFileSync(path.join(assetDir, "index.html"), "utf8");
  assert.match(html, /review\.js/);
  assert.match(html, /review\.css/);
  assert.match(html, /id="edges-review-payload"/);
  const js = readFileSync(path.join(assetDir, "review.js"), "utf8");
  assert.equal(js.includes("DEV-MOCK-STEM-NOT-IN-PROD"), false);
  const ignored = spawnSync("git", ["check-ignore", "-q", path.join(assetDir, "review.js")], {
    cwd: repoRoot,
  });
  assert.equal(ignored.status, 0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from the repo root:

```bash
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/review-app-build.test.ts
```

Expected: FAIL because `edges-review-app` is not a workspace package yet.

- [ ] **Step 3: Scaffold, then replace the Vite build**

From the repo root:

```bash
mkdir -p extensions/clis/review-app
pnpm dlx shadcn@latest init -t vite -y --no-monorepo -b radix -p nova -c extensions/clis/review-app
rm -f extensions/clis/review-app/pnpm-workspace.yaml extensions/clis/review-app/pnpm-lock.yaml extensions/clis/review-app/README.md
rm -rf extensions/clis/review-app/public
```

Do not pass `-n`. That flag nests a second directory. If a nested `edges-review-app/` appears, move its files up into `extensions/clis/review-app/` and delete the extra directory.

Add the package to the root workspace. In `pnpm-workspace.yaml`:

```yaml
packages:
  - 'extensions/mcp-servers/*'
  - 'extensions/clis'
  - 'extensions/clis/review-app'
  - 'extensions/services/*'
```

Append to the root `.gitignore`:

```
# Review shell Vite outDir (ADR 0022). Source is extensions/clis/review-app/.
extensions/clis/src/tasks/project/assets/review-page/
```

Replace `extensions/clis/review-app/vite.config.ts` with:

```ts
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const outDir = path.resolve(
  __dirname,
  "../src/tasks/project/assets/review-page",
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "",
  build: {
    outDir,
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
        entryFileNames: "review.js",
        assetFileNames: (assetInfo) =>
          assetInfo.names.some((name) => name.endsWith(".css"))
            ? "review.css"
            : "[name][extname]",
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
  },
});
```

Replace `extensions/clis/review-app/index.html` with:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Task Project 审阅页</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="application/json" id="edges-review-payload">{}</script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Replace `extensions/clis/review-app/src/App.tsx` with a placeholder the later tasks replace. Keep `data-review-shell="edges"`:

```tsx
export default function App() {
  return <div data-review-shell="edges">edges-review-app</div>;
}
```

Create `extensions/clis/review-app/src/dev-mock.ts`:

```ts
export const mockPayload = {
  groups: [{ id: "default", title: "Default", description: "" }],
  items: [
    {
      stem: "DEV-MOCK-STEM-NOT-IN-PROD",
      current: "default",
      suggested: "default",
      title: "Dev mock",
    },
  ],
};
```

In `extensions/clis/review-app/src/main.tsx`, load the dev mock only when `import.meta.env.DEV` is true, and pass nothing else into the production graph:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("review app missing #root");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.DEV) {
  void import("./dev-mock.ts").then((mod) => {
    const el = document.getElementById("edges-review-payload");
    if (el && (el.textContent ?? "").trim() === "{}") {
      el.textContent = JSON.stringify(mod.mockPayload);
    }
  });
}
```

`ThemeProvider` from the scaffold may stay or go. The placeholder does not need it. Delete the favicon link if the scaffold's `index.html` replacement above is what you saved.

Add scripts on `edges-review-app` (keep the scaffold's `tsc -b && vite build` as `build`). Add a test script:

```json
"test": "vitest run"
```

Install Vitest 5 (peers with Vite 8) from the repo root:

```bash
pnpm --filter edges-review-app add -D vitest@^5.0.1 jsdom @testing-library/react @testing-library/user-event
```

Point `edges-cli` at the app. In `extensions/clis/package.json`:

```json
"scripts": {
  "build:review-app": "pnpm --filter edges-review-app run build",
  "build": "pnpm run build:review-app && tsc -p tsconfig.json && node ./scripts/copy-review-page-asset.mjs",
  "prepack": "pnpm run build",
  "start": "node dist/index.js",
  "dev": "tsx src/index.ts",
  "dev:review-app": "pnpm --filter edges-review-app run dev",
  "test": "pnpm run build:review-app && node --test --import tsx './test/**/*.test.ts'"
},
"devDependencies": {
  "edges-review-app": "workspace:*",
  "@types/node": "^22.19.11",
  "tsx": "^4.19.3",
  "typescript": "^5.8.2"
}
```

Keep the existing `dependencies` block. Then:

```bash
pnpm install --filter edges-cli... --filter edges-review-app...
```

Commit the root `pnpm-lock.yaml` only.

`copy-review-page-asset.mjs` already copies `src/tasks/project/assets` recursively. Leave it. After this task the handwritten `review-page.html` is still there; Task 4 deletes it.

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/review-app-build.test.ts
```

Expected: PASS. `git status --short` does not list `extensions/clis/src/tasks/project/assets/review-page/` as a file to add.

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml .gitignore extensions/clis/package.json extensions/clis/review-app extensions/clis/test/tasks/review-app-build.test.ts
git commit -m "$(cat <<'EOF'
build: scaffold review shell with fixed Vite filenames

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>
EOF
)"
```

---

### Task 2: Put optional Task Doc on grouped items

**Files:**
- Create: `extensions/clis/src/tasks/utils/task-doc.ts`
- Modify: `extensions/clis/src/tasks/utils/board.ts` (`readListItem` around the `parseTaskDoc` call)
- Modify: `extensions/clis/src/tasks/utils/grouped.ts`
- Modify: `extensions/clis/src/tasks/list.ts` (help text only)
- Test: `extensions/clis/test/tasks/utils/grouped.test.ts`
- Test: `extensions/clis/test/tasks/grouped-list.test.ts`

**Interfaces:**
- Consumes: `parseTaskDoc` from `extensions/clis/src/tasks/utils/frontmatter.ts` returns `{ name, description, metadata, body, rawFrontmatter }`. `TaskListItem` stays stem/title/status/description/path/sidecarPath/runCount/priority/project.
- Produces:
  - `export type TaskDoc = { name: string; description: string; metadata: Record<string, string>; body: string }`
  - `export function taskDocFromMarkdown(markdown: string): TaskDoc`
  - `export type GroupedTaskInput = TaskListItem & { doc?: TaskDoc }`
  - `buildGroupedList(tasks: GroupedTaskInput[], groups: GroupedListGroup[]): GroupedList`
  - `GroupedListItem` gains optional `doc?: TaskDoc`. `status` and `priority` stay optional strings.
  - `listTasks` return value does not include `doc`.
  - `listGroupedByProject` items include `doc` taken from `taskDocFromMarkdown` of the Task file. `rawFrontmatter` is not copied.

- [ ] **Step 1: Write the failing test**

Add to `extensions/clis/test/tasks/utils/grouped.test.ts`:

```ts
test("buildGroupedList copies doc and omits rawFrontmatter", () => {
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
      doc: {
        name: "alpha",
        description: "first",
        metadata: {
          "edges-type": "task",
          "edges-title": "Alpha",
          "edges-tasks-status": "todo",
          "edges-task-priority": "high",
          "edges-task-assignee": "Ada",
          "edges-updated-at": "2026-09-21T00:00:00.000Z",
        },
        body: "hello body",
      },
    }],
    [{ id: "default", title: "Default", description: "ungrouped" }],
  );
  assert.equal(grouped.items[0]?.doc?.body, "hello body");
  assert.equal(grouped.items[0]?.doc?.metadata["edges-task-assignee"], "Ada");
  assert.equal("rawFrontmatter" in (grouped.items[0]?.doc ?? {}), false);
});

test("buildGroupedList omits doc when the caller has none", () => {
  const grouped = buildGroupedList(
    [{
      stem: "2026-09-21--alpha",
      title: "Alpha",
      status: "todo",
      description: "first",
      path: "p",
      sidecarPath: "s",
      runCount: 0,
      priority: "none",
      project: "default",
    }],
    [{ id: "default", title: "Default" }],
  );
  assert.equal("doc" in grouped.items[0]!, false);
});
```

Add to `extensions/clis/test/tasks/grouped-list.test.ts` inside the existing `--group-by project` test, after `assert.equal(item?.status, "todo")`:

```ts
assert.equal(item?.doc?.name !== undefined, true);
assert.equal(typeof item?.doc?.body, "string");
assert.equal(item?.doc?.metadata["edges-tasks-status"], "todo");
assert.equal("rawFrontmatter" in (item?.doc ?? {}), false);
```

And in the flat-list test, after `assert.equal(body.tasks.length, 1)`:

```ts
assert.equal("doc" in body.tasks[0]!, false);
```

Widen the flat-list task element type with `doc?: unknown` so the assertion typechecks.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/utils/grouped.test.ts ./test/tasks/grouped-list.test.ts
```

Expected: FAIL. `buildGroupedList` drops `doc`. `list --group-by` items have no `doc`.

- [ ] **Step 3: Write the minimal implementation**

Create `extensions/clis/src/tasks/utils/task-doc.ts`:

```ts
import { parseTaskDoc, type ParsedTaskDoc } from "./frontmatter.js";

export type TaskDoc = {
  name: string;
  description: string;
  metadata: Record<string, string>;
  body: string;
};

export function taskDocFromParsed(doc: ParsedTaskDoc): TaskDoc {
  return {
    name: doc.name,
    description: doc.description,
    metadata: { ...doc.metadata },
    body: doc.body,
  };
}

export function taskDocFromMarkdown(markdown: string): TaskDoc {
  return taskDocFromParsed(parseTaskDoc(markdown));
}
```

In `board.ts`, change `readListItem` so it returns both the list item and the doc:

```ts
import { taskDocFromParsed, type TaskDoc } from "./task-doc.js";

export type ListedTask = {
  item: TaskListItem;
  doc: TaskDoc;
};

async function readListItem(...): Promise<ListedTask> {
  // existing path / sidecar / parseTaskDoc / assertProjectDualWrite logic
  const doc = taskDocFromParsed(parsed);
  return {
    doc,
    item: {
      stem,
      title: doc.metadata["edges-title"] || doc.name || stem,
      status,
      description: doc.description,
      path: rel,
      sidecarPath: sidecarRel,
      runCount,
      priority: priorityFromMetadata(doc.metadata),
      project: resolvedProject,
    },
  };
}
```

`listStatusDir` maps `(await readListItem(...)).item`. Add:

```ts
export async function listTasksWithDocs(
  repoPath: string,
  opts: TaskListOpts,
  fs: BoardFs,
): Promise<Array<TaskListItem & { doc: TaskDoc }>> {
  const projects = await listProjectIds(repoPath, fs);
  const statuses = opts.status ? [opts.status] : [...TASK_STATUSES];
  const rows: Array<TaskListItem & { doc: TaskDoc }> = [];
  for (const project of projects) {
    for (const status of statuses) {
      const dir = statusDir(repoPath, project, status);
      if (!(await fs.exists(dir))) {
        continue;
      }
      const names = await fs.readdir(dir);
      for (const name of names) {
        if (!isTaskMarkdownName(name)) {
          continue;
        }
        const stem = stemFromFilename(name);
        if (!stem) {
          continue;
        }
        const listed = await readListItem(repoPath, project, status, stem, fs);
        rows.push({ ...listed.item, doc: listed.doc });
      }
    }
  }
  const priorityFiltered = filterTasksByPriority(rows, opts.priorities ?? []);
  const filtered = filterTasksByProject(priorityFiltered, opts.projects ?? []);
  if (opts.sort === "priority") {
    return sortTasksByPriority(filtered);
  }
  if (opts.sort !== undefined) {
    throw new TasksError("VALIDATION_ERROR", `invalid --sort: ${String(opts.sort)} (expected priority)`);
  }
  return filtered;
}

export async function listTasks(...): Promise<TaskListItem[]> {
  const rows = await listTasksWithDocs(repoPath, opts, fs);
  return rows.map(({ doc: _doc, ...item }) => item);
}
```

`listTasks` must call `listTasksWithDocs` and drop `doc`. Delete the old walk inside `listTasks` so the board is read once.

In `grouped.ts`:

```ts
import type { TaskDoc } from "./task-doc.js";

export type GroupedTaskInput = TaskListItem & { doc?: TaskDoc };

export type GroupedListItem = {
  id: string;
  stem?: string;
  group: string;
  title?: string;
  status?: string;
  description?: string;
  priority?: string;
  doc?: TaskDoc;
};

export function buildGroupedList(tasks: GroupedTaskInput[], groups: GroupedListGroup[]): GroupedList {
  return {
    schema: GROUPED_LIST_SCHEMA,
    groups: groups.length > 0 ? groups : fallbackGroups(),
    items: tasks.map((task) => {
      const item: GroupedListItem = {
        id: task.stem,
        stem: task.stem,
        group: task.project,
        title: task.title,
        status: task.status,
        description: task.description,
        priority: task.priority,
      };
      if (task.doc) {
        item.doc = task.doc;
      }
      return item;
    }),
  };
}
```

`parseItem`: if `raw.doc` is present, assign `item.doc = parseTaskDocField(raw.doc)`.

```ts
function parseTaskDocField(raw: unknown): TaskDoc {
  if (!isPlainObject(raw)) {
    throw new TasksError("VALIDATION_ERROR", "grouped list doc must be an object");
  }
  if (typeof raw.name !== "string" || typeof raw.description !== "string" || typeof raw.body !== "string") {
    throw new TasksError("VALIDATION_ERROR", "grouped list doc requires name, description, and body strings");
  }
  if (!isPlainObject(raw.metadata)) {
    throw new TasksError("VALIDATION_ERROR", "grouped list doc.metadata must be an object");
  }
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw.metadata)) {
    if (typeof value !== "string") {
      throw new TasksError("VALIDATION_ERROR", `grouped list doc.metadata.${key} must be a string`);
    }
    metadata[key] = value;
  }
  return { name: raw.name, description: raw.description, metadata, body: raw.body };
}
```

`listGroupedByProject` calls `listTasksWithDocs` instead of `listTasks`, then `buildGroupedList(rows, groups)`.

In `list.ts` `LIST_AFTER_HELP`, replace the grouped stdout sentence with:

```
Grouped stdout (edges.tasks.grouped/v1) is { schema, groups, items }. Items may include optional doc (name, description, metadata, body). Without --group-by the envelope stays { status, command: "list", tasks: [...] } and tasks do not include doc.
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/utils/grouped.test.ts ./test/tasks/grouped-list.test.ts
```

Expected: PASS. Flat list still has no `doc`.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/task-doc.ts extensions/clis/src/tasks/utils/board.ts extensions/clis/src/tasks/utils/grouped.ts extensions/clis/src/tasks/list.ts extensions/clis/test/tasks/utils/grouped.test.ts extensions/clis/test/tasks/grouped-list.test.ts
git commit -m "$(cat <<'EOF'
feat: embed optional Task Doc on grouped task items

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>
EOF
)"
```

---

### Task 3: Pass doc through the review-page payload

**Files:**
- Modify: `extensions/clis/src/tasks/utils/review-page.ts` (`ReviewPageItem`, `parseItem`)
- Modify: `extensions/clis/src/tasks/utils/grouped.ts` (`groupedListToReviewPageInput`)
- Test: `extensions/clis/test/tasks/utils/review-page.test.ts`
- Test: `extensions/clis/test/tasks/utils/grouped.test.ts`

**Interfaces:**
- Consumes: `TaskDoc` from `task-doc.ts`. `GroupedListItem.doc`, `.status`, `.priority`.
- Produces: `ReviewPageItem` is `{ stem, current, suggested, title?, description?, note?, status?, priority?, doc? }`. No `assignee` field. `parseReviewPageInput` accepts a missing `doc` (classify JSON). A present `doc` must have string `name`, `description`, `body`, and string metadata values. `groupedListToReviewPageInput` copies `status`, `priority`, and `doc` onto the page item. `current` and `suggested` both start as the grouped `group`.

- [ ] **Step 1: Write the failing test**

Add to `extensions/clis/test/tasks/utils/grouped.test.ts`:

```ts
test("groupedListToReviewPageInput copies status, priority, and doc", () => {
  const page = groupedListToReviewPageInput({
    schema: "edges.tasks.grouped/v1",
    groups: [{ id: "cli", title: "CLI" }],
    items: [{
      id: "2026-09-21--beta",
      group: "cli",
      title: "Beta",
      status: "todo",
      priority: "high",
      doc: {
        name: "beta",
        description: "d",
        metadata: { "edges-task-assignee": "Ada" },
        body: "body",
      },
    }],
  });
  assert.equal(page.items[0]?.status, "todo");
  assert.equal(page.items[0]?.priority, "high");
  assert.equal(page.items[0]?.doc?.body, "body");
  assert.equal(page.items[0]?.current, "cli");
  assert.equal(page.items[0]?.suggested, "cli");
  assert.equal("assignee" in page.items[0]!, false);
});
```

Add to `extensions/clis/test/tasks/utils/review-page.test.ts`:

```ts
test("parseReviewPageInput keeps a thin doc and allows a missing doc", () => {
  const withDoc = parseReviewPageInput({
    groups: sample.groups,
    items: [{
      ...sample.items[0],
      status: "todo",
      priority: "low",
      doc: {
        name: "demo",
        description: "demo task",
        metadata: { "edges-task-assignee": "Ada", "extra-key": "kept" },
        body: "",
      },
    }],
  });
  assert.equal(withDoc.items[0]?.doc?.body, "");
  assert.equal(withDoc.items[0]?.doc?.metadata["extra-key"], "kept");
  assert.equal(withDoc.items[0]?.status, "todo");
  assert.equal(withDoc.items[0]?.priority, "low");

  const withoutDoc = parseReviewPageInput(sample);
  assert.equal(withoutDoc.items[0]?.doc, undefined);
});

test("parseReviewPageInput rejects a doc that is missing body", () => {
  assert.throws(
    () =>
      parseReviewPageInput({
        groups: sample.groups,
        items: [{
          ...sample.items[0],
          doc: { name: "demo", description: "d", metadata: {} },
        }],
      }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /review-page doc requires name, description, and body strings/);
      return true;
    },
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/utils/grouped.test.ts ./test/tasks/utils/review-page.test.ts
```

Expected: FAIL. The map drops `status` / `priority` / `doc`. The parser drops them too.

- [ ] **Step 3: Write the minimal implementation**

Extend `ReviewPageItem` in `review-page.ts`:

```ts
import type { TaskDoc } from "./task-doc.js";

export type ReviewPageItem = {
  stem: string;
  current: string;
  suggested: string;
  title?: string;
  description?: string;
  note?: string;
  status?: string;
  priority?: string;
  doc?: TaskDoc;
};
```

In `parseItem`, after the optional title/description/note copies:

```ts
const status = optionalString(raw.status);
const priority = optionalString(raw.priority);
if (status !== undefined) {
  item.status = status;
}
if (priority !== undefined) {
  item.priority = priority;
}
if ("doc" in raw && raw.doc !== undefined) {
  item.doc = parseReviewDoc(raw.doc);
}

function parseReviewDoc(raw: unknown): TaskDoc {
  if (!isPlainObject(raw)) {
    fail("review-page doc must be an object");
  }
  if (typeof raw.name !== "string" || typeof raw.description !== "string" || typeof raw.body !== "string") {
    fail("review-page doc requires name, description, and body strings");
  }
  if (!isPlainObject(raw.metadata)) {
    fail("review-page doc.metadata must be an object");
  }
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw.metadata)) {
    if (typeof value !== "string") {
      fail(`review-page doc.metadata.${key} must be a string`);
    }
    metadata[key] = value;
  }
  return { name: raw.name, description: raw.description, metadata, body: raw.body };
}
```

In `groupedListToReviewPageInput`, copy the three fields the same way `title` is copied today:

```ts
if (item.status !== undefined) {
  mapped.status = item.status;
}
if (item.priority !== undefined) {
  mapped.priority = item.priority;
}
if (item.doc !== undefined) {
  mapped.doc = item.doc;
}
```

`renderReviewPageHtml` already `JSON.stringify`s `{ groups, items }`, so the new fields ride along. Keep the `<` → `\u003c` escape.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/utils/grouped.test.ts ./test/tasks/utils/review-page.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/review-page.ts extensions/clis/src/tasks/utils/grouped.ts extensions/clis/test/tasks/utils/grouped.test.ts extensions/clis/test/tasks/utils/review-page.test.ts
git commit -m "$(cat <<'EOF'
feat: carry optional doc through the review-page payload

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>
EOF
)"
```

---

### Task 4: Inline the built shell instead of the handwritten HTML

**Files:**
- Modify: `extensions/clis/src/tasks/utils/review-page.ts`
- Modify: `extensions/clis/src/tasks/project/review-page.ts`
- Delete: `extensions/clis/src/tasks/project/assets/review-page.html`
- Test: `extensions/clis/test/tasks/utils/review-page.test.ts`

**Interfaces:**
- Consumes: Task 1's three files at `defaultReviewPageAssetDir()`. `renderReviewPageHtml(input, shellHtml)` still replaces `#edges-review-payload`.
- Produces:
  - `export function defaultReviewPageAssetDir(): string` — directory URL `../project/assets/review-page/` next to the compiled or `tsx` module.
  - `export async function loadBuiltReviewShell(readFile: (abs: string) => Promise<string>, assetDir?: string): Promise<string>` — reads `index.html`, `review.js`, `review.css`, inlines them, returns one HTML string that still contains an empty payload script.
  - Missing asset throws `TasksError` `VALIDATION_ERROR` with message `review-page asset missing: <absolute path> (run pnpm --filter edges-cli run build:review-app)`.
  - `project/review-page.ts` calls `loadBuiltReviewShell` then `renderReviewPageHtml`. Stdout stays `{ status, command: "project.review-page", path, groupCount, itemCount }`.

- [ ] **Step 1: Write the failing test**

Replace the tests that read `review-page.html`, `filterId`, and design-A `<style>` blocks. Those assertions move to Vitest in Tasks 5 and 6. Keep the parser tests from Task 3.

Add:

```ts
test("loadBuiltReviewShell inlines js and css and keeps the payload slot", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-shell-"));
  try {
    await writeFile(
      path.join(dir, "index.html"),
      `<!doctype html><html><head><link rel="stylesheet" crossorigin href="./review.css"></head><body><script type="application/json" id="edges-review-payload">{}</script><script type="module" crossorigin src="./review.js"></script></body></html>`,
    );
    await writeFile(path.join(dir, "review.js"), "window.__review = true;</script>");
    await writeFile(path.join(dir, "review.css"), "body{color:red}</style>");
    const shell = await loadBuiltReviewShell((abs) => readFile(abs, "utf8"), dir);
    assert.match(shell, /<script type="module">window\.__review = true;<\\\/script>/);
    assert.match(shell, /<style type='text\/css'>body\{color:red\}<\\\/style>/);
    assert.doesNotMatch(shell, /src="\.\/review\.js"/);
    assert.doesNotMatch(shell, /href="\.\/review\.css"/);
    const html = renderReviewPageHtml(sample as never, shell);
    assert.match(html, /2026-09-13--demo/);
    assert.doesNotMatch(html, /id="edges-review-payload">\{\}<\/script>/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("loadBuiltReviewShell names the build command when an asset is missing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-shell-"));
  try {
    await assert.rejects(
      () => loadBuiltReviewShell((abs) => readFile(abs, "utf8"), dir),
      (error: unknown) => {
        assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
        assert.match((error as Error).message, /review-page asset missing:/);
        assert.match((error as Error).message, /pnpm --filter edges-cli run build:review-app/);
        return true;
      },
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("default asset dir is the gitignored review-page build", () => {
  assert.match(defaultReviewPageAssetDir(), /project[/\\]assets[/\\]review-page[/\\]?$/);
});
```

Delete `defaultReviewPageTemplatePath` / `loadReviewPageTemplate` imports from this test.

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/utils/review-page.test.ts
```

Expected: FAIL with `loadBuiltReviewShell is not exported` (or the old template tests failing once you remove them — the new test must be the one that fails for a missing export).

- [ ] **Step 3: Write the minimal implementation**

In `review-page.ts`, replace the template path helpers:

```ts
export function defaultReviewPageAssetDir(): string {
  return fileURLToPath(new URL("../project/assets/review-page/", import.meta.url));
}

function missingAsset(abs: string): never {
  fail(`review-page asset missing: ${abs} (run pnpm --filter edges-cli run build:review-app)`);
}

async function readAsset(
  readFile: (abs: string) => Promise<string>,
  abs: string,
): Promise<string> {
  try {
    return await readFile(abs);
  } catch {
    missingAsset(abs);
  }
}

export async function loadBuiltReviewShell(
  readFile: (abs: string) => Promise<string>,
  assetDir?: string,
): Promise<string> {
  const dir = assetDir ?? defaultReviewPageAssetDir();
  const html = await readAsset(readFile, path.join(dir, "index.html"));
  const js = await readAsset(readFile, path.join(dir, "review.js"));
  const css = await readAsset(readFile, path.join(dir, "review.css"));
  const safeJs = js.replaceAll("</script", "<\\/script");
  const safeCss = css.replaceAll("</style", "<\\/style");
  return html
    .replace(
      /<script type="module"[^>]*><\/script>/,
      () => `<script type="module">${safeJs}</script>`,
    )
    .replace(
      /<link rel="stylesheet"[^>]*>/,
      () => `<style type='text/css'>${safeCss}</style>`,
    );
}
```

`renderReviewPageHtml` stays. It still requires the payload script and still escapes `<`.

In `project/review-page.ts`:

```ts
const shell = await loadBuiltReviewShell((abs) => readFile(abs, "utf8"));
const html = renderReviewPageHtml(input, shell);
```

Delete `extensions/clis/src/tasks/project/assets/review-page.html`.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm --filter edges-cli run build:review-app
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/utils/review-page.test.ts
```

Expected: PASS. Grep the repo for `review-page.html` and update any remaining test import. `extensions/clis/README.md` still describes a single-file HTML page; Task 7 updates that sentence.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/review-page.ts extensions/clis/src/tasks/project/review-page.ts extensions/clis/src/tasks/project/assets/review-page.html extensions/clis/test/tasks/utils/review-page.test.ts
git commit -m "$(cat <<'EOF'
feat: inline the prebuilt review shell into one HTML file

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>
EOF
)"
```

---

### Task 5: Draw the three columns, filters, hash, and Markdown pane

**Files:**
- Create: `extensions/clis/review-app/src/types.ts`
- Create: `extensions/clis/review-app/src/statuses.ts`
- Create: `extensions/clis/review-app/src/filter.ts`
- Create: `extensions/clis/review-app/src/hash.ts`
- Create: `extensions/clis/review-app/src/components/TopBar.tsx`
- Create: `extensions/clis/review-app/src/components/ProjectColumn.tsx`
- Create: `extensions/clis/review-app/src/components/StatusBoard.tsx`
- Create: `extensions/clis/review-app/src/components/TaskCard.tsx`
- Create: `extensions/clis/review-app/src/components/MarkdownPane.tsx`
- Modify: `extensions/clis/review-app/src/App.tsx`
- Modify: `extensions/clis/review-app/src/index.css` (append the dark tokens; do not delete the scaffold's Tailwind import)
- Test: `extensions/clis/review-app/test/filter.test.ts`
- Test: `extensions/clis/review-app/test/hash.test.ts`
- Test: `extensions/clis/review-app/test/shell.test.tsx`

**Interfaces:**
- Consumes: payload shape from Task 3. Schema enums from `extensions/clis/schemas/task-doc.v1.json`.
- Produces:
  - `matchesReviewFilter(item: ReviewItem, filter: ReviewFilter): boolean`
  - `itemStatus`, `itemPriority`, `itemAssignee`, `itemSearchText`
  - `parseReviewHash(hash: string): ReviewHashState`
  - `buildReviewHash(state: ReviewHashState): string` — always starts with `#?`
  - `navigateReviewHash(href: string): void` — `history.pushState` plus a `popstate` event
  - `REVIEW_STATUS_COLUMNS` — the seven schema statuses, in schema order
  - App root element `data-review-shell="edges"`

`ReviewFilter` is `{ q: string; priority: "all" | TaskPriority; assignee: string; status: "all" | TaskStatus; projectId: string }`. `projectId` `"all"` means「全部」. `assignee` `""` means every assignee.

Status alignment: if `doc.metadata["edges-tasks-status"]` is a non-empty string, use it; otherwise use `item.status`. Priority: same with `edges-task-priority`; if both are missing, the value is `none`. Assignee: only `doc.metadata["edges-task-assignee"]`, else `""`.

An item whose status is missing or not one of the seven renders in a column `data-status-column="__unspecified"` titled `未标注`. That column is absent when every visible item has a known status. It is not a drop target and it is not written back onto the item.

Full text is case-insensitive `includes` over title, description, `doc.name`, `doc.description`, and `doc.body`. It does not search the stem.

Hash keys, omitted when they are the default: `q`, `priority`, `assignee`, `status`, `project`, `stem`. Unknown priority or status values parse as `all`.

- [ ] **Step 1: Write the failing tests**

`extensions/clis/review-app/test/filter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { itemPriority, itemStatus, matchesReviewFilter, type ReviewFilter, type ReviewItem } from "../src/filter.ts";

const base: ReviewItem = {
  stem: "2026-09-21--alpha",
  current: "default",
  suggested: "cli",
  title: "Alpha title",
  description: "short",
  status: "todo",
  priority: "low",
  doc: {
    name: "alpha-name",
    description: "doc-desc",
    metadata: {
      "edges-tasks-status": "in_progress",
      "edges-task-priority": "high",
      "edges-task-assignee": "Ada",
      "edges-updated-at": "2026-09-21T00:00:00.000Z",
    },
    body: "Body mentions Vite",
  },
};

const all: ReviewFilter = { q: "", priority: "all", assignee: "", status: "all", projectId: "all" };

describe("matchesReviewFilter", () => {
  it("prefers doc metadata for status and priority", () => {
    expect(itemStatus(base)).toBe("in_progress");
    expect(itemPriority(base)).toBe("high");
    expect(matchesReviewFilter(base, { ...all, status: "todo" })).toBe(false);
    expect(matchesReviewFilter(base, { ...all, status: "in_progress" })).toBe(true);
    expect(matchesReviewFilter(base, { ...all, priority: "low" })).toBe(false);
    expect(matchesReviewFilter(base, { ...all, priority: "high" })).toBe(true);
  });

  it("treats a missing priority as none and reads assignee only from doc", () => {
    const bare: ReviewItem = { stem: "s", current: "default", suggested: "default", title: "T" };
    expect(itemPriority(bare)).toBe("none");
    expect(matchesReviewFilter(bare, { ...all, priority: "none" })).toBe(true);
    expect(matchesReviewFilter(bare, { ...all, assignee: "Ada" })).toBe(false);
    expect(matchesReviewFilter(base, { ...all, assignee: "Ada" })).toBe(true);
  });

  it("searches title, description, and doc text, not the stem", () => {
    expect(matchesReviewFilter(base, { ...all, q: "vite" })).toBe(true);
    expect(matchesReviewFilter(base, { ...all, q: "alpha title" })).toBe(true);
    expect(matchesReviewFilter(base, { ...all, q: "2026-09-21--alpha" })).toBe(false);
  });

  it("filters by suggested project", () => {
    expect(matchesReviewFilter(base, { ...all, projectId: "cli" })).toBe(true);
    expect(matchesReviewFilter(base, { ...all, projectId: "default" })).toBe(false);
  });
});
```

`extensions/clis/review-app/test/hash.test.ts`:

```ts
import { expect, it } from "vitest";
import { buildReviewHash, parseReviewHash } from "../src/hash.ts";

it("round-trips hash search params and drops defaults", () => {
  const hash = buildReviewHash({
    q: "vite",
    priority: "high",
    assignee: "Ada",
    status: "todo",
    projectId: "cli",
    stem: "2026-09-21--alpha",
  });
  expect(hash.startsWith("#?")).toBe(true);
  expect(hash.includes("#/")).toBe(false);
  const parsed = parseReviewHash(hash);
  expect(parsed).toEqual({
    q: "vite",
    priority: "high",
    assignee: "Ada",
    status: "todo",
    projectId: "cli",
    stem: "2026-09-21--alpha",
  });
  expect(buildReviewHash({
    q: "",
    priority: "all",
    assignee: "",
    status: "all",
    projectId: "all",
    stem: "",
  })).toBe("#?");
});

it("treats an unknown status as all", () => {
  expect(parseReviewHash("#?status=nope").status).toBe("all");
});
```

`extensions/clis/review-app/test/shell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import App from "../src/App.tsx";
import type { ReviewPayload } from "../src/types.ts";

const payload: ReviewPayload = {
  groups: [
    { id: "default", title: "Default", description: "" },
    { id: "cli", title: "CLI", description: "edges CLI" },
  ],
  items: [
    {
      stem: "2026-09-21--alpha",
      current: "default",
      suggested: "cli",
      title: "Alpha title",
      description: "short",
      status: "todo",
      priority: "low",
      doc: {
        name: "alpha-name",
        description: "doc-desc",
        metadata: {
          "edges-tasks-status": "in_progress",
          "edges-task-priority": "high",
          "edges-task-assignee": "Ada",
          "edges-updated-at": "2026-09-21T00:00:00.000Z",
        },
        body: "# Heading\n\n- item\n\nBody mentions Vite",
      },
    },
    {
      stem: "2026-09-13--demo",
      current: "default",
      suggested: "default",
      title: "Classify me",
      description: "no doc",
    },
  ],
};

it("lays out filters, columns, design A, and the markdown pane", async () => {
  const user = userEvent.setup();
  render(<App initialPayload={payload} />);
  expect(document.querySelector("[data-review-shell=edges]")).not.toBeNull();
  expect(document.querySelector("[data-status-column=in_progress]")?.textContent).toContain("2026-09-21--alpha");
  expect(document.querySelector("[data-status-column=__unspecified]")?.textContent).toContain("2026-09-13--demo");
  expect(document.querySelector("[data-project-id=all]")?.getAttribute("data-droppable")).toBe("0");
  const cli = document.querySelector("[data-project-id=cli]");
  expect(cli?.className).toContain("opacity-60");
  await user.type(document.querySelector("[data-filter=q]") as HTMLElement, "vite");
  expect(screen.queryByText("2026-09-13--demo")).toBeNull();
  expect(screen.getByText("2026-09-21--alpha")).toBeTruthy();
  await user.click(cli as Element);
  expect(cli?.getAttribute("data-filter")).toBe("on");
  expect(cli?.className).toContain("border-[#5b9fd4]");
  expect(cli?.className).not.toContain("opacity-60");
  await user.click(screen.getByText("2026-09-21--alpha"));
  expect(document.querySelector("[data-markdown-pane] h1")?.textContent).toBe("Heading");
  expect(document.querySelector("[data-markdown-pane] li")?.textContent).toBe("item");
  expect(window.location.hash.startsWith("#?")).toBe(true);
  expect(window.location.hash).toContain("stem=");
  expect(document.querySelector("[data-status-column] [data-droppable]")).toBeNull();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm --filter edges-review-app test
```

Expected: FAIL importing `../src/filter.ts` (module not found).

- [ ] **Step 3: Write the minimal implementation**

`src/statuses.ts`:

```ts
import taskDocSchema from "../../schemas/task-doc.v1.json" with { type: "json" };

const metadata = taskDocSchema.properties.metadata.properties;

export const REVIEW_STATUS_COLUMNS = metadata["edges-tasks-status"].enum;
export const REVIEW_PRIORITIES = metadata["edges-task-priority"].enum;

export type ReviewStatus = (typeof REVIEW_STATUS_COLUMNS)[number];
export type ReviewPriority = (typeof REVIEW_PRIORITIES)[number];
```

`src/types.ts` mirrors `TaskDoc` and `ReviewPageItem` from Task 3 (`stem`, `current`, `suggested`, optional `title`, `description`, `note`, `status`, `priority`, `doc`). `ReviewGroup` is `{ id, title, description? }`. `ReviewPayload` is `{ groups: ReviewGroup[]; items: ReviewItem[] }`.

`src/filter.ts` implements the rules in this task's Interfaces. `itemSearchText` joins the five strings with `\n` and lowercases them. `matchesReviewFilter` applies project, status, priority, assignee, then `q`.

`src/hash.ts`:

```ts
import { REVIEW_PRIORITIES, REVIEW_STATUS_COLUMNS, type ReviewPriority, type ReviewStatus } from "./statuses.ts";
import type { ReviewHashState } from "./types.ts";

export function parseReviewHash(hash: string): ReviewHashState {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const priority = params.get("priority") ?? "";
  const status = params.get("status") ?? "";
  return {
    q: params.get("q") ?? "",
    priority: (REVIEW_PRIORITIES as readonly string[]).includes(priority) ? priority as ReviewPriority : "all",
    assignee: params.get("assignee") ?? "",
    status: (REVIEW_STATUS_COLUMNS as readonly string[]).includes(status) ? status as ReviewStatus : "all",
    projectId: params.get("project") || "all",
    stem: params.get("stem") ?? "",
  };
}

export function buildReviewHash(state: ReviewHashState): string {
  const params = new URLSearchParams();
  if (state.q !== "") params.set("q", state.q);
  if (state.priority !== "all") params.set("priority", state.priority);
  if (state.assignee !== "") params.set("assignee", state.assignee);
  if (state.status !== "all") params.set("status", state.status);
  if (state.projectId !== "all") params.set("project", state.projectId);
  if (state.stem !== "") params.set("stem", state.stem);
  return `#?${params.toString()}`;
}

export function navigateReviewHash(href: string): void {
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
```

`ReviewHashState` lives in `types.ts` and matches the object in the hash test.

Append to `src/index.css`:

```css
:root {
  --background: #0f1419;
  --foreground: #e7ecf3;
  --card: #1a2332;
  --muted-foreground: #9aa8bc;
  --border: #334155;
  --accent: #5b9fd4;
}
html, body, #root { height: 100%; background: #0f1419; color: #e7ecf3; }
```

`ProjectColumn.tsx`: a button `data-project-id="all"` `data-droppable="0"` titled `全部`. Each group is `data-project-id={id}` `data-droppable="1"`. Selected row: `data-filter="on"` plus `border-solid border-[#5b9fd4] bg-[#1a2332] opacity-100`. Unselected: `opacity-60 hover:opacity-100`. Counts use items that match the top-bar filter with `projectId: "all"` for「全部」, and with that group id for each project.

`StatusBoard.tsx`: for each status in `REVIEW_STATUS_COLUMNS`, a section `data-status-column={status}` whose heading is the status plus the count of `matchesReviewFilter` items whose `itemStatus` is that status. Cards are `TaskCard`. If any matched item has a status outside the seven, render `data-status-column="__unspecified"` titled `未标注`. No `data-droppable` anywhere in this component.

`TaskCard.tsx`: `data-stem={stem}`. Show stem, then `title || doc.metadata["edges-title"] || doc.name || stem`, then a `data-project-tag` with the suggested group's title, then `data-updated` with `doc.metadata["edges-updated-at"]` or empty.

`MarkdownPane.tsx`:

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPane({ body }: { body: string }) {
  return (
    <aside data-markdown-pane="true" className="min-h-0 overflow-auto border-l border-[#334155] p-4">
      {body === "" ? null : <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>}
    </aside>
  );
}
```

Install the renderer:

```bash
pnpm --filter edges-review-app add react-markdown remark-gfm
pnpm --filter edges-review-app exec shadcn add input select -y
```

`TopBar.tsx` uses shadcn `Input` (`data-filter="q"`) and `Select` (`data-filter="priority" | "assignee" | "status"`). Priority options: `all` plus `REVIEW_PRIORITIES`. Status options: `all` plus `REVIEW_STATUS_COLUMNS`. Assignee options: `""` labeled `全部`, plus sorted unique non-empty assignees from the items. The Copy JSON button is a placeholder `disabled` in this task; Task 6 wires it.

`App.tsx` reads the payload script unless `initialPayload` is passed (tests pass it). Layout:

```tsx
<div data-review-shell="edges" className="flex h-screen flex-col">
  <TopBar ... />
  <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_320px]">
    <ProjectColumn ... />
    <StatusBoard ... />
    <MarkdownPane body={selected?.doc?.body ?? ""} />
  </div>
</div>
```

On filter or stem change, call `navigateReviewHash(buildReviewHash(state))` only when the current hash differs. On `popstate`, `parseReviewHash(window.location.hash)`.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm --filter edges-review-app test
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/review-app-build.test.ts
```

Expected: PASS. The build test still sees exactly three files, and `review.js` still lacks `DEV-MOCK-STEM-NOT-IN-PROD`.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/review-app pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat: add review shell columns, filters, and hash navigation

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>
EOF
)"
```

---

### Task 6: Drag a card onto a project and copy the same JSON

**Files:**
- Create: `extensions/clis/review-app/src/export.ts`
- Modify: `extensions/clis/review-app/src/App.tsx`
- Modify: `extensions/clis/review-app/src/components/TaskCard.tsx`
- Modify: `extensions/clis/review-app/src/components/ProjectColumn.tsx`
- Modify: `extensions/clis/review-app/src/components/TopBar.tsx`
- Test: `extensions/clis/review-app/test/export.test.ts`
- Test: `extensions/clis/review-app/test/drag.test.tsx`

**Interfaces:**
- Consumes: `ReviewItem` from `types.ts`.
- Produces:
  - `export function exportReviewRows(items: ReviewItem[]): Array<{ stem: string; current: string; suggested: string; action: "keep" | "move"; note: string }>`
  - `export function applyProjectDrop(items: ReviewItem[], stem: string, projectId: string): ReviewItem[]` — sets `suggested` only. Does not change `status`, `current`, or `doc`.
  - Droppable ids are `project:${groupId}` for real groups only.
  - Draggable id is the stem.
  - `PointerSensor` activation distance is 6.

- [ ] **Step 1: Write the failing tests**

`test/export.test.ts`:

```ts
import { expect, it } from "vitest";
import { applyProjectDrop, exportReviewRows } from "../src/export.ts";
import type { ReviewItem } from "../src/types.ts";

const items: ReviewItem[] = [{
  stem: "2026-09-21--alpha",
  current: "default",
  suggested: "default",
  status: "todo",
  note: "",
}];

it("copies keep or move without a status field", () => {
  expect(exportReviewRows(items)[0]).toEqual({
    stem: "2026-09-21--alpha",
    current: "default",
    suggested: "default",
    action: "keep",
    note: "",
  });
  const moved = applyProjectDrop(items, "2026-09-21--alpha", "cli");
  expect(moved[0]?.suggested).toBe("cli");
  expect(moved[0]?.current).toBe("default");
  expect(moved[0]?.status).toBe("todo");
  expect(exportReviewRows(moved)[0]?.action).toBe("move");
  expect("status" in exportReviewRows(moved)[0]!).toBe(false);
});
```

Add `projectIdFromDrop` to `src/export.ts` and cover it in `test/drag.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import App from "../src/App.tsx";
import { exportReviewRows, projectIdFromDrop } from "../src/export.ts";
import type { ReviewPayload } from "../src/types.ts";

const payload: ReviewPayload = {
  groups: [
    { id: "default", title: "Default", description: "" },
    { id: "cli", title: "CLI", description: "" },
  ],
  items: [{
    stem: "2026-09-21--alpha",
    current: "default",
    suggested: "default",
    title: "Alpha",
    status: "todo",
    note: "",
  }],
};

it("accepts only project drop ids", () => {
  expect(projectIdFromDrop("todo")).toBeUndefined();
  expect(projectIdFromDrop("project:cli")).toBe("cli");
  expect(projectIdFromDrop("__unspecified")).toBeUndefined();
  expect(projectIdFromDrop(undefined)).toBeUndefined();
});

it("marks project rows as droppable and status columns as not", () => {
  render(<App initialPayload={payload} />);
  expect(document.querySelector("[data-project-id=cli]")?.getAttribute("data-droppable-id")).toBe("project:cli");
  expect(document.querySelector("[data-status-column=todo] [data-droppable-id]")).toBeNull();
  expect(document.querySelector("[data-project-id=all]")?.getAttribute("data-droppable")).toBe("0");
});

it("copies export JSON without status", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  render(<App initialPayload={payload} />);
  await user.click(screen.getByRole("button", { name: "复制导出 JSON" }));
  expect(writeText).toHaveBeenCalledWith(JSON.stringify(exportReviewRows(payload.items), null, 2));
});
```

```ts
export function projectIdFromDrop(overId: string | undefined): string | undefined {
  if (!overId?.startsWith("project:")) return undefined;
  const id = overId.slice("project:".length);
  return id === "" ? undefined : id;
}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm --filter edges-review-app test
```

Expected: FAIL importing `../src/export.ts`.

- [ ] **Step 3: Write the minimal implementation**

```bash
pnpm --filter edges-review-app add @dnd-kit/core
```

`src/export.ts` as specified. `note` is `item.note ?? ""`. `action` is `keep` when `suggested === current`, else `move`.

`App.tsx` wraps the grid in:

```tsx
<DndContext
  sensors={useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))}
  onDragEnd={(event) => {
    const projectId = projectIdFromDrop(event.over ? String(event.over.id) : undefined);
    if (!projectId) return;
    setItems((prev) => applyProjectDrop(prev, String(event.active.id), projectId));
  }}
>
```

`TaskCard` calls `useDraggable({ id: item.stem })`. `ProjectColumn` calls `useDroppable({ id: `project:${group.id}` })` only for real groups, and sets `data-droppable-id={project:${group.id}}`. While `isOver`, add `outline outline-2 outline-offset-[3px] outline-[#5b9fd4]`.「全部」does not call `useDroppable`. `StatusBoard` and the `未标注` column do not call `useDroppable`.

`TopBar` copy button `data-action="copy-json"` writes `JSON.stringify(exportReviewRows(items), null, 2)` via `navigator.clipboard.writeText`. On failure, `console.log` the same text. Label: `复制导出 JSON`.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm --filter edges-review-app test
pnpm --filter edges-cli run build:review-app
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/utils/review-page.test.ts ./test/tasks/review-app-build.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/review-app pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat: drag review cards between projects and copy export JSON

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>
EOF
)"
```

---

### Task 7: Build the shell before `/tasks/` and keep classify JSON working

**Files:**
- Modify: `.github/workflows/deploy.yml` (the generate block inside the SSH script)
- Modify: `extensions/clis/deploy/README.md`
- Modify: `extensions/clis/README.md`
- Modify: `extensions/clis/src/tasks/list.ts` only if Task 2's help sentence is missing
- Modify: `extensions/skills/project-tasks-classify/SKILL.md`
- Modify: `extensions/skills/project-tasks-classify/CHANGELOG.md`
- Modify: `CHANGELOG.md`
- Test: `extensions/clis/test/tasks/review-page-classify.test.ts`
- Test: `extensions/clis/test/tasks/deploy-review-build.test.ts`

**Interfaces:**
- Consumes: `loadBuiltReviewShell`, `parseReviewPageInput`, `renderReviewPageHtml`, `exportReviewRows`.
- Produces: deploy always runs `pnpm --filter edges-review-app run build` after a frozen install that includes `edges-review-app`, then `generate-tasks-site.ts`. A classify payload with no `doc` still renders. A payload with a thin `doc` (`body: ""`) embeds that doc and does not add `assignee` beside it. Skill version becomes `1.2.0`.

- [ ] **Step 1: Write the failing tests**

`extensions/clis/test/tasks/review-page-classify.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

const classify = {
  groups: [
    { id: "default", title: "Default", description: "ungrouped" },
    { id: "cli", title: "CLI", description: "edges CLI" },
  ],
  items: [
    { stem: "2026-09-13--demo", current: "default", suggested: "cli", title: "Demo", description: "demo task" },
    {
      stem: "2026-09-13--thin",
      current: "default",
      suggested: "default",
      title: "Thin",
      doc: { name: "thin", description: "thin", metadata: { "edges-task-assignee": "Ada" }, body: "" },
    },
  ],
};

test("review-page renders classify JSON with a missing doc and a thin doc", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-classify-"));
  try {
    const out = path.join(dir, "out.html");
    const result = await run(["tasks", "project", "review-page", "--from", "-", "--out", out], {
      stdinText: JSON.stringify(classify),
    });
    assert.equal(result.exitCode, 0, result.stderr);
    const html = await readFile(out, "utf8");
    assert.match(html, /id="edges-review-payload"/);
    assert.match(html, /2026-09-13--demo/);
    assert.match(html, /2026-09-13--thin/);
    assert.match(html, /<script type="module">/);
    assert.doesNotMatch(html, /src="\.\/review\.js"/);
    assert.doesNotMatch(html, /playwrightReportBase64/);
    assert.match(html, /edges-task-assignee/);
    const body = JSON.parse(result.stdout) as { command: string; path: string };
    assert.equal(body.command, "project.review-page");
    assert.equal(body.path, out);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

`extensions/clis/test/tasks/deploy-review-build.test.ts` reads `.github/workflows/deploy.yml` as text and asserts it contains `pnpm --filter edges-review-app run build` before `scripts/generate-tasks-site.ts`, and that this build is not inside `if [ ! -d node_modules ]`.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/review-page-classify.test.ts ./test/tasks/deploy-review-build.test.ts
```

Expected: the deploy test FAIL because `deploy.yml` does not build `edges-review-app`. The classify test PASS only after Task 4; if it fails on a missing asset, run `pnpm --filter edges-cli run build:review-app` first. The deploy assertion is the failure this task must turn green.

- [ ] **Step 3: Write the minimal implementation**

In `.github/workflows/deploy.yml`, replace the block that conditionally installs and then generates the site with:

```bash
pnpm install --frozen-lockfile --filter edges-cli... --filter edges-review-app...
pnpm --filter edges-review-app run build
test -s extensions/clis/src/tasks/project/assets/review-page/index.html
test -s extensions/clis/src/tasks/project/assets/review-page/review.js
test -s extensions/clis/src/tasks/project/assets/review-page/review.css
pnpm --filter edges-cli exec -- tsx scripts/generate-tasks-site.ts \
  --out "$PWD/knowledge/tasks/_site/index.html"
test -s knowledge/tasks/_site/index.html
grep -q 'id="edges-review-payload"' knowledge/tasks/_site/index.html
grep -q '<script type="module">' knowledge/tasks/_site/index.html
if grep -q 'src="./review.js"' knowledge/tasks/_site/index.html; then
  echo "review.js must be inlined, not linked"
  exit 1
fi
```

Leave the later artifacts `if [ ! -d` install alone. Do not add a second workflow file.

In `extensions/clis/deploy/README.md`, put the build command in front of the generate command in the "Generate (every deploy)" section:

```bash
pnpm install --frozen-lockfile --filter edges-cli... --filter edges-review-app...
pnpm --filter edges-review-app run build
pnpm --filter edges-cli exec -- tsx scripts/generate-tasks-site.ts \
  --out "$PWD/knowledge/tasks/_site/index.html"
```

State that the Vite output is gitignored and must be built on the box. Do not write whether a machine has already been migrated.

In `extensions/clis/README.md`, replace the `project review-page` paragraph with: the command still only renders; it reads groups+items JSON; it inlines the prebuilt shell (`pnpm --filter edges-cli run build:review-app` or `prepack`) into one HTML file; data is `#edges-review-payload`; items may omit `doc`. Mention `dev:review-app` for local UI work. Keep the Artifacts sentence: render, then `publish` separately.

In `extensions/skills/project-tasks-classify/SKILL.md`, set `version: 1.2.0`. Under step 4's `items` bullet, add: `doc` is optional. When present it is `name`, `description`, `metadata`, and `body` (Markdown, `body` may be `""`). Omitting `doc` is valid. The pasted export is still `stem`, `current`, `suggested`, `action`, `note`. Do not require the skill to read Task files into `doc` in this round; the board generator does that for `/tasks/`.

In that skill's `CHANGELOG.md`, add:

```markdown
## [1.2.0] - 2026-09-24

### Changed

- 第 4 步建议 JSON 的 `items[]` 可以带可选 `doc`（`name`、`description`、`metadata`、`body`，`body` 允许空字符串）。不带 `doc` 仍然合法。贴回来的导出行仍是 `stem`、`current`、`suggested`、`action`、`note`。

```

Leave the existing `[Unreleased]` bullets in place. Do not retag `1.1.0`. Tag command, after the commit is on the remote:

```bash
git tag -a skill/project-tasks-classify@1.2.0 -m "skill(project-tasks-classify): optional thin doc on review JSON"
git push origin skill/project-tasks-classify@1.2.0
```

In the root `CHANGELOG.md` under `## [Unreleased]` / `### 任务看板与项目`, add this bullet and no field table:

```markdown
- `edges tasks project review-page` 和固定入口 `/tasks/` 共用同一个三栏审阅页：顶栏可以按全文、`urgent` / `high` / `medium` / `low` / `none`、指派和 `edges-tasks-status` 筛选；左侧点项目筛选，拖到项目上只改 project，再用「复制导出 JSON」贴回。中间的状态列只展示，右侧渲染当前条目的 Markdown 正文。页上的脚本在生成前由 `pnpm --filter edges-review-app run build` 打好并内联进单份 HTML，构建产物不进 git。
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm --filter edges-cli run build:review-app
pnpm --filter edges-cli exec -- node --test --import tsx ./test/tasks/review-page-classify.test.ts ./test/tasks/deploy-review-build.test.ts ./test/tasks/utils/review-page.test.ts ./test/tasks/grouped-list.test.ts
pnpm --filter edges-review-app test
```

Expected: PASS.

Open `dev:review-app` only if a browser is available. Otherwise the Vitest shell test is the UI check. Confirm a drag from a status column does not change `item.status` (Task 6) and that `/tasks/` generation is still `generate-tasks-site.ts` writing `knowledge/tasks/_site/index.html`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml extensions/clis/deploy/README.md extensions/clis/README.md extensions/skills/project-tasks-classify/SKILL.md extensions/skills/project-tasks-classify/CHANGELOG.md CHANGELOG.md extensions/clis/test/tasks/review-page-classify.test.ts extensions/clis/test/tasks/deploy-review-build.test.ts
git commit -m "$(cat <<'EOF'
ci: build the review shell before generating /tasks/

Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>
EOF
)"
git tag -a skill/project-tasks-classify@1.2.0 -m "skill(project-tasks-classify): optional thin doc on review JSON"
```

Push the tag with the branch. Do not move the in-progress task card.

---

## Spec coverage

| Requirement | Task |
| --- | --- |
| Vite source `extensions/clis/review-app/`, fixed `index.html` / `review.js` / `review.css`, `inlineDynamicImports` | 1 |
| Gitignore the outDir; do not commit artifacts | 1 |
| `build:review-app` / `prepack` / `dev:review-app` | 1 |
| Grouped items optional Schema-aligned `doc` from `parseTaskDoc`; flat list unchanged | 2 |
| Page payload carries `doc`, `status`, `priority`; classify may omit `doc` | 3, 7 |
| Runtime reads assets, inlines JS/CSS, injects `#edges-review-payload` | 4 |
| Top bar filters, left project, center status columns, right Markdown | 5 |
| Hash or hash+query | 5 |
| Design A selected / dim / outline | 5, 6 |
| `@dnd-kit` project drop only; Copy JSON `keep`/`move` | 6 |
| Items with no status still visible for classify | 5 |
| Deploy builds before `/tasks/` generate | 7 |
| Skill notes optional thin `doc` | 7 |
| No git write-back, semantic search, auth, zip payload, path router, kanban library | Non-goals |

## Self-review notes

- Placeholder scan: commands, types, and assertions above are concrete. The shadcn scaffold's generated `button.tsx` and theme CSS stay as the CLI wrote them; this plan only appends tokens and replaces `App.tsx`, `index.html`, and `vite.config.ts`.
- `TaskDoc.metadata` is `Record<string, string>` because `parseTaskDoc` only emits strings. Unknown keys are kept. Non-string metadata values fail validation.
- `applyProjectDrop` and `exportReviewRows` names are the same in Task 6's tests and implementation. `loadBuiltReviewShell` is the same in Task 4 and Task 7.
- The center column does not write `edges-tasks-status`. `__unspecified` is a display bucket for classify rows that have no status.
