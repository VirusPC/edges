# Capability Surface (CLI + Skill + MCP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete repo-root `bin/`, move note-ingest git into `extensions/clis` TypeScript with full `bin/new-note` parity, make MCP spawn `edges note`, and add an `edges-note` Skill that only teaches when/how to call the CLI (or MCP when there is no shell).

**Architecture:** Capability Surface is three entries — CLI, Skill, MCP — as defined in CONTEXT and accepted in ADR-0004. The `edges` CLI owns git via small `execFile('git', …)` wrappers (no `simple-git`, no leftover bash). MCP is a subprocess client of that CLI (`execFile` of the `edges-cli` entry + `note` flags), not an in-process import and not `execFile` of a repo-root script. Skill is a SKILL.md only: invoke recipes, JSON/exit codes, and the no-shell MCP peer. npm `package.json` `"bin": { "edges": … }` stays an install hook, not a glossary layer.

**Tech Stack:** TypeScript, Node.js ≥20, `node:child_process.execFile` (git/gh from CLI; `edges note` from MCP), existing `commander` + `zod`, `node:test` + `tsx`, Node built-in `fetch` + `encodeURIComponent` (replace bash `curl`/`python3`).

**Spec:** `docs/adr/0004-capability-surface-cli-skill-mcp.md` (accepted). Glossary: `CONTEXT.md` terms **能力面（Capability Surface）**, **CLI**, **Skill（调用说明）**, **MCP（Edges）**. Behavioral source until Task 4 deletes it: `bin/new-note`. Prior layering note (will be updated in Task 6): `.memory/projects/project_capability_surface_cli_skill_mcp.md`.

## Global Constraints

