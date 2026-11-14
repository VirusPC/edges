import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../../src/program.js";
import "../register-skills-install-mock.js";

const templatePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../skills/edges/references/memory/references/templates/AGENTS.tmpl.md",
);

const SEED = [
  "本目录有项目记忆。提问或动手前用 `$edges-memory-ask`；该沉淀用 `$edges-memory-remember`。本轮查过不重复。",
  "本层硬约束直接写在这个区块里，不要链到记忆正文文件。",
];

const ISOLATION = [
  "先核验 git 顶层与当前路径",
  "`git worktree list`",
  "当前分支和 status 基线",
  "必须是当前任务自己的 worktree 和独立分支",
  "多个 Agent 不得共用同一工作树写入",
  "同一分支不得挂两个 worktree",
  "技能安装、生成索引",
  "不满足则停写，先隔离开再写",
  "已在独立 clone/环境中的任务视为已隔离",
  "只读查询可不建 worktree",
  "全局安装写明目标目录",
  "没有写入本仓 checkout",
  "全局安装不更新仓内 tracked 副本",
  "另开 PR，不在现有目录上覆盖",
  "已有改动保留",
  "不对未知改动执行 clean、reset 或 stash",
];

const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "Edges Test",
  GIT_AUTHOR_EMAIL: "edges-test@example.com",
  GIT_COMMITTER_NAME: "Edges Test",
  GIT_COMMITTER_EMAIL: "edges-test@example.com",
};

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, env: gitEnv, stdio: "ignore" });
}

