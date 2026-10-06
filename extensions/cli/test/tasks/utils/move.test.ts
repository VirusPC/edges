import { writeIndexedTaskFixture as writeFile } from "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  access,
  mkdir,
  readFile,
  rm,
} from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { moveTaskStatus } from "../../../src/services/tasks/move.js";
import { nodeBoardWriter } from "./helpers.js";

test("moveTaskStatus updates frontmatter and moves Task + sidecar", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "tasks/_default/todo");
    await mkdir(fromDir, { recursive: true });
    await mkdir(path.join(repo, "tasks/_default/in_progress"), {
      recursive: true,
    });
    await writeFile(
      path.join(fromDir, "2026-09-13--mv/index.md"),
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
    await writeFile(
      path.join(fromDir, "2026-09-13--mv/.2026-09-13--mv.log.md"),
      "# Run log: 2026-09-13--mv\n",
      "utf8",
    );
    const result = await moveTaskStatus(repo, "2026-09-13--mv", "in_progress", {
      fs: nodeBoardWriter(),
      now: new Date("2026-09-13T12:00:00Z"),
    });
    assert.equal(result.from, "todo");
    assert.equal(result.to, "in_progress");
    const md = await readFile(path.join(repo, result.path), "utf8");
    assert.match(md, /edges-tasks-status: in_progress/);
    await access(
      path.join(
        repo,
        "tasks/_default/in_progress/2026-09-13--mv/.2026-09-13--mv.log.md",
      ),
    );
    await assert.rejects(access(path.join(fromDir, "2026-09-13--mv/index.md")));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("status cancelled keeps both files under cancelled/", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "tasks/_default/backlog");
    await mkdir(fromDir, { recursive: true });
    await mkdir(path.join(repo, "tasks/_default/cancelled"), {
      recursive: true,
    });
    await writeFile(
      path.join(fromDir, "2026-09-13--stop/index.md"),
      `---
name: stop
description: stop
metadata:
  edges-type: task
  edges-title: stop
  edges-tasks-status: backlog
---

body
`,
      "utf8",
    );
    await writeFile(
      path.join(fromDir, "2026-09-13--stop/.2026-09-13--stop.log.md"),
      "# Run log: 2026-09-13--stop\n",
      "utf8",
    );
    await moveTaskStatus(repo, "2026-09-13--stop", "cancelled", {
      fs: nodeBoardWriter(),
      now: new Date("2026-09-13T12:00:00Z"),
    });
    await access(
      path.join(repo, "tasks/_default/cancelled/2026-09-13--stop/index.md"),
    );
    await access(
      path.join(
        repo,
        "tasks/_default/cancelled/2026-09-13--stop/.2026-09-13--stop.log.md",
      ),
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("moveTaskStatus stays inside a named project and preserves edges-task-project", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "tasks/cli/todo");
    await mkdir(fromDir, { recursive: true });
    await writeFile(
      path.join(fromDir, "2026-09-16--keep/index.md"),
      `---
name: keep
description: keep
metadata:
  edges-type: task
  edges-title: keep
  edges-tasks-status: todo
  edges-task-project: cli
  edges-task-priority: urgent
---

body
`,
      "utf8",
    );
    await writeFile(
      path.join(fromDir, "2026-09-16--keep/.2026-09-16--keep.log.md"),
      "# Run log: 2026-09-16--keep\n",
      "utf8",
    );
    const result = await moveTaskStatus(
      repo,
      "2026-09-16--keep",
      "in_progress",
      {
        fs: nodeBoardWriter(),
        now: new Date("2026-09-16T12:00:00Z"),
      },
    );
    assert.equal(result.to, "in_progress");
    assert.equal(
      result.path,
      "tasks/cli/in_progress/2026-09-16--keep/index.md",
    );
    const md = await readFile(path.join(repo, result.path), "utf8");
    assert.match(md, /edges-tasks-status: in_progress/);
    assert.match(md, /edges-task-project: cli/);
    assert.match(md, /edges-task-priority: urgent/);
    await access(
      path.join(
        repo,
        "tasks/cli/in_progress/2026-09-16--keep/.2026-09-16--keep.log.md",
      ),
    );
    await assert.rejects(
      access(path.join(fromDir, "2026-09-16--keep/index.md")),
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("moveTaskStatus preserves edges-task-priority and still moves folders", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "tasks/_default/todo");
    await mkdir(fromDir, { recursive: true });
    await mkdir(path.join(repo, "tasks/_default/in_progress"), {
      recursive: true,
    });
    await writeFile(
      path.join(fromDir, "2026-09-16--keep/index.md"),
      `---
name: keep
description: keep
metadata:
  edges-type: task
  edges-title: keep
  edges-tasks-status: todo
  edges-task-priority: urgent
---

body
`,
      "utf8",
    );
    await writeFile(
      path.join(fromDir, "2026-09-16--keep/.2026-09-16--keep.log.md"),
      "# Run log: 2026-09-16--keep\n",
      "utf8",
    );
    const result = await moveTaskStatus(
      repo,
      "2026-09-16--keep",
      "in_progress",
      {
        fs: nodeBoardWriter(),
        now: new Date("2026-09-16T12:00:00Z"),
      },
    );
    assert.equal(result.to, "in_progress");
    const md = await readFile(path.join(repo, result.path), "utf8");
    assert.match(md, /edges-tasks-status: in_progress/);
    assert.match(md, /edges-task-priority: urgent/);
    await access(
      path.join(
        repo,
        "tasks/_default/in_progress/2026-09-16--keep/.2026-09-16--keep.log.md",
      ),
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