- Co-authored-by on every commit: `Coding Agent 专家 <grok-bot@users.noreply.github.com>`
- Git subject: `type: subject`
- Do **not** auto-create/edit/move/delete `knowledge/posts/`
- Do **not** change `knowledge/tasks` board status or task bodies
- Do **not** rewrite historical notes under `knowledge/notes/` (they record past design)
- Do **not** add `simple-git` or any extra git library
- Do **not** keep any file under repo-root `bin/` (delete the directory)
- Do **not** in-process `import` CLI modules from MCP this round
- Do **not** `execFile` bash or `bin/new-note` from MCP
- Do **not** put git/ingest implementation in the Skill (`extensions/skills/edges-note/` has no `scripts/` that talk to git)
- npm `package.json` `"bin"` on `edges-cli` remains the `edges` install hook only — never describe it as a Capability Surface layer
- Node `>=20`; keep `commander` / `zod` / `node:test`
- Public repo: no credentials, tokens, or personal data in commits
- If `docs/adr/0004-capability-surface-cli-skill-mcp.md` is missing on the implementation branch, cherry-pick `53ff4ad` from `cursor/capability-surface-cli-skill-mcp-b627` (PR #41) or rebase onto `main` after that PR merges. This plan branch already includes that cherry-pick.
- `pull` / `rebase` use `--autostash`. Do not commit `.obsidian/workspace.json`

---

## File map

**Create**

- `extensions/clis/src/git/slug.ts` — title → slug (bash `tr` rules)
- `extensions/clis/src/git/markers.ts` — format/parse `__EDGES_*__` lines
- `extensions/clis/src/git/exec.ts` — `execFile` wrapper + `commandExists`
- `extensions/clis/src/git/pr.ts` — remote → repo path, compare URL, gh / token / fallback
- `extensions/clis/src/git/ingest.ts` — `runNoteIngest` orchestration (write note, git, markers)
- `extensions/clis/test/git-slug.test.ts`
- `extensions/clis/test/git-markers.test.ts`
- `extensions/clis/test/git-pr.test.ts`
- `extensions/clis/test/git-ingest.test.ts`
- `extensions/mcp-servers/new-note/src/cliAdapter.ts` — spawn `edges note`, parse JSON
- `extensions/skills/edges-note/SKILL.md`
- `extensions/skills/edges-note/CHANGELOG.md`

**Modify**

- `extensions/clis/src/types.ts` — drop `scriptPath` from `RuntimeConfig`
- `extensions/clis/src/config.ts` — drop `EDGES_SCRIPT`
- `extensions/clis/src/service.ts` — default runner = `runNoteIngest`
- `extensions/clis/src/run.ts` — default ingest = `runNoteIngest`
- `extensions/clis/src/help.ts` — ENV without `EDGES_SCRIPT`; `GITHUB_TOKEN` goes to TS git
- `extensions/clis/src/errors.ts` — `ENOENT` on git → `GIT_FAILURE`, not `SCRIPT_NOT_FOUND`
- `extensions/clis/README.md` — git lives in this package
- `extensions/clis/test/config.test.ts`, `service.test.ts`, `errors.test.ts`, `ingest.test.ts`, `run.test.ts`
- `extensions/mcp-servers/new-note/src/types.ts` — `scriptPath` → `cliEntry`
- `extensions/mcp-servers/new-note/src/config.ts` — resolve `edges-cli` entry; honor `EDGES_CLI`
- `extensions/mcp-servers/new-note/src/service.ts` — default runner = `runEdgesNote`
- `extensions/mcp-servers/new-note/src/errors.ts` — missing CLI entry → `SCRIPT_NOT_FOUND`
- `extensions/mcp-servers/new-note/src/server.ts` — log `cliEntry`, not script path
- `extensions/mcp-servers/new-note/README.md` + parent `extensions/mcp-servers/README.md`
- `extensions/mcp-servers/new-note/test/scriptAdapter.test.ts` → rewrite as `cliAdapter.test.ts`
- `extensions/mcp-servers/new-note/test/service.test.ts`, `authMiddleware.test.ts`, `integration.sh`
- `scripts/setup` — stop adding a `bin/` PATH; keep `.env` sourcing
- `scripts/README.md`, root `README.md`, `extensions/README.md`, `extensions/tools/README.md`
- `CHANGELOG.md` Unreleased — Removed `bin/`; Changed MCP spawn; Added `edges-note` skill
- Memory via `memory.py remember` (not hand-edited indexes): `project_capability_surface_cli_skill_mcp`, `project_new_note_ingest`, `project_clis_from_mcp`, `reference_bin_cli_skill_classic_projects`. If `project_bin_cli_skill_layering` is still present, delete that file after remember so the two-layer slug leaves the index.

**Delete**

- entire `bin/` (`bin/new-note`, `bin/README.md`)
- `extensions/clis/src/scriptAdapter.ts`
- `extensions/mcp-servers/new-note/src/scriptAdapter.ts`

**Do not create/commit**

- Skill `scripts/` that reimplement git
- `simple-git` dependency
- `knowledge/posts/**` edits
- Task board status moves
- Historical rewrite of `CHANGELOG.md` `[1.1.0]` / `knowledge/notes/*`

---

## Locked design (read before Task 1)

### Git approach

One `ExecFn` wrapping `execFile(file, args, { cwd, env, encoding: "utf8" })`. CLI calls `exec("git", …)` and `exec("gh", …)`. PR HTTP fallback uses global `fetch` (Node 20), not `curl` + `python3`. URL encoding uses `encodeURIComponent` (same as Python `urllib.parse.quote(..., safe='')`).

### Parity with `bin/new-note` (must preserve)

| Item | Behavior |
| --- | --- |
| Args | `title`, `content`, `coAuthor` (CLI already maps flags → these fields before git starts) |
| Env | `EDGES_REPO`, `EDGES_BASE_BRANCH` (default `main`), `EDGES_MODE` (`direct` \| `pr`, default `direct`), `EDGES_DRY_RUN` (`true` skips checkout/pull/push only), `GITHUB_TOKEN` |
| Slug | `title` → lower → spaces to `-` → keep only `[a-z0-9-]`. Empty (e.g. CJK-only) → `untitled-${unixSeconds}` |
| File | `knowledge/notes/YYYY-MM-DD--${slug}.md` (`YYYY-MM-DD` is **local** date, bash `date +%Y-%m-%d`) |
| Branch | `pr`: `ingest/${DATE}-${slug}`. `direct`: marker branch = `baseBranch` |
| Dry-run | Skip `git checkout $BASE` and `git pull` and all `git push`. Still `mkdir`, write file, `git add`, `git commit`. `pr` still runs `git checkout -b $BRANCH`. `direct` does **not** checkout base (commit lands on the current branch; marker still names `baseBranch`) |
| Commit | Subject `ingest: ${TITLE}`, blank line, `Co-authored-by: ${CO_AUTHOR}` |
| Note body | `# ${TITLE}\n\n> Ingested on ${DATE}\n\n${CONTENT}\n` |
| Markers on the **git module** stdout string | `__EDGES_FILE__`, `__EDGES_BRANCH__`, `__EDGES_PR_STATUS__` (`created` \| `unavailable` \| `direct_commit`), `__EDGES_PR_URL__` |
| PR | `gh auth status` then `gh pr create`; else `GITHUB_TOKEN` + GitHub API; else compare URL |

Human diagnostic lines from bash (`📝 Mode: …`, `🌿 Mode: …`, `✅ Ingested: …`, `🔗` / `⚠️` / `📎` / `💡`) stay on that same stdout string so CLI `diagnosticsFromScript` still strips `__EDGES_` lines onto stderr.

### Intentional fix (do not copy the bash bug)

`bin/new-note` sets `PR_CREATED=true` when `gh pr create` succeeds but never assigns `PR_HTML_URL`, so it prints `__EDGES_PR_STATUS__=unavailable`. The port **must** parse the PR URL from `gh pr create` stdout (first `https://github.com/` line). `prStatus` is `created` when that URL exists. Marker semantics win over the bash bug.

### CLI vs MCP output

- CLI stdout stays JSON (`formatResult`). Markers are **not** CLI stdout; they live on `ScriptSuccess.stdout` inside the git module.
- MCP spawns `edges note … --json` and parses **JSON**, not markers.

### Auth mapping (MCP → CLI)

MCP HTTP/stdio already gates on `EDGES_AUTH_TOKEN`. The child process **must omit `EDGES_AUTH_TOKEN`** so the CLI does not demand `--token-file` / `--token-stdin`. Pass through `EDGES_REPO`, `EDGES_BASE_BRANCH`, `EDGES_MODE`, `EDGES_DRY_RUN`, `GITHUB_TOKEN`. If MCP `mode`/`dryRun` are set, also pass `--mode` / `--dry-run` flags.

### `SCRIPT_NOT_FOUND`

- CLI: `ENOENT` spawning `git`/`gh` is `GIT_FAILURE`. Drop the `ENOENT` → `SCRIPT_NOT_FOUND` mapping (there is no script).
- MCP: `ENOENT` spawning the `edges-cli` entry is `SCRIPT_NOT_FOUND` (same error code, new meaning: CLI entry missing). Keep the code in the MCP union.

### `EDGES_SCRIPT`

Remove from CLI config, help, and tests. Isolation tests use `EDGES_REPO` only; git runs in-process via `runNoteIngest`.

---

### Task 1: TypeScript git ingest module (unit-tested, mocked exec)

**Files:**
- Create: `extensions/clis/src/git/slug.ts`
- Create: `extensions/clis/src/git/markers.ts`
- Create: `extensions/clis/src/git/exec.ts`
- Create: `extensions/clis/src/git/pr.ts`
- Create: `extensions/clis/src/git/ingest.ts`
- Test: `extensions/clis/test/git-slug.test.ts`
- Test: `extensions/clis/test/git-markers.test.ts`
- Test: `extensions/clis/test/git-pr.test.ts`
- Test: `extensions/clis/test/git-ingest.test.ts`

**Interfaces:**
- Consumes: `IngestRequest` from `extensions/clis/src/types.ts` (`title`, `content`, `coAuthor`)
- Produces:
  - `titleToSlug(title: string, now?: Date): string`
  - `localDateYmd(now: Date): string`
  - `formatMarkerStdout(markers: IngestMarkers): string`
  - `parseMarkers(stdout: string): { filePath?: string; branch?: string; prStatus?: PrStatus; prUrl?: string; diagnostics: string }`
  - `type ExecFn = (file: string, args: string[], options?: { cwd?: string; env?: NodeJS.ProcessEnv }) => Promise<{ stdout: string; stderr: string }>`
  - `createExecFile(): ExecFn`
  - `repoPathFromRemote(remoteUrl: string): string | undefined`
  - `buildCompareUrl(input: { remoteUrl: string; baseBranch: string; branch: string; title: string; body: string }): string | undefined`
  - `createPullRequest(input: CreatePrInput): Promise<{ created: boolean; htmlUrl?: string; compareUrl?: string }>`
  - `type IngestGitConfig = { repoPath: string; baseBranch: string; mode: "pr" \| "direct"; dryRun: boolean }`
  - `type IngestGitDeps = { exec: ExecFn; now?: Date; writeFile?: (absPath: string, contents: string) => Promise<void>; mkdirp?: (absDir: string) => Promise<void>; directoryExists?: (absPath: string) => Promise<boolean>; fetchJson?: (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ html_url?: string }> }`
  - `runNoteIngest(input: IngestRequest, config: IngestGitConfig, env?: NodeJS.ProcessEnv, deps?: IngestGitDeps): Promise<ScriptSuccess>`
  - `ScriptSuccess` remains `{ filePath, branch, prUrl?, prStatus, stdout }`

- [ ] **Step 1: Write the failing tests**

Create `extensions/clis/test/git-slug.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { titleToSlug, localDateYmd } from "../src/git/slug.js";

test("titleToSlug lowercases, hyphens spaces, strips other chars", () => {
  assert.equal(titleToSlug("Hello World!"), "hello-world");
  assert.equal(titleToSlug("A  B"), "a--b");
});

test("titleToSlug falls back for non-ASCII titles using unix seconds", () => {
  const now = new Date("2026-09-11T12:00:00+00:00");
  assert.equal(titleToSlug("中文标题", now), `untitled-${Math.floor(now.getTime() / 1000)}`);
});

test("localDateYmd uses local calendar date", () => {
  const now = new Date(2026, 8, 11, 15, 0, 0);
  assert.equal(localDateYmd(now), "2026-09-11");
});
```

Create `extensions/clis/test/git-markers.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { formatMarkerStdout, parseMarkers } from "../src/git/markers.js";

test("formatMarkerStdout writes the four bash markers", () => {
  const stdout = formatMarkerStdout({
    filePath: "knowledge/notes/2026-09-11--hello.md",
    branch: "ingest/2026-09-11-hello",
    prStatus: "created",
    prUrl: "https://github.com/org/repo/pull/1",
  });
  assert.match(stdout, /__EDGES_FILE__=knowledge\/notes\/2026-09-11--hello\.md/);
  assert.match(stdout, /__EDGES_BRANCH__=ingest\/2026-09-11-hello/);
  assert.match(stdout, /__EDGES_PR_STATUS__=created/);
  assert.match(stdout, /__EDGES_PR_URL__=https:\/\/github.com\/org\/repo\/pull\/1/);
});

test("parseMarkers reads markers and leaves diagnostics", () => {
  const parsed = parseMarkers(
    "📝 Mode: Direct commit to main\n__EDGES_FILE__=knowledge/notes/a.md\n__EDGES_BRANCH__=main\n__EDGES_PR_STATUS__=direct_commit\n__EDGES_PR_URL__=\n",
  );
  assert.equal(parsed.filePath, "knowledge/notes/a.md");
  assert.equal(parsed.branch, "main");
  assert.equal(parsed.prStatus, "direct_commit");
  assert.match(parsed.diagnostics, /Mode: Direct commit/);
});
```

Create `extensions/clis/test/git-pr.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { repoPathFromRemote, buildCompareUrl, createPullRequest } from "../src/git/pr.js";

test("repoPathFromRemote accepts ssh and https", () => {
  assert.equal(repoPathFromRemote("git@github.com:VirusPC/edges.git"), "VirusPC/edges");
  assert.equal(repoPathFromRemote("https://github.com/VirusPC/edges.git"), "VirusPC/edges");
});

test("buildCompareUrl encodes title and body", () => {
  const url = buildCompareUrl({
    remoteUrl: "https://github.com/VirusPC/edges.git",
    baseBranch: "main",
    branch: "ingest/2026-09-11-hello",
    title: "Hello World",
    body: "Auto-ingested with AI assistance.\n\nCo-authored-by: A <a@b.c>",
  });
  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/VirusPC/edges/compare/main...ingest/2026-09-11-hello");
  assert.equal(parsed.searchParams.get("expand"), "1");
  assert.equal(parsed.searchParams.get("title"), "Hello World");
});

test("createPullRequest uses gh stdout URL when auth status succeeds", async () => {
  const calls: string[][] = [];
  const result = await createPullRequest({
    title: "Hello",
    body: "Body",
    branch: "ingest/x",
    baseBranch: "main",
    remoteUrl: "https://github.com/VirusPC/edges.git",
    exec: async (file, args) => {
      calls.push([file, ...args]);
      if (file === "gh" && args[0] === "auth") return { stdout: "ok", stderr: "" };
      if (file === "gh" && args[0] === "pr") {
        return { stdout: "https://github.com/VirusPC/edges/pull/9\n", stderr: "" };
      }
      throw new Error(`unexpected ${file} ${args.join(" ")}`);
    },
  });
  assert.equal(result.created, true);
  assert.equal(result.htmlUrl, "https://github.com/VirusPC/edges/pull/9");
  assert.ok(calls.some((c) => c[0] === "gh" && c[1] === "pr"));
});

test("createPullRequest falls back to token fetch then compare URL", async () => {
  const result = await createPullRequest({
    title: "Hello",
    body: "Body",
    branch: "ingest/x",
    baseBranch: "main",
    remoteUrl: "https://github.com/VirusPC/edges.git",
    githubToken: "ghs_test",
    exec: async (file) => {
      if (file === "gh") throw Object.assign(new Error("not found"), { code: "ENOENT" });
      return { stdout: "", stderr: "" };
    },
    fetchJson: async (url, init) => {
      assert.equal(url, "https://api.github.com/repos/VirusPC/edges/pulls");
      assert.equal(init.method, "POST");
      assert.equal(init.headers.Authorization, "token ghs_test");
      return { html_url: "https://github.com/VirusPC/edges/pull/3" };
    },
  });
  assert.equal(result.created, true);
  assert.equal(result.htmlUrl, "https://github.com/VirusPC/edges/pull/3");
});
```

Create `extensions/clis/test/git-ingest.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { runNoteIngest } from "../src/git/ingest.js";
import type { ExecFn } from "../src/git/exec.js";

const input = {
  title: "Hello World",
  content: "Body text",
  coAuthor: "Tester <tester@example.com>",
};

const now = new Date("2026-09-11T12:00:00+00:00");

function recordingExec(calls: string[][]): ExecFn {
  return async (file, args) => {
    calls.push([file, ...args]);
    if (file === "git" && args[0] === "--version") return { stdout: "git version 2.0", stderr: "" };
    return { stdout: "", stderr: "" };
  };
}

test("dry-run direct writes the note, commits, skips checkout/pull/push", async () => {
  const calls: string[][] = [];
  const writes: Record<string, string> = {};
  const result = await runNoteIngest(
    input,
    { repoPath: "/repo", baseBranch: "main", mode: "direct", dryRun: true },
    { GITHUB_TOKEN: "" },
    {
      exec: recordingExec(calls),
      now,
      directoryExists: async () => true,
      mkdirp: async () => undefined,
      writeFile: async (absPath, contents) => {
        writes[absPath] = contents;
      },
    },
  );

  assert.equal(result.filePath, "knowledge/notes/2026-09-11--hello-world.md");
  assert.equal(result.branch, "main");
  assert.equal(result.prStatus, "direct_commit");
  assert.match(result.stdout, /__EDGES_PR_STATUS__=direct_commit/);
  assert.equal(
    writes["/repo/knowledge/notes/2026-09-11--hello-world.md"],
    "# Hello World\n\n> Ingested on 2026-09-11\n\nBody text\n",
  );

  const gitCommands = calls.filter((c) => c[0] === "git").map((c) => c.slice(1));
  assert.ok(gitCommands.some((a) => a[0] === "add"));
  assert.ok(
    gitCommands.some(
      (a) => a[0] === "commit" && a.includes("-m") && a.some((x) => x.startsWith("ingest: Hello World")),
    ),
  );
  assert.ok(!gitCommands.some((a) => a[0] === "checkout"));
  assert.ok(!gitCommands.some((a) => a[0] === "pull"));
  assert.ok(!gitCommands.some((a) => a[0] === "push"));
});

test("dry-run pr creates local branch and does not push", async () => {
  const calls: string[][] = [];
  const result = await runNoteIngest(
    input,
    { repoPath: "/repo", baseBranch: "main", mode: "pr", dryRun: true },
    {},
    {
      exec: recordingExec(calls),
      now,
      directoryExists: async () => true,
      mkdirp: async () => undefined,
      writeFile: async () => undefined,
    },
  );

  assert.equal(result.branch, "ingest/2026-09-11-hello-world");
  assert.equal(result.prStatus, "unavailable");
  assert.match(result.stdout, /__EDGES_PR_STATUS__=unavailable/);
  const gitCommands = calls.filter((c) => c[0] === "git").map((c) => c.slice(1));
  assert.ok(gitCommands.some((a) => a[0] === "checkout" && a[1] === "-b" && a[2] === "ingest/2026-09-11-hello-world"));
  assert.ok(!gitCommands.some((a) => a[0] === "pull"));
  assert.ok(!gitCommands.some((a) => a[0] === "push"));
});

test("commit message includes Co-authored-by trailer", async () => {
  const calls: string[][] = [];
  await runNoteIngest(
    input,
    { repoPath: "/repo", baseBranch: "main", mode: "direct", dryRun: true },
    {},
    {
      exec: recordingExec(calls),
      now,
      directoryExists: async () => true,
      mkdirp: async () => undefined,
      writeFile: async () => undefined,
    },
  );
  const commit = calls.find((c) => c[0] === "git" && c[1] === "commit");
  assert.ok(commit);
  const message = commit[commit.indexOf("-m") + 1];
  assert.equal(message, "ingest: Hello World\n\nCo-authored-by: Tester <tester@example.com>\n");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/git-slug.test.ts test/git-markers.test.ts test/git-pr.test.ts test/git-ingest.test.ts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../src/git/slug.js` (and the other new modules).

- [ ] **Step 3: Write the minimal implementation**

`extensions/clis/src/git/slug.ts`:

```ts
export function localDateYmd(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function titleToSlug(title: string, now: Date = new Date()): string {
  const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
  if (slug.length === 0) {
    return `untitled-${Math.floor(now.getTime() / 1000)}`;
  }
  return slug;
}
```

`extensions/clis/src/git/markers.ts`:

```ts
export type PrStatus = "created" | "unavailable" | "direct_commit";

export type IngestMarkers = {
  filePath: string;
  branch: string;
  prStatus: PrStatus;
  prUrl?: string;
};

const FILE_MARKER = "__EDGES_FILE__=";
const BRANCH_MARKER = "__EDGES_BRANCH__=";
const PR_URL_MARKER = "__EDGES_PR_URL__=";
const PR_STATUS_MARKER = "__EDGES_PR_STATUS__=";

function pick(stdout: string, marker: string): string | undefined {
  const line = stdout
    .split("\n")
    .map((s) => s.trim())
    .find((s) => s.startsWith(marker));
  return line?.slice(marker.length).trim();
}

export function formatMarkerStdout(markers: IngestMarkers): string {
  const url = markers.prUrl ?? "";
  return [
    `${FILE_MARKER}${markers.filePath}`,
    `${BRANCH_MARKER}${markers.branch}`,
    `${PR_STATUS_MARKER}${markers.prStatus}`,
    `${PR_URL_MARKER}${url}`,
  ].join("\n");
}

export function parseMarkers(stdout: string): {
  filePath?: string;
  branch?: string;
  prStatus?: PrStatus;
  prUrl?: string;
  diagnostics: string;
} {
  const prStatusRaw = pick(stdout, PR_STATUS_MARKER);
  let prStatus: PrStatus | undefined;
  if (prStatusRaw === "created" || prStatusRaw === "unavailable" || prStatusRaw === "direct_commit") {
    prStatus = prStatusRaw;
  }
  const diagnostics = stdout
    .split("\n")
    .filter((line) => !line.trim().startsWith("__EDGES_"))
    .join("\n")
    .trim();
  const prUrl = pick(stdout, PR_URL_MARKER);
  return {
    filePath: pick(stdout, FILE_MARKER),
    branch: pick(stdout, BRANCH_MARKER),
    prStatus,
    prUrl: prUrl || undefined,
    diagnostics,
  };
}
```

`extensions/clis/src/git/exec.ts`:

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ExecResult = { stdout: string; stderr: string };
export type ExecFn = (
  file: string,
  args: string[],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv },
) => Promise<ExecResult>;

