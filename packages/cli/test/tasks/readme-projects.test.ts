import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { mkdtemp, rm, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { physicalParent } from "../../src/services/node/node-layout.js";
import { NodeService } from "../../src/services/node/node-service.js";

const scopeAgents = (local = "") => `# Scope

<!-- edges-constraints:start -->
## 本层硬约束

Keep constraints.
<!-- edges-constraints:end -->

<!-- edges-local:start -->
## 本层系统维护信息

${local}
<!-- edges-local:end -->

<!-- edges-descendants:start -->
## 下层系统维护信息

<!-- edges-descendants:end -->
`;
const projectReadme = (title: string, description: string) =>
  `# ${title}\n\n${description}\n\n<!-- edges-entries-local:start -->\n## 本层内容\n<!-- edges-entries-local:end -->\n`;

function write(root: string, rel: string, source: string): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), source);
}

/** Maintenance board whose Task Projects live on the board README content face. */
async function readmeBoard(): Promise<string> {
  const repo = fs.realpathSync(await mkdtemp(path.join(tmpdir(), "edges-readme-projects-")));
  write(repo, "AGENTS.md", scopeAgents("- [Tasks](.edges/tasks/README.md) — board"));
  write(repo, ".edges/tasks/AGENTS.md", scopeAgents());
  write(
    repo,
    ".edges/tasks/README.md",
    "# Tasks\n\nBoard prose.\n\n<!-- edges-entries-local:start -->\n## 本层内容\n\n- [Alpha](alpha/README.md) — alpha work\n- [Beta](beta/README.md) — beta work\n<!-- edges-entries-local:end -->\n",
  );
  write(repo, ".edges/tasks/alpha/README.md", projectReadme("Alpha", "alpha work"));
  write(repo, ".edges/tasks/beta/README.md", projectReadme("Beta", "beta work"));
  return repo;
}

async function cli(repo: string, args: string[], superScope = false) {
  const { run } = await import("../../src/program.js");
  const result = await run(["--scope", repo, ...(superScope ? ["--super"] : []), "tasks", ...args], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}

const read = (repo: string, rel: string) => readFile(path.join(repo, rel), "utf8");

test("physicalParent: a edges-entries README is the parent of its task leaves", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const leaf = path.join(repo, ".edges/tasks/alpha/backlog/2026-10-06--x/INDEX.md");
  assert.equal(physicalParent(leaf, repo), path.join(repo, ".edges/tasks/alpha/README.md"));
  // System-one README children prefer the board org list over the board AGENTS.
  assert.equal(
    physicalParent(path.join(repo, ".edges/tasks/gamma/README.md"), repo),
    path.join(repo, ".edges/tasks/README.md"),
  );
  // Harness material stays with the system entry even when the scope README has entries.
  write(repo, "README.md", "# Root\n\n<!-- edges-entries-local:start -->\n## 本层内容\n\n<!-- edges-entries-local:end -->\n");
  assert.equal(
    physicalParent(path.join(repo, ".edges/memory/projects/README.md"), repo),
    path.join(repo, "AGENTS.md"),
  );
  assert.equal(
    physicalParent(path.join(repo, "notes/AGENTS.md"), repo),
    path.join(repo, "AGENTS.md"),
  );
});

test("task create into an AGENTS-only project creates the project README and does not register the leaf on AGENTS", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  write(repo, ".edges/tasks/legacy/AGENTS.md", scopeAgents());
  const boardBefore = await read(repo, ".edges/tasks/AGENTS.md");
  const legacyAgents = await read(repo, ".edges/tasks/legacy/AGENTS.md");
  const created = await cli(repo, ["create", "--title", "Orphan", "--project", "legacy"]);
  const readme = await read(repo, ".edges/tasks/legacy/README.md");
  assert.match(readme, /edges-entries-local:start/);
  assert.ok(readme.includes(created.stem), readme);
  assert.equal(await read(repo, ".edges/tasks/legacy/AGENTS.md"), legacyAgents);
  assert.equal(await read(repo, ".edges/tasks/AGENTS.md"), boardBefore);
  assert.ok(!(await read(repo, "AGENTS.md")).includes(created.stem));
});

test("task create into a README-backed project updates the project README, not the board AGENTS", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const boardBefore = await read(repo, ".edges/tasks/AGENTS.md");
  const created = await cli(repo, ["create", "--title", "Fresh", "--project", "alpha"]);
  const alpha = await read(repo, ".edges/tasks/alpha/README.md");
  assert.ok(alpha.includes(created.stem), alpha);
  assert.match(alpha, /^# Alpha\n\nalpha work\n/);
  assert.equal(await read(repo, ".edges/tasks/AGENTS.md"), boardBefore);
  await assert.rejects(access(path.join(repo, ".edges/tasks/alpha/AGENTS.md")));
  const listed = await cli(repo, ["list"]);
  assert.deepEqual(listed.tasks.map((task: any) => task.stem), [created.stem]);
});

