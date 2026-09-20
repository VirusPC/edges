# Artifacts Preview Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a short-lived static Artifacts 预览服务 (upload → public URL → TTL delete) plus thin `edges artifacts` CLI, so humans can open Agent HTML (e.g. a Task Project 审阅页) in a real browser on a reachable URL.

**Architecture:** New pnpm workspace package `extensions/services/artifacts-preview/` is the HTTP service (Node `http`, disk store, server-side expiry). `edges artifacts` in `extensions/clis` is a thin client: `init` writes `~/.config/edges/artifacts.env`; `publish` / `rm` read that config and call the HTTP API. `edges tasks project review-page` stays render-only (ADR 0012). classifyTasks Skill adds one orchestration beat: render → publish → give the human the public URL. No result-back-to-agent-client. No new MCP this round (Capability Surface remains CLI + Skill + MCP; artifacts MCP is backlog).

**Tech Stack:** TypeScript, Node.js ≥20, NodeNext ESM (relative imports end in `.js`), `node:test` + `tsx`, `node:http`, `node:fs/promises`, `node:crypto`. CLI keeps existing `commander`. No Express/busboy. No embeddings. No browser automation in CI.

**Spec:** `docs/adr/0013-artifacts-preview-service.md` (accepted; extends ADR 0012; stacks ADR 0004). Glossary: `CONTEXT.md` terms **Artifacts 预览服务**, **Artifact（edges）**, **edges artifacts（CLI）**, **聊天 HTML 预览**, **本地 HTML 视图**, **Task Project 审阅页（edges）**. Prior plans to mirror: `docs/superpowers/plans/2026-09-17-task-project-review-page.md`. CLI context rule: `.memory/projects/project_cli_context_production_snapshot.md`. Test runner: `.memory/projects` under extensions — `project_clis_node_test_glob.md`, `project_node_esm_ts_import_js.md`.

## Global Constraints