export function createExecFile(): ExecFn {
  return async (file, args, options = {}) => {
    const result = await execFileAsync(file, args, {
      cwd: options.cwd,
      env: options.env,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 10,
    });
    return { stdout: result.stdout, stderr: result.stderr };
  };
}
```

`extensions/clis/src/git/pr.ts`:

```ts
import type { ExecFn } from "./exec.js";

export function repoPathFromRemote(remoteUrl: string): string | undefined {
  if (remoteUrl.startsWith("git@github.com:")) {
    return remoteUrl.slice("git@github.com:".length).replace(/\.git$/, "");
  }
  if (remoteUrl.startsWith("https://github.com/")) {
    return remoteUrl.slice("https://github.com/".length).replace(/\.git$/, "");
  }
  return undefined;
}

export function buildCompareUrl(input: {
  remoteUrl: string;
  baseBranch: string;
  branch: string;
  title: string;
  body: string;
}): string | undefined {
  const repo = repoPathFromRemote(input.remoteUrl);
  if (!repo) return undefined;
  const title = encodeURIComponent(input.title);
  const body = encodeURIComponent(input.body);
  return `https://github.com/${repo}/compare/${input.baseBranch}...${input.branch}?expand=1&title=${title}&body=${body}`;
}

export type CreatePrInput = {
  title: string;
  body: string;
  branch: string;
  baseBranch: string;
  remoteUrl: string;
  githubToken?: string;
  exec: ExecFn;
  fetchJson?: (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string },
  ) => Promise<{ html_url?: string }>;
};

async function defaultFetchJson(
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
): Promise<{ html_url?: string }> {
  const res = await fetch(url, init);
  try {
    return (await res.json()) as { html_url?: string };
  } catch {
    return {};
  }
}