test("cross-project move updates both project READMEs", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  await cli(repo, ["create", "--title", "Stay", "--project", "alpha"]);
  const created = await cli(repo, ["create", "--title", "Mover", "--project", "alpha"]);
  const oneItemList = /## 本层内容\n\n- \[[^\n]+\n<!-- edges-entries-local:end -->\n$/;
  assert.match(await read(repo, ".edges/tasks/alpha/README.md"), /## 本层内容\n\n- \[[^\n]+\n- \[[^\n]+\n<!-- edges-entries-local:end -->\n$/);
  const boardBefore = await read(repo, ".edges/tasks/AGENTS.md");
  await cli(repo, ["update", created.stem, "--project", "beta"]);
  const alpha = await read(repo, ".edges/tasks/alpha/README.md");
  assert.ok(!alpha.includes(created.stem));
  assert.match(alpha, oneItemList);
  const beta = await read(repo, ".edges/tasks/beta/README.md");
  assert.ok(beta.includes(created.stem));
  assert.match(beta, oneItemList);
  assert.equal(await read(repo, ".edges/tasks/AGENTS.md"), boardBefore);
  const listed = await cli(repo, ["list"]);
  assert.deepEqual(listed.tasks.map((task: any) => task.project).sort(), ["alpha", "beta"]);
});

test("destroy removes references held by READMEs reached as separate content-face roots", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const created = await cli(repo, ["create", "--title", "Doomed", "--project", "alpha"]);
  const beta = path.join(repo, ".edges/tasks/beta/README.md");
  write(repo, ".edges/tasks/beta/README.md", (await read(repo, ".edges/tasks/beta/README.md")).replace(
    "<!-- edges-entries-local:end -->",
    `<!-- edges-entries-local:end -->\n\n<!-- edges-entries-descendants:start -->\n## 下层内容\n\n- [Doomed](../alpha/backlog/${created.stem}/INDEX.md)\n<!-- edges-entries-descendants:end -->`,
  ));
  const service = new NodeService({ managedRoot: path.join(repo, ".edges/tasks") });
  const task = (await service.get(path.join(repo, created.path)))!;
  await service.destroy(task);
  assert.ok(!(await read(repo, ".edges/tasks/alpha/README.md")).includes(created.stem));
  assert.ok(!fs.readFileSync(beta, "utf8").includes(created.stem));
});

test("project create lists the new README project in the board README with no seed AGENTS", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const boardBefore = await read(repo, ".edges/tasks/AGENTS.md");
  const created = await cli(repo, ["project", "create", "gamma", "--title", "Gamma", "--description", "gamma work"]);
  assert.equal(created.path, ".edges/tasks/gamma/README.md");
  await assert.rejects(access(path.join(repo, ".edges/tasks/gamma/AGENTS.md")));
  assert.match(await read(repo, ".edges/tasks/gamma/README.md"), /^# Gamma\n\ngamma work\n[\s\S]*<!-- edges-entries-local:start -->/);
  const boardReadme = await read(repo, ".edges/tasks/README.md");
  assert.match(boardReadme, /\[Gamma\]\(<?gamma\/README\.md>?\) — gamma work/);
  assert.match(boardReadme, /^# Tasks\n\nBoard prose\./);
  assert.equal(await read(repo, ".edges/tasks/AGENTS.md"), boardBefore);
  const task = await cli(repo, ["create", "--title", "First", "--project", "gamma"]);
  assert.ok((await read(repo, ".edges/tasks/gamma/README.md")).includes(task.stem));
});

test("domain board: new project and its tasks live in README org lists; legacy AGENTS project links migrate", async (t) => {
  const repo = fs.realpathSync(await mkdtemp(path.join(tmpdir(), "edges-domain-readme-")));
  t.after(() => rm(repo, { recursive: true, force: true }));
  write(repo, "AGENTS.md", scopeAgents("- [Tasks](tasks/AGENTS.md) — board"));
  write(repo, "tasks/AGENTS.md", scopeAgents("- [Old](old/README.md) — old work"));
  write(repo, "tasks/old/README.md", projectReadme("Old", "old work"));
  const created = await cli(repo, ["project", "create", "cli", "--title", "CLI", "--description", "cli work"], true);
  assert.equal(created.path, "tasks/cli/README.md");
  const board = await read(repo, "tasks/AGENTS.md");
  assert.doesNotMatch(board, /README\.md/);
  const list = await read(repo, "tasks/README.md");
  assert.match(list, /\[CLI\]\(<?cli\/README\.md>?\) — cli work/);
  assert.match(list, /\[Old\]\(<?old\/README\.md>?\) — old work/);
  const projects = await cli(repo, ["project", "list"], true);
  assert.deepEqual(projects.projects.map((p: any) => [p.project, p.path]).sort(), [
    ["cli", "tasks/cli/README.md"],
    ["default", "tasks/_default/README.md"],
    ["old", "tasks/old/README.md"],
  ]);
  const task = await cli(repo, ["create", "--title", "Domain task", "--project", "cli"], true);
  assert.ok((await read(repo, "tasks/cli/README.md")).includes(task.stem));
  assert.doesNotMatch(await read(repo, "tasks/AGENTS.md"), new RegExp(task.stem));
});
