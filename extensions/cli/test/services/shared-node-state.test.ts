import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { AgentsNode, LeafNode, TaskNode } from "../../src/domain/models/index.js";
import { NodeService } from "../../src/services/node/node-service.js";
function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "shared-state-"),
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
  test(`shared Leaf body saves sequential nested metadata after ${operation} and subsequent save`, async (t) => {
    const { file, service } = fixture(t);
    const primary = await service.create(
      new TaskNode(file("tasks/demo/todo/one/index.md")),
      {
        title: "Before",
        status: "todo",
        body: "Original\n",
        metadata: { vendor: { keep: true, version: 1 } },
      }, { indexGroup: "local" }
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
    });
  });
}
test("shared Leaf metadata retains updated body and metadata removal after subsequent save", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(new LeafNode(file("one/index.md")), {
    body: "Before\n",
    metadata: { vendor: { old: "remove", keep: 1 }, obsolete: true },
  }, { indexGroup: "local" });
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
test("shared Internal constraints and reference edits retain authored prose and structural changes", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(new AgentsNode(file("AGENTS.md")), {
    body,
  }, { indexGroup: "local" });
  const alias = (await service.get(primary.path, AgentsNode))!;
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
  const saved = (await service.get(alias.path, AgentsNode))!;
  assert.match(saved.body, /# Committed root/);
  assert.match(saved.body, /Intro committed/);
  assert.match(saved.body, /Tail locally edited/);
  assert.deepEqual(saved.constraints, ["Pending constraint"]);
  assert.equal(saved.descendantChildren[0]?.name, "Pending label");
});
test("sequential shared Leaf body edits preserve authored whitespace", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(new LeafNode(file("one/index.md")), {
    body: "# First\n\nMiddle  \n\nLast\n",
  }, { indexGroup: "local" });
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
  test(`sequential shared ${field} edits save the last assignment`, async (t) => {
    const { file, service } = fixture(t);
    const primary = field === "internal prose"
      ? await service.create(new AgentsNode(file("AGENTS.md")), { body }, { indexGroup: "local" })
      : await service.create(new LeafNode(file("one/index.md")), { body: "Original\n", metadata: { vendor: { version: 1 } } }, { indexGroup: "local" });
    const alias = (await service.get(primary.path))!;
    assert.strictEqual(alias, primary);
    if (field === "metadata") {
      alias.setMetadata("vendor", { version: 2, pending: true });
      primary.setMetadata("vendor", { version: 3 });
      assert.deepEqual(alias.metadata?.vendor, { version: 3 });
    } else {
      alias.body = "Local\n";
      primary.body = "Committed\n";
      assert.equal(alias.body, "Committed\n");
    }
    await service.update(primary, {});
    assert.equal(fs.readFileSync(alias.path, "utf8"), alias.serialize());
  });
}
test("shared Task status assignment survives directory movement", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(new TaskNode(file("tasks/demo/todo/one/index.md")), { status: "todo", body: "Original\n" }, { indexGroup: "local" });
  const alias = (await service.get(primary.path, TaskNode))!;
  alias.status = "backlog";
  primary.status = "done";
  const oldPath = primary.path;
  await service.move(primary, file("tasks/demo/done/one/index.md"));
  assert.equal(fs.existsSync(oldPath), false);
  assert.strictEqual(alias, primary);
  assert.equal(alias.status, "done");
  assert.match(fs.readFileSync(alias.path, "utf8"), /Original/);
  assert.strictEqual(await service.get(primary.path), primary);
});
test("update input overwrites the shared body's latest assignment", async (t) => {
  const { file, service } = fixture(t);
  const primary = await service.create(new LeafNode(file("one/index.md")), { body: "First and last\n" }, { indexGroup: "local" });
  const alias = (await service.get(primary.path))!;
  alias.body = "Local first and last\n";
  await service.update(primary, { body: "First and committed last\n" });
  assert.strictEqual(primary, alias);
  assert.equal(alias.body, "First and committed last\n");
  assert.equal(fs.readFileSync(alias.path, "utf8"), alias.body);
});