export async function createPullRequest(input: CreatePrInput): Promise<{
  created: boolean;
  htmlUrl?: string;
  compareUrl?: string;
}> {
  const compareUrl = buildCompareUrl(input);
  try {
    await input.exec("gh", ["auth", "status"]);
    const created = await input.exec("gh", ["pr", "create", "--title", input.title, "--body", input.body]);
    const htmlUrl = created.stdout
      .split("\n")
      .map((s) => s.trim())
      .find((s) => s.startsWith("https://github.com/"));
    if (htmlUrl) {
      return { created: true, htmlUrl, compareUrl };
    }
  } catch {
    // fall through to token / compare URL
  }

  const repo = repoPathFromRemote(input.remoteUrl);
  if (input.githubToken && repo) {
    const fetchJson = input.fetchJson ?? defaultFetchJson;
    const payload = await fetchJson(`https://api.github.com/repos/${repo}/pulls`, {
      method: "POST",
      headers: {
        Authorization: `token ${input.githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        head: input.branch,
        base: input.baseBranch,
      }),
    });
    if (payload.html_url) {
      return { created: true, htmlUrl: payload.html_url, compareUrl };
    }
  }

  return { created: false, compareUrl };
}
```

`extensions/clis/src/git/ingest.ts`:

```ts
import path from "node:path";
import { promises as fs } from "node:fs";
import type { IngestRequest, ScriptSuccess } from "../types.js";
import { createExecFile, type ExecFn } from "./exec.js";
import { formatMarkerStdout } from "./markers.js";
import { createPullRequest } from "./pr.js";
import { localDateYmd, titleToSlug } from "./slug.js";

export type IngestGitConfig = {
  repoPath: string;
  baseBranch: string;
  mode: "pr" | "direct";
  dryRun: boolean;
};

export type IngestGitDeps = {
  exec?: ExecFn;
  now?: Date;
  writeFile?: (absPath: string, contents: string) => Promise<void>;
  mkdirp?: (absDir: string) => Promise<void>;
  directoryExists?: (absPath: string) => Promise<boolean>;
  fetchJson?: CreatePrFetch;
};

type CreatePrFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ html_url?: string }>;

function renderNoteMarkdown(title: string, content: string, date: string): string {
  return `# ${title}\n\n> Ingested on ${date}\n\n${content}\n`;
}

export async function runNoteIngest(
  input: IngestRequest,
  config: IngestGitConfig,
  env: NodeJS.ProcessEnv = process.env,
  deps: IngestGitDeps = {},
): Promise<ScriptSuccess> {
  if (!input.title || !input.content || !input.coAuthor) {
    throw new Error('usage: new-note "title" "content" "AI Name <email>"');
  }

  const exec = deps.exec ?? createExecFile();
  const now = deps.now ?? new Date();
  const writeFile = deps.writeFile ?? ((absPath, contents) => fs.writeFile(absPath, contents, "utf8"));
  const mkdirp = deps.mkdirp ?? ((absDir) => fs.mkdir(absDir, { recursive: true }).then(() => undefined));
  const directoryExists =
    deps.directoryExists ??
    (async (absPath) => {
      try {
        const st = await fs.stat(absPath);
        return st.isDirectory();
      } catch {
        return false;
      }
    });

  if (!(await directoryExists(config.repoPath))) {
    throw new Error(`error: repository path does not exist: ${config.repoPath}`);
  }

  try {
    await exec("git", ["--version"]);
  } catch {
    throw new Error("error: git is required");
  }

  const lines: string[] = [];
  const date = localDateYmd(now);
  const slug = titleToSlug(input.title, now);
  const filePath = `knowledge/notes/${date}--${slug}.md`;
  const absFile = path.join(config.repoPath, filePath);
  let branch = `ingest/${date}-${slug}`;

  if (!config.dryRun) {
    await exec("git", ["checkout", config.baseBranch], { cwd: config.repoPath, env });
    await exec("git", ["pull"], { cwd: config.repoPath, env });
  }

  if (config.mode === "direct") {
    branch = config.baseBranch;
    lines.push(`📝 Mode: Direct commit to ${config.baseBranch}`);
  } else {
    lines.push("🌿 Mode: Create branch and PR");
    await exec("git", ["checkout", "-b", branch], { cwd: config.repoPath, env });
  }

  await mkdirp(path.join(config.repoPath, "knowledge/notes"));
  await writeFile(absFile, renderNoteMarkdown(input.title, input.content, date));
  await exec("git", ["add", filePath], { cwd: config.repoPath, env });
  await exec(
    "git",
    ["commit", "-m", `ingest: ${input.title}\n\nCo-authored-by: ${input.coAuthor}\n`],
    { cwd: config.repoPath, env },
  );

  if (!config.dryRun) {
    if (config.mode === "direct") {
      await exec("git", ["push"], { cwd: config.repoPath, env });
    } else {
      await exec("git", ["push", "-u", "origin", branch], { cwd: config.repoPath, env });
    }
  }

  let prStatus: "created" | "unavailable" | "direct_commit" = "direct_commit";
  let prUrl: string | undefined;

  if (config.mode === "direct") {
    prStatus = "direct_commit";
  } else {
    const remoteUrl = config.dryRun
      ? "https://github.com/example/repo"
      : (await exec("git", ["remote", "get-url", "origin"], { cwd: config.repoPath, env })).stdout.trim();
    const prBody = `Auto-ingested with AI assistance.\n\nCo-authored-by: ${input.coAuthor}`;
    const pr = await createPullRequest({
      title: input.title,
      body: prBody,
      branch,
      baseBranch: config.baseBranch,
      remoteUrl,
      githubToken: env.GITHUB_TOKEN,
      exec,
      fetchJson: deps.fetchJson,
    });
    if (pr.htmlUrl) {
      prStatus = "created";
      prUrl = pr.htmlUrl;
      lines.push(`🔗 PR created: ${pr.htmlUrl}`);
    } else {
      prStatus = "unavailable";
      prUrl = pr.compareUrl;
      if (pr.compareUrl) lines.push(`📎 Create PR: ${pr.compareUrl}`);
      lines.push("💡 Tip: Set GITHUB_TOKEN or run 'gh auth login' for auto PR creation");
    }
  }

  lines.push(`✅ Ingested: ${filePath}`);
  lines.push(formatMarkerStdout({ filePath, branch, prStatus, prUrl }));

  return {
    filePath,
    branch,
    prUrl,
    prStatus,
    stdout: `${lines.join("\n")}\n`,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/git-slug.test.ts test/git-markers.test.ts test/git-pr.test.ts test/git-ingest.test.ts`

Expected: PASS (4 files, all tests).

- [ ] **Step 5: Commit**

```bash
git add extensions/clis/src/git extensions/clis/test/git-slug.test.ts extensions/clis/test/git-markers.test.ts extensions/clis/test/git-pr.test.ts extensions/clis/test/git-ingest.test.ts
git commit -m "feat(cli): port new-note git ingest to TypeScript

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 2: Wire CLI service/run; drop scriptAdapter and EDGES_SCRIPT

**Files:**
- Modify: `extensions/clis/src/types.ts`
- Modify: `extensions/clis/src/config.ts`
- Modify: `extensions/clis/src/service.ts`
- Modify: `extensions/clis/src/run.ts`
- Modify: `extensions/clis/src/help.ts`
- Modify: `extensions/clis/src/errors.ts`
- Modify: `extensions/clis/README.md`
- Modify: `extensions/clis/test/config.test.ts`
- Modify: `extensions/clis/test/service.test.ts`
- Modify: `extensions/clis/test/errors.test.ts`
- Modify: `extensions/clis/test/ingest.test.ts`
- Delete: `extensions/clis/src/scriptAdapter.ts`

**Interfaces:**
- Consumes: `runNoteIngest(input, config, env, deps?)` from Task 1. `IngestGitConfig` fields are the git subset of `RuntimeConfig`.
- Produces: `RuntimeConfig` without `scriptPath`. `loadConfig()` no longer reads `EDGES_SCRIPT`. `runIngest` / `run` default runner is `runNoteIngest`. `IngestRunner` signature stays `(input: IngestRequest, config: RuntimeConfig, env?: NodeJS.ProcessEnv) => Promise<ScriptSuccess>`.

- [ ] **Step 1: Write the failing tests (update existing files first)**

Replace `extensions/clis/test/config.test.ts` entirely:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";

test("loadConfig defaults repo, branch, mode, dryRun and has no scriptPath", () => {
  const config = loadConfig({
    EDGES_AUTH_TOKEN: "",
    EDGES_REPO: "/tmp/edges-fixture",
    EDGES_BASE_BRANCH: "develop",
    EDGES_MODE: "pr",
    EDGES_DRY_RUN: "true",
  });
  assert.equal(config.repoPath, "/tmp/edges-fixture");
  assert.equal(config.baseBranch, "develop");
  assert.equal(config.mode, "pr");
  assert.equal(config.dryRun, true);
  assert.equal("scriptPath" in config, false);
});
```

In `extensions/clis/test/service.test.ts` remove `scriptPath` from the fixture:

```ts
const config: RuntimeConfig = {
  repoPath: "/repo",
  baseBranch: "main",
  mode: "direct",
  dryRun: true,
};
```

Replace the ENOENT test in `extensions/clis/test/errors.test.ts`:

```ts
test("classifyError maps git ENOENT to GIT_FAILURE", () => {
  const code = classifyError({ code: "ENOENT", message: "spawn git ENOENT" });
  assert.equal(code, "GIT_FAILURE");
});
```

Replace `extensions/clis/test/ingest.test.ts` so it no longer sets `EDGES_SCRIPT` and no longer points at `bin/new-note`. Keep a real isolated git repo (this is the CLI-level dry-run integration):

```ts
import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { run } from "../src/run.js";

const execFile = promisify(execFileCb);

async function initTempRepo(): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "edges-cli-ingest-"));
  await execFile("git", ["init"], { cwd: tmp });
  await execFile("git", ["config", "user.email", "tester@example.com"], { cwd: tmp });
  await execFile("git", ["config", "user.name", "Tester"], { cwd: tmp });
  return tmp;
}

test("dry-run ingest against an isolated repo returns parseable success", async () => {
  const repo = await initTempRepo();
  const result = await run(
    [
      "note",
      "--title",
      "Cli Isolated Ingest",
      "--content",
      "Throwaway note for CLI ingest test.",
      "--co-author",
      "Tester <tester@example.com>",
      "--dry-run",
      "--json",
    ],
    {
      env: {
        ...process.env,
        EDGES_REPO: repo,
        EDGES_DRY_RUN: "true",
        EDGES_MODE: "direct",
        EDGES_AUTH_TOKEN: "",
      },
    },
  );

  assert.equal(result.exitCode, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout) as {
    status: string;
    filePath: string;
    branch: string;
    prStatus: string;
  };
  assert.equal(parsed.status, "success");
  assert.ok(parsed.filePath.startsWith("knowledge/notes/"));
  assert.equal(parsed.prStatus, "direct_commit");
  await fs.access(path.join(repo, parsed.filePath));
});
```

Add to `extensions/clis/test/run.test.ts` (keep existing injected-runner tests):

```ts
test("note --help no longer documents EDGES_SCRIPT", async () => {
  const result = await run(["note", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.doesNotMatch(result.stdout, /EDGES_SCRIPT/);
  assert.doesNotMatch(result.stdout, /bin\/new-note/);
});
```

- [ ] **Step 2: Run the updated tests to verify they fail**

Run: `pnpm --filter edges-cli exec node --test --import tsx test/config.test.ts test/errors.test.ts test/run.test.ts test/ingest.test.ts`

Expected: FAIL — `config.scriptPath` still exists; `classifyError` still returns `SCRIPT_NOT_FOUND` for ENOENT; help still mentions `EDGES_SCRIPT`; ingest still tries `execFile` of `bin/new-note` unless the default runner is switched.

- [ ] **Step 3: Wire the CLI**

`extensions/clis/src/types.ts` — change `RuntimeConfig` to:

```ts
export interface RuntimeConfig {
  repoPath: string;
  baseBranch: string;
  mode: "pr" | "direct";
  dryRun: boolean;
  authToken?: string;
}
```

`extensions/clis/src/config.ts` — replace `loadConfig` return (keep `resolveEdgesRoot`):

```ts
export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const edgesRoot = resolveEdgesRoot();
  const repoPath = env.EDGES_REPO ?? edgesRoot;
  const rawMode = env.EDGES_MODE?.toLowerCase();
  const mode = rawMode === "pr" ? "pr" : "direct";
  const authToken = env.EDGES_AUTH_TOKEN?.trim() || undefined;

  return {
    repoPath,
    baseBranch: env.EDGES_BASE_BRANCH ?? "main",
    mode,
    dryRun: env.EDGES_DRY_RUN === "true",
    authToken,
  };
}
```

`extensions/clis/src/service.ts` — replace the whole file:

```ts
import type { IngestRequest, IngestResult, RuntimeConfig, ScriptSuccess } from "./types.js";
import { classifyError, summarize } from "./errors.js";
import { parseMarkers } from "./git/markers.js";
import { runNoteIngest } from "./git/ingest.js";

export type IngestRunner = (
  input: IngestRequest,
  config: RuntimeConfig,
  env?: NodeJS.ProcessEnv,
) => Promise<ScriptSuccess>;

export async function runIngest(
  input: IngestRequest,
  config: RuntimeConfig,
  runner: IngestRunner = runNoteIngest,
  env: NodeJS.ProcessEnv = process.env,
): Promise<IngestResult> {
  try {
    const result = await runner(input, config, env);
    const diagnostics = parseMarkers(result.stdout).diagnostics;
    return {
      status: "success",
      filePath: result.filePath,
      branch: result.branch,
      prUrl: result.prUrl,
      prStatus: result.prStatus,
      stdoutSummary: summarize(diagnostics) ?? "ingest success",
      diagnostics: diagnostics || undefined,
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    const reason = err.message || "unknown ingest failure";
    return {
      status: "failed",
      errorCode: classifyError({
        stdout: err.stdout,
        stderr: err.stderr,
        message: err.message,
        code: err.code,
      }),
      reason,
      stdoutSummary: summarize(err.stdout),
      stderrSummary: summarize(err.stderr),
    };
  }
}
```

`extensions/clis/src/run.ts` — drop `runIngestScript`. Change the two lines:

```ts
import { runNoteIngest } from "./git/ingest.js";
```

and later:

```ts
  const runner = io.ingest ?? runNoteIngest;
  const result = await runIngest(request, config, runner, env);
```

`extensions/clis/src/help.ts` — ENV section becomes:

```
ENV
  EDGES_REPO          Target git repo (default: this Edges checkout)
  EDGES_BASE_BRANCH   Default main
  EDGES_MODE          direct | pr
  EDGES_DRY_RUN       true to skip checkout/pull/push
  EDGES_AUTH_TOKEN    Optional expected token
  GITHUB_TOKEN        Passed through to git ingest for PR creation
```

Remove `EDGES_SCRIPT` and every `bin/new-note` mention from `NOTE_AFTER_HELP`.

`extensions/clis/src/errors.ts` — replace the ENOENT / `new-note` branches:

```ts
  if (output.code === "ENOENT") {
    return "GIT_FAILURE";
  }

  const text = [output.stdout, output.stderr, output.message].filter(Boolean).join("\n").toLowerCase();

  if (text.includes("usage: new-note") || text.includes("validation")) {
    return "VALIDATION_ERROR";
  }
  if (text.includes("permission denied (publickey)") || text.includes("authentication failed")) {
    return "PUSH_AUTH_FAILED";
  }
  if (text.includes("git push") || text.includes("could not read from remote repository") || text.includes("spawn git")) {
    return "GIT_FAILURE";
  }
```

Leave `SCRIPT_NOT_FOUND` in the `IngestErrorCode` union (MCP still uses it). Remove it from the CLI help failure-code list.

`extensions/clis/README.md` first paragraph:

```
Multi-command Edges CLI. Humans and local agents share `edges`. Note ingest git lives in this package (`src/git`). npm `package.json` `"bin"` is the install hook for the `edges` binary, not a separate layer.
```

Delete `extensions/clis/src/scriptAdapter.ts`. Grep the package for `scriptAdapter` / `EDGES_SCRIPT` / `scriptPath` and fix leftovers.

- [ ] **Step 4: Run CLI tests**

Run: `pnpm --filter edges-cli test`

Expected: PASS, including isolated-repo dry-run ingest.

- [ ] **Step 5: Commit**

```bash
git add extensions/clis
git commit -m "feat(cli): run note ingest in-process and drop EDGES_SCRIPT

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 3: MCP spawns `edges note`

**Files:**
- Create: `extensions/mcp-servers/new-note/src/cliAdapter.ts`
- Create: `extensions/mcp-servers/new-note/test/cliAdapter.test.ts`
- Modify: `extensions/mcp-servers/new-note/src/types.ts`
- Modify: `extensions/mcp-servers/new-note/src/config.ts`
- Modify: `extensions/mcp-servers/new-note/src/service.ts`
- Modify: `extensions/mcp-servers/new-note/src/errors.ts`
- Modify: `extensions/mcp-servers/new-note/src/server.ts`
- Modify: `extensions/mcp-servers/new-note/test/service.test.ts`
- Modify: `extensions/mcp-servers/new-note/test/authMiddleware.test.ts`
- Modify: `extensions/mcp-servers/new-note/test/integration.sh`
- Modify: `extensions/mcp-servers/new-note/README.md`
- Delete: `extensions/mcp-servers/new-note/src/scriptAdapter.ts`
- Delete: `extensions/mcp-servers/new-note/test/scriptAdapter.test.ts`

**Interfaces:**
- Consumes: CLI JSON from Task 2 (`{ status, filePath, branch, prStatus, prUrl?, errorCode?, reason? }`) and exit codes 0/1/2/4.
- Produces:
  - `RuntimeConfig.cliEntry: string` (absolute path to `edges-cli` `dist/index.js` or `src/index.ts`)
  - `loadConfig(env?: NodeJS.ProcessEnv): RuntimeConfig` reads `EDGES_CLI` override
  - `runEdgesNote(input: IngestRequest, config: RuntimeConfig, env?: NodeJS.ProcessEnv): Promise<ScriptSuccess>`
  - Child argv: `note --title <t> --content <c> --co-author <a> --json` plus `--dry-run` when `config.dryRun` or `env.EDGES_DRY_RUN === "true"`, plus `--mode <config.mode>` when set
  - Child env copies parent but **deletes `EDGES_AUTH_TOKEN`**. Sets `EDGES_REPO`, `EDGES_BASE_BRANCH`, `EDGES_MODE`, `EDGES_DRY_RUN` from config. Keeps `GITHUB_TOKEN`.
  - Spawn: if `cliEntry` ends with `.ts`, `execFile(process.execPath, ["--import", "tsx", cliEntry, ...noteArgs])`; else `execFile(process.execPath, [cliEntry, ...noteArgs])`. Never `execFile("edges")` via PATH. Never `import` from `extensions/clis/src`.

- [ ] **Step 1: Write the failing MCP adapter test**

Create `extensions/mcp-servers/new-note/test/cliAdapter.test.ts`. The mock CLI is a small Node file that asserts flags/env and prints success JSON:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { runEdgesNote } from "../src/cliAdapter.js";
import type { RuntimeConfig } from "../src/types.js";

test("runEdgesNote spawns the CLI entry with flags and parses JSON", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "edges-mcp-cli-"));
  const mockCli = path.join(tmp, "mock-edges.mjs");
  await fs.writeFile(
    mockCli,
    [
      "const args = process.argv.slice(2);",
      "if (args[0] !== 'note') { console.error('missing note'); process.exit(1); }",
      "if (process.env.EDGES_AUTH_TOKEN) { console.error('auth leaked'); process.exit(1); }",
      "if (process.env.EDGES_REPO !== '/repo') { console.error('repo'); process.exit(1); }",
      "const json = {",
      "  status: 'success',",
      "  filePath: 'knowledge/notes/2026-09-11--demo.md',",
      "  branch: 'ingest/2026-09-11-demo',",
      "  prStatus: 'created',",
      "  prUrl: 'https://github.com/org/repo/pull/9'",
      "};",
      "process.stdout.write(JSON.stringify(json) + '\\n');",
    ].join("\n"),
  );

  const config: RuntimeConfig = {
    repoPath: "/repo",
    baseBranch: "main",
    cliEntry: mockCli,
    skillsPath: "/repo/extensions/skills",
    mode: "pr",
    dryRun: true,
    authToken: "secret-should-not-leak",
  };

  const result = await runEdgesNote(
    { title: "Demo", content: "Body", coAuthor: "OpenAI Codex <codex@openai.com>" },
    config,
    { ...process.env, EDGES_AUTH_TOKEN: "secret-should-not-leak", GITHUB_TOKEN: "ghs_x" },
  );

  assert.equal(result.filePath, "knowledge/notes/2026-09-11--demo.md");
  assert.equal(result.branch, "ingest/2026-09-11-demo");
  assert.equal(result.prStatus, "created");
  assert.equal(result.prUrl, "https://github.com/org/repo/pull/9");
});

test("runEdgesNote maps CLI failure JSON to a thrown error with errorCode", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "edges-mcp-cli-fail-"));
  const mockCli = path.join(tmp, "mock-edges.mjs");
  await fs.writeFile(
    mockCli,
    "process.stdout.write(JSON.stringify({status:'failed',errorCode:'GIT_FAILURE',reason:'boom'})+'\\n'); process.exit(1);\n",
  );

  const config: RuntimeConfig = {
    repoPath: "/repo",
    baseBranch: "main",
    cliEntry: mockCli,
    skillsPath: "/skills",
    mode: "direct",
    dryRun: false,
  };

  await assert.rejects(
    () =>
      runEdgesNote(
        { title: "Demo", content: "Body", coAuthor: "OpenAI Codex <codex@openai.com>" },
        config,
        { ...process.env },
      ),
    (err: Error & { errorCode?: string }) => {
      assert.match(err.message, /boom/);
      return true;
    },
  );
});
```

In `extensions/mcp-servers/new-note/test/service.test.ts` and `authMiddleware.test.ts`, change fixtures from `scriptPath: "/repo/bin/new-note"` to `cliEntry: "/repo/extensions/clis/dist/index.js"` and add `dryRun: false` if the type requires it.

Replace `extensions/mcp-servers/new-note/test/integration.sh` so it calls the CLI, not `bin/new-note`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")")"
CLI=(node --import tsx "$REPO_ROOT/extensions/clis/src/index.ts")

echo "Starting integration tests via edges note"

TITLE="Test Direct Mode $(date +%s)"
OUTPUT="$(
  EDGES_DRY_RUN=true EDGES_MODE=direct EDGES_AUTH_TOKEN= \
    "${CLI[@]}" note \
      --title "$TITLE" \
      --content "Integration test content for direct mode." \
      --co-author "Tester <tester@example.com>" \
      --dry-run --json
)"
echo "$OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='success'; assert d['prStatus']=='direct_commit'"

TITLE="Test PR Mode $(date +%s)"
OUTPUT_PR="$(
  EDGES_DRY_RUN=true EDGES_MODE=pr EDGES_AUTH_TOKEN= \
    "${CLI[@]}" note \
      --title "$TITLE" \
      --content "Integration test content for PR mode." \
      --co-author "Tester <tester@example.com>" \
      --mode pr --dry-run --json
)"
echo "$OUTPUT_PR" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='success'; assert d['prStatus'] in ('created','unavailable'); assert d['branch'].startswith('ingest/')"

echo "Integration tests passed"
```

