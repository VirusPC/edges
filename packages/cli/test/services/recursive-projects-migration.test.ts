import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { planRecursiveProjects, applyRecursiveProjects } from "../../../../scripts/migrations/recursive-projects.mts";
import { run } from "../../src/program.js";
import { NodeService } from "../../src/services/node/node-service.js";
import { ProjectNode } from "../../src/domain/models/index.js";

const entries = (rows: string[]) => `<!-- edges-entries-local:start -->\n## 本层内容\n\n${rows.join("\n")}\n<!-- edges-entries-local:end -->\n`;
function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "recursive-migration-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = (name: string) => path.join(root, name);
  const write = (name: string, source: string | Buffer) => {
    fs.mkdirSync(path.dirname(file(name)), { recursive: true });
    fs.writeFileSync(file(name), source);
  };
  write("AGENTS.md", "<!-- edges-local:start -->\n- [Materials](.edges/README.md)\n<!-- edges-local:end -->\n");
  write(".edges/README.md", "# Materials\n\n" + entries(["- [Tasks](tasks/README.md)", "- [Projects](projects/README.md)"]));
  write(".edges/projects/README.md", "# Projects\n\n" + entries(["- [Existing](existing/INDEX.md)"]));
  write(".edges/projects/existing/INDEX.md", "# Existing\n\n[Task](../../tasks/topic/done/2026-09-01--early/INDEX.md#result)\n");
  write(".edges/tasks/README.md", "# Tasks\n\n" + entries(["- [Topic](topic/README.md)", "- [Default](_default/README.md)"]));
  write(".edges/tasks/topic/README.md", "---\nname: Topic\ndescription: Preserve description\n---\n# Topic title\n\nKeep authored prose.\n\n## 本层硬约束\n- Keep this instruction.\n\n" + entries(["- [Early](done/2026-09-01--early/INDEX.md)", "- [Later](todo/2026-10-02--later/INDEX.md)"]));
  write(".edges/tasks/_default/README.md", "# Default\n\nDefault prose retained in saved plan.\n\n" + entries(["- [Free](backlog/2026-10-01--free/INDEX.md)"]));
  for (const [group, status, stem] of [["topic", "done", "2026-09-01--early"], ["topic", "todo", "2026-10-02--later"], ["_default", "backlog", "2026-10-01--free"]]) {
    const dir = `.edges/tasks/${group}/${status}/${stem}`;
    write(`${dir}/INDEX.md`, `---\nname: ${stem}\nmetadata:\n  edges-task-project: ${group}\n  edges-tasks-status: ${status}\n  edges-task-priority: high\n---\n# Task\n\n[Group](../../README.md)\n` + (status === "done" ? "\n![Proof](../img/proof.png)\n" : ""));
    write(`${dir}/.${stem}.log.md`, `Historical snapshot: ../../tasks/${group}/${status}/${stem}/INDEX.md\n\u0000 bytes stay fixed\n`);
  }
  write(".edges/tasks/topic/done/img/proof.png", Buffer.from([0, 13, 10, 255, 42]));
  write(".edges/tasks/topic/unregistered-resource.txt", "User resource\n");
  write("docs/history.json", '{"source":".edges/tasks/topic/done/2026-09-01--early/INDEX.md"}\n');
  return { root, file, write };
}

function snapshot(dir: string): Record<string, string> {
  const result: Record<string, string> = {};
  function visit(current: string) {
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, item.name);
      if (item.isDirectory()) visit(file);
      else result[path.relative(dir, file)] = fs.readFileSync(file).toString("base64");
    }
  }
  visit(dir);
  return result;
}