for (const operation of ["move", "destroy"] as const) {
  for (const pending of ["removal", "rewrite"] as const) {
    test(`${operation} persists current indexes after pending reference ${pending}`, async (t) => {
      const { file, service } = fixture(t);
      const parent = await service.create(new AgentsNode(file("AGENTS.md")), { body }, { indexGroup: "local" });
      // This explicitly loaded index is not registered under the root.
      fs.mkdirSync(file("referrer"));
      fs.writeFileSync(file("referrer/AGENTS.md"), body.replace("child/index.md", "../child/index.md"));
      const referrer = (await service.get(file("referrer/AGENTS.md"), AgentsNode))!;
      const child = (await service.get(file("child/index.md")))!;
      const unrelated = await service.create(new LeafNode(file("unrelated/index.md")), { body: "Persisted unrelated\n" }, { indexGroup: "local" });
      fs.mkdirSync(file("replacement"));
      fs.writeFileSync(file("replacement/index.md"), "Replacement\n");
      const replacement = (await service.get(file("replacement/index.md")))!;
      const unrelatedSource = fs.readFileSync(unrelated.path, "utf8");
      unrelated.body = "Pending unrelated\n";
      for (const index of [parent, referrer]) {
        index.removeChild(child.id);
        if (pending === "rewrite") index.addChild("local", { id: replacement.id, name: "New intent" });
        index.setConstraints(["Pending constraint"]);
        index.setMetadata("pending", true);
        index.body = index.body.replace("Tail unchanged.", "Pending prose.");
      }
      if (operation === "move") await service.move(child, file("moved/index.md"));
      else await service.destroy(child);
      const fresh = new NodeService({ managedRoot: file("") });
      for (const index of [parent, referrer]) {
        const saved = (await fresh.get(index.path, AgentsNode))!;
        assert.equal(saved.children.some(ref => ref.id === file("child/index.md")), false);
        assert.equal(saved.children.some(ref => ref.id === replacement.id && ref.name === "New intent"), pending === "rewrite");
        assert.deepEqual(saved.constraints, ["Pending constraint"]);
        assert.equal(saved.metadata?.pending, true);
        assert.match(saved.body, /Pending prose/);
      }
      await fresh.list(file(""), {});
      assert.equal(fs.readFileSync(unrelated.path, "utf8"), unrelatedSource);
      assert.equal(unrelated.body, "Pending unrelated\n");
    });
  }
}

test("move persists a destination parent's pending registration", async (t) => {
  const { file, service } = fixture(t);
  await service.create(new AgentsNode(file("AGENTS.md")), { body }, { indexGroup: "local" });
  const destination = await service.create(new AgentsNode(file("destination/AGENTS.md")), { body: "# Destination\n" }, { indexGroup: "local" });
  const child = (await service.get(file("child/index.md")))!;
  const target = file("destination/moved/index.md");
  destination.addChild("local", { id: target, name: "Pending label" });
  destination.setConstraints(["Pending destination"]);
  await service.move(child, target);
  const fresh = new NodeService({ managedRoot: file("") });
  const saved = (await fresh.get(destination.path, AgentsNode))!;
  assert.equal(saved.children[0]?.id, target);
  assert.equal(saved.children[0]?.name, "Pending label");
  assert.deepEqual(saved.constraints, ["Pending destination"]);
  await fresh.list(file(""), {});
});


test("move persists pre-rewritten prose links in a loaded non-parent referrer", async (t) => {
  const { file, service } = fixture(t);
  fs.mkdirSync(file("referrer"));
  fs.writeFileSync(file("referrer/index.md"), "[Child](../child/index.md#section)\n");
  const referrer = (await service.get(file("referrer/index.md")))!;
  const child = (await service.get(file("child/index.md")))!;
  referrer.body = "Pending prose [Child](../moved/index.md#section)\n";
  await service.move(child, file("moved/index.md"));
  const fresh = new NodeService({ managedRoot: file("") });
  assert.equal((await fresh.get(referrer.path))!.body, "Pending prose [Child](../moved/index.md#section)\n");
});

test("move rejects a dangling pending destination reference before changing files", async (t) => {
  const { file, service } = fixture(t);
  const parent = await service.create(new AgentsNode(file("AGENTS.md")), { body }, { indexGroup: "local" });
  const child = (await service.get(file("child/index.md")))!;
  const persisted = fs.readFileSync(parent.path, "utf8");
  parent.addChild("local", { id: file("moved/missing/index.md") });
  await assert.rejects(service.move(child, file("moved/index.md")), /Missing referenced node/);
  assert.equal(fs.existsSync(file("moved")), false);
  assert.equal(fs.existsSync(child.path), true);
  assert.equal(fs.readFileSync(parent.path, "utf8"), persisted);
  assert.equal(parent.children.some(ref => ref.id === file("moved/missing/index.md")), true);
});