- Co-authored-by on every commit: `Coding 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Capability Surface wording: always **CLI + Skill + MCP** (three peers). This round does **not** add an artifacts MCP; say so explicitly, do not write “CLI + Skill” as the Edges shorthand
- `edges tasks project review-page` stays render-only: no publish, no `--open`, no merge of hosting into that verb
- Do not implement review-result POST / callback to the agent client
- Do not change `knowledge/tasks` board **status** (do not `edges tasks status` on the artifacts task)
- Do not edit `knowledge/posts/`
- Do not put `ingest` / `fs` / `writer` / `now` / `fetch` / `repoPath` on `CliContext`
- Relative TypeScript imports use `.js` (nodenext)
- Test runners: `node --test --import tsx './test/**/*.test.ts'` (never `node --test --import tsx test`)
- Public repo: no credentials, tokens, or personal data in committed files; config lives in `~/.config/edges/artifacts.env` (gitignored by being outside the repo)
- Phone review needs a reachable URL (ECS / public host). Localhost is fine for laptop-only; document that phones cannot use localhost
- Layout: service package under `extensions/services/` (new sibling of `clis/` / `mcp-servers/`), **not** inside the CLI command tree. CLI stays the thin command surface

---

## File map

**Create — HTTP service (`extensions/services/artifacts-preview/`)**

- `package.json` — name `edges-artifacts-preview`, private, `"type": "module"`, scripts `build` / `start` / `dev` / `test`
- `tsconfig.json` — extends `../../../tsconfig.base.json`, `rootDir: src`, `outDir: dist`
- `README.md` — how to run locally and on ECS; phone-reachable URL note
- `CHANGELOG.md` — Unreleased Added
- `src/types.ts` — `ArtifactMeta`, `PublishBody`, `ServerOptions`
- `src/paths.ts` — UUID check, relative path safety, `safeResolve`
- `src/store.ts` — disk create/read/delete + expiry sweep
- `src/auth.ts` — Bearer timing-safe compare
- `src/http.ts` — request helpers (read JSON body, send JSON)
- `src/server.ts` — `createArtifactsServer` / `listenArtifactsServer`
- `src/index.ts` — process entry (env → listen)
- `test/paths.test.ts`
- `test/store.test.ts`
- `test/server.test.ts` — upload, auth reject, TTL, path safety

**Create — CLI (`extensions/clis/`)**

- `src/artifacts.ts` — group command `artifacts`
- `src/artifacts/init.ts` — `init`
- `src/artifacts/publish.ts` — `publish <path>`
- `src/artifacts/rm.ts` — `rm <id|url>`
- `src/artifacts/utils/config.ts` — read/write `artifacts.env`
- `src/artifacts/utils/collect.ts` — file/dir → publish files (skip symlinks)
- `src/artifacts/utils/client.ts` — `publishArtifact` / `deleteArtifact` (inject `fetch`)
- `src/artifacts/utils/ttl.ts` — parse `--ttl 24h` / `3600`
- `src/artifacts/utils/result.ts` — succeed/fail JSON (exit 0/1/2/4)
- `test/artifacts/config.test.ts`
- `test/artifacts/collect.test.ts`
- `test/artifacts/ttl.test.ts`
- `test/artifacts/cli.test.ts` — init + publish happy path (mocked HTTP)

**Modify**

- `pnpm-workspace.yaml` — add `extensions/services/*`
- `package.json` — optional `start:artifacts` / `dev:artifacts` scripts
- `extensions/README.md` — document `services/`
- `extensions/clis/src/program.ts` — register `addArtifactsCommand`; help lists `artifacts`
- `extensions/clis/src/context.ts` — `usageError` / `usageScope` add `"artifacts"`
- `extensions/clis/README.md` — document `edges artifacts`
- `extensions/clis/test/run.test.ts` — root help lists `artifacts`
- `extensions/clis/test/cli.test.ts` — real entry help lists `artifacts`
- `extensions/skills/project-tasks-classify/SKILL.md` — step 4: after render, `edges artifacts publish` then give URL; still STOP for pasted JSON; no result-back
- `extensions/skills/project-tasks-classify/CHANGELOG.md`
- `CHANGELOG.md` `[Unreleased]` — new module **Artifacts 预览**
- `CONTEXT.md` — `edges artifacts（CLI）` drop “约定中的”
- `.gitignore` — `extensions/services/*/node_modules/` and `extensions/services/*/dist/` (root `dist/` already covers)

**Do not create/commit**

- Artifacts MCP server
- Publish merged into `review-page`
- Review-result POST / callback
- Astro / long-term blog hosting
- Local HTML view card
- Board status changes under `knowledge/tasks/`
- Files under `knowledge/posts/`
- Rewriting ADR 0013’s historical “本轮只定文档” as if that grill implemented the service

---

## Locked design (read before Task 1)

### Layout (Edges convention)

`extensions/` already has `clis/` (command tree), `mcp-servers/` (MCP hosts), `skills/` (when/how). A long-running static host is neither a Commander node nor an MCP server, so it gets a new sibling:

```
extensions/services/artifacts-preview/   # HTTP process
extensions/clis/src/artifacts/           # thin CLI client
```

Do **not** put `createServer` inside `extensions/clis`. The CLI README rule is **file = one command node**.

### HTTP API

Default listen: `127.0.0.1:8787`. Override with `EDGES_ARTIFACTS_HOST` / `EDGES_ARTIFACTS_PORT`.
Public URL prefix for printed links: `EDGES_ARTIFACTS_BASE_URL` (no trailing slash), e.g. `http://127.0.0.1:8787` locally or `https://artifacts.example.com` on ECS.
Data dir: `EDGES_ARTIFACTS_DATA_DIR` or `path.join(os.tmpdir(), "edges-artifacts")`.
Shared token: `EDGES_ARTIFACTS_TOKEN` (required to start; refuse empty).
Default TTL: `86400` seconds. Override per publish via JSON `ttlSeconds` (integer, 1…2592000).
Body size cap: 10 MiB.

```
GET  /health
  → 200 {"ok":true}

POST /artifacts
  Authorization: Bearer <token>
  Content-Type: application/json
  {
    "ttlSeconds": 86400,
    "entry": "index.html",
    "from": { "kind": "cli", "name": "edges-cli" },
    "task": { "project": "_default", "stem": "2026-09-18--example" },
    "files": [
      { "path": "index.html", "content": "<html>…</html>" },
      { "path": "icon.png", "encoding": "base64", "content": "…" }
    ]
  }
  → 201 {
    "id": "<uuid>",
    "url": "http://127.0.0.1:8787/artifacts/<uuid>/",
    "expiresAt": "2026-09-20T14:00:00.000Z",
    "from": { "kind": "cli", "name": "edges-cli" },
    "task": { "project": "_default", "stem": "2026-09-18--example" }
  }

GET /artifacts/:id/
GET /artifacts/:id/:relpath
  no auth
  → 200 file bytes (or 302/200 of entry for trailing slash)
  → 404 if missing or expired (expired is deleted then 404)

DELETE /artifacts/:id
  Authorization: Bearer <token>
  → 204
  → 404 if missing
```

`files[].path` is a relative POSIX path. `encoding` omitted or `"utf8"` means `content` is UTF-8 text; `"base64"` means binary.

`entry` optional: default `index.html` if present, else the sole file if `files.length === 1`, else reject.
`from` required: `{ kind, name }` non-empty strings (kind ≤64, name ≤120). Suggested kinds: `skill` | `cli` | `agent`.
`task` optional: `{ project, stem }` both required when present (no path separators / `..`). Omit for a pure manual preview.

### Path safety

Reject a file path if any of:

- empty, contains `\0`, `\`, or starts with `/`
- any segment is `""`, `.`, or `..`
- after `path.posix.normalize` it still starts with `..` or is absolute

Serve/write only after `safeResolve(root, rel)`: `path.resolve(root, rel)` and require `resolved === root || resolved.startsWith(root + path.sep)`.

On write and on GET: `lstat` the final path; **refuse symlinks** (404 / validation error). Do not `realpath` through a symlink to escape the artifact root.

`:id` must match:

```
/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
```

(Use `crypto.randomUUID()` for new ids.)

### Auth

Write routes (`POST /artifacts`, `DELETE /artifacts/:id`) require `Authorization: Bearer <token>`.
Compare with `crypto.timingSafeEqual` on equal-length buffers; if lengths differ, still hash/compare a dummy so we do not throw.
GET of artifact URLs and `/health` are unauthenticated.
Missing/invalid token → `401` `{"status":"failed","errorCode":"AUTH_MISSING"|"AUTH_INVALID_FORMAT"|"AUTH_INVALID_TOKEN","reason":"…"}`.

### Disk layout

```
$dataDir/<uuid>/meta.json
$dataDir/<uuid>/files/<safe-relpath>
```

`meta.json`:

```json
{ "id": "<uuid>", "entry": "index.html", "expiresAt": "2026-09-20T14:00:00.000Z", "from": { "kind": "cli", "name": "edges-cli" }, "task": { "project": "_default", "stem": "2026-09-18--example" } }
```

Expiry cleanup:

- `sweepExpired(now)` deletes any artifact whose `expiresAt <= now`
- `createArtifactsServer` starts an interval (default 60s; injectable) that calls sweep
- GET of an expired id sweeps that one and returns 404

Inject `now: () => Date` and `idFactory: () => string` on `ServerOptions` / store options. Do **not** put these on `CliContext`.

### CLI surface

```
edges artifacts init [--base-url <url>] [--config <path>]
edges artifacts publish <path> [--ttl <duration>] [--entry <relpath>] [--from-kind <kind>] [--from-name <name>] [--task-project <slug>] [--task-stem <stem>] [--config <path>]
edges artifacts rm <id|url> [--config <path>]
```

Config file default: `path.join(os.homedir(), ".config/edges/artifacts.env")`.
Override with `--config` or `EDGES_ARTIFACTS_CONFIG`.

File format (KEY=VALUE, no export, `#` comments):

```
EDGES_ARTIFACTS_TOKEN=64-hex-chars
EDGES_ARTIFACTS_BASE_URL=http://127.0.0.1:8787
```

Env overrides file for `publish` / `rm`: `EDGES_ARTIFACTS_TOKEN`, `EDGES_ARTIFACTS_BASE_URL`.

`init`:

- Generate `crypto.randomBytes(32).toString("hex")`
- Write config (mkdir `~/.config/edges` as needed). Do not overwrite an existing token unless `--force` (include `--force`; without it, fail VALIDATION_ERROR if token already present)
- `--base-url` default `http://127.0.0.1:8787`
- stdout JSON:

```json
{"status":"success","command":"artifacts.init","configPath":"/home/x/.config/edges/artifacts.env","baseUrl":"http://127.0.0.1:8787","tokenCreated":true}
```

- stderr (human, not JSON) prints what the **server** needs:

```
Server needs:
  EDGES_ARTIFACTS_TOKEN=<same token>
  EDGES_ARTIFACTS_BASE_URL=<public URL for printed links>
  EDGES_ARTIFACTS_HOST=0.0.0.0   # ECS; local default is 127.0.0.1
  EDGES_ARTIFACTS_PORT=8787
Phone review needs a reachable URL (not localhost).
```

`publish`:

- `<path>` is a file or directory
- Directory: walk regular files only; skip hidden names starting with `.`; skip symlinks; reject unsafe relative paths
- `--ttl` accepts `24h` / `90m` / `3600` / `1d` (integer seconds if bare number). Default 24h
- `--from-kind` / `--from-name` required on the HTTP body; defaults `cli` / `edges-cli`
- `--task-project` / `--task-stem` optional together; omit both for no `task` pointer
- Calls `POST /artifacts` with Bearer token
- stdout JSON:

```json
{"status":"success","command":"artifacts.publish","id":"<uuid>","url":"http://127.0.0.1:8787/artifacts/<uuid>/","expiresAt":"…","from":{"kind":"cli","name":"edges-cli"}}
```

`rm`:

- Argument is a UUID or a URL containing `/artifacts/<uuid>`
- `DELETE /artifacts/:id`
- stdout JSON: `{"status":"success","command":"artifacts.rm","id":"<uuid>"}`

Exit codes (match note): `0` success, `2` validation, `4` auth, `1` runtime.

JSON failure envelope: `{"status":"failed","errorCode":"VALIDATION_ERROR"|"AUTH_MISSING"|"AUTH_INVALID_TOKEN"|"UNKNOWN_ERROR","reason":"…"}`.

### Skill orchestration (minimal)

In `extensions/skills/project-tasks-classify/SKILL.md` step 4, after `review-page` prints `path`:

1. If the human needs a reachable URL (phone / other machine):

```bash
pnpm --filter edges-cli exec tsx src/index.ts artifacts publish <absolute-html-path> --from-kind skill --from-name project-tasks-classify --task-project <slug> --task-stem <stem>
```

2. Give the human `url` from stdout. Say: open in a **system browser**; phone needs the ECS / public `EDGES_ARTIFACTS_BASE_URL`, not `localhost`.
3. Still **STOP** and wait for pasted 审阅导出行 JSON.
4. Do **not** implement POST-back of the review result.
5. `review-page` itself still does not publish.

### Server process

```bash
# after edges artifacts init — export the printed token on the server
EDGES_ARTIFACTS_TOKEN=… \
EDGES_ARTIFACTS_BASE_URL=http://127.0.0.1:8787 \
pnpm --filter edges-artifacts-preview dev
```

ECS: same binary; set `EDGES_ARTIFACTS_HOST=0.0.0.0` and a public `EDGES_ARTIFACTS_BASE_URL`. Document in the service README. Do not invent a new GitHub Actions deploy in this plan.

---

### Task 1: Path safety + disk store

**Files:**
- Create: `extensions/services/artifacts-preview/package.json`
- Create: `extensions/services/artifacts-preview/tsconfig.json`
- Create: `extensions/services/artifacts-preview/src/types.ts`
- Create: `extensions/services/artifacts-preview/src/paths.ts`
- Create: `extensions/services/artifacts-preview/src/store.ts`
- Create: `extensions/services/artifacts-preview/test/paths.test.ts`
- Create: `extensions/services/artifacts-preview/test/store.test.ts`
- Modify: `pnpm-workspace.yaml`

**Interfaces:**
- Produces: `isArtifactId(id: string): boolean`
- Produces: `assertSafeRelPath(rel: string): string` (throws `Error` with stable messages below)
- Produces: `safeResolve(root: string, rel: string): string`
- Produces: `createArtifactStore(options: { dataDir: string; now?: () => Date; idFactory?: () => string })`
- Produces: `store.put({ ttlSeconds, entry, files }): Promise<{ id, expiresAt }>`
- Produces: `store.getFile(id, rel): Promise<{ bytes: Buffer, contentType: string } | null>`
- Produces: `store.getMeta(id): Promise<ArtifactMeta | null>`
- Produces: `store.remove(id): Promise<boolean>`
- Produces: `store.sweepExpired(now?: Date): Promise<number>`

Stable validation messages:

- `artifact path must be a relative POSIX path`
- `artifact path must not contain '..' or empty segments`
- `artifact path escapes the artifact root`
- `artifact path must not be a symlink`

- [ ] **Step 1: Write failing path tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { assertSafeRelPath, isArtifactId, safeResolve } from "../src/paths.js";

test("accepts a nested relative file path", () => {
  assert.equal(assertSafeRelPath("index.html"), "index.html");
  assert.equal(assertSafeRelPath("css/app.css"), "css/app.css");
});

test("rejects traversal and absolute paths", () => {
  for (const rel of ["../secret", "foo/../../etc/passwd", "/etc/passwd", "a\\b", "foo/./../x"]) {
    assert.throws(() => assertSafeRelPath(rel), /relative POSIX|\.\.|empty segments|escapes/);
  }
});

test("isArtifactId accepts UUID and rejects junk", () => {
  assert.equal(isArtifactId("2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab"), true);
  assert.equal(isArtifactId("not-a-uuid"), false);
  assert.equal(isArtifactId("2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/../x"), false);
});

test("safeResolve stays under root", () => {
  const root = "/tmp/edges-artifacts/id";
  assert.equal(safeResolve(root, "index.html"), "/tmp/edges-artifacts/id/index.html");
  assert.throws(() => safeResolve(root, "../x"), /escapes|relative|\.\./);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd extensions/services/artifacts-preview && pnpm test` (after adding package.json / workspace). Expected: FAIL module not found.

- [ ] **Step 3: Implement paths + store + package scaffold**

`package.json` name `edges-artifacts-preview`, scripts matching clis (`"test": "node --test --import tsx './test/**/*.test.ts'"`). Workspace glob `extensions/services/*`. Then implement `paths.ts` and `store.ts` so tests pass. `put` writes `meta.json` + files under `files/`. `getFile` returns null for missing, expired (and deletes), or symlink. `sweepExpired` removes expired dirs.