test("preview is read-only; apply preserves tasks, prose, resources, logs, incoming links, and reruns", async (t) => {
  const { root, file } = fixture(t);
  const before = snapshot(root);
  const plan = planRecursiveProjects(root);
  assert.deepEqual(snapshot(root), before);
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.totals.projects, 1);
  assert.equal(plan.totals.tasks, 3);
  assert.equal(plan.totals.defaultTasks, 1);
  assert.equal(plan.totals.runLogs, 3);
  assert.equal(plan.groups.find((group) => group.name === "topic")!.date, "2026-09-01");
  await applyRecursiveProjects(plan);
  const project = file(".edges/projects/2026-09-01--topic");
  const index = fs.readFileSync(path.join(project, "INDEX.md"), "utf8");
  assert.match(index, /# Topic title/);
  assert.match(index, /description: Preserve description/);
  assert.match(index, /Keep authored prose/);
  assert.match(index, /Keep this instruction/);
  assert.match(index, /tasks\/README.md/);
  assert.deepEqual(fs.readFileSync(path.join(project, "tasks/done/img/proof.png")), Buffer.from([0, 13, 10, 255, 42]));
  assert.equal(fs.readFileSync(path.join(project, "tasks/unregistered-resource.txt"), "utf8"), "User resource\n");
  assert.equal(fs.existsSync(file(".edges/tasks/topic")), false);
  assert.equal(fs.existsSync(file(".edges/tasks/_default")), false);
  const movedTask = fs.readFileSync(path.join(project, "tasks/done/2026-09-01--early/INDEX.md"), "utf8");
  assert.doesNotMatch(movedTask, /edges-task-project/);
  assert.match(movedTask, /edges-task-priority: high/);
  assert.match(movedTask, /\.\.\/img\/proof.png/);
  const free = fs.readFileSync(file(".edges/tasks/backlog/2026-10-01--free/INDEX.md"), "utf8");
  assert.match(free, /\[Group\]\(\.\.\/\.\.\/README.md\)/);
  for (const group of plan.groups) for (const record of group.files.filter((entry) => entry.relative.endsWith(".log.md"))) {
    assert.equal(fs.readFileSync(path.join(group.destination, record.relative)).toString("base64"), before[path.relative(root, path.join(group.source, record.relative))]);
  }
  assert.equal(fs.readFileSync(file("docs/history.json")).toString("base64"), before["docs/history.json"]);
  assert.match(fs.readFileSync(file(".edges/projects/existing/INDEX.md"), "utf8"), /2026-09-01--topic\/tasks\/done\/2026-09-01--early\/INDEX.md#result/);
  const after = snapshot(root);
  await applyRecursiveProjects(JSON.parse(JSON.stringify(plan)));
  assert.deepEqual(snapshot(root), after);
  assert.equal(planRecursiveProjects(root).groups.length, 0);
});

test("saved plan resumes after Project creation and a whole group move", async (t) => {
  const { root } = fixture(t);
  const plan = planRecursiveProjects(root);
  const group = plan.groups.find((item) => item.project)!;
  const service = new NodeService({ managedRoot: root });
  const entry = new ProjectNode(path.join(group.project!, "INDEX.md")).parse(group.projectSource!);
  await service.create(entry, { body: entry.body, metadata: entry.metadata });
  await service.move((await service.get(path.join(group.source, "README.md")))!, path.join(group.destination, "README.md"));
  await applyRecursiveProjects(JSON.parse(JSON.stringify(plan)));
  assert.equal(fs.existsSync(path.join(group.source, "README.md")), false);
  assert.doesNotMatch(fs.readFileSync(path.join(group.destination, group.tasks[0]!.relative), "utf8"), /edges-task-project/);
});

test("saved plan resumes after a default Task move and refuses modified default prose", async (t) => {
  const { root } = fixture(t);
  const plan = planRecursiveProjects(root);
  const group = plan.groups.find((item) => !item.project)!;
  const task = group.tasks[0]!;
  const service = new NodeService({ managedRoot: root });
  await service.move((await service.get(path.join(group.source, task.relative)))!, path.join(group.destination, task.relative));
  await applyRecursiveProjects(JSON.parse(JSON.stringify(plan)));
  assert.equal(fs.existsSync(group.source), false);

  const changed = fixture(t);
  const stale = planRecursiveProjects(changed.root);
  fs.appendFileSync(changed.file(".edges/tasks/_default/README.md"), "\nNew user prose.\n");
  await assert.rejects(applyRecursiveProjects(stale), /Default README changed/);
  assert.equal(fs.existsSync(changed.file(".edges/projects/2026-09-01--topic")), false);
});

test("all conflicts reject before mutation: occupied destination, duplicate stems, missing dates, symlinks, unknown default resources", async (t) => {
  for (const problem of ["occupied", "duplicate", "date", "symlink", "default-resource"]) {
    const { root, file, write } = fixture(t);
    if (problem === "occupied") write(".edges/projects/2026-09-01--topic/INDEX.md", "# User Project\n");
    if (problem === "duplicate") write(".edges/tasks/topic/backlog/2026-09-01--early/INDEX.md", "# Duplicate\n");
    if (problem === "date") write(".edges/tasks/topic/backlog/undated/INDEX.md", "# Undated\n");
    if (problem === "symlink") fs.symlinkSync(file("docs/history.json"), file(".edges/tasks/topic/linked.json"));
    if (problem === "default-resource") write(".edges/tasks/_default/backlog/img/user.png", "resource");
    const before = snapshot(root);
    const plan = planRecursiveProjects(root);
    assert.ok(plan.conflicts.length, problem);
    await assert.rejects(applyRecursiveProjects(plan), /Conflicts block apply/);
    assert.deepEqual(snapshot(root), before, problem);
  }
});

test("saved preview rejects new and modified resources before creating Projects", async (t) => {
  for (const change of ["modified", "new"]) {
    const { root, file, write } = fixture(t);
    const plan = planRecursiveProjects(root);
    write(`.edges/tasks/topic/${change === "new" ? "new.txt" : "unregistered-resource.txt"}`, "Changed\n");
    await assert.rejects(applyRecursiveProjects(plan), /Content changed|Unplanned resource/);
    assert.equal(fs.existsSync(file(".edges/projects/2026-09-01--topic")), false);
  }
});

test("empty named groups require an explicit date; mapping never replaces an existing earliest task date", (t) => {
  const { root, write } = fixture(t);
  write(".edges/tasks/empty/README.md", "# Empty group\n");
  assert.ok(planRecursiveProjects(root).conflicts.some((conflict) => conflict.includes("explicit valid date")));
  const plan = planRecursiveProjects(root, { empty: "2026-08-01" });
  assert.deepEqual(plan.conflicts, []);
  assert.match(plan.groups.find((group) => group.name === "empty")!.project!, /2026-08-01--empty$/);
  assert.ok(planRecursiveProjects(root, { empty: "2026-08-01", topic: "2026-11-02" }).conflicts.some((conflict) => conflict.includes("earliest Task date")));
});


test("group relocation preserves a pre-existing dangling index reference without inventing a Task", async (t) => {
  const { root, file } = fixture(t);
  const groupReadme = file(".edges/tasks/topic/README.md");
  fs.writeFileSync(groupReadme, fs.readFileSync(groupReadme, "utf8").replace("- [Early](done/2026-09-01--early/INDEX.md)", "- [Historical missing Task](done/2026-09-01--missing/INDEX.md)"));
  const plan = planRecursiveProjects(root);
  assert.equal(plan.totals.tasks, 3);
  const group = plan.groups.find((item) => item.name === "topic")!;
  assert.deepEqual(group.missingReferences, ["done/2026-09-01--missing/INDEX.md"]);
  assert.deepEqual(group.unindexedTasks, ["done/2026-09-01--early/INDEX.md"]);
  await applyRecursiveProjects(plan);
  assert.match(fs.readFileSync(path.join(group.destination, "README.md"), "utf8"), /2026-09-01--missing/);
  assert.equal(fs.existsSync(path.join(group.destination, "done/2026-09-01--missing/INDEX.md")), false);
  assert.match(fs.readFileSync(path.join(group.destination, "README.md"), "utf8"), /2026-09-01--early/);
  const tasks = await new NodeService({ managedRoot: root }).query(root, { types: ["task"] }).toArray().value();
  assert.equal(tasks.length, 3);
  const listed = await run(["--scope", root, "tasks", "list"], { env: {} });
  assert.equal(listed.exitCode, 0, listed.stderr);
  assert.equal(JSON.parse(listed.stdout).tasks.length, 3);
});
