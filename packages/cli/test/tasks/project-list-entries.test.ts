import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const scopeAgents = (local = "", descendants = "") => `# Scope

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

${descendants}
<!-- edges-descendants:end -->
`;

const projectReadme = (title: string, description: string, extra = "") =>
  `# ${title}\n\n${description}\n\n<!-- project-entries-local:start -->\n## 本层内容\n${extra}<!-- project-entries-local:end -->\n`;

const projectAgents = (title: string, description: string) =>
  `# ${title}\n\n${description}\n\n<!-- edges-local:start -->\n## 本层系统维护信息\n<!-- edges-local:end -->\n`;

const harnessIndex = `# 本层 harness 材料索引

<!-- project-entries-local:start -->
## 本层内容

<!-- project-entries-local:end -->
`;

function write(root: string, rel: string, source: string): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), source);
}

/**
 * Maintenance board under `.edges/tasks` plus a domain board at `tasks/`.
 * The domain board's harness index and a nested README have no description;
 * the old path filter parses both and fails the whole list.
 */
async function boardsWithEntries(): Promise<string> {
  const repo = fs.realpathSync(await mkdtemp(path.join(tmpdir(), "edges-project-list-")));
  write(
    repo,
    "AGENTS.md",
    scopeAgents(
      "- [Tasks](.edges/README.md) — harness",
      "- [领域任务](tasks/AGENTS.md) — domain board",
    ),
  );
  write(
    repo,
    ".edges/README.md",
    "# Harness\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Tasks](tasks/README.md) — maintenance board\n<!-- project-entries-local:end -->\n",
  );
  write(
    repo,
    ".edges/tasks/README.md",
    "# Tasks\n\nBoard.\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Alpha](alpha/README.md) — alpha work\n- [Both](both/README.md) — readme copy\n<!-- project-entries-local:end -->\n",
  );
  write(
    repo,
    ".edges/tasks/AGENTS.md",
    scopeAgents(
      "- [本层 harness 材料索引](.edges/README.md) — index\n- [Tech](tech/AGENTS.md) — tech work",
    ),
  );
  write(repo, ".edges/tasks/.edges/README.md", harnessIndex);
  write(repo, ".edges/tasks/alpha/README.md", projectReadme(
    "Alpha",
    "alpha work",
    "- [Nested](nested/README.md) — not a project\n",
  ));
  write(repo, ".edges/tasks/alpha/nested/README.md", harnessIndex);
  write(repo, ".edges/tasks/tech/AGENTS.md", projectAgents("Tech", "tech work"));
  write(repo, ".edges/tasks/both/README.md", projectReadme("From Readme", "readme copy"));
  write(repo, ".edges/tasks/both/AGENTS.md", projectAgents("From Agents", "agents copy"));
  write(repo, "tasks/AGENTS.md", scopeAgents("- [本层 harness 材料索引](.edges/README.md) — index"));
  write(repo, "tasks/.edges/README.md", harnessIndex);
  write(
    repo,
    "tasks/README.md",
    "# Tasks\n\nDomain.\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Kept](kept/README.md) — domain work\n<!-- project-entries-local:end -->\n",
  );
  write(repo, "tasks/kept/README.md", projectReadme("Kept", "domain work"));
  return repo;
}

async function runList(repo: string, prefix: string[] = []) {
  const { run } = await import("../../src/program.js");
  return run([...prefix, "--scope", repo, "tasks", "project", "list"], { env: {} });
}

function projectsOf(stdout: string): Array<{ project: string; title: string; description: string; path: string }> {
  return JSON.parse(stdout).projects;
}

test("project list skips harness indexes and nested READMEs under a tasks board", async (t) => {
  const repo = await boardsWithEntries();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const result = await runList(repo);
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  const projects = projectsOf(result.stdout);
  const paths = projects.map((project) => project.path);
  assert.equal(paths.some((item) => item.includes("/.edges/")), false, paths.join("\n"));
  assert.equal(paths.some((item) => item.endsWith("alpha/nested/README.md")), false, paths.join("\n"));
  assert.deepEqual(projects.map((project) => project.project).sort(), ["alpha", "both"]);
  const both = projects.find((project) => project.project === "both");
  assert.equal(both?.title, "From Readme");
  assert.equal(both?.description, "readme copy");
  assert.equal(both?.path, ".edges/tasks/both/README.md");
});

