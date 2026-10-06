import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { mkdtemp, rm, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { physicalParent } from "../../src/services/node/node-layout.js";
import { NodeService } from "../../src/services/node/node-service.js";

const scopeAgents = (local = "") => `# Scope

<!-- project-harness-constraints:start -->
## 本层硬约束

Keep constraints.
<!-- project-harness-constraints:end -->

<!-- project-harness-local:start -->
## 本层系统维护信息

${local}
<!-- project-harness-local:end -->

<!-- project-harness-descendants:start -->
## 下层系统维护信息

<!-- project-harness-descendants:end -->
`;
const projectReadme = (title: string, description: string) =>
  `# ${title}\n\n${description}\n\n<!-- project-entries-local:start -->\n## 本层内容\n<!-- project-entries-local:end -->\n`;

function write(root: string, rel: string, source: string): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), source);
}

/** Maintenance board whose Task Projects are reached only through the board README companion. */
async function readmeBoard(): Promise<string> {
  const repo = fs.realpathSync(await mkdtemp(path.join(tmpdir(), "edges-readme-projects-")));
  write(repo, "AGENTS.md", scopeAgents("- [Tasks](.harness/tasks/AGENTS.md) — board"));
  write(repo, ".harness/tasks/AGENTS.md", scopeAgents());
  write(
    repo,
    ".harness/tasks/README.md",
    "# Tasks\n\nBoard prose.\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Alpha](alpha/README.md) — alpha work\n- [Beta](beta/README.md) — beta work\n<!-- project-entries-local:end -->\n",
  );
  write(repo, ".harness/tasks/alpha/README.md", projectReadme("Alpha", "alpha work"));
  write(repo, ".harness/tasks/beta/README.md", projectReadme("Beta", "beta work"));
  return repo;
}

async function cli(repo: string, args: string[]) {
  const { run } = await import("../../src/program.js");
  const result = await run(["tasks", ...args], { env: { EDGES_SCOPE: repo } });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}

const read = (repo: string, rel: string) => readFile(path.join(repo, rel), "utf8");

test("physicalParent: a project-entries README is the parent of its task leaves", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const leaf = path.join(repo, ".harness/tasks/alpha/backlog/2026-10-06--x/INDEX.md");
  assert.equal(physicalParent(leaf, repo), path.join(repo, ".harness/tasks/alpha/README.md"));
  // System-one README children prefer the board org list over the board AGENTS.
  assert.equal(
    physicalParent(path.join(repo, ".harness/tasks/gamma/README.md"), repo),
    path.join(repo, ".harness/tasks/README.md"),
  );
  // Harness material stays with the system entry even when the scope README has entries.
  write(repo, "README.md", "# Root\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n<!-- project-entries-local:end -->\n");
  assert.equal(
    physicalParent(path.join(repo, ".harness/memory/projects/README.md"), repo),
    path.join(repo, "AGENTS.md"),
  );
  assert.equal(
    physicalParent(path.join(repo, "notes/AGENTS.md"), repo),
    path.join(repo, "AGENTS.md"),
  );
});

test("task create into a README-backed project updates the project README, not the board AGENTS", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const boardBefore = await read(repo, ".harness/tasks/AGENTS.md");
  const created = await cli(repo, ["create", "--title", "Fresh", "--project", "alpha"]);
  const alpha = await read(repo, ".harness/tasks/alpha/README.md");
  assert.ok(alpha.includes(created.stem), alpha);
  assert.match(alpha, /^# Alpha\n\nalpha work\n/);
  assert.equal(await read(repo, ".harness/tasks/AGENTS.md"), boardBefore);
  await assert.rejects(access(path.join(repo, ".harness/tasks/alpha/AGENTS.md")));
  const listed = await cli(repo, ["list"]);
  assert.deepEqual(listed.tasks.map((task: any) => task.stem), [created.stem]);
});

test("cross-project move updates both project READMEs", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  await cli(repo, ["create", "--title", "Stay", "--project", "alpha"]);
  const created = await cli(repo, ["create", "--title", "Mover", "--project", "alpha"]);
  const oneItemList = /## 本层内容\n\n- \[[^\n]+\n<!-- project-entries-local:end -->\n$/;
  assert.match(await read(repo, ".harness/tasks/alpha/README.md"), /## 本层内容\n\n- \[[^\n]+\n- \[[^\n]+\n<!-- project-entries-local:end -->\n$/);
  const boardBefore = await read(repo, ".harness/tasks/AGENTS.md");
  await cli(repo, ["update", created.stem, "--project", "beta"]);
  const alpha = await read(repo, ".harness/tasks/alpha/README.md");
  assert.ok(!alpha.includes(created.stem));
  assert.match(alpha, oneItemList);
  const beta = await read(repo, ".harness/tasks/beta/README.md");
  assert.ok(beta.includes(created.stem));
  assert.match(beta, oneItemList);
  assert.equal(await read(repo, ".harness/tasks/AGENTS.md"), boardBefore);
  const listed = await cli(repo, ["list"]);
  assert.deepEqual(listed.tasks.map((task: any) => task.project).sort(), ["alpha", "beta"]);
});