async function directory(t: test.TestContext, prefix: string) {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

function agentsDocument(bullets: readonly string[]): string {
  const lines = bullets.map((bullet) => `- ${bullet}`).join("\n");
  return `# scope

<!-- edges:start -->

<!-- edges-constraints:start -->
## 本层硬约束

${lines}
<!-- edges-constraints:end -->

<!-- edges-local:start -->
## 本层系统维护信息

<!-- edges-local:end -->

<!-- edges:end -->
`;
}

async function initNotes(scopeDir: string, extra: string[] = []) {
  const result = await run(["--scope", scopeDir, ...extra, "init", "notes"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  return readFile(path.join(scopeDir, "AGENTS.md"), "utf8");
}

function assertIsolation(text: string) {
  for (const phrase of ISOLATION) assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(text.split("`git worktree list`").length - 1, 1);
  assert.doesNotMatch(text, /git-root-constraint/);
  assert.doesNotMatch(text, /本仓内容变更走 PR/);
}

function assertNoIsolation(text: string) {
  assert.doesNotMatch(text, /git worktree list/);
  assert.doesNotMatch(text, /先核验 git 顶层/);
  assert.doesNotMatch(text, /git-root-constraint/);
}

test("the official AGENTS template stores the git-root isolation constraint on its own line", async () => {
  const template = await readFile(templatePath, "utf8");
  const marker = template.indexOf("<!-- git-root-constraint -->\n- ");
  assert.ok(marker >= 0, template);
  const line = template.slice(marker).split("\n")[1] ?? "";
  for (const phrase of ISOLATION) assert.match(line, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(line, /本仓内容变更走 PR/);
  assert.equal(template.split("<!-- git-root-constraint -->").length - 1, 1);
});

test("edges init at a git root writes the isolation constraint once", async (t) => {
  const root = await directory(t, "edges-git-root-");
  git(root, ["init", "-b", "main"]);
  const agents = await initNotes(root);
  assertIsolation(agents);
  for (const bullet of SEED) assert.match(agents, new RegExp(bullet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(await initNotes(root), agents);
});

test("a linked worktree root is the git root for the isolation constraint", async (t) => {
  const parent = await directory(t, "edges-worktree-parent-");
  git(parent, ["init", "-b", "main"]);
  git(parent, ["commit", "--allow-empty", "-m", "init"]);
  const worktree = path.join(parent, "task");
  git(parent, ["worktree", "add", "-b", "task", worktree]);
  assert.equal(existsSync(path.join(worktree, ".git")), true);
  assertIsolation(await initNotes(worktree));
  assert.equal(existsSync(path.join(parent, "AGENTS.md")), false);
});

test("edges init below a git root does not copy the isolation constraint", async (t) => {
  const root = await directory(t, "edges-nested-");
  git(root, ["init", "-b", "main"]);
  const nested = path.join(root, "packages", "example");
  await mkdir(nested, { recursive: true });
  assertNoIsolation(await initNotes(nested));
  assert.equal(existsSync(path.join(root, "AGENTS.md")), false);
});

test("edges init outside a git repository does not write the isolation constraint", async (t) => {
  const root = await directory(t, "edges-nogit-");
  assertNoIsolation(await initNotes(root));
});

test("refreshing a git root whose constraints are still the default seed adds the isolation line", async (t) => {
  const root = await directory(t, "edges-seed-");
  git(root, ["init", "-b", "main"]);
  await writeFile(path.join(root, "AGENTS.md"), agentsDocument(SEED));
  const agents = await initNotes(root);
  assertIsolation(agents);
  for (const bullet of SEED) assert.match(agents, new RegExp(bullet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(await initNotes(root), agents);
});

test("refreshing a git root keeps handwritten constraints and does not add the isolation line", async (t) => {
  const root = await directory(t, "edges-hand-");
  git(root, ["init", "-b", "main"]);
  const handwritten = [...SEED, "用户自己的约束保留。"];
  await writeFile(path.join(root, "AGENTS.md"), agentsDocument(handwritten));
  const agents = await initNotes(root);
  assert.match(agents, /用户自己的约束保留。/);
  assertNoIsolation(agents);
  assert.equal(await initNotes(root), agents);
});

test("refreshing a git root does not repair a rewritten seed bullet", async (t) => {
  const root = await directory(t, "edges-rewritten-");
  git(root, ["init", "-b", "main"]);
  const rewritten = [SEED[0].replace("不重复", "可以重复"), SEED[1]];
  await writeFile(path.join(root, "AGENTS.md"), agentsDocument(rewritten));
  const agents = await initNotes(root);
  assert.match(agents, /可以重复/);
  assertNoIsolation(agents);
});

test("an empty constraints block on a git root stays empty", async (t) => {
  const root = await directory(t, "edges-empty-");
  git(root, ["init", "-b", "main"]);
  await writeFile(path.join(root, "AGENTS.md"), agentsDocument([]));
  const agents = await initNotes(root);
  assertNoIsolation(agents);
  assert.match(agents, /<!-- edges-constraints:start -->/);
});

test("a git root missing the constraints block receives the isolation seed", async (t) => {
  const root = await directory(t, "edges-missing-");
  git(root, ["init", "-b", "main"]);
  await writeFile(
    path.join(root, "AGENTS.md"),
    `# scope

<!-- edges:start -->
<!-- edges-local:start -->
## 本层系统维护信息
<!-- edges-local:end -->
<!-- edges:end -->
`,
  );
  assertIsolation(await initNotes(root));
});

test("a nested entry missing the constraints block does not receive the isolation seed", async (t) => {
  const root = await directory(t, "edges-nested-missing-");
  git(root, ["init", "-b", "main"]);
  const nested = path.join(root, "nested");
  await mkdir(nested);
  await writeFile(
    path.join(nested, "AGENTS.md"),
    `# nested

<!-- edges:start -->
<!-- edges-local:start -->
## 本层系统维护信息
<!-- edges-local:end -->
<!-- edges:end -->
`,
  );
  assertNoIsolation(await initNotes(nested));
});

test("refreshing a default seed that already has the independent-harness line adds isolation once", async (t) => {
  const root = await directory(t, "edges-seed-super-");
  git(root, ["init", "-b", "main"]);
  await writeFile(
    path.join(root, "AGENTS.md"),
    agentsDocument([
      ...SEED,
      "这是独立 edges harness 仓库，调用 edges cli 时优先考虑加 --super 参数",
    ]),
  );
  const agents = await initNotes(root, ["--super"]);
  assertIsolation(agents);
  assert.equal(agents.split("这是独立 edges harness 仓库").length - 1, 1);
  assert.equal(await initNotes(root, ["--super"]), agents);
});

test("init --super on a git root keeps handwritten constraints and does not add isolation", async (t) => {
  const root = await directory(t, "edges-hand-super-");
  git(root, ["init", "-b", "main"]);
  await writeFile(path.join(root, "AGENTS.md"), agentsDocument([...SEED, "用户自己的约束保留。"]));
  const agents = await initNotes(root, ["--super"]);
  assert.match(agents, /用户自己的约束保留。/);
  assertNoIsolation(agents);
  assert.equal(agents.split("这是独立 edges harness 仓库").length - 1, 1);
});

test("init --super on a git root keeps one isolation line and one independent-harness line", async (t) => {
  const root = await directory(t, "edges-super-root-");
  git(root, ["init", "-b", "main"]);
  const agents = await initNotes(root, ["--super"]);
  assertIsolation(agents);
  assert.equal(agents.split("这是独立 edges harness 仓库").length - 1, 1);
  assert.equal(await initNotes(root, ["--super"]), agents);
});