- [ ] **Step 2: Run adapter tests to verify they fail**

Run: `pnpm --filter new-note exec node --test --import tsx test/cliAdapter.test.ts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `cliAdapter.js`.

- [ ] **Step 3: Implement the adapter and config**

`extensions/mcp-servers/new-note/src/types.ts` `RuntimeConfig`:

```ts
export interface RuntimeConfig {
  repoPath: string;
  baseBranch: string;
  cliEntry: string;
  skillsPath: string;
  mode: "pr" | "direct";
  dryRun: boolean;
  authToken?: string;
}
```

`extensions/mcp-servers/new-note/src/config.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RuntimeConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDefaultRepoPath(): string {
  return path.resolve(__dirname, "../../../../");
}

function resolveCliEntry(env: NodeJS.ProcessEnv): string {
  if (env.EDGES_CLI) return env.EDGES_CLI;
  const dist = path.resolve(__dirname, "../../../clis/dist/index.js");
  const src = path.resolve(__dirname, "../../../clis/src/index.ts");
  return fs.existsSync(dist) ? dist : src;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const repoPath = env.EDGES_REPO ?? resolveDefaultRepoPath();
  const rawMode = env.EDGES_MODE?.toLowerCase();
  return {
    repoPath,
    baseBranch: env.EDGES_BASE_BRANCH ?? "main",
    cliEntry: resolveCliEntry(env),
    skillsPath: path.join(repoPath, "extensions/skills"),
    mode: rawMode === "pr" ? "pr" : "direct",
    dryRun: env.EDGES_DRY_RUN === "true",
    authToken: env.EDGES_AUTH_TOKEN,
  };
}
```

`extensions/mcp-servers/new-note/src/cliAdapter.ts`:

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { IngestRequest, RuntimeConfig, ScriptSuccess } from "./types.js";

const execFileAsync = promisify(execFile);

function spawnArgs(cliEntry: string): { file: string; prefix: string[] } {
  if (cliEntry.endsWith(".ts")) {
    return { file: process.execPath, prefix: ["--import", "tsx", cliEntry] };
  }
  return { file: process.execPath, prefix: [cliEntry] };
}

export async function runEdgesNote(
  input: IngestRequest,
  config: RuntimeConfig,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ScriptSuccess> {
  const { file, prefix } = spawnArgs(config.cliEntry);
  const args = [
    ...prefix,
    "note",
    "--title",
    input.title,
    "--content",
    input.content,
    "--co-author",
    input.coAuthor,
    "--json",
    "--mode",
    config.mode,
  ];
  if (config.dryRun) args.push("--dry-run");

  const childEnv: NodeJS.ProcessEnv = {
    ...env,
    EDGES_REPO: config.repoPath,
    EDGES_BASE_BRANCH: config.baseBranch,
    EDGES_MODE: config.mode,
    EDGES_DRY_RUN: config.dryRun ? "true" : env.EDGES_DRY_RUN,
  };
  delete childEnv.EDGES_AUTH_TOKEN;

  const { stdout } = await execFileAsync(file, args, {
    env: childEnv,
    maxBuffer: 1024 * 1024 * 10,
  });

  const parsed = JSON.parse(stdout) as {
    status: string;
    filePath?: string;
    branch?: string;
    prStatus?: ScriptSuccess["prStatus"];
    prUrl?: string;
    reason?: string;
    errorCode?: string;
  };

  if (parsed.status !== "success" || !parsed.filePath || !parsed.branch || !parsed.prStatus) {
    throw Object.assign(new Error(parsed.reason || "edges note failed"), {
      errorCode: parsed.errorCode,
      stdout,
    });
  }

  return {
    filePath: parsed.filePath,
    branch: parsed.branch,
    prUrl: parsed.prUrl,
    prStatus: parsed.prStatus,
    stdout,
  };
}
```

