import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

test("run tasks list returns JSON tasks from EDGES_REPO", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/_default/backlog");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-13--listed.md"),
      `---
name: listed
description: listed
metadata:
  edges-type: task
  edges-title: listed
  edges-tasks-status: backlog
---

x
`,
      "utf8",
    );
    const result = await run(["tasks", "list"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as {
      status: string;
      command: string;
      tasks: { stem: string; priority?: string }[];
    };
    assert.equal(body.status, "success");
    assert.equal(body.command, "list");
    assert.equal(body.tasks[0]?.stem, "2026-09-13--listed");
    assert.equal(body.tasks[0]?.priority, "none");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks get returns the task body", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/_default/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-13--got.md"),
      `---
name: got
description: got
metadata:
  edges-type: task
  edges-title: got
  edges-tasks-status: todo
---

hello body
`,
      "utf8",
    );
    const result = await run(["tasks", "get", "2026-09-13--got"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as {
      command: string;
      task: { body: string; stem: string; priority?: string };
    };
    assert.equal(body.command, "get");
    assert.equal(body.task.stem, "2026-09-13--got");
    assert.match(body.task.body, /hello body/);
    assert.equal(body.task.priority, "none");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks get missing exits 1 with TASK_NOT_FOUND", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    const result = await run(["tasks", "get", "missing"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 1);
    const body = JSON.parse(result.stdout) as { errorCode: string };
    assert.equal(body.errorCode, "TASK_NOT_FOUND");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create is JSON and skips git", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    const result = await run(["tasks", "create", "--title", "From CLI"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { command: string; path: string; stem: string };
    assert.equal(body.command, "create");
    assert.match(body.path, /knowledge\/tasks\/_default\/backlog\//);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create --priority high returns JSON priority and writes the field", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    const env = { ...process.env, EDGES_REPO: repo };
    const created = await run(["tasks", "create", "--title", "Pri", "--priority", "high"], { env });
    assert.equal(created.exitCode, 0);
    const body = JSON.parse(created.stdout) as { command: string; priority: string; project: string; path: string };
    assert.equal(body.command, "create");
    assert.equal(body.priority, "high");
    assert.equal(body.project, "default");
    assert.match(body.path, /knowledge\/tasks\/_default\/backlog\//);
    const md = await readFile(path.join(repo, body.path), "utf8");
    assert.match(md, /edges-task-priority: high/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create --project cli returns JSON project and writes the field", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    const created = await run(["tasks", "create", "--title", "Pri", "--project", "cli"], { env });
    assert.equal(created.exitCode, 0);
    const body = JSON.parse(created.stdout) as { command: string; project: string; path: string };
    assert.equal(body.command, "create");
    assert.equal(body.project, "cli");
    const md = await readFile(path.join(repo, body.path), "utf8");
    assert.match(md, /edges-task-project: cli/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create --project _default is VALIDATION_ERROR and writes nothing", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const result = await run(["tasks", "create", "--title", "Pri", "--project", "_default"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create without --project JSON project is default", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const result = await run(["tasks", "create", "--title", "None"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 0);
    assert.equal(JSON.parse(result.stdout).project, "default");
    assert.match(JSON.parse(result.stdout).path, /knowledge\/tasks\/_default\/backlog\//);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create --priority P0 is VALIDATION_ERROR and writes nothing", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    const result = await run(["tasks", "create", "--title", "Pri", "--priority", "P0"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
    const names = await readdir(path.join(repo, "knowledge/tasks/_default/backlog"));
    assert.deepEqual(names, []);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create without --priority JSON priority is none", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    const result = await run(["tasks", "create", "--title", "From CLI"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 0);
    assert.equal(JSON.parse(result.stdout).priority, "none");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks update without flags is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "update", "stem"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks update --priority high JSON and in-place path", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    const created = await run(["tasks", "create", "--title", "PatchPri"], { env });
    const stem = JSON.parse(created.stdout).stem as string;
    const updated = await run(["tasks", "update", stem, "--priority", "high"], { env });
    assert.equal(updated.exitCode, 0);
    const body = JSON.parse(updated.stdout) as { command: string; priority: string; path: string };
    assert.equal(body.command, "update");
    assert.equal(body.priority, "high");
    assert.match(body.path, /knowledge\/tasks\/_default\/backlog\//);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks update --priority Urgent is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "update", "stem", "--priority", "Urgent"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks status returns command status", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/_default/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-13--mv.md"),
      `---
name: mv
description: mv
metadata:
  edges-type: task
  edges-title: mv
  edges-tasks-status: todo
---

body
`,
      "utf8",
    );
    const result = await run(["tasks", "status", "2026-09-13--mv", "done"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { command: string };
    assert.equal(body.command, "status");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks runs --output json lists derived run-id", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const stem = "2026-09-13--with-run";
  try {
    const dir = path.join(repo, "knowledge/tasks/_default/done");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${stem}.md`),
      `---
name: with_run
description: with run
metadata:
  edges-type: task
  edges-title: with run
  edges-tasks-status: done
---

body
`,
      "utf8",
    );
    await writeFile(
      path.join(dir, `.${stem}.log.md`),
      `# Run log: ${stem}

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | Agent | 2026-09-13T01:00:00Z | 2026-09-13T02:00:00Z | completed |  |
`,
      "utf8",
    );
    const json = await run(["tasks", "runs", stem, "--output", "json"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(json.exitCode, 0);
    const body = JSON.parse(json.stdout) as { command: string; runs: { runId: string }[] };
    assert.equal(body.command, "runs");
    assert.equal(body.runs[0]?.runId, `${stem}--1`);

    const table = await run(["tasks", "runs", stem], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(table.exitCode, 0);
    assert.match(table.stdout, /run-id/);
    assert.match(table.stdout, new RegExp(`${stem}--1`));
    assert.doesNotMatch(table.stdout, /"command":"runs"/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks runs missing task is TASK_NOT_FOUND", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    const result = await run(["tasks", "runs", "nope"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 1);
    assert.equal(JSON.parse(result.stdout).errorCode, "TASK_NOT_FOUND");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks run-messages returns notes for a stable run-id", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const stem = "2026-09-13--msg";
  try {
    const dir = path.join(repo, "knowledge/tasks/_default/in_progress");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${stem}.md`),
      `---
name: msg
description: msg
metadata:
  edges-type: task
  edges-title: msg
  edges-tasks-status: in_progress
---

body
`,
      "utf8",
    );
    await writeFile(
      path.join(dir, `.${stem}.log.md`),
      `# Run log: ${stem}

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | Agent | 2026-09-13T01:00:00Z |  | running |  |

## Notes

- 2026-09-13T01:05:00Z hello from the run
`,
      "utf8",
    );
    const full = await run(["tasks", "run-messages", `${stem}--1`, "--output", "json"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(full.exitCode, 0);
    const body = JSON.parse(full.stdout) as {
      command: string;
      run: { runId: string };
      messages: { text: string }[];
    };
    assert.equal(body.command, "run-messages");
    assert.equal(body.run.runId, `${stem}--1`);
    assert.match(body.messages[0]?.text ?? "", /hello from the run/);

    const short = await run(["tasks", "run-messages", "1", "--task", stem, "--output", "json"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(short.exitCode, 0);
    assert.equal(JSON.parse(short.stdout).run.runId, `${stem}--1`);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks run-messages 1 without --task is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "run-messages", "1"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks run-messages unknown id is RUN_NOT_FOUND", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const stem = "2026-09-13--msg";
  try {
    const dir = path.join(repo, "knowledge/tasks/_default/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${stem}.md`),
      `---
name: msg
description: msg
metadata:
  edges-type: task
  edges-title: msg
  edges-tasks-status: todo
---

body
`,
      "utf8",
    );
    await writeFile(path.join(dir, `.${stem}.log.md`), `# Run log: ${stem}\n\n## Notes\n`, "utf8");
    const result = await run(["tasks", "run-messages", `${stem}--9`, "--output", "json"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 1);
    assert.equal(JSON.parse(result.stdout).errorCode, "RUN_NOT_FOUND");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

async function seedPriorities() {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const docs: Array<{ status: "backlog" | "todo"; stem: string; priorityLine: string }> = [
    { status: "backlog", stem: "2026-09-16--none-one", priorityLine: "" },
    { status: "backlog", stem: "2026-09-16--high-one", priorityLine: "  edges-task-priority: high\n" },
    { status: "todo", stem: "2026-09-16--urgent-one", priorityLine: "  edges-task-priority: urgent\n" },
    { status: "todo", stem: "2026-09-16--high-two", priorityLine: "  edges-task-priority: high\n" },
    { status: "todo", stem: "2026-09-16--low-one", priorityLine: "  edges-task-priority: low\n" },
  ];
  for (const doc of docs) {
    const dir = path.join(repo, "knowledge/tasks/_default", doc.status);
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${doc.stem}.md`),
      `---
name: ${doc.stem}
description: ${doc.stem}
metadata:
  edges-type: task
  edges-title: ${doc.stem}
  edges-tasks-status: ${doc.status}
${doc.priorityLine}---

body
`,
      "utf8",
    );
  }
  return repo;
}

test("run tasks list --priority urgent --priority high --sort priority", async () => {
  const repo = await seedPriorities();
  try {
    const result = await run(
      ["tasks", "list", "--priority", "urgent", "--priority", "high", "--sort", "priority"],
      { env: { ...process.env, EDGES_REPO: repo } },
    );
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { tasks: Array<{ stem: string; priority: string }> };
    assert.deepEqual(
      body.tasks.map((task) => task.priority),
      ["urgent", "high", "high"],
    );
    assert.equal(body.tasks[0]?.stem, "2026-09-16--urgent-one");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks list --sort status is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "list", "--sort", "status"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks list --priority P0 is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "list", "--priority", "P0"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks status rejects --priority and does not move", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/_default/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-16--stay.md"),
      `---
name: stay
description: stay
metadata:
  edges-type: task
  edges-title: stay
  edges-tasks-status: todo
  edges-task-priority: high
---

body
`,
      "utf8",
    );
    const result = await run(["tasks", "status", "2026-09-16--stay", "--priority", "low"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 2);
    assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
    const md = await readFile(path.join(dir, "2026-09-16--stay.md"), "utf8");
    assert.match(md, /edges-tasks-status: todo/);
    assert.match(md, /edges-task-priority: high/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
