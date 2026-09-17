# Task Project review-page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship render-only `edges tasks project review-page` that turns generic `groups[]` + `items[]` JSON into a drag-and-drop HTML Task Project 审阅页, print the absolute path, and update classifyTasks so step 4’s primary human gate is that page (Markdown table remains no-GUI fallback).

**Architecture:** Keep Commander → `runTasksCommand` → `src/tasks/project/<verb>.ts` + `src/tasks/utils/`. Add pure helpers in `review-page.ts` (parse + render + write). Ship the HTML/JS shell as a static file under `src/tasks/project/assets/` and copy it into `dist/` on build so `import.meta.url` resolves after `tsc`. The page is mode-less: callers decide what a group means. No assignment algorithm, no board writes, no `apply-review`, no public `classify` verb, no new MCP.

**Tech Stack:** TypeScript, Node.js ≥20, existing `commander`, `node:test` + `tsx`, `node:fs/promises`, `node:os` `tmpdir`. Validate with existing `TasksError("VALIDATION_ERROR", …)` style (zod is available but project-meta does not use it — stay consistent unless a local zod schema is clearly simpler; prefer hand validation matching sibling verbs). No embeddings. No browser automation in CI — unit-test parse/render and a lightweight DOM-less export-shape test; HTML drag behavior is covered by a small fixture script only if cheap, otherwise manual checklist in the plan.

**Spec:** `docs/adr/0012-task-project-review-page-is-render-only-cli.md` (accepted; extends ADR 0010 / 0011). Also: `docs/adr/0010-classify-tasks-and-task-project-metadata.md`, `docs/adr/0011-propose-task-project-types-from-default.md`, `docs/adr/0004-capability-surface-cli-skill-mcp.md`, `docs/adr/0005-edges-tasks-cli.md`. Glossary: `CONTEXT.md` terms **Task Project 审阅页（edges）**, **审阅导出行（edges）**, **Task stem（edges）**, **classifyTasks（edges）**, **proposeTypes（edges）**, **edges tasks（CLI）**. Prior plans to mirror: `docs/superpowers/plans/2026-09-17-classify-tasks.md`, `docs/superpowers/plans/2026-09-16-edges-task-project.md`.

## Global Constraints