`extensions/mcp-servers/new-note/src/service.ts` — `import { runEdgesNote } from "./cliAdapter.js";` and default `runner = runEdgesNote`.

`extensions/mcp-servers/new-note/src/errors.ts` — treat CLI-missing as `SCRIPT_NOT_FOUND`:

```ts
  if (text.includes("enoent") && (text.includes("edges") || text.includes("cli"))) {
    return "SCRIPT_NOT_FOUND";
  }
```

Also map `error.code === "ENOENT"` to `SCRIPT_NOT_FOUND` (the spawned Node entry does not exist).

`extensions/mcp-servers/new-note/src/server.ts` — replace the `Script path` log line with `CLI entry: ${config.cliEntry}`.

`extensions/mcp-servers/new-note/README.md` — What It Does / Troubleshooting / Rollback:

- Calls `edges note` as a subprocess (same flags/JSON as the CLI).
- `SCRIPT_NOT_FOUND`: `edges-cli` entry missing; build `pnpm --filter edges-cli build` or set `EDGES_CLI`.
- Rollback: stop the MCP server and use `pnpm --filter edges-cli exec tsx src/index.ts note …` (not `bin/new-note`).
- Document `EDGES_CLI`.
- File path examples: `knowledge/notes/YYYY-MM-DD--slug.md` (not `inbox/`).

`extensions/mcp-servers/README.md`:

```
- `new-note/`: 无 shell 宿主的入库入口。子进程调用 `edges note`，与 CLI 同一套契约。
```

Remove 「公共脚本放在仓库根目录 `bin/`」.

Delete `scriptAdapter.ts` and `test/scriptAdapter.test.ts`.

- [ ] **Step 4: Run MCP unit tests, then integration**

Run: `pnpm --filter new-note test`

Expected: PASS.

Run: `pnpm --filter new-note test:integration`

Expected: PASS (dry-run `edges note` JSON). If this writes commits into a temp-unrelated checkout of the current repo, stop and point `EDGES_REPO` at a `mkdtemp` git repo inside the shell script instead — do not leave ingest commits on the implementation branch. Prefer wrapping the script so `EDGES_REPO` is an isolated `git init` directory (same as CLI `ingest.test.ts`). If the current `integration.sh` still targets the real checkout, change it to a temp repo before relying on it.

- [ ] **Step 5: Commit**

```bash
git add extensions/mcp-servers/new-note extensions/mcp-servers/README.md
git commit -m "feat(mcp): spawn edges note instead of bin/new-note

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 4: Delete `bin/` and retarget human/docs entry points

**Files:**
- Delete: `bin/new-note`, `bin/README.md`, and the `bin/` directory
- Modify: `scripts/setup`
- Modify: `scripts/README.md`
- Modify: `README.md`
- Modify: `extensions/README.md`
- Modify: `extensions/tools/README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: CLI as the human and agent command (`edges note`); npm `bin` hook unchanged on `edges-cli`.
- Produces: no repo-root `bin/` directory; `pnpm setup` no longer writes a `bin/` PATH export; root README Capability Surface paragraph names CLI + Skill + MCP.

- [ ] **Step 1: Write a failing grep/assertion test via the docs check you will re-run**

There is no existing docs test file. Add `scripts/test/no-bin-entry.test.sh` only if you want a machine check; otherwise the failing step is the explicit grep (run it, expect hits, then fix):

```bash
rg -n 'bin/new-note|\[`bin/`\]|加入 `\$PATH`|把 `bin/` 加入' README.md scripts/README.md scripts/setup extensions/README.md extensions/clis/README.md extensions/mcp-servers/README.md extensions/mcp-servers/new-note/README.md extensions/tools/README.md CHANGELOG.md
test -d bin && echo 'bin/ still exists'
```

Expected before the edit: matches in those docs and `bin/` still present. Do **not** fail the build on historical `CHANGELOG.md` `[1.1.0]` / `[1.0.0]` lines or `knowledge/notes/` — leave those.

- [ ] **Step 2: Confirm the grep still finds living entry points**

Run the `rg` command above. Expected: hits in root README (lines that still say humans use `bin/new-note` and `pnpm setup` adds `bin/` to PATH), `scripts/setup`, `scripts/README.md`, `extensions/README.md` decoupling bullet, `extensions/tools/README.md`.

- [ ] **Step 3: Delete `bin/` and retarget docs**

`rm -rf bin`

`scripts/setup` — remove `BIN_DIR`, `add_path`, `remove_path`, `chmod +x "$BIN_DIR"/*`, and PATH export. Keep `.env` sourcing into `~/.zshrc` / `~/.bash_profile` and `--uninstall` that only removes the `.env` source line / leftover `# edges bin` + PATH lines if present (so old machines can clean up):

```bash
#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
RC_FILES=("$HOME/.zshrc" "$HOME/.bash_profile")
MARKER="# edges bin"

strip_legacy_bin_path() {
  local rc_file="$1"
  [ -f "$rc_file" ] || return 0
  if grep -qF "$MARKER" "$rc_file" 2>/dev/null || grep -qE '/edges/bin|/bin:\$PATH' "$rc_file" 2>/dev/null; then
    sed -i.bak -e "/$MARKER/d" -e '\|/bin:\$PATH|d' "$rc_file" && rm -f "$rc_file.bak"
    echo "Removed legacy bin PATH from: $rc_file"
  fi
}

if [ "$1" = "--uninstall" ] || [ "$1" = "-u" ]; then
  for rc_file in "${RC_FILES[@]}"; do
    strip_legacy_bin_path "$rc_file"
  done
  echo "Done. Restart terminal to apply."
  exit 0
fi

for rc_file in "${RC_FILES[@]}"; do
  [ -f "$rc_file" ] || touch "$rc_file"
  strip_legacy_bin_path "$rc_file"
  if [ -f "$ENV_FILE" ] && ! grep -qF "source \"$ENV_FILE\"" "$rc_file" 2>/dev/null; then
    echo "source \"$ENV_FILE\"" >> "$rc_file"
    echo "Added .env sourcing to: $rc_file"
  fi
done

[ -f "$ENV_FILE" ] && source "$ENV_FILE"
echo "Setup complete. Use: pnpm --filter edges-cli exec tsx src/index.ts note --help"
```

On Linux this environment `sed -i.bak` is the portable form (the current `sed -i ''` is macOS-only). Use the portable form.

Root `README.md` system table: **delete the `bin/` row**. Capture paragraph becomes:

```
捕获入口最终回到同一套知识模型：人和有 shell 的 Agent 使用 [`edges` CLI](extensions/clis/README.md) 的 `edges note …`（稳定参数与 JSON stdout）；没有 shell 的宿主使用 [`new-note` MCP](extensions/mcp-servers/new-note/README.md)；Agent 何时该调用则看 [`edges-note` Skill](extensions/skills/edges-note/SKILL.md)。它们复用同一条 Note 入库链路。npm `package.json` 的 `bin` 只是 `edges` 的安装挂钩，不是单独一层。
```

`pnpm setup` bullet: `初始化本地环境（加载 .env；不再把仓根 bin/ 写入 PATH）。`

Footer links: drop `[用户命令](bin/README.md)`.

`scripts/README.md`:

```
项目自身的维护脚本目录。人和 Agent 天天用的入库命令是 `extensions/clis` 的 `edges`，不是仓根脚本。
```

Replace 「→ `bin/`」 with 「→ `extensions/clis` 的 `edges`（`package.json` `"bin"` 安装挂钩）」。

Naming bullet: drop 「与 `bin/new-note` 保持风格一致」.

Setup row: `首次接入初始化：加载 .env；清掉旧的仓根 bin PATH`.

`extensions/README.md` decoupling bullet:

```
3. **解耦**: Extension 应当只依赖 `edges` CLI 契约或标准的 `knowledge/` 路径，避免复杂的内部依赖。不要依赖仓根 `bin/`。
```

`extensions/tools/README.md`:

```
与 `extensions/clis` 的 `edges` CLI 不同，这里的工具通常包含适配器代码，用于对接外部 API 或特定平台的调用协议。
```

`CHANGELOG.md` `[Unreleased]`:

```
### Added
- `extensions/skills/edges-note`：教 Agent 何时如何调用 CLI 与 MCP（能力面三入口）。

### Changed
- `new-note` MCP 改为子进程调用 `edges note`，不再 `execFile` 仓根脚本。
- `pnpm setup` 不再把仓根 `bin/` 写入 PATH。
- 根 README 捕获入口改为 CLI + Skill + MCP（ADR-0004）。

### Removed
- 仓根 `bin/`（含 `new-note`）。Note 入库 git 在 `extensions/clis` TypeScript。
```

Also edit the existing Unreleased ADR line from 「实现另 PR」 to 「实现见本 Unreleased 的 Removed/Changed」 once Tasks 1–5 are on the branch.

- [ ] **Step 4: Re-run the living-doc grep**

```bash
rg -n 'bin/new-note' README.md scripts/README.md scripts/setup extensions/README.md extensions/clis/README.md extensions/mcp-servers/README.md extensions/mcp-servers/new-note/README.md extensions/tools/README.md extensions/clis/src extensions/mcp-servers/new-note/src
test ! -e bin
pnpm --filter edges-cli test
pnpm --filter new-note test
```

Expected: no matches in those living paths; `bin/` gone; tests PASS. Historical changelog / notes may still mention `bin/new-note`.

- [ ] **Step 5: Commit**

```bash
git add -A bin README.md scripts/setup scripts/README.md extensions/README.md extensions/tools/README.md CHANGELOG.md
git commit -m "chore: delete repo-root bin/ and retarget docs to edges CLI

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 5: Add `extensions/skills/edges-note`

**Files:**
- Create: `extensions/skills/edges-note/SKILL.md`
- Create: `extensions/skills/edges-note/CHANGELOG.md`

**Interfaces:**
- Consumes: CLI flags/JSON/exit codes from Task 2; MCP tool `new_note` from Task 3.
- Produces: skill `name: edges-note` matching the directory; `version: 1.0.0`; no `scripts/` directory.

- [ ] **Step 1: Write a failing link/name check**

```bash
test -f extensions/skills/edges-note/SKILL.md
```

Expected: FAIL (`No such file`).

- [ ] **Step 2: Confirm the directory is absent**

`ls extensions/skills/edges-note` → not found.

- [ ] **Step 3: Add the skill files**

`extensions/skills/edges-note/SKILL.md` (frontmatter `name` **must** equal the directory name):

```markdown
---
name: edges-note
description: 把一条 Note 入库到 Edges 仓库时使用。有 shell 就调用 `edges note`；没有 shell 的宿主调用对等能力面入口 new-note MCP。不要自己跑 git，也不要找仓根 bin/new-note。
version: 1.0.0
---

# edges note