- [ ] **Step 4: Write store tests (TTL + symlink refuse) and implement until green**

```ts
test("put then getFile returns bytes before expiry", async () => {
  // tmp dir, fixed now, ttl 60
});

test("getFile returns null and deletes after expiry", async () => {
  // put with ttl 1, now() jumps past expiresAt
});

test("getFile refuses a symlink inside the artifact dir", async () => {
  // put a file, replace it with symlink to /etc/passwd, getFile → null
});
```

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml extensions/services/artifacts-preview
git commit -m "feat(artifacts): add preview store with path safety"
```

Trailer: `Co-authored-by: Coding 专家 <grok-bot@users.noreply.github.com>`

---

### Task 2: HTTP service (upload, auth, GET, delete, sweep)

**Files:**
- Create: `extensions/services/artifacts-preview/src/auth.ts`
- Create: `extensions/services/artifacts-preview/src/http.ts`
- Create: `extensions/services/artifacts-preview/src/server.ts`
- Create: `extensions/services/artifacts-preview/src/index.ts`
- Create: `extensions/services/artifacts-preview/test/server.test.ts`

**Interfaces:**
- Consumes: store + `assertSafeRelPath` from Task 1
- Produces: `createArtifactsServer(options: ServerOptions): http.Server`
- Produces: `listenArtifactsServer(options): Promise<{ server, url, close }>` (`listen(0)` in tests)

`ServerOptions`: `{ token: string; dataDir: string; baseUrl: string; now?: () => Date; idFactory?: () => string; sweepIntervalMs?: number | null }` (`null` disables interval in tests).

- [ ] **Step 1: Write failing server tests**

Cover: `POST` 201 + `GET` 200 body; `POST` without Bearer → 401; `POST` wrong token → 401; `GET` needs no auth; expired artifact → 404; `GET /artifacts/<id>/../../outside` does not escape; `DELETE` requires auth and removes.

- [ ] **Step 2: Run to verify fail**
- [ ] **Step 3: Implement `auth.ts` + `server.ts` + `index.ts`**
- [ ] **Step 4: Tests green**
- [ ] **Step 5: Commit** `feat(artifacts): serve upload GET delete with token and TTL`

---

### Task 3: `edges artifacts` CLI (init / publish / rm)

**Files:**
- Create: CLI files listed in File map
- Modify: `program.ts`, `context.ts`, clis README, root/clis help tests

**Interfaces:**
- Consumes: HTTP contract from Task 2
- Produces: `run(["artifacts", …])` → `CliResult`
- `publishArtifact({ baseUrl, token, files, ttlSeconds, entry, fetch })`
- `readArtifactsConfig(env, configPath?)` / `writeArtifactsConfig(path, { token, baseUrl })`

- [ ] **Step 1: Write failing tests** — init writes env file and prints server needs on stderr; publish mocked `fetch` POSTs JSON and prints `url`; missing token → exit 4 or 2 as specified; root `--help` lists `artifacts`
- [ ] **Step 2: Verify fail**
- [ ] **Step 3: Implement CLI leaves; domain functions take `fetch` — not CliContext**
- [ ] **Step 4: Tests green (`pnpm --filter edges-cli test` and service tests)**
- [ ] **Step 5: Commit** `feat(artifacts): add edges artifacts init publish rm`

---

### Task 4: Docs, Skill note, changelogs

**Files:**
- Create: service README + CHANGELOG
- Modify: `extensions/README.md`, root `CHANGELOG.md` Unreleased (module **Artifacts 预览**), classify Skill + its CHANGELOG, `CONTEXT.md` (`edges artifacts` no longer “约定中的”), optional `package.json` start scripts

Root changelog (human Chinese + real command names, no ADR/plan dump):

```
### Artifacts 预览