- Co-authored-by on every commit: `Coding Agent 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Capability Surface wording: always **CLI + Skill + MCP** (three peers). Never “CLI + Skill” alone as the Edges shorthand; never npm `bin` as a layer
- Render-only: `review-page` must not call `updateTask`, `createProject`, `status`, or any board mutator
- No public `edges tasks classify` / `propose` / `apply-review`
- No `--mode` flag
- Input JSON is generic `groups` + `items`; Skill interprets group ids
- Export row: `stem`, `current`, `suggested`, `action`, optional `note`. `stem` is filename without `.md` (CLI lookup key), not title, not frontmatter `name`
- `action` on export is derived in the page: `keep` if `suggested === current`, else `move` (do not invent `create-then-move` in the page; Skill still may `project create` before `update --project` when suggested is unknown)
- Default output: OS temp file; `--out <path>` overrides; print absolute path in JSON success payload; do **not** open a browser
- HTML shell lives in the CLI package (`extensions/clis/.../assets/`), not under `tools/`
- classifyTasks Skill path: `extensions/skills/project-tasks-classify/` — update step 4 to review-page primary path; Markdown table = no-GUI fallback only
- proposeTypes Skill is **not** on main yet (`extensions/skills/project-tasks-propose-types/` missing). Do **not** invent that Skill in this plan; only ensure CLI is reusable. Optional one-line note in `extensions/skills/README.md` or classify CHANGELOG cross-link is enough
- Do not put `ingest` / `fs` / `writer` / `now` / `repoPath` on `CliContext`
- Relative TypeScript imports use `.js` (nodenext)
- Test runner: `extensions/clis/package.json` `"test": "node --test --import tsx './test/**/*.test.ts'"`
- Invalid JSON / schema → `VALIDATION_ERROR`, exit 2, no file write (except do not leave partial `--out` on failure — write via temp rename or write only after successful render)
- Public repo: no credentials or personal data
- This plan-only PR that first lands this document must **not** implement the CLI or rewrite the Skill

---

## File map

Verified against `origin/main` after ADR 0012 merge (`92ea00a`). Command tree: `extensions/clis/src/tasks.ts` + `extensions/clis/src/tasks/project.ts` + `extensions/clis/src/tasks/project/<verb>.ts`. README rule: **file = one command node**.

**Create**

- `extensions/clis/src/tasks/utils/review-page.ts` — types; `parseReviewPageInput`; `renderReviewPageHtml`; `resolveReviewPageOutPath`; `writeReviewPage`
- `extensions/clis/src/tasks/project/assets/review-page.html` — static shell with `<script type="application/json" id="edges-review-payload">` for JSON injection
- `extensions/clis/src/tasks/project/review-page.ts` — Commander leaf `review-page`
- `extensions/clis/test/tasks/utils/review-page.test.ts` — parse/render/write unit tests
- `extensions/clis/scripts/copy-review-page-asset.mjs` — tiny post-`tsc` copy (or inline `cp` in package.json `build` if the team prefers zero script file; prefer one small script for Windows-hostile `cp -R` clarity on Linux CI)

**Modify**

- `extensions/clis/package.json` — `build` runs `tsc` then copies `src/tasks/project/assets/` → `dist/tasks/project/assets/`
- `extensions/clis/src/tasks/project.ts` — register `addProjectReviewPageCommand`; help text lists `review-page`
- `extensions/clis/src/tasks/utils/format.ts` — extend `TasksSuccess` with optional `path?: string`, `groupCount?: number`, `itemCount?: number` (or nest under a single optional object — prefer flat fields matching existing style)
- `extensions/clis/src/tasks.ts` — `TASKS_AFTER_HELP` mentions `project review-page` if the root help enumerates project children
- `extensions/clis/README.md` — document `project review-page`; Capability Surface stays CLI + Skill + MCP
- `extensions/clis/test/tasks/cli.test.ts` — project help lists `review-page`
- `extensions/clis/test/tasks/parse.test.ts` — happy path `--from` fixture; bad JSON → exit 2; unknown `classify` still fails
- `extensions/skills/project-tasks-classify/SKILL.md` — step 4 primary = write suggestions JSON → `review-page` → give path → **STOP** → wait for pasted export → step 5 apply; Markdown table = fallback
- `extensions/skills/project-tasks-classify/CHANGELOG.md` — note review-page gate
- `CHANGELOG.md` `[Unreleased]` — Added `edges tasks project review-page`
- `.memory/projects/project_task_project_review_page_render_only_cli.md` — How-to: landed (via `$project-memory-remember` if that skill is used; otherwise edit the pointer file consistently with prior plans)

**Do not create/commit**

- `edges tasks classify` / `apply-review` / propose verb
- MCP tool for review-page
- `tools/**` HTML prototype revival
- `--open` / auto browser launch
- `--mode`
- proposeTypes Skill body (not on main)
- Embedding / classification libraries
- Edits under `knowledge/posts/`
- Rewriting ADR 0012 / CONTEXT (already merged) except typo fixes if a command path was wrong

---

## Locked design (read before Task 1)

### CLI surface

```
edges tasks project review-page --from <path|-> [--out <path>]
```

- `--from` **required**. Path to UTF-8 JSON file, or `-` for stdin
- `--out` optional. If omitted, write to `path.join(os.tmpdir(), \`edges-review-page-${Date.now()}.html\`)` (unique name; do not clobber)
- Success JSON (stdout), `command` exactly `project.review-page`:

```json
{"status":"success","command":"project.review-page","path":"/tmp/edges-review-page-1710000000000.html","groupCount":3,"itemCount":12}
```

- Failure: existing envelope `{"status":"failed","errorCode":"VALIDATION_ERROR","reason":"..."}` exit 2
- No `--mode`, no `--open`, no positional args beyond what Commander needs
- `edges tasks project` help AFTER text must list `review-page`
- `edges tasks classify` remains unknown command

### Input JSON schema (strict enough to fail loud)

```ts
export type ReviewPageGroup = {
  id: string;          // non-empty; for classify: Task Project CLI id (`default` or kebab)
  title: string;       // non-empty, ≤120, no CR/LF
  description?: string; // default ""
};

export type ReviewPageItem = {
  stem: string;        // non-empty Task stem
  current: string;     // group id (may equal suggested)
  suggested: string;   // group id; must reference an existing groups[].id OR we allow unknown suggested? → **must exist in groups[].id** at parse time so the page never shows an orphan target
  title?: string;      // display only
  description?: string;
  note?: string;
};

export type ReviewPageInput = {
  groups: ReviewPageGroup[]; // length ≥ 1; ids unique
  items: ReviewPageItem[];   // stems unique; current & suggested ∈ group ids
};
```

Exact validation messages (stable strings for tests):

- `review-page input must be a JSON object with groups[] and items[]`
- `review-page groups must be a non-empty array`
- `review-page group id must be a non-empty string`
- `duplicate review-page group id: ${id}`
- `invalid review-page group title (expected 1–120 characters, no newlines)`
- `review-page items must be an array`
- `review-page item stem must be a non-empty string`
- `duplicate review-page item stem: 2026-09-13--demo: ${stem}`
- `review-page item ${stem} current group not found: ${current}`
- `review-page item ${stem} suggested group not found: ${suggested}`
- `review-page --from file not readable: ${path}`
- `review-page stdin is empty`

### HTML / export behavior

- Inject parsed input as JSON into the template placeholder `/*EDGES_REVIEW_PAYLOAD*/` replaced by `JSON.stringify({ groups, items })` (no surrounding script break — use `<script type="application/json" id="edges-review-payload">...</script>` then read `textContent` in page JS; **prefer this over placeholder comment** so we never `eval`)
- Left: groups (title + description + count). Right: items (title, stem, description, current→suggested)
- Pointer-based drag (not HTML5 DnD): press-hold item, drop on group, update `suggested` in memory, refresh counts, toast
- Button **复制导出 JSON**: clipboard write array of 审阅导出行:

```json
[{"stem":"2026-09-13--demo","current":"default","suggested":"cli","action":"move","note":""}]
```

  `action` = `suggested === current ? "keep" : "move"`. Include `note` key always (string, possibly empty) for stable shape
- Do not depend on Grok Bot preview; page must work in system Chrome/Safari/Firefox
- Chinese UI chrome OK (match existing board language); keep stem in monospace

### Skill orchestration (classifyTasks)

After implementation, step 4 becomes:

1. Build `suggestions.json` on disk (tmpdir or `.edges/` — prefer OS tmp; do not commit). `groups` from `project list`; `items` from whole-board list + agent suggestions (`current` = task.project, `suggested` = agent pick, `title`/`description` from task)
2. Run:

```bash
pnpm --filter edges-cli exec tsx src/index.ts tasks project review-page --from /path/to/suggestions.json
```

3. Read stdout JSON `path`; tell the human to open that file in a **system browser** (not chat HTML preview)
4. **STOP** — wait until human pastes export JSON
5. Step 5 unchanged: `project create` if needed (human-confirmed title/description), then `update --project`

Markdown table remains documented as fallback when the host has no way to open HTML.

---

### Task 1: Pure parse + render + write helpers

**Files:**
- Create: `extensions/clis/src/tasks/utils/review-page.ts`
- Create: `extensions/clis/src/tasks/project/assets/review-page.html`
- Create: `extensions/clis/test/tasks/utils/review-page.test.ts`
- Modify: `extensions/clis/package.json` (build copy — can land in Task 2 if you split; include build copy here so render can load the asset via `import.meta.url` in tests under tsx from `src/`)

**Interfaces:**
- Produces:
  - `parseReviewPageInput(raw: unknown): ReviewPageInput`
  - `loadReviewPageTemplate(readFile: (abs: string) => Promise<string>, templatePath?: string): Promise<string>`
  - `defaultReviewPageTemplatePath(): string` — `fileURLToPath(new URL('../project/assets/review-page.html', import.meta.url))` from `utils/review-page.ts` → resolves to `.../tasks/project/assets/review-page.html` beside compiled/output tree
  - `renderReviewPageHtml(input: ReviewPageInput, templateHtml: string): string`
  - `resolveReviewPageOutPath(outFlag: string | undefined, nowMs: number, tmpDir: string): string`
  - `writeReviewPage(absPath: string, html: string, writeFile: …): Promise<void>`

- [ ] **Step 1: Write the failing tests**

Create `extensions/clis/test/tasks/utils/review-page.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  parseReviewPageInput,
  renderReviewPageHtml,
  resolveReviewPageOutPath,
  writeReviewPage,
} from "../../src/tasks/utils/review-page.js";
import { TasksError } from "../../src/tasks/utils/types.js";

