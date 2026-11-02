import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ProjectNode, NoteNode, ReadmeNode } from "../../src/domain/models/index.js";
import { identifyNodeType } from "../../src/domain/models/node/layout.js";
import { ComposeReadmeNode } from "../../src/domain/models/compose/compose-readme-node.js";
import { readmeModelFor } from "../../src/domain/models/readme/specialize.js";
import { NodeService } from "../../src/services/node/node-service.js";
import { pathHitsExcludedModule, isScopeModuleDir } from "../../src/domain/config/exclude.js";

const prose = `# A Project

## 本层硬约束
- 不得丢正文

## 本层系统维护信息
- [Ordinary link](notes/README.md)

<!-- edges-local:start -->
- This is quoted AGENTS syntax, not a Project child list.
<!-- edges-local:end -->
`;
const entries = "<!-- edges-entries-local:start -->\n## 本层内容\n<!-- edges-entries-local:end -->\n";

test("Project and README only interpret explicit entries markers and preserve authored headings", () => {
  for (const node of [new ProjectNode("/repo/projects/P/INDEX.md"), new ReadmeNode("/repo/README.md")]) {
    assert.equal(node.isLeaf, false, "navigation must know composition before loading the body");
    node.parse(prose);
    assert.deepEqual(node.children, []);
    assert.equal(node.serialize(), prose);
    node.addChild("local", { id: path.join(node.directoryPath, "notes/README.md"), name: "Notes" });
    assert.ok(node.serialize().startsWith(prose));
    assert.equal(node.children.length, 1);
    assert.match(node.serialize(), /edges-entries-local:start/);
    node.removeChild(node.children[0]!.id);
    assert.ok(node.serialize().startsWith(prose));
  }
});

test("the nearest module classifies nested entries, without turning arbitrary Project resources into Projects", () => {
  const cases = {
    "/repo/.edges/projects/P/INDEX.md": "project",
    "/repo/.edges/projects/P/notes/N/INDEX.md": "note",
    "/repo/.edges/projects/P/notes/N/projects/Q/INDEX.md": "project",
    "/repo/.edges/projects/P/projects/Q/tasks/backlog/T/INDEX.md": "task",
    "/repo/.edges/projects/P/evaluation/E/INDEX.md": "text",
    "/repo/.edges/projects/P/memory/projects/M/INDEX.md": "text",
    "/repo/.edges/projects/P/memory/custom/M/INDEX.md": "text",
    "/repo/notes/group/N/INDEX.md": "note",
  };
  for (const [file, expected] of Object.entries(cases)) assert.equal(identifyNodeType(file), expected, file);
  assert.equal(identifyNodeType("/repo/.edges/projects/P/memory/projects/M/INDEX.md", { module: "memory" }), "memory");
});

test("Project composition registers modules, queries nested content, and survives relocation and deletion", async (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "project-composition-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = (relative: string) => path.join(root, relative);
  const service = new NodeService({ managedRoot: root });
  const projects = await service.create(new ReadmeNode(file("projects/README.md")), { body: "# Projects\n\n" + entries });
  const project = await service.create(new ProjectNode(file("projects/P/INDEX.md")), { body: prose });
  assert.equal(project.parent?.id, projects.id);
  const notes = await service.create(new ReadmeNode(file("projects/P/notes/README.md")), { body: "# Notes\n\n" + entries });
  assert.equal(notes.parent?.id, project.id);
  const note = await service.create(new NoteNode(file("projects/P/notes/N/INDEX.md")), { body: "# Note\n" });
  const nested = await service.create(new ReadmeNode(file("projects/P/projects/README.md")), { body: "# Projects\n\n" + entries });
  const child = await service.create(new ProjectNode(file("projects/P/projects/Q/INDEX.md")), { body: "# Q\n" });
  await service.create(new ReadmeNode(file("projects/P/projects/Q/notes/README.md")), { body: "# Notes\n\n" + entries });
  const nestedNote = await service.create(new NoteNode(file("projects/P/projects/Q/notes/N/INDEX.md")), { body: "# Nested note\n" });
  assert.equal(child.parent?.id, nested.id);
  assert.deepEqual((await service.query(project.path, { types: ["note"] }).toArray().value()).map((node) => node.id), [note.id, nestedNote.id]);
  assert.deepEqual((await service.query(project.path, { types: ["note"], super: true }).toArray().value()).map((node) => node.id), [note.id, nestedNote.id]);
  assert.deepEqual(await service.query(project.path, { types: ["note"], scopeDir: root, exclude: new Set(["notes"]) }).toArray().value(), []);
  assert.equal(fs.existsSync(file("projects/P/AGENTS.md")), false);
  assert.equal(fs.existsSync(file("projects/P/.edges")), false);
  fs.writeFileSync(file("projects/P/resource.bin"), Buffer.from([0, 10, 20, 255]));
  // Reload after adding a resource: lifecycle snapshots must describe the current directory.
  const moving = new NodeService({ managedRoot: root });
  const loaded = (await moving.get(project.path))!;
  await moving.get(projects.path);
  await moving.move(loaded, file("projects/R/INDEX.md"));
  assert.equal(fs.existsSync(file("projects/P")), false);
  assert.deepEqual(fs.readFileSync(file("projects/R/resource.bin")), Buffer.from([0, 10, 20, 255]));
  assert.match(fs.readFileSync(projects.path, "utf8"), /R\/INDEX\.md/);
  assert.match(fs.readFileSync(file("projects/R/INDEX.md"), "utf8"), /不得丢正文/);
  assert.equal((await moving.query(loaded.path, { types: ["note"] }).toArray().value()).length, 2);
  await moving.destroy(loaded);
  assert.equal(fs.existsSync(file("projects/R")), false);
  assert.doesNotMatch(fs.readFileSync(projects.path, "utf8"), /R\/INDEX\.md/);
});