async function maintenanceEntries(): Promise<string> {
  const repo = fs.realpathSync(await mkdtemp(path.join(tmpdir(), "edges-project-list-agents-")));
  write(repo, "AGENTS.md", scopeAgents("- [Tasks](.edges/README.md) — harness"));
  write(
    repo,
    ".edges/README.md",
    "# Harness\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Tasks](tasks/README.md) — board\n<!-- project-entries-local:end -->\n",
  );
  write(
    repo,
    ".edges/tasks/README.md",
    "# Tasks\n\nBoard.\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Alpha](alpha/README.md) — alpha work\n- [Both](both/README.md) — readme copy\n<!-- project-entries-local:end -->\n",
  );
  write(repo, ".edges/tasks/AGENTS.md", scopeAgents("- [Tech](tech/AGENTS.md) — tech work"));
  write(repo, ".edges/tasks/alpha/README.md", projectReadme("Alpha", "alpha work"));
  write(repo, ".edges/tasks/tech/AGENTS.md", projectAgents("Tech", "tech work"));
  write(repo, ".edges/tasks/both/README.md", projectReadme("From Readme", "readme copy"));
  write(repo, ".edges/tasks/both/AGENTS.md", projectAgents("From Agents", "agents copy"));
  return repo;
}

test("project list does not treat an AGENTS.md system entry as a Task Project", async (t) => {
  const repo = await maintenanceEntries();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const result = await runList(repo);
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  const projects = projectsOf(result.stdout);
  assert.equal(projects.some((project) => project.project === "tech"), false);
  assert.equal(projects.some((project) => project.path.endsWith("/AGENTS.md")), false);
});

test("project list uses README.md once when AGENTS.md is also present", async (t) => {
  const repo = await maintenanceEntries();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const result = await runList(repo);
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  const both = projectsOf(result.stdout).filter((project) => project.project === "both");
  assert.equal(both.length, 1);
  assert.equal(both[0]?.title, "From Readme");
  assert.equal(both[0]?.description, "readme copy");
  assert.equal(both[0]?.path, ".edges/tasks/both/README.md");
});

test("project list follows --super onto the domain board and --all across boards", async (t) => {
  const repo = await boardsWithEntries();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const domain = await runList(repo, ["--super"]);
  assert.equal(domain.exitCode, 0, domain.stdout + domain.stderr);
  assert.deepEqual(projectsOf(domain.stdout).map((project) => [project.project, project.path]), [
    ["kept", "tasks/kept/README.md"],
  ]);
  const all = await runList(repo, ["--all"]);
  assert.equal(all.exitCode, 0, all.stdout + all.stderr);
  assert.deepEqual(
    projectsOf(all.stdout).map((project) => [project.project, project.path]).sort(),
    [
      ["alpha", ".edges/tasks/alpha/README.md"],
      ["both", ".edges/tasks/both/README.md"],
      ["kept", "tasks/kept/README.md"],
    ],
  );
});

test("project list --all --super does not require a scope AGENTS.md", async (t) => {
  const repo = fs.realpathSync(await mkdtemp(path.join(tmpdir(), "edges-project-list-super-")));
  t.after(() => rm(repo, { recursive: true, force: true }));
  write(
    repo,
    "tasks/README.md",
    "# Tasks\n\nDomain.\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Kept](kept/README.md) — domain work\n<!-- project-entries-local:end -->\n",
  );
  write(repo, "tasks/kept/README.md", projectReadme("Kept", "domain work"));
  const result = await runList(repo, ["--all", "--super"]);
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  assert.deepEqual(projectsOf(result.stdout).map((project) => [project.project, project.path]), [
    ["kept", "tasks/kept/README.md"],
  ]);
  assert.equal(fs.existsSync(path.join(repo, "AGENTS.md")), false);
});