test("destroy removes references held by READMEs reached only through the companion edge", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const created = await cli(repo, ["create", "--title", "Doomed", "--project", "alpha"]);
  const beta = path.join(repo, ".harness/tasks/beta/README.md");
  write(repo, ".harness/tasks/beta/README.md", (await read(repo, ".harness/tasks/beta/README.md")).replace(
    "<!-- project-entries-local:end -->",
    `<!-- project-entries-local:end -->\n\n<!-- project-entries-descendants:start -->\n## 下层内容\n\n- [Doomed](../alpha/backlog/${created.stem}/INDEX.md)\n<!-- project-entries-descendants:end -->`,
  ));
  const service = new NodeService({ managedRoot: path.join(repo, ".harness/tasks") });
  const task = (await service.get(path.join(repo, created.path)))!;
  await service.destroy(task);
  assert.ok(!(await read(repo, ".harness/tasks/alpha/README.md")).includes(created.stem));
  assert.ok(!fs.readFileSync(beta, "utf8").includes(created.stem));
});

test("project create lists the new README project in the board README with no seed AGENTS", async (t) => {
  const repo = await readmeBoard();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const boardBefore = await read(repo, ".harness/tasks/AGENTS.md");
  const created = await cli(repo, ["project", "create", "gamma", "--title", "Gamma", "--description", "gamma work"]);
  assert.equal(created.path, ".harness/tasks/gamma/README.md");
  await assert.rejects(access(path.join(repo, ".harness/tasks/gamma/AGENTS.md")));
  assert.match(await read(repo, ".harness/tasks/gamma/README.md"), /^# Gamma\n\ngamma work\n[\s\S]*<!-- project-entries-local:start -->/);
  const boardReadme = await read(repo, ".harness/tasks/README.md");
  assert.match(boardReadme, /\[Gamma\]\(<?gamma\/README\.md>?\) — gamma work/);
  assert.match(boardReadme, /^# Tasks\n\nBoard prose\./);
  assert.equal(await read(repo, ".harness/tasks/AGENTS.md"), boardBefore);
  const task = await cli(repo, ["create", "--title", "First", "--project", "gamma"]);
  assert.ok((await read(repo, ".harness/tasks/gamma/README.md")).includes(task.stem));
});

test("domain board: new project and its tasks live in README org lists; legacy AGENTS project links migrate", async (t) => {
  const repo = fs.realpathSync(await mkdtemp(path.join(tmpdir(), "edges-domain-readme-")));
  t.after(() => rm(repo, { recursive: true, force: true }));
  write(repo, "AGENTS.md", scopeAgents("- [Tasks](tasks/AGENTS.md) — board"));
  write(repo, "tasks/AGENTS.md", scopeAgents("- [Old](old/README.md) — old work"));
  write(repo, "tasks/old/README.md", projectReadme("Old", "old work"));
  const args = ["--purpose", "domain"];
  const created = await cli(repo, [...args, "project", "create", "cli", "--title", "CLI", "--description", "cli work"]);
  assert.equal(created.path, "tasks/cli/README.md");
  const board = await read(repo, "tasks/AGENTS.md");
  assert.doesNotMatch(board, /README\.md/);
  const list = await read(repo, "tasks/README.md");
  assert.match(list, /\[CLI\]\(<?cli\/README\.md>?\) — cli work/);
  assert.match(list, /\[Old\]\(<?old\/README\.md>?\) — old work/);
  const projects = await cli(repo, [...args, "project", "list"]);
  assert.deepEqual(projects.projects.map((p: any) => [p.project, p.path]).sort(), [
    ["cli", "tasks/cli/README.md"],
    ["default", "tasks/_default/README.md"],
    ["old", "tasks/old/README.md"],
  ]);
  const task = await cli(repo, [...args, "create", "--title", "Domain task", "--project", "cli"]);
  assert.ok((await read(repo, "tasks/cli/README.md")).includes(task.stem));
  assert.doesNotMatch(await read(repo, "tasks/AGENTS.md"), new RegExp(task.stem));
});