人和有 shell 的 Agent 共用 [`extensions/clis`](../../clis/README.md) 的 `edges note`。本 skill 只说明何时调用、怎么写对命令。Git / 落盘 / PR 在 CLI 里，不在本目录。

## 什么时候用

- 用户或任务要把一条 Note 写进 `knowledge/notes/YYYY-MM-DD--slug.md` 并 commit（可选 push / PR）。
- 不要用它整理对话（改用 `conversation-to-notes`）、不要用它改 tasks 看板、不要自己 `git commit`。

## 有 shell：调用 CLI

在仓库根：

```bash
pnpm --filter edges-cli exec tsx src/index.ts note \
  --title "<1–120 chars>" \
  --content "<1–50000 chars>" \
  --co-author "Name <email@domain>" \
  --json
```

已 build 时把 `tsx src/index.ts` 换成 `node dist/index.js`。`package.json` 的 `"bin": { "edges": "./dist/index.js" }` 只是安装挂钩：装过之后也可以 `npx edges note …`，不要再包一层仓根脚本。

可选 flags：`--dry-run`（本地 commit，不 push）、`--mode direct|pr`、`--token-file PATH`、`--token-stdin`（仅当环境变量 `EDGES_AUTH_TOKEN` 已设置）。

环境变量：`EDGES_REPO`、`EDGES_BASE_BRANCH`（默认 `main`）、`EDGES_MODE`、`EDGES_DRY_RUN`、`EDGES_AUTH_TOKEN`、`GITHUB_TOKEN`（PR）。

### stdout JSON

成功 exit 0：

```json
{"status":"success","filePath":"knowledge/notes/2026-09-11--slug.md","branch":"main","prStatus":"direct_commit"}
```

`prStatus` 为 `created` | `unavailable` | `direct_commit`。失败时 `status` 为 `failed`，带 `errorCode` 与 `reason`。

### exit codes

| code | 含义 |
| --- | --- |
| 0 | 成功 |
| 1 | 运行时失败（git / 未知） |
| 2 | 用法或校验失败（未跑 git） |
| 4 | 鉴权失败（未跑 git） |

进度与诊断在 stderr。只解析 stdout JSON。

## 无 shell：改用 MCP

宿主不能 exec 时，调用 `extensions/mcp-servers/new-note` 的工具 `new_note`，参数 `title`、`content`、`coAuthor`（同一套长度限制）。不要 import CLI 模块，不要找已删除的 `bin/new-note`。

## 禁止

- 不要在本 skill 下写 `scripts/` 去跑 git。
- 不要教 Agent 把仓根 `bin/` 加入 PATH。
- 不要把 npm `bin` 说成能力面的一层。能力面是 CLI + Skill + MCP（见仓库 `CONTEXT.md` 与 `docs/adr/0004-capability-surface-cli-skill-mcp.md`）。
```

`extensions/skills/edges-note/CHANGELOG.md`:

```markdown
# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-11

### Added

- 教 Agent 用 CLI 与 MCP 入库 Note（能力面三入口）。无 git 脚本。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/edges-note@1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/edges-note@1.0.0
```

Do **not** create `extensions/skills/edges-note/scripts/`.

- [ ] **Step 4: Link and verify**

```bash
pnpm skills:link
pnpm skills:link -- --check
test -L .agents/skills/edges-note
python3 - <<'PY'
from pathlib import Path
text = Path("extensions/skills/edges-note/SKILL.md").read_text()
assert text.startswith("---\nname: edges-note\n")
assert "bin/new-note" in text and "不要" in text
assert "pnpm --filter edges-cli" in text
assert "new_note" in text
assert not Path("extensions/skills/edges-note/scripts").exists()
print("skill ok")
PY
```

Expected: link check exit 0; `.agents/skills/edges-note` is a relative symlink; `scripts/` absent.

After the skill commit, tag `skill/edges-note@1.0.0` on **that same commit** (annotated) when this work lands on the branch that will merge. If the implementation is still mid-PR, create the tag on the skill-adding commit:

```bash
git tag -a skill/edges-note@1.0.0 -m "skill/edges-note@1.0.0"
```

Push the tag with the branch (`git push origin skill/edges-note@1.0.0`) only if the repo's skill-release convention requires it on merge; do not tag from this plan-only PR.

- [ ] **Step 5: Commit**

```bash
git add extensions/skills/edges-note .agents/skills/edges-note
git commit -m "feat(skill): add edges-note invoke guide for edges note

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

### Task 6: Memory, doctor, and ADR consistency

**Files:**
- Update via `memory.py remember` (do not hand-edit indexes):
  - `.memory/projects/project_capability_surface_cli_skill_mcp.md`
  - `.memory/projects/project_new_note_ingest.md`
  - `.memory/references/reference_bin_cli_skill_classic_projects.md`
  - `extensions/.memory/projects/project_clis_from_mcp.md`
- Verify: `docs/adr/0004-capability-surface-cli-skill-mcp.md`, `CONTEXT.md` terms
- Modify: `CHANGELOG.md` only if Task 4 left the ADR Unreleased line saying 「实现另 PR」

**Interfaces:**
- Consumes: remember CLI `python3 extensions/skills/project-memory-init/scripts/memory.py remember`
- Produces: indexes refreshed by the script; `project_capability_surface_cli_skill_mcp` How-to no longer says 「实现后续 PR」 or 「`bin/new-note` 可当 git 残留」；title/Why/How-to keep CLI + Skill + MCP as equal peers (no 「必要时 MCP」, no two-layer shorthand)

- [ ] **Step 1: Write a failing consistency check**

```bash
rg -n 'bin/new-note 可继续|git 仍只在 `bin/new-note`|两边都 `execFile` 同一条脚本|实现后续 PR：整目录删除|必要时 MCP' \
  .memory/projects/project_capability_surface_cli_skill_mcp.md \
  .memory/projects/project_new_note_ingest.md \
  .memory/references/reference_bin_cli_skill_classic_projects.md \
  extensions/.memory/projects/project_clis_from_mcp.md
test -f docs/adr/0004-capability-surface-cli-skill-mcp.md
test ! -f .memory/projects/project_bin_cli_skill_layering.md
```