test("project list --all includes a composed tasks board and --exclude compose skips it", async (t) => {
  const repo = fs.realpathSync(await mkdtemp(path.join(tmpdir(), "edges-project-list-composed-")));
  t.after(() => rm(repo, { recursive: true, force: true }));
  write(repo, "AGENTS.md", scopeAgents("- [材料](.edges/README.md) — harness"));
  write(
    repo,
    ".edges/README.md",
    "# 材料\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [组合](compose/README.md) — composed\n<!-- project-entries-local:end -->\n",
  );
  write(
    repo,
    ".edges/compose/README.md",
    "# 组合\n\n<!-- edges-compose:start -->\n## 组合\n\n- [hidden](<../../hidden/tasks/README.md>) — hidden board remote: https://example.com/hidden.git\n<!-- edges-compose:end -->\n",
  );
  write(repo, "hidden/tasks/AGENTS.md", "# Hidden\n\nNot a harness system entry.\n");
  write(
    repo,
    "hidden/tasks/README.md",
    "# Tasks\n\nHidden.\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Foreign](foreign/README.md) — foreign work\n<!-- project-entries-local:end -->\n",
  );
  write(repo, "hidden/tasks/foreign/README.md", projectReadme("Foreign", "foreign work"));
  const plain = await runList(repo, ["--all"]);
  assert.equal(plain.exitCode, 0, plain.stdout + plain.stderr);
  assert.deepEqual(
    projectsOf(plain.stdout).filter((project) => project.project === "foreign").map((project) => project.path),
    ["hidden/tasks/foreign/README.md"],
  );
  const excluded = await runList(repo, ["--all", "--exclude", "compose"]);
  assert.equal(excluded.exitCode, 0, excluded.stdout + excluded.stderr);
  assert.equal(projectsOf(excluded.stdout).some((project) => project.project === "foreign"), false);
  const both = await runList(repo, ["--all", "--super"]);
  assert.equal(both.exitCode, 0, both.stdout + both.stderr);
  assert.equal(projectsOf(both.stdout).some((project) => project.project === "foreign"), true);
  const bothExcluded = await runList(repo, ["--all", "--super", "--exclude", "compose"]);
  assert.equal(bothExcluded.exitCode, 0, bothExcluded.stdout + bothExcluded.stderr);
  assert.equal(projectsOf(bothExcluded.stdout).some((project) => project.project === "foreign"), false);
});

test("project list fails fast and names the file when one project entry is invalid", async (t) => {
  const repo = fs.realpathSync(await mkdtemp(path.join(tmpdir(), "edges-project-list-bad-")));
  t.after(() => rm(repo, { recursive: true, force: true }));
  write(repo, "AGENTS.md", scopeAgents("- [Tasks](.edges/README.md) — harness"));
  write(
    repo,
    ".edges/README.md",
    "# Harness\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Tasks](tasks/README.md) — board\n<!-- project-entries-local:end -->\n",
  );
  write(
    repo,
    ".edges/tasks/README.md",
    "# Tasks\n\nBoard.\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Alpha](alpha/README.md) — alpha work\n- [Bad](bad/README.md) — broken\n<!-- project-entries-local:end -->\n",
  );
  write(repo, ".edges/tasks/alpha/README.md", projectReadme("Alpha", "alpha work"));
  write(repo, ".edges/tasks/bad/README.md", "# Bad\n\n<!-- project-entries-local:start -->\n## 本层内容\n<!-- project-entries-local:end -->\n");
  const { run } = await import("../../src/program.js");
  const result = await run(["--scope", repo, "tasks", "project", "list"], { env: {} });
  assert.notEqual(result.exitCode, 0);
  const body = JSON.parse(result.stdout);
  assert.equal(body.status, "failed");
  assert.equal(body.errorCode, "VALIDATION_ERROR");
  assert.match(body.reason, /invalid Task Project description/);
  assert.match(body.reason, /\.edges\/tasks\/bad\/README\.md/);
  assert.equal(body.projects, undefined);
});