- 可以把短生命周期的静态页（例如审阅页 HTML）上传成真浏览器能打开的 URL，到期自动删。起服务用 `pnpm --filter edges-artifacts-preview start`；本机先 `edges artifacts init` 写下 token 和 `EDGES_ARTIFACTS_BASE_URL`，再 `edges artifacts publish <path>` 打印公开 URL，`edges artifacts rm <id|url>` 提前删。写接口要共享 token；浏览器打开 URL 不登录。手机审阅必须用 ECS / 可达地址，不能假定 localhost。`edges tasks project review-page` 仍只渲染，不发布。本轮没有 artifacts MCP。
```

- [ ] **Step 1: Write the docs listed above**
- [ ] **Step 2: Commit** `docs(artifacts): document preview service and Skill publish step`

---

### Task 5: Memory pointer + verify

- Update `.memory/projects/project_artifacts_preview_service.md` via `$project-memory-remember` (same slug): implementation landed; How-to lists service package + CLI verbs; drop “本轮只定 CONTEXT / ADR”.
- Run `pnpm --filter edges-artifacts-preview test` and `pnpm --filter edges-cli test`.
- Do **not** change Task board status.

---

## Self-review

1. **Spec coverage:** ADR v1 upload/URL/TTL, TS stack, same service local+ECS, `edges artifacts` init/publish/rm, review-page render-only, write token / read UUID, default 24h + override, server cleanup, Skill render→publish→URL, no MCP, no result-back, no Astro, no local view card — each has a task.
2. **Placeholders:** none; messages, JSON shapes, and commands are spelled out.
3. **Types:** `ArtifactMeta`, `PublishBody`, CLI `command` strings `artifacts.init|publish|rm` are consistent across tasks.