const sample = {
  groups: [
    { id: "default", title: "Default", description: "ungrouped" },
    { id: "cli", title: "CLI", description: "edges CLI" },
  ],
  items: [
    {
      stem: "2026-09-13--demo",
      current: "default",
      suggested: "cli",
      title: "Demo",
      description: "demo task",
      note: "",
    },
  ],
};

test("parseReviewPageInput accepts valid payload", () => {
  const parsed = parseReviewPageInput(sample);
  assert.equal(parsed.groups.length, 2);
  assert.equal(parsed.items[0]?.stem, "2026-09-13--demo");
});

test("parseReviewPageInput rejects unknown suggested group", () => {
  assert.throws(
    () =>
      parseReviewPageInput({
        ...sample,
        items: [{ ...sample.items[0], suggested: "missing" }],
      }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /review-page item 2026-09-13--demo suggested group not found: missing/);
      return true;
    },
  );
});

test("parseReviewPageInput rejects duplicate stems", () => {
  assert.throws(
    () =>
      parseReviewPageInput({
        groups: sample.groups,
        items: [sample.items[0], { ...sample.items[0] }],
      }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /duplicate review-page item stem: 2026-09-13--demo/);
      return true;
    },
  );
});

test("renderReviewPageHtml embeds payload JSON and escape-safe stem", () => {
  const template = `<!doctype html><html><body>
<script type="application/json" id="edges-review-payload">{}</script>
</body></html>`;
  const html = renderReviewPageHtml(sample as never, template);
  assert.match(html, /id="edges-review-payload"/);
  assert.match(html, /2026-09-13--demo/);
  assert.doesNotMatch(html, /id="edges-review-payload">\{\}<\/script>/);
});