Expected: ADR file exists (already on this plan branch / PR #41). Memory files still contain the stale phrases until remember runs.

- [ ] **Step 2: Run the check and keep the list of stale files**

Run the `rg` above. Expected: matches in the four memory bodies (and/or their descriptions). `project_capability_surface_cli_skill_mcp` on a branch that only cherry-picked PR #41 still says 「实现后续 PR」.

- [ ] **Step 3: remember the four entries**

Use the skill script; do not hand-write `.memory/PROJECT.md` / `extensions/.memory/PROJECT.md`.

```bash
INIT=extensions/skills/project-memory-init/scripts/memory.py

python3 "$INIT" remember \
  --target-dir . \
  --type project \
  --slug capability_surface_cli_skill_mcp \
  --title "能力面：CLI / Skill / MCP" \
  --description "能力面是 CLI、Skill、MCP 三者并列；仓根 bin/ 已删除；Note git 在 extensions/clis 的 TS；MCP 子进程调 edges note。禁止「必要时 MCP」或只写 CLI+Skill。新能力不要再加仓根脚本或把 npm bin 当一层。" \
  --content "能力面定为 CLI、Skill 与 MCP 三者并列。仓根 \`bin/\`（含 \`new-note\`）已删除；Note 入库的 git 在 \`extensions/clis\` 的 TypeScript，与旧脚本全量对等。MCP 用子进程调用 \`edges note\`，不直连仓根脚本、也不 in-process import。Skill 在 \`extensions/skills/edges-note/\`，说明何时如何调 CLI 或 MCP。npm \`package.json\` 的 \`bin\` 只是安装挂钩，不是一层。

**Why:**
能力面始终是三条对等入口：CLI、Skill、MCP。经典项目（gh / AXI / Agent Skills）只示范 CLI 与 Skill 的形状，用来去掉「给人的 PATH 脚本」这层假分层；Edges 另外把 MCP 作为无 shell 宿主的一等入口，不是事后加装。删除仓根 \`bin/\` 后，MCP 仍通过子进程调用 CLI。2026-09-11 grill 确认（ADR 0004）。实现已按 \`docs/superpowers/plans/2026-09-11-capability-surface-bin-cli-skill-mcp.md\` 落地。

**How to apply:**
- 新能力落 CLI 契约 + Skill 说明 + MCP 暴露（需要机器入口时一并提供；能力面定义里 MCP 不是可选项）。禁止 Skill → 仓根 \`bin/\`，也禁止把 npm \`bin\` 定义成一层。
- 不要恢复仓根 \`bin/\`、只搬 bash、半迁移 git、或 MCP in-process import CLI。
- 对照来源见 \`reference_bin_cli_skill_classic_projects\`。"

# Drop the old two-layer slug so the index does not keep both:
rm -f .memory/projects/project_bin_cli_skill_layering.md

python3 "$INIT" remember \
  --target-dir . \
  --type project \
  --slug new_note_ingest \
  --title "new-note MCP 的 ingest 约束" \
  --description "改 new-note 或新增 MCP ingest 时：TS+Node 编排，子进程调用 edges note，失败即停，返回机器可解析 JSON。不要 Python server，不要 in-process import CLI，不要再找仓根 bin/。" \
  --content "\`new-note\` MCP 的约束是：TypeScript + Node.js 编排，git 由 \`edges note\` 在 CLI 进程里跑，MCP 只 \`execFile\` 该 CLI。失败即停，返回机器可解析结果。不要改成 Python server，不要 in-process import \`extensions/clis\`，不要再 \`execFile\` 仓根脚本。

**Why:** 2026-02-19 的 ingest 把外部写入做成 MCP 工具 \`new_note\`。ADR-0004 把 git 收进 CLI，并规定 MCP 子进程调 CLI。参数数组调用避免注入。

**How to apply:**
- 工具入参必填 \`title\`、\`content\`、\`coAuthor\`；缺字段或超长校验失败，不启动 CLI。
- 顺序：校验 → spawn \`edges note --json\` → 解析 JSON。任一步失败不得继续。
- spawn/execFile 用参数数组，禁止 shell 字符串拼接。子进程环境删除 \`EDGES_AUTH_TOKEN\`（MCP 已鉴权）。
- commit 必须带 ingest 标题上下文和 co-author trailer（由 CLI git 模块保证）。
- push 成功但 PR 依赖不可用时，ingest 仍算成功，\`prStatus: \"unavailable\"\`。
- 尚未做完：并发分支冲突策略、启动时 git/凭据/gh 预检查。"

python3 "$INIT" remember \
  --target-dir . \
  --type reference \
  --slug bin_cli_skill_classic_projects \
  --title "bin/CLI/Skill 经典项目对照" \
  --description "对照 gh、AXI、Agent Skills 规范、superpowers：何时查「要不要仓根 bin/、Skill 调谁」。经典项目示范 CLI+Skill 形状；Edges 能力面仍是 CLI+Skill+MCP 并列。本仓现状是 CLI 内 TS git + Skill 说明 + MCP spawn edges note。" \
  --content "设计 edges 的能力面时，对照这些一手来源：经典项目是「一个 CLI + 一份 SKILL.md」；Edges 在此之上把 MCP 作为无 shell 宿主的一等入口，三者并列。npm/AXI 的 bin 等于 CLI 安装入口，不是仓根再摆人用 shell。

**Why:**
2026-09-11 为对齐「要不要单独养仓根 \`bin/\`」做的短调研。结论写入 \`project_capability_surface_cli_skill_mcp\` 与 ADR 0004。对照来源只用来定 CLI 与 Skill 的形状，不要据此把 MCP 写成可选项。

**How to apply:**
- \`gh\`（cli/cli）：人和 agent 共用一个 \`gh\`。Skill 只教 agent 痛点。https://github.com/cli/cli/blob/trunk/skills/gh/SKILL.md
- AXI / \`gh-axi\`：CLI 是主界面；Skill 例子写成 \`npx -y gh-axi …\`。他们的 \`bin/*.ts\` 是 npm 入口，不是第三层。
- Agent Skills 规范：已有包就 \`npx\`/\`uvx\`；命令难一次写对才把脚本放进 **skill 自己的 \`scripts/\`**，不是仓根 \`bin/\`。https://agentskills.io/skill-creation/using-scripts
- obra/superpowers：Skill 是流程，落地调已有命令。
- 本仓现状：\`extensions/clis\` 的 \`edges note\` 在进程内跑 git（\`src/git\`，\`execFile('git', …)\`）；MCP \`new-note\` 子进程调用该 CLI；\`extensions/skills/edges-note\` 只教何时如何调用。仓根 \`bin/\` 已删除。"

python3 "$INIT" remember \
  --target-dir extensions \
  --type project \
  --slug clis_from_mcp \
  --title "new_note 收成 extensions/clis/edges，MCP 保留" \
  --description "改 note ingest、new-note MCP 或 clis 时：本地 agent 走 extensions/clis 的 edges note；git 在 CLI 的 TS 模块；MCP 子进程调 edges note；鉴权 flag 留在 note 上；JSON stdout。不要把 CLI 放仓库根。" \
  --content "本地、有 shell 的 agent 用 \`extensions/clis/\` 的 \`edges\` CLI；入库子命令是 \`edges note …\`。鉴权 flag（\`--token-file\` / \`--token-stdin\`）挂在 \`note\` 上，和 new-note MCP HTTP 同一道可选门闩。\`edges tasks\` 仍是占位。二进制只有 \`edges\`。git 在 \`extensions/clis/src/git\`；\`extensions/mcp-servers/new-note\` 留给没有 shell 的宿主，子进程调用 \`edges note\`。不要把 CLI 项目放在仓库根 \`clis/\`。

**Why:** ADR-0004 把能力面定为 CLI + Skill + MCP，并删除仓根 \`bin/\`。先前「两边都 execFile bin/new-note、MCP 不套 CLI」已被取代。

**How to apply:**

### 表面

一个 MCP 服务：工具 \`new_note\`。必填 \`title\`（1–120）、\`content\`（1–50_000）、\`coAuthor\`（3–200）。顺序：校验 → \`execFile(node, [cliEntry, note flags])\` → 解析 CLI JSON。成功：\`status, filePath, branch, prStatus (created|unavailable|direct_commit), prUrl?, stdoutSummary\`。失败：\`status, errorCode, reason\`。push 成功但 PR 不可用仍算成功。HTTP 鉴权：\`EDGES_AUTH_TOKEN\` 未设则跳过；设了则 Bearer。子进程环境删除 \`EDGES_AUTH_TOKEN\`。

### 三入口

\`\`\`
agent / human
 ├─ extensions/clis  edges            多命令 CLI（note / tasks / …；Commander + JSON；git 在 src/git）
 ├─ extensions/skills/edges-note      何时如何调 CLI 或 MCP（对等能力面入口）
 └─ extensions/mcp-servers/new-note   无 shell 的 MCP 宿主（spawn edges note）
\`\`\`

不要把 npm \`bin\` 当成一层。不要恢复仓根 \`bin/\`。\`conversation-to-notes\` 不进 CLI。隔离仓测用 \`EDGES_REPO\`，不要再设 \`EDGES_SCRIPT\`。

### CLI 契约

包 \`edges-cli\`，目录 \`extensions/clis/\`，二进制只有 \`edges\`。

\`\`\`
edges note --title T --content C --co-author \"Name <email>\" [--json] [--dry-run] [--mode direct|pr] [--token-file PATH]
edges tasks [--help]
edges --help / -v
\`\`\`

- 根目录不带入子命令：help 或 usage error，不跑 note ingest。
- 输出始终 JSON；进度在 stderr。
- 成功 exit 0；运行时失败 exit 1；缺字段 exit 2；鉴权失败 exit 4。
- 环境：\`EDGES_REPO\`、\`EDGES_BASE_BRANCH\`、\`EDGES_MODE\`、\`EDGES_DRY_RUN\`、\`EDGES_AUTH_TOKEN\`、\`GITHUB_TOKEN\`。没有 \`EDGES_SCRIPT\`。

### 不做

删 MCP；MCP in-process import CLI；把 MCP HTTP/stdio 搬进 CLI；发 npm；AXI TOON/分页/session hook；并发分支策略；恢复 \`edges-note\` 第二 bin；根目录默认 ingest。"
```

If remember reports `agentsAction: needs-doctor`, run doctor (next step) before committing.

- [ ] **Step 4: Doctor + living-doc sweep + test**

```bash
python3 extensions/skills/project-memory-init/scripts/memory.py doctor --target-dir .
python3 extensions/skills/project-memory-init/scripts/memory.py doctor --target-dir extensions
# Only --apply if doctor reports index drift you just caused; do not rewrite someone else's AGENTS.md.

rg -n 'bin/new-note|仓根 `bin/`' \
  README.md scripts/README.md scripts/setup \
  extensions/README.md extensions/clis/README.md extensions/clis/src \
  extensions/mcp-servers/README.md extensions/mcp-servers/new-note/src \
  extensions/mcp-servers/new-note/README.md \
  extensions/skills/edges-note \
  .memory/projects/project_capability_surface_cli_skill_mcp.md \
  .memory/projects/project_new_note_ingest.md \
  .memory/references/reference_bin_cli_skill_classic_projects.md \
  extensions/.memory/projects/project_clis_from_mcp.md \
  CONTEXT.md docs/adr/0004-capability-surface-cli-skill-mcp.md

test -f docs/adr/0004-capability-surface-cli-skill-mcp.md
rg -n '能力面（Capability Surface）|\*\*CLI\*\*|Skill（调用说明）|MCP（Edges）' CONTEXT.md
pnpm --filter edges-cli test
pnpm --filter new-note test
pnpm skills:link -- --check
```

Allowed leftover mentions: ADR/CONTEXT/Skill **forbidding** `bin/`; historical `CHANGELOG.md` version sections; `knowledge/notes/` archives. Living entry points must not tell a human to put `bin/` on PATH or run `bin/new-note`.

If doctor is clean and tests pass, do not `--apply` anything extra.

- [ ] **Step 5: Commit**

```bash
git add .memory/projects/project_capability_surface_cli_skill_mcp.md \
  .memory/projects/project_new_note_ingest.md \
  .memory/references/reference_bin_cli_skill_classic_projects.md \
  .memory/PROJECT.md .memory/REFERENCE.md \
  extensions/.memory/projects/project_clis_from_mcp.md \
  extensions/.memory/PROJECT.md \
  CHANGELOG.md
git add -u .memory/projects/project_bin_cli_skill_layering.md
git commit -m "docs(memory): capability surface is CLI+Skill+MCP after bin/ removal

Co-authored-by: Coding Agent 专家 <grok-bot@users.noreply.github.com>"
```

---

## Spec coverage (self-review)

| Requirement | Task |
| --- | --- |
| Capability Surface = CLI + Skill + MCP (CONTEXT / ADR-0004) | header, 4–6 |
| Delete entire repo-root `bin/` | 4 |
| Rewrite `bin/new-note` git in `extensions/clis` TS with full parity | 1–2 |
| Args title/content/coAuthor | 1 (`runNoteIngest` input), 2 (existing CLI flags) |
| Env EDGES_REPO / BASE_BRANCH / MODE / DRY_RUN / GITHUB_TOKEN | 1–2 |
| Slug, `knowledge/notes/YYYY-MM-DD--slug.md`, branch names | 1 |
| Dry-run skips checkout/pull/push only | 1 (`git-ingest.test.ts`) |
| Commit `ingest: TITLE` + Co-authored-by | 1 |
| Markers `__EDGES_FILE__` / `BRANCH` / `PR_STATUS` / `PR_URL` | 1 (`markers.ts` + ingest stdout) |
| PR via gh, else token fetch, else compare URL | 1 (`pr.ts`) |
| CLI in-process TS; drop `scriptPath` / `EDGES_SCRIPT` | 2 |
| MCP spawn/exec `edges note`, not bash, not in-process import | 3 |
| Map MCP auth (strip `EDGES_AUTH_TOKEN` on child) | 3 |
| Skill under `extensions/skills/edges-note/` teaching CLI and MCP as equal peers | 5 |
| Root README / docs no longer say human PATH via `bin/` | 4 |
| Update `project_capability_surface_cli_skill_mcp` and related memory | 6 |
| npm `package.json` `bin` remains `edges` install hook only | 2 README, 5 SKILL, 6 memory |
| `execFile('git')` wrappers, no simple-git | Locked design + Task 1 |
| ADR-0004 + CONTEXT present or cherry-pick #41 | Global Constraints + Task 6 |
| No `knowledge/posts/` edits; no task-board moves | Global Constraints |

## Placeholder scan

No TBD / implement-later / similar-to-Task-N without code. Task 6 remember bodies are spelled out. Integration.sh isolation warning is a concrete instruction (use `mkdtemp`), not an open TODO.

## Type consistency

- `IngestRequest` = `{ title, content, coAuthor }` in both packages
- `ScriptSuccess` = `{ filePath, branch, prUrl?, prStatus, stdout }`
- `prStatus` = `"created" \| "unavailable" \| "direct_commit"`
- CLI `RuntimeConfig` = `{ repoPath, baseBranch, mode, dryRun, authToken? }` — no `scriptPath`
- MCP `RuntimeConfig` = `{ repoPath, baseBranch, cliEntry, skillsPath, mode, dryRun, authToken? }` — no `scriptPath`
- `runNoteIngest(input, config, env?, deps?)` is the CLI default `IngestRunner`
- `runEdgesNote(input, config, env?)` is the MCP default runner
- `ExecFn` = `(file, args, options?) => Promise<{ stdout, stderr }>`
- Skill directory / frontmatter name = `edges-note`
