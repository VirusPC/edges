import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { AgentsNode, TaskNode } from "../../src/domain/models/index.js";
import {
  listTaskNodes,
  listRepositoryTaskNodes,
  taskLocationOf,
} from "../../src/services/tasks/node-query.js";
import { taskBoardLocation } from "../../src/services/tasks/paths.js";
import {
  getTask,
  listTasks,
  createNodeBoardFs,
} from "../../src/services/tasks/board.js";

function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "task-query-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel: string, contents: string) => {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
    return file;
  };
  const index = (
    rel: string,
    children: string[],
    descendants: string[] = [],
  ) => {
    const file = path.join(root, rel);
    write(
      rel,
      new AgentsNode(file)
        .create(
          {
            localChildren: children.map((id) => ({
              id: path.resolve(path.dirname(file), id),
            })),
            descendantChildren: descendants.map((id) => ({
              id: path.resolve(path.dirname(file), id),
            })),
          },
          { operation: "create" },
        )
        .serialize(),
    );
  };
  const task = (rel: string) =>
    write(
      rel,
      new TaskNode(path.join(root, rel))
        .create(
          {
            name: "Same",
            status: "todo",
          },
          { operation: "create" },
        )
        .serialize(),
    );
  return { root, write, index, task };
}
test("missing board is empty, existing unindexed board requests migration", async (t) => {
  const { root, write } = fixture(t);
  const target = taskBoardLocation(root, { super: true });
  assert.deepEqual(await listTaskNodes(target), []);
  write("tasks/todo/old/index.md", "Old");
  const material = (await import("../../src/domain/config/edges-materials.js")).placeHarnessMaterial(root, "tasks", { super: true }).absPath;
  await assert.rejects(listTaskNodes(target), (error: Error) =>
    error.message.includes("Task board material missing") && error.message.includes(material));
});
test("repository includes every harness depth and physical origins despite aliases", async (t) => {
  const { root, index, task, write } = fixture(t);
  const entries = [
    "tasks/todo/same/index.md",
    ".edges/tasks/todo/same/index.md",
    "notes/example/.edges/tasks/todo/same/index.md",
    "cli/.edges/tasks/todo/same/index.md",
    "tasks/todo/same/.edges/tasks/todo/same/index.md",
    "tasks/todo/same/.edges/tasks/todo/same/.edges/tasks/todo/same/index.md",
  ];
  for (const entry of entries) {
    const board = path.dirname(path.dirname(path.dirname(entry)));
    index(`${board}/AGENTS.md`, ["todo/same/index.md"]);
    task(entry);
  }
  index(
    "AGENTS.md",
    ["tasks/AGENTS.md", ".edges/tasks/AGENTS.md"],
    ["notes/example/index.md", "cli/AGENTS.md"],
  );
  index(".edges/AGENTS.md", ["tasks/AGENTS.md"]);
  write("notes/example/index.md", "---\nbad: [\n---\n");
  index("notes/example/AGENTS.md", [".edges/tasks/AGENTS.md"]);
  index("cli/AGENTS.md", [".edges/tasks/AGENTS.md"]);
  index("tasks/todo/same/AGENTS.md", [".edges/tasks/AGENTS.md"]);
  index(
    "tasks/todo/same/.edges/tasks/todo/same/AGENTS.md",
    [".edges/tasks/AGENTS.md"],
  );
  assert.equal(
    (await listTaskNodes(taskBoardLocation(root, { super: true }))).length,
    1,
  );
  const all = await listRepositoryTaskNodes(root);
  assert.equal(all.length, 6);
  assert.equal(new Set(all.map((n) => n.path)).size, 6);
  assert.deepEqual(
    all
      .map((n) => taskLocationOf(n, root).source)
      .sort(
        (a, b) =>
          a.scope.localeCompare(b.scope) || a.purpose.localeCompare(b.purpose),
      ),
    [
      { scope: ".", purpose: "domain" },
      { scope: ".", purpose: "maintenance" },
      { scope: "cli", purpose: "maintenance" },
      { scope: "notes/example", purpose: "maintenance" },
      { scope: "tasks/todo/same", purpose: "maintenance" },
      {
        scope: "tasks/todo/same/.edges/tasks/todo/same",
        purpose: "maintenance",
      },
    ],
  );
});

test("explicit get rejects status metadata mismatch just like indexed lists", async (t) => {
  const { root, index, task, write } = fixture(t);
  index("tasks/AGENTS.md", ["todo/same/index.md"]);
  task("tasks/todo/same/index.md");
  const file = path.join(root, "tasks/todo/same/index.md");
  write(
    "tasks/todo/same/index.md",
    fs
      .readFileSync(file, "utf8")
      .replace("edges-tasks-status: todo", "edges-tasks-status: done"),
  );
  const target = taskBoardLocation(root, { super: true }),
    io = createNodeBoardFs(target);
  await assert.rejects(listTasks(target, {}, io), /dual-write mismatch/);
  await assert.rejects(
    getTask(target, "tasks/todo/same/index.md", io),
    /dual-write mismatch/,
  );
});

test("selected board rejects a registered reference into another board", async (t) => {
  const { root, index, task } = fixture(t);
  index("tasks/AGENTS.md", ["../.edges/tasks/todo/same/index.md"]);
  task(".edges/tasks/todo/same/index.md");
  await assert.rejects(
    listTaskNodes(taskBoardLocation(root, { super: true })),
    /outside selected task board/,
  );
});

test('board query grouping keeps chaining lazy and repeatable after operations migration', async t => {
  const {root, index, task} = fixture(t);
  index('tasks/AGENTS.md', ['todo/same/index.md']);
  task('tasks/todo/same/index.md');
  const { taskBoardQuery } = await import('../../src/services/tasks/node-query.js');
  const source = await taskBoardQuery(taskBoardLocation(root, { super: true }));
  let calls = 0;
  const chain = source.filter((node): node is TaskNode => node instanceof TaskNode)
    .map(node => {calls++; return node;})
    .groupBy(node => node.type)
    .filter(nodes => nodes.length > 0)
    .map(nodes => nodes.map(node => node.id));
  assert.equal(calls, 0);
  const expected = [[path.join(root, 'tasks/todo/same/index.md')]];
  assert.deepEqual(await chain.value(), expected);
  assert.deepEqual(await chain.value(), expected);
  assert.equal(calls, 2);
});
