import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";
import { NodeService } from "../../src/services/node/node-service.js";
import { ReadmeNode } from "../../src/domain/models/readme/readme-node.js";
import { TaskNode } from "../../src/domain/models/tasks/task-node.js";

async function fixture() {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "edges-task-index-")));
  await mkdir(path.join(root, ".harness/tasks"), { recursive: true });
  await writeFile(path.join(root, "AGENTS.md"), "# Scope\n");
  return { root, board: path.join(root, ".harness/tasks") };
}

const call = (root: string, args: string[]) =>
  run(["--scope", root, "tasks", ...args], {
    env: { EDGES_REPO: root, EDGES_SCOPE: root },
  });

test("created projects and tasks are recursively discoverable, then moves replace old references", async () => {
  const { root, board } = await fixture();
  try {
    const project = await call(root, ["project", "create", "cli", "--title", "CLI", "--description", "CLI work"]);
    assert.equal(project.exitCode, 0, project.stdout);
    const created = await call(root, ["create", "--title", "Indexed task", "--project", "cli"]);
    assert.equal(created.exitCode, 0, created.stdout);
    const stem = JSON.parse(created.stdout).stem as string;
    const service = new NodeService({ managedRoot: board });
    // Content-face tasks/projects are discovered via SuperAgentsNode, not real AGENTS.
    let nodes = await service.list(board, { super: true });
    assert.equal(nodes.filter((node) => node instanceof TaskNode).length, 1);
    assert.ok(nodes.some((node) => node.path === path.join(board, "cli/README.md")));
    const projectNode = await service.get(path.join(board, "cli/README.md"), ReadmeNode);
    assert.ok(projectNode?.children.some((child) => child.id === path.join(board, `cli/backlog/${stem}/INDEX.md`)));
    const { access } = await import("node:fs/promises");
    await assert.rejects(access(path.join(board, "cli/backlog/AGENTS.md")));

    const moved = await call(root, ["status", stem, "done"]);
    assert.equal(moved.exitCode, 0, moved.stdout);
    nodes = await new NodeService({ managedRoot: board }).list(board, { super: true });
    assert.equal(nodes.filter((node) => node instanceof TaskNode).length, 1);
    assert.ok(nodes.some((node) => node.path === path.join(board, `cli/done/${stem}/INDEX.md`)));
    const old = await new NodeService({ managedRoot: board }).get(path.join(board, "cli/README.md"), ReadmeNode);
    assert.ok(old);
    assert.equal(old.children.some((child) => child.id === path.join(board, `cli/backlog/${stem}/INDEX.md`)), false);

    const regrouped = await call(root, ["update", stem, "--project", "default"]);
    assert.equal(regrouped.exitCode, 0, regrouped.stdout);
    nodes = await new NodeService({ managedRoot: board }).list(board, { super: true });
    assert.equal(nodes.filter((node) => node instanceof TaskNode).length, 1);
    assert.ok(nodes.some((node) => node.path === path.join(board, `_default/done/${stem}/INDEX.md`)));
    const destinationProject = await new NodeService({ managedRoot: board }).get(path.join(board, "_default/README.md"), ReadmeNode);
    assert.ok(destinationProject?.children.some((child) => child.id === path.join(board, `_default/done/${stem}/INDEX.md`)));
    await assert.rejects(access(path.join(board, "_default/done/AGENTS.md")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("invalid project update leaves child index and authored project prose intact", async () => {
  const { root, board } = await fixture();
  try {
    assert.equal((await call(root, ["project", "create", "cli", "--title", "CLI", "--description", "CLI work"])).exitCode, 0);
    assert.equal((await call(root, ["create", "--title", "Keep indexed", "--project", "cli"])).exitCode, 0);
    const file = path.join(board, "cli/README.md");
    const authored = (await readFile(file, "utf8"))
      .replace("CLI work\n", "CLI work\n\nKeep authored prose.\n")
      + "\n## Pointers\n\nKeep this.\n";
    await writeFile(file, authored);
    const before = await readFile(file, "utf8");
    assert.notEqual((await call(root, ["project", "update", "cli", "--title", " "])).exitCode, 0);
    assert.equal(await readFile(file, "utf8"), before);
    const updated = await call(root, ["project", "update", "cli", "--title", "CLI Tools"]);
    assert.equal(updated.exitCode, 0, updated.stdout);
    const after = await readFile(file, "utf8");
    assert.match(after, /^# CLI Tools\n/);
    assert.match(after, /Keep authored prose\./);
    assert.match(after, /Keep this\./);
    const indexed = await new NodeService({ managedRoot: board }).get(file, ReadmeNode);
    assert.equal(indexed?.children.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("damaged parent index prevents task creation without leaving an orphan", async () => {
  const { root, board } = await fixture();
  try {
    const first = await call(root, ["create", "--title", "First task"]);
    assert.equal(first.exitCode, 0, first.stdout);
    const projectEntry = path.join(board, "_default/README.md");
    const contents = await readFile(projectEntry, "utf8");
    await writeFile(projectEntry, contents.replace("<!-- project-entries-local:end -->", ""));
    const next = await call(root, ["create", "--title", "Orphan task"]);
    assert.notEqual(next.exitCode, 0);
    const { readdir } = await import("node:fs/promises");
    const directories = await readdir(path.join(board, "_default/backlog"));
    assert.equal(directories.filter((name) => name.includes("Orphan")).length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("creating in a new named project registers its full discovery chain", async () => {
  const { root, board } = await fixture();
  try {
    const created = await call(root, ["create", "--title", "Direct project task", "--project", "cli"]);
    assert.equal(created.exitCode, 0, created.stdout);
    const nodes = await new NodeService({ managedRoot: board }).list(board, { super: true });
    assert.equal(nodes.filter((node) => node instanceof TaskNode).length, 1);
    assert.ok(nodes.some((node) => node.path === path.join(board, "cli/README.md")));
    const projectNode = await new NodeService({ managedRoot: board }).get(path.join(board, "cli/README.md"), ReadmeNode);
    assert.equal(projectNode?.children.length, 1);
    const { access } = await import("node:fs/promises");
    await assert.rejects(access(path.join(board, "cli/backlog/AGENTS.md")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
