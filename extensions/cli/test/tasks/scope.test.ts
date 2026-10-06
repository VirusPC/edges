import { mkdir as fixtureMkdir } from "node:fs/promises";
import { dirname as fixtureDirname } from "node:path";
async function writeFile(...args: Parameters<typeof fixtureRawWriteFile>) {
  await fixtureMkdir(fixtureDirname(String(args[0])), { recursive: true });
  return fixtureRawWriteFile(...args);
}
import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile as fixtureRawWriteFile,
  readFile,
  rm,
  access,
  realpath,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";
import { loadConfig } from "../../src/services/config.js";

const marker =
  "<!-- project-memory:start -->\n<!-- project-memory-local:start -->\n<!-- project-memory-local:end -->\n<!-- project-memory:end -->";
async function fixture() {
  const root = await realpath(
    await mkdtemp(path.join(tmpdir(), "edges-scope-")),
  );
  execFileSync("git", ["init", "-q", root]);
  const child = path.join(root, "projects/demo");
  await mkdir(child, { recursive: true });
  await writeFile(path.join(root, "AGENTS.md"), marker);
  await writeFile(path.join(child, "AGENTS.md"), marker);
  return { root, child };
}
test("explicit nested scope separates both boards and co-moves Task/Run without path escape", async () => {
  const { root, child } = await fixture();
  try {
    const env = { EDGES_REPO: root, EDGES_SCOPE: root };
    const call = (purpose: string, args: string[]) =>
      run(["--scope", child, "tasks", "--index-group", "local", "--purpose", purpose, ...args], { env });
    let domainPath = "";
    for (const purpose of ["domain", "maintenance"]) {
      const result = await call(purpose, [
        "create",
        "--title",
        "Same",
        "--status",
        "todo",
      ]);
      assert.equal(result.exitCode, 0, result.stdout);
      const record = JSON.parse(result.stdout);
      const task = record.task ?? record;
      const runLog = `# Run log: ${task.stem}\n\n| # | agent | status |\n| --- | --- | --- |\n| 1 | Codex | completed |\n\n## Notes\n- completed fixture\n`;
      await writeFile(path.join(child, task.sidecarPath), runLog);
      const listed = JSON.parse((await call(purpose, ["list"])).stdout);
      assert.ok(JSON.stringify(listed).includes("Same"));
      const moved = await call(purpose, ["status", task.stem, "done"]);
      assert.equal(moved.exitCode, 0, moved.stdout);
      const board = purpose === "domain" ? "tasks" : ".harness/tasks";
      assert.equal(
        await readFile(
          path.join(
            child,
            board,
            "_default/done",
            `${task.stem}/.${task.stem}.log.md`,
          ),
          "utf8",
        ),
        runLog,
      );
      const classified = await call(purpose, [
        "update",
        task.stem,
        "--project",
        "cli",
      ]);
      assert.equal(classified.exitCode, 0, classified.stdout);
      assert.equal(
        await readFile(
          path.join(
            child,
            board,
            "cli/done",
            `${task.stem}/.${task.stem}.log.md`,
          ),
          "utf8",
        ),
        runLog,
      );
      const runs = await call(purpose, ["runs", task.stem, "--output", "json"]);
      assert.equal(runs.exitCode, 0, runs.stdout);
      assert.ok(runs.stdout.includes(`${task.stem}--1`));
      if (purpose === "domain")
        domainPath = path.join(child, JSON.parse(classified.stdout).path);
    }
    assert.notEqual(
      (await call("maintenance", ["get", domainPath])).exitCode,
      0,
    );
    await assert.rejects(access(path.join(root, ".harness/tasks")));
    await assert.rejects(access(path.join(child, "knowledge/tasks")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("scope discovery selects the nearest type or business AGENTS independently of CLI installation", async () => {
  const { root, child } = await fixture();
  const cwd = process.cwd();
  try {
    const nested = path.join(child, ".harness/memory/project");
    await mkdir(nested, { recursive: true });
    await writeFile(
      path.join(nested, "AGENTS.md"),
      "<!-- project-memory-entries:start -->",
    );
    process.chdir(nested);
    assert.equal(loadConfig({}).scopeDir, nested);
    assert.equal(loadConfig({}).repoPath, root);
    assert.equal(
      loadConfig({ EDGES_SCOPE: child, EDGES_REPO: root }).scopeDir,
      child,
    );
    assert.equal(loadConfig({ EDGES_REPO: root }).scopeDir, root);
    assert.equal(
      loadConfig({ EDGES_SCOPE: "../.." }).scopeDir,
      path.join(child, ".harness"),
    );
  } finally {
    process.chdir(cwd);
    await rm(root, { recursive: true, force: true });
  }
});
test("project reads do not initialize absent board and manual AGENTS content survives index insertion", async () => {
  const { root, child } = await fixture();
  try {
    const result = await run(
      [
        "--scope",
        child,
        "tasks", "--index-group", "local",
        "--purpose",
        "maintenance",
        "project",
        "list",
      ],
      { env: {} },
    );
    assert.equal(result.exitCode, 0, result.stdout);
    await assert.rejects(access(path.join(child, ".harness/tasks")));
    assert.match(
      "# Manual\n\nKeep rules.\n",
      /# Manual\n\nKeep rules\./,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("discovery crosses maintenance containers but stops at symlinks and nested Git roots", async () => {
  const { root, child } = await fixture();
  try {
    const { discoverScopes } = await import("../../src/services/scope.js");
    const { symlink } = await import("node:fs/promises");
    const evaluation = path.join(root, ".harness/evaluation");
    const method = path.join(root, ".harness/skills/managed/method");
    const nestedRepo = path.join(root, "vendor");
    for (const dir of [evaluation, method, nestedRepo]) {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "AGENTS.md"), marker);
    }
    execFileSync("git", ["init", "-q", nestedRepo]);
    await symlink(child, path.join(root, "linked"));
    await mkdir(path.join(root, "important-only"));
    await writeFile(
      path.join(root, "important-only/AGENTS.md"),
      "<!-- project-memory:start -->\n<!-- project-memory-important:start -->",
    );
    assert.deepEqual(
      discoverScopes(root).sort(),
      [
        root,
        child,
        evaluation,
        method,
        path.join(root, "important-only"),
      ].sort(),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("selected board rejects symlink escape on writes", async () => {
  const { root, child } = await fixture();
  try {
    const { symlink } = await import("node:fs/promises");
    await mkdir(path.join(root, "outside"));
    await symlink(path.join(root, "outside"), path.join(child, "tasks"));
    const result = await run(
      ["--scope", child, "tasks", "--index-group", "local", "--purpose", "domain", "create", "--title", "Escape"],
      { env: {} },
    );
    assert.equal(result.exitCode, 2, result.stdout);
    await assert.rejects(access(path.join(root, "outside/_default")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("render-only review-page works outside a repository and explicit fresh scopes need no memory initialization", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-render-only-"));
  const cwd = process.cwd();
  try {
    process.chdir(dir);
    const rendered = await run(
      [
        "tasks", "--index-group", "local",
        "project",
        "review-page",
        "--from",
        "-",
        "--out",
        path.join(dir, "review.html"),
      ],
      {
        env: {},
        stdinText: JSON.stringify({
          groups: [{ id: "default", title: "Default" }],
          items: [],
        }),
      },
    );
    assert.equal(rendered.exitCode, 0, rendered.stdout);
    const invalid = await run(["tasks", "--index-group", "local", "create", "--title", "No owner"], {
      env: {},
    });
    assert.equal(invalid.exitCode, 2);
    assert.match(invalid.stdout, /--scope/);
    const created = await run(
      ["--scope", dir, "tasks", "--index-group", "local", "create", "--title", "Explicit"],
      { env: {} },
    );
    assert.equal(created.exitCode, 0, created.stdout);
    await assert.rejects(access(path.join(dir, "AGENTS.md")));
  } finally {
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});

test("project list rejects unindexed project directories without creating metadata", async () => {
  const { root, child } = await fixture();
  try {
    await mkdir(path.join(child, "tasks/cli/todo"), { recursive: true });
    const result = await run(["--scope", child, "tasks", "--index-group", "local", "--purpose", "domain", "project", "list"], {
      env: {},
    });
    assert.equal(result.exitCode, 2, result.stdout);
    assert.match(JSON.parse(result.stdout).reason, /index missing.*migrate/i);
    await assert.rejects(access(path.join(child, "tasks/cli/AGENTS.md")));
    await assert.rejects(access(path.join(child, "tasks/_default")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