test("resolveReviewPageOutPath uses --out or tmp default", () => {
  assert.equal(resolveReviewPageOutPath("/tmp/out.html", 1, "/tmp"), path.resolve("/tmp/out.html"));
  assert.equal(
    resolveReviewPageOutPath(undefined, 1710000000000, "/tmp"),
    path.join("/tmp", "edges-review-page-1710000000000.html"),
  );
});

test("writeReviewPage writes utf8 html", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-rp-"));
  try {
    const target = path.join(dir, "out.html");
    await writeReviewPage(target, "<html>ok</html>", writeFile);
    assert.equal(await readFile(target, "utf8"), "<html>ok</html>");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter edges-cli test -- test/tasks/utils/review-page.test.ts`  
(or from `extensions/clis`: `node --test --import tsx test/tasks/utils/review-page.test.ts`)  
Expected: FAIL module not found / cannot find review-page.js

- [ ] **Step 3: Implement `review-page.ts` helpers + minimal HTML asset**

`extensions/clis/src/tasks/utils/review-page.ts` — implement the functions above. `parseReviewPageInput` throws `TasksError("VALIDATION_ERROR", exactMessage)`.

`renderReviewPageHtml`: find `<script type="application/json" id="edges-review-payload">` … `</script>` and replace inner JSON with `JSON.stringify({ groups: input.groups, items: input.items })`. If the script tag is missing → `VALIDATION_ERROR`, `review-page template missing edges-review-payload script`.

`extensions/clis/src/tasks/project/assets/review-page.html` — full single-file page:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Task Project 审阅页</title>
  <style>
    :root { --bg:#0f1419; --panel:#1a2332; --text:#e7ecf3; --muted:#9aa8bc; --border:#334155; --accent:#5b9fd4; }
    * { box-sizing: border-box; }
    body { margin:0; font:14px/1.45 system-ui,sans-serif; background:var(--bg); color:var(--text); height:100vh; display:flex; flex-direction:column; }
    header { padding:12px 16px; border-bottom:1px solid var(--border); }
    .layout { flex:1; min-height:0; display:grid; grid-template-columns:280px 1fr; }
    .sidebar { overflow:auto; padding:12px; border-right:1px solid var(--border); display:flex; flex-direction:column; gap:8px; }
    .group { border:1px dashed var(--border); border-radius:12px; padding:12px; background:var(--panel); }
    .group.is-over { outline:2px solid var(--accent); }
    .group .title { font-weight:650; }
    .group .desc { color:var(--muted); font-size:12px; margin-top:4px; }
    .main { overflow:auto; padding:12px 16px; }
    .card { background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:10px 12px; margin-bottom:8px; cursor:grab; touch-action:none; }
    .stem { font-family:ui-monospace,Menlo,monospace; font-size:12px; color:var(--muted); }
    .tdesc { color:var(--muted); font-size:12px; }
    button { background:#1e4d73; border:1px solid var(--accent); color:var(--text); border-radius:8px; padding:8px 12px; cursor:pointer; }
    #toast { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:#12324d; border:1px solid var(--accent); padding:10px 14px; border-radius:10px; display:none; }
    #ghost { position:fixed; z-index:90; pointer-events:none; display:none; background:#243044; border:1px solid var(--accent); border-radius:10px; padding:8px 10px; max-width:360px; }
  </style>
</head>
<body>
  <header>
    <strong>Task Project 审阅页</strong>
    <div style="color:var(--muted);font-size:13px;margin:4px 0 8px">按住右侧任务拖到左侧分组。系统浏览器打开；不要用聊天 HTML 预览当闸门。</div>
    <button type="button" id="btnCopy">复制导出 JSON</button>
  </header>
  <div class="layout">
    <aside class="sidebar" id="sidebar"></aside>
    <section class="main" id="list"></section>
  </div>
  <div id="ghost"></div>
  <div id="toast"></div>
  <script type="application/json" id="edges-review-payload">{}</script>
  <script>
  (() => {
    const payload = JSON.parse(document.getElementById("edges-review-payload").textContent || "{}");
    const groups = payload.groups || [];
    const items = payload.items || [];
    const byId = Object.fromEntries(groups.map(g => [g.id, g]));
    const toast = (msg) => { const el = document.getElementById("toast"); el.textContent = msg; el.style.display = "block"; clearTimeout(toast._t); toast._t = setTimeout(() => el.style.display = "none", 2000); };
    function exportRows() {
      return items.map(it => ({
        stem: it.stem,
        current: it.current,
        suggested: it.suggested,
        action: it.suggested === it.current ? "keep" : "move",
        note: it.note || ""
      }));
    }
    function paint() {
      const counts = Object.fromEntries(groups.map(g => [g.id, 0]));
      for (const it of items) counts[it.suggested] = (counts[it.suggested] || 0) + 1;
      document.getElementById("sidebar").innerHTML = groups.map(g =>
        `<div class="group" data-group-id="${g.id}"><div class="title">${esc(g.title)}</div><div class="desc">${esc(g.description || "")}</div><div class="desc">${counts[g.id] || 0} 条 · ${esc(g.id)}</div></div>`
      ).join("");
      document.getElementById("list").innerHTML = items.map(it =>
        `<article class="card" data-stem="${esc(it.stem)}"><div>${esc(it.title || it.stem)}</div><div class="stem">${esc(it.stem)}</div>${it.description ? `<div class="tdesc">${esc(it.description)}</div>` : ""}<div class="tdesc">${esc(it.current)} → ${esc(it.suggested)}</div></article>`
      ).join("") || `<p class="tdesc">没有任务</p>`;
    }
    function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])); }
    document.getElementById("btnCopy").onclick = async () => {
      const text = JSON.stringify(exportRows(), null, 2);
      try { await navigator.clipboard.writeText(text); toast("已复制导出 JSON"); }
      catch { toast("复制失败，请手动全选控制台输出"); console.log(text); }
    };
    let drag = null;
    document.getElementById("list").addEventListener("pointerdown", (e) => {
      const card = e.target.closest(".card");
      if (!card || e.button !== 0) return;
      const stem = card.getAttribute("data-stem");
      drag = { stem, x: e.clientX, y: e.clientY, active: false, pointerId: e.pointerId };
      card.setPointerCapture(e.pointerId);
    });
    document.getElementById("list").addEventListener("pointermove", (e) => {
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dist = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
      if (!drag.active && dist < 6) return;
      drag.active = true;
      const ghost = document.getElementById("ghost");
      ghost.style.display = "block";
      ghost.style.left = (e.clientX + 8) + "px";
      ghost.style.top = (e.clientY + 8) + "px";
      ghost.textContent = drag.stem;
      document.querySelectorAll(".group").forEach(g => g.classList.remove("is-over"));
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const group = el && el.closest(".group");
      if (group) group.classList.add("is-over");
    });
    function endDrag(e) {
      if (!drag || drag.pointerId !== e.pointerId) return;
      const wasActive = drag.active;
      const stem = drag.stem;
      document.getElementById("ghost").style.display = "none";
      document.querySelectorAll(".group").forEach(g => g.classList.remove("is-over"));
      if (wasActive) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const group = el && el.closest(".group");
        if (group) {
          const id = group.getAttribute("data-group-id");
          const item = items.find(it => it.stem === stem);
          if (item && id && item.suggested !== id) {
            item.suggested = id;
            toast(`${stem} → ${id}`);
            paint();
          }
        }
      }
      drag = null;
    }
    document.getElementById("list").addEventListener("pointerup", endDrag);
    document.getElementById("list").addEventListener("pointercancel", () => { drag = null; document.getElementById("ghost").style.display = "none"; });
    paint();
  })();
  </script>
</body>
</html>
```

(Implementer may tidy CSS/JS but must keep: payload script id, pointer drag, copy export shape, title+stem+description display.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test --import tsx test/tasks/utils/review-page.test.ts` from `extensions/clis`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/tasks/utils/review-page.ts \
  extensions/clis/src/tasks/project/assets/review-page.html \
  extensions/clis/test/tasks/utils/review-page.test.ts
git commit -m "$(cat <<'EOF'
feat: add review-page parse/render helpers

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>
EOF
)"
```

---

### Task 2: Build asset copy + CLI verb

**Files:**
- Create: `extensions/clis/src/tasks/project/review-page.ts`
- Create: `extensions/clis/scripts/copy-review-page-asset.mjs` (optional if `build` uses a one-liner)
- Modify: `extensions/clis/package.json`
- Modify: `extensions/clis/src/tasks/project.ts`
- Modify: `extensions/clis/src/tasks/utils/format.ts`
- Modify: `extensions/clis/test/tasks/cli.test.ts`
- Modify: `extensions/clis/test/tasks/parse.test.ts`
- Modify: `extensions/clis/README.md`
- Modify: `extensions/clis/src/tasks.ts` (help text if needed)

**Interfaces:**
- Consumes: helpers from Task 1
- Produces: `addProjectReviewPageCommand(project, ctx)` registering `review-page`

- [ ] **Step 1: Write failing CLI tests**

In `cli.test.ts`, extend project help test:

```ts
test("tasks project help lists list get create update review-page", async () => {
  const result = await run(["tasks", "project", "--help"]);
  for (const verb of ["list", "get", "create", "update", "review-page"]) {
    assert.match(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
  }
  assert.doesNotMatch(result.stdout, /^\s+classify\b/m);
});
```

In `parse.test.ts` add:

```ts
test("run tasks project review-page --from fixture writes html and returns path", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-rp-cli-"));
  try {
    const fixture = path.join(dir, "in.json");
    const out = path.join(dir, "out.html");
    await writeFile(
      fixture,
      JSON.stringify({
        groups: [
          { id: "default", title: "Default", description: "u" },
          { id: "cli", title: "CLI", description: "c" },
        ],
        items: [
          { stem: "2026-09-13--demo", current: "default", suggested: "cli", title: "Demo" },
        ],
      }),
      "utf8",
    );
    const result = await run(
      ["tasks", "project", "review-page", "--from", fixture, "--out", out],
      { env: { ...process.env, EDGES_REPO: dir } },
    );
    assert.equal(result.exitCode, 0);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.status, "success");
    assert.equal(payload.command, "project.review-page");
    assert.equal(payload.path, path.resolve(out));
    assert.equal(payload.itemCount, 1);
    assert.equal(payload.groupCount, 2);
    const html = await readFile(out, "utf8");
    assert.match(html, /2026-09-13--demo/);
    assert.match(html, /edges-review-payload/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("run tasks project review-page --from bad json is VALIDATION_ERROR", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-rp-bad-"));
  try {
    const fixture = path.join(dir, "bad.json");
    await writeFile(fixture, "{", "utf8");
    const result = await run(["tasks", "project", "review-page", "--from", fixture], {
      env: { ...process.env, EDGES_REPO: dir },
    });
    assert.equal(result.exitCode, 2);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.status, "failed");
    assert.equal(payload.errorCode, "VALIDATION_ERROR");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

(Adjust `run` / `EDGES_REPO` to match existing parse.test helpers — copy imports from neighboring tests.)

- [ ] **Step 2: Run CLI tests — expect fail** (help missing `review-page`, command unknown)

- [ ] **Step 3: Implement command + build copy**

`package.json` scripts:

```json
"build": "tsc -p tsconfig.json && node ./scripts/copy-review-page-asset.mjs"
```

`scripts/copy-review-page-asset.mjs`:

```js
import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const from = path.join(root, "../src/tasks/project/assets");
const to = path.join(root, "../dist/tasks/project/assets");
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
```

`project/review-page.ts`:

```ts
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { Command } from "commander";
import type { CliContext } from "../../context.js";
import {
  defaultReviewPageTemplatePath,
  parseReviewPageInput,
  renderReviewPageHtml,
  resolveReviewPageOutPath,
  writeReviewPage,
} from "../utils/review-page.js";
import { runTasksCommand, succeed } from "../utils/result.js";
import { TasksError } from "../utils/types.js";

export function addProjectReviewPageCommand(project: Command, ctx: CliContext): void {
  project
    .command("review-page")
    .description("Render a Task Project review HTML page from groups+items JSON (no board writes)")
    .requiredOption("--from <path>", "JSON file path, or - for stdin")
    .option("--out <path>", "HTML output path (default: OS temp file)")
    .action(async (opts: { from: string; out?: string }) => {
      await runTasksCommand(ctx, async () => {
        const rawText =
          opts.from === "-"
            ? await readStdin()
            : await readFile(opts.from, "utf8").catch(() => {
                throw new TasksError(
                  "VALIDATION_ERROR",
                  `review-page --from file not readable: ${opts.from}`,
                );
              });
        if (!rawText.trim()) {
          throw new TasksError("VALIDATION_ERROR", "review-page stdin is empty");
        }
        let raw: unknown;
        try {
          raw = JSON.parse(rawText);
        } catch {
          throw new TasksError("VALIDATION_ERROR", "review-page input must be a JSON object with groups[] and items[]");
        }
        const input = parseReviewPageInput(raw);
        const template = await readFile(defaultReviewPageTemplatePath(), "utf8");
        const html = renderReviewPageHtml(input, template);
        const outPath = resolveReviewPageOutPath(opts.out, Date.now(), tmpdir());
        await writeReviewPage(outPath, html, writeFile);
        return succeed({
          status: "success",
          command: "project.review-page",
          path: outPath,
          groupCount: input.groups.length,
          itemCount: input.items.length,
        });
      });
    });
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
```

Register in `project.ts`; update `PROJECT_AFTER_HELP`; extend `TasksSuccess` with `path?`, `groupCount?`, `itemCount?`.

- [ ] **Step 4: Run full edges-cli tests**

Run: `pnpm --filter edges-cli test`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/package.json extensions/clis/scripts/copy-review-page-asset.mjs \
  extensions/clis/src/tasks/project/review-page.ts extensions/clis/src/tasks/project.ts \
  extensions/clis/src/tasks/utils/format.ts extensions/clis/src/tasks.ts \
  extensions/clis/README.md extensions/clis/test/tasks/cli.test.ts \
  extensions/clis/test/tasks/parse.test.ts
git commit -m "$(cat <<'EOF'
feat: add edges tasks project review-page CLI

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>
EOF
)"
```

---

### Task 3: classifyTasks Skill + changelog pointers

**Files:**
- Modify: `extensions/skills/project-tasks-classify/SKILL.md`
- Modify: `extensions/skills/project-tasks-classify/CHANGELOG.md`
- Modify: `CHANGELOG.md`
- Modify: `.memory/projects/project_task_project_review_page_render_only_cli.md` (How-to landed)
- Optional: `extensions/skills/README.md` one line that proposeTypes (when added) reuses `project review-page`

- [ ] **Step 1: Rewrite Skill step 4 (primary path)**

Replace the “只输出 Markdown 表然后停止” block with:

1. Write suggestions JSON (`groups` from `project list`, `items` from whole-board suggestions) to a temp file
2. Run `tasks project review-page --from <file>`
3. Parse stdout `path`; tell human to open in **system browser** (cite Grok Bot preview drag bug note if useful)
4. **STOP** — wait for pasted 审阅导出行 JSON
5. On resume, validate pasted rows (`stem`/`current`/`suggested`/`action`), then existing step 5 apply

Keep a short **Fallback** subsection: if the host cannot open HTML, emit the Markdown table as today.

Update frontmatter `description` to mention 审阅页.

Update “能力面 / CLI” bullet to include `project review-page`.

- [ ] **Step 2: CHANGELOG entries**

Skill-local CHANGELOG + root `CHANGELOG.md` `[Unreleased]` Added line for the command; Changed line for classifyTasks gate.

- [ ] **Step 3: Commit**

```bash
git add extensions/skills/project-tasks-classify/SKILL.md \
  extensions/skills/project-tasks-classify/CHANGELOG.md \
  CHANGELOG.md \
  .memory/projects/project_task_project_review_page_render_only_cli.md
git commit -m "$(cat <<'EOF'
docs: classifyTasks primary gate uses project review-page

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>
EOF
)"
```

---

### Task 4: Manual smoke (executor checklist)

- [ ] **Step 1:** From a clone with real board data (or tiny fixture repo), build CLI (`pnpm --filter edges-cli build`) and run review-page on a hand-written JSON with ≥2 groups and ≥3 items including title/description
- [ ] **Step 2:** Open the printed path in system Chrome; drag one card; copy export JSON; confirm `action` flips between `keep`/`move`
- [ ] **Step 3:** Confirm `edges tasks project review-page` does not modify any file under `knowledge/tasks/` (git status clean for board)
- [ ] **Step 4:** Open PR for implementation (not this plan-only PR)

---

## Self-review (author)

**Spec coverage (ADR 0012):**
- Render-only CLI under `project review-page` → Task 2
- Input file/stdin JSON groups+items → Task 1–2
- Temp/`--out`, print path, no auto-open → Task 2
- Copy JSON round-trip; apply via existing verbs → Task 3 (Skill); page export shape → Task 1 HTML
- Asset in CLI package → Task 1–2
- classifyTasks step 4 primary path → Task 3
- Export fields stem/current/suggested/action/note → Task 1 HTML + Skill
- No `--mode` → Global Constraints + CLI surface
- No MCP / classify / apply-review / tools HTML → Do-not-create list
- proposeTypes reuse without implementing that Skill → noted explicitly

**Placeholder scan:** none intentional.

**Type consistency:** `command: "project.review-page"`; success fields `path`/`groupCount`/`itemCount`; validation message strings fixed above.

---

## Execution handoff

Plan complete when saved to `docs/superpowers/plans/2026-09-17-task-project-review-page.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — executing-plans in one session with checkpoints  

Which approach?