test("module exclusions follow recursive Projects and stay bounded by the selected root", () => {
  const root = "/repo";
  const note = "/repo/.edges/projects/P/projects/Q/notes/N/INDEX.md";
  assert.equal(pathHitsExcludedModule(note, root, new Set(["notes"])), true);
  assert.equal(pathHitsExcludedModule(note, root, new Set(["tasks"])), false);
  assert.equal(pathHitsExcludedModule(note, "/elsewhere", new Set(["notes"])), false);
  assert.equal(pathHitsExcludedModule(note, "/repo/.edges/projects/P", new Set(["projects"])), true);
  assert.equal(isScopeModuleDir("/repo/.edges/projects/P/projects/Q", "notes", root), true);
  assert.equal(isScopeModuleDir("/repo/.edges/projects/P/projects/Q/.edges", "notes", root), true);
  assert.equal(isScopeModuleDir("/repo/.edges/projects/P/resources", "notes", root), false);
});


test("Compose specialization recognizes direct Project modules without claiming arbitrary compose directories", () => {
  for (const file of [
    "/repo/.edges/compose/README.md",
    "/repo/.edges/projects/P/compose/README.md",
    "/repo/.edges/projects/P/projects/Q/compose/README.md",
  ]) assert.equal(readmeModelFor(file), ComposeReadmeNode, file);
  for (const file of [
    "/repo/compose/README.md",
    "/repo/.edges/projects/P/resources/compose/README.md",
    "/repo/.edges/memory/projects/M/compose/README.md",
  ]) assert.equal(readmeModelFor(file), ReadmeNode, file);
});

test("Project import copies its nested composition and resources, retaining source and rejecting occupied targets", async (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "project-import-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = (relative: string) => path.join(root, relative);
  const service = new NodeService({ managedRoot: root });
  await service.create(new ReadmeNode(file("projects/README.md")), { body: "# Projects\n\n" + entries });
  const project = await service.create(new ProjectNode(file("projects/P/INDEX.md")), { body: "# P\n" });
  await service.create(new ReadmeNode(file("projects/P/notes/README.md")), { body: "# Notes\n\n" + entries });
  await service.create(new NoteNode(file("projects/P/notes/N/INDEX.md")), { body: "# Note\n" });
  fs.writeFileSync(file("projects/P/resource.bin"), Buffer.from([1, 2, 255]));
  const source = fs.readFileSync(project.path, "utf8");
  const imported = await service.import(project.path, file("projects/Copy/INDEX.md"));
  assert.ok(imported instanceof ProjectNode);
  assert.equal(fs.readFileSync(project.path, "utf8"), source);
  assert.deepEqual(fs.readFileSync(file("projects/Copy/resource.bin")), Buffer.from([1, 2, 255]));
  assert.deepEqual((await service.query(imported.path, { types: ["note"] }).toArray().value()).map((node) => node.path), [file("projects/Copy/notes/N/INDEX.md")]);
  assert.match(fs.readFileSync(file("projects/README.md"), "utf8"), /Copy\/INDEX\.md/);
  await assert.rejects(service.import(project.path, imported.path), /already exists/);
  assert.equal(fs.readFileSync(project.path, "utf8"), source);
});
