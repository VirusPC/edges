import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { InternalNode, LeafNode, TaskNode } from "../../src/models/index.js";
import { NodeService } from "../../src/services/node-service.js";
function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "alias-merge-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "child"));
  fs.writeFileSync(path.join(root, "child/index.md"), "child\n");
  return {
    file: (name: string) => path.join(root, name),
    service: new NodeService({ managedRoot: root }),
  };
}
for (const operation of ["move", "update"] as const) {
  test(`dirty Leaf body retains committed nested metadata after ${operation} and subsequent save`, async (t) => {
    const { file, service } = fixture(t);
    const primary = await service.create(
      new TaskNode(file("tasks/demo/todo/one/index.md")),
      {
        title: "Before",
        status: "todo",
        body: "Original\n",
        metadata: { vendor: { keep: true, version: 1 } },
      },
    );
    const alias = (await service.get(primary.path, TaskNode))!;
    alias.body = "Unsaved body\n";
    alias.priority = "high";
    alias.setMetadata("vendor", { keep: true, version: 1, local: "pending" });
    primary.title = "After";
    primary.setMetadata("vendor", { keep: true, version: 2 });
    if (operation === "move") {
      primary.status = "done";
      await service.move(primary, file("tasks/demo/done/one/index.md"));
    } else await service.update(primary, {});
    assert.equal(alias.title, "After");
    assert.equal(alias.status, operation === "move" ? "done" : "todo");
    assert.equal(alias.priority, "high");
    assert.deepEqual(alias.metadata?.vendor, {
      keep: true,
      version: 2,
      local: "pending",
    });
    await service.update(alias, {});
    const saved = (await service.get(alias.path, TaskNode))!;
    assert.equal(saved.title, "After");
    assert.equal(saved.status, operation === "move" ? "done" : "todo");
    assert.equal(saved.priority, "high");
    assert.equal(saved.body, "Unsaved body\n");
    assert.deepEqual(saved.metadata?.vendor, {
      keep: true,
      version: 2,
      local: "pending",
    });
  });
}
test("dirty Leaf metadata retains committed body and metadata removal after subsequent save", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(new LeafNode(file("one/index.md")), {
    body: "Before\n",
    metadata: { vendor: { old: "remove", keep: 1 }, obsolete: true },
  });
  const alias = (await service.get(primary.path))!;
  alias.description = "Pending";
  primary.removeMetadata("obsolete");
  primary.setMetadata("vendor", { keep: 1 });
  await service.update(primary, { body: "Committed\n" });
  await service.update(alias, {});
  const saved = (await service.get(alias.path))!;
  assert.equal(saved.body, "Committed\n");
  assert.equal(saved.description, "Pending");
  assert.equal(saved.metadata?.obsolete, undefined);
  assert.deepEqual(saved.metadata?.vendor, { keep: 1 });
});
const body = `# Root\n\nIntro unchanged.\n\n<!-- project-memory-important:start -->\n- Original constraint\n<!-- project-memory-important:end -->\n\n<!-- project-memory-local:start -->\n- [Child](child/index.md) — Original description\n<!-- keep this comment -->\n<!-- project-memory-local:end -->\n\nTail unchanged.\n`;
test("dirty Internal constraints and reference edits retain committed authored prose and structural changes", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(new InternalNode(file("AGENTS.md")), {
    body,
  });
  const alias = (await service.get(primary.path, InternalNode))!;
  alias.setConstraints(["Pending constraint"]);
  alias.updateChild(file("child/index.md"), { name: "Pending label" });
  alias.body = alias.body.replace("Tail unchanged.", "Tail locally edited.");
  primary.body = primary.body
    .replace("# Root", "# Committed root")
    .replace("Intro unchanged.", "Intro committed.");
  primary.moveChild(file("child/index.md"), "descendant");
  await service.update(primary, {});
  assert.match(alias.body, /# Committed root/);
  assert.match(alias.body, /Intro committed/);
  assert.match(alias.body, /Tail locally edited/);
  assert.match(alias.body, /<!-- keep this comment -->/);
  assert.deepEqual(alias.constraints, ["Pending constraint"]);
  assert.equal(alias.descendantChildren[0]?.name, "Pending label");
  await service.update(alias, {});
  const saved = (await service.get(alias.path, InternalNode))!;
  assert.match(saved.body, /# Committed root/);
  assert.match(saved.body, /Intro committed/);
  assert.match(saved.body, /Tail locally edited/);
  assert.deepEqual(saved.constraints, ["Pending constraint"]);
  assert.equal(saved.descendantChildren[0]?.name, "Pending label");
});
test("independent Leaf body edits merge without losing authored whitespace", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(new LeafNode(file("one/index.md")), {
    body: "# First\n\nMiddle  \n\nLast\n",
  });
  const alias = (await service.get(primary.path))!;
  alias.body = alias.body.replace("Last", "Local last");
  await service.update(primary, {
    body: primary.body.replace("First", "Committed first"),
  });
  await service.update(alias, {});
  assert.equal(
    fs.readFileSync(alias.path, "utf8"),
    "# Committed first\n\nMiddle  \n\nLocal last\n",
  );
});
for (const field of ["body", "metadata", "internal prose"] as const) {
  test(`divergent ${field} conflicts reject before IO and leave snapshots usable`, async (t) => {
    const { file, service } = fixture(t);
    const primary =
      field === "internal prose"
        ? await service.create(new InternalNode(file("AGENTS.md")), { body })
        : await service.create(new LeafNode(file("one/index.md")), {
            body: "Original\n",
            metadata: { vendor: { version: 1 } },
          });
    const alias = (await service.get(primary.path))!;
    if (field === "metadata") {
      alias.setMetadata("vendor", { version: 2 });
      primary.setMetadata("vendor", { version: 3 });
    } else {
      alias.body = alias.body.replace(
        field === "body" ? "Original" : "# Root",
        "Local",
      );
      primary.body = primary.body.replace(
        field === "body" ? "Original" : "# Root",
        "Committed",
      );
    }
    const before = fs.readFileSync(primary.path, "utf8");
    await assert.rejects(service.update(primary, {}), /conflict/i);
    assert.equal(fs.readFileSync(primary.path, "utf8"), before);
    primary.parse(before);
    await service.update(alias, {});
    assert.equal(fs.readFileSync(alias.path, "utf8"), alias.serialize());
  });
}
test("conflicting Task metadata rejects directory movement before any path changes", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(
    new TaskNode(file("tasks/demo/todo/one/index.md")),
    { status: "todo", body: "Original\n" },
  );
  const alias = (await service.get(primary.path, TaskNode))!;
  alias.status = "backlog";
  primary.status = "done";
  const before = fs.readFileSync(primary.path, "utf8");
  await assert.rejects(
    service.move(primary, file("tasks/demo/done/one/index.md")),
    /conflict/i,
  );
  assert.equal(fs.existsSync(file("tasks/demo/done/one")), false);
  assert.equal(fs.readFileSync(primary.path, "utf8"), before);
  assert.equal(alias.path, primary.path);
});

test("different edits on the same authored line conflict before writing or advancing either alias", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(new LeafNode(file("one/index.md")), {
    body: "First and last\n",
  });
  const alias = (await service.get(primary.path))!;
  alias.body = "Local first and last\n";
  const before = fs.readFileSync(primary.path, "utf8");
  await assert.rejects(
    service.update(primary, { body: "First and committed last\n" }),
    /conflict.*body/i,
  );
  assert.equal(fs.readFileSync(primary.path, "utf8"), before);
  assert.equal(alias.body, "Local first and last\n");
  assert.equal(primary.body, "First and last\n");
  await service.update(alias, {});
  assert.equal(fs.readFileSync(alias.path, "utf8"), "Local first and last\n");
});
