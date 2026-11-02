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
  await mkdir(path.join(root, ".edges/tasks"), { recursive: true });
  await writeFile(path.join(root, "AGENTS.md"), "# Scope\n");
  return { root, board: path.join(root, ".edges/tasks") };
}

const call = (root: string, args: string[]) =>
  run(["--scope", root, "tasks", ...args], {
    env: { EDGES_REPO: root, EDGES_SCOPE: root },
  });

test("damaged parent index prevents task creation without leaving an orphan", async () => {
  const { root, board } = await fixture();
  try {
    const first = await call(root, ["create", "--title", "First task"]);
    assert.equal(first.exitCode, 0, first.stdout);
    const projectEntry = path.join(board, "README.md");
    const contents = await readFile(projectEntry, "utf8");
    await writeFile(projectEntry, contents.replace("<!-- edges-entries-local:end -->", ""));
    const next = await call(root, ["create", "--title", "Orphan task"]);
    assert.notEqual(next.exitCode, 0);
    const { readdir } = await import("node:fs/promises");
    const directories = await readdir(path.join(board, "backlog"));
    assert.equal(directories.filter((name) => name.includes("Orphan")).length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
