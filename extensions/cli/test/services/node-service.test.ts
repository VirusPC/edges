import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  BaseNode,
  InternalNode,
  LeafNode,
  MemoryNode,
  NoteNode,
  SkillNode,
  TaskNode,
} from "../../src/models/index.js";
import { NodeService } from "../../src/services/node-service.js";
function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "node-service-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = (name: string) => path.join(root, name);
  const write = (name: string, source: string) => {
    fs.mkdirSync(path.dirname(file(name)), { recursive: true });
    fs.writeFileSync(file(name), source);
    return file(name);
  };
  return { root, file, write, service: new NodeService({ managedRoot: root }) };
}
function index(local = "", descendants = "") {
  return `# Scope\n\n<!-- project-memory-important:start -->\nKeep constraints.\n<!-- project-memory-important:end -->\n<!-- project-memory-local:start -->\n${local}\n<!-- project-memory-local:end -->\n<!-- project-memory-children:start -->\n${descendants}\n<!-- project-memory-children:end -->\n`;
}
function typeIndex(module: string, writable: boolean, entries = "") {
  return `<!-- project-memory-type:start -->\nname: ${writable ? "managed" : "referenced"}\nmodule: ${module}\nwritable: ${writable}\n<!-- project-memory-type:end -->\n<!-- project-memory-entries:start -->\n${entries}\n<!-- project-memory-entries:end -->\n`;
}
for (const operation of ["update", "create", "attach"] as const) {
  test(`post-commit read failure records and recovers the committed ${operation} destination`, async (t) => {
    const { file, write, service } = fixture(t);
    write("AGENTS.md", index());
    write("child/index.md", "child");
    const parent = (await service.get(file("AGENTS.md"), InternalNode))!;
    const child = (await service.get(file("child/index.md")))!;
    const target =
      operation === "create"
        ? file("new/index.md")
        : operation === "update"
          ? child.path
          : parent.path;
    const before =
      operation === "create" ? undefined : fs.readFileSync(target, "utf8");
    const { default: mutableFs } = await import("node:fs");
    const { syncBuiltinESMExports } = await import("node:module");
    const rename = mutableFs.renameSync,
      link = mutableFs.linkSync,
      open = mutableFs.openSync;
    let committed = false,
      failed = false;
    const renameMock = t.mock.method(
      mutableFs,
      "renameSync",
      (source: fs.PathLike, dest: fs.PathLike) => {
        rename(source, dest);
        if (dest === target) committed = true;
      },
    );
    const linkMock = t.mock.method(
      mutableFs,
      "linkSync",
      (source: fs.PathLike, dest: fs.PathLike) => {
        link(source, dest);
        if (dest === target) committed = true;
      },
    );
    const openMock = t.mock.method(
      mutableFs,
      "openSync",
      (...args: Parameters<typeof open>) => {
        if (committed && !failed && args[0] === target) {
          failed = true;
          throw new Error("Post-commit inspection failure");
        }
        return open(...args);
      },
    );
    syncBuiltinESMExports();
    t.after(() => {
      renameMock.mock.restore();
      linkMock.mock.restore();
      openMock.mock.restore();
      syncBuiltinESMExports();
    });
    child.body = "updated";
    const action =
      operation === "create"
        ? service.create(new LeafNode(target), { body: "new" })
        : operation === "update"
          ? service.update(child, {})
          : attach(service, parent, child, "local");
    await assert.rejects(action, (error) => {
      assert.ok(String(error).includes(`Affected: ${target}`));
      return true;
    });
    if (before === undefined) assert.equal(fs.existsSync(target), false);
    else assert.equal(fs.readFileSync(target, "utf8"), before);
  });
}

test("post-commit temporary cleanup failure recovers created file rather than leaving an unreported mutation", async (t) => {
  const { file, service } = fixture(t);
  const { default: mutableFs } = await import("node:fs");
  const { syncBuiltinESMExports } = await import("node:module");
  const unlink = mutableFs.unlinkSync;
  let failed = false;
  const mocked = t.mock.method(
    mutableFs,
    "unlinkSync",
    (target: fs.PathLike) => {
      if (!failed && String(target).endsWith(".tmp")) {
        failed = true;
        throw new Error("Temporary cleanup failure");
      }
      return unlink(target);
    },
  );
  syncBuiltinESMExports();
  t.after(() => {
    mocked.mock.restore();
    syncBuiltinESMExports();
  });
  const target = file("new/index.md");
  await assert.rejects(
    service.create(new LeafNode(target), { body: "new" }),
    (error) => {
      assert.ok(String(error).includes(`Affected: ${target}`));
      return true;
    },
  );
  assert.equal(fs.existsSync(target), false);
});

test("structured create dispatches task defaults and refuses conflicts before changing the input", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index());
  const task = new TaskNode(file("tasks/backlog/one/index.md"));
  assert.equal(
    await service.create(task, { title: "One", body: "body" }),
    task,
  );
  assert.equal(task.title, "One");
  assert.equal(task.status, "backlog");
  assert.equal(task.parent?.id, file("AGENTS.md"));
  const fresh = new LeafNode(task.path);
  await assert.rejects(service.create(fresh, { body: "wrong" }), /exists/);
  assert.equal(fresh.body, "");
});
test("default get uses layout and physical ancestors, ignoring YAML type claims and ordinary navigation", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [one](one/index.md)"));
  write("one/index.md", "---\ntype: task\n---\nbody");
  write("README.md", "docs");
  const node = (await service.get(file("one/index.md")))!;
  assert.equal(node.type, "leaf");
  assert.equal(node.parent?.id, file("AGENTS.md"));
  assert.equal(await service.get(file("README.md")), undefined);
  assert.equal(await service.get(file("missing/index.md")), undefined);
  write("invalid/index.md", "---\nname: [\n---\n");
  await assert.rejects(service.get(file("invalid/index.md")));
});
test("local traversal supports cross-layer discovery and skips descendants before loading", async (t) => {
  const { root, file, write, service } = fixture(t);
  write(
    "AGENTS.md",
    index("- [A](a/AGENTS.md)", "- [Missing](missing/AGENTS.md)"),
  );
  write("a/AGENTS.md", index("- [B](../elsewhere/b/AGENTS.md)"));
  write(
    "elsewhere/b/AGENTS.md",
    index("- [Leaf](../../data/a%20b/index.md#part)"),
  );
  write("data/a b/index.md", "leaf");
  assert.deepEqual(
    (await service.list(root)).map((n) => n.path),
    [
      "AGENTS.md",
      "a/AGENTS.md",
      "elsewhere/b/AGENTS.md",
      "data/a b/index.md",
    ].map(file),
  );
  await assert.rejects(
    service.list(root, { includeDescendants: true }),
    /Missing/,
  );
  await assert.rejects(service.list(file("absent")), /Missing/);
  assert.equal(
    (await service.get(file("data/a b/index.md")))!.parent?.id,
    file("AGENTS.md"),
  );
});
test("composition cycles reject while diamond crossreferences do not invent conflicting parents", async (t) => {
  const { root, file, write, service } = fixture(t);
  write("AGENTS.md", index("- [A](a/AGENTS.md)\n- [B](b/AGENTS.md)"));
  write("a/AGENTS.md", index("- [Leaf](../leaf/index.md)"));
  write("b/AGENTS.md", index("- [Leaf](../leaf/index.md)"));
  write("leaf/index.md", "leaf");
  assert.equal((await service.list(root)).length, 4);
  assert.equal(
    (await service.get(file("leaf/index.md")))!.parent?.id,
    file("AGENTS.md"),
  );
  write("b/AGENTS.md", index("- [root](../AGENTS.md)"));
  await assert.rejects(service.list(root), /cycle/i);
});
test("registered type contracts choose memory and custom constructors without YAML inference", async (t) => {
  const { root, file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Memory](mem/AGENTS.md)"));
  write("mem/AGENTS.md", typeIndex("memory", true, "- [One](one/index.md)"));
  write("mem/one/index.md", "body");
  assert.ok((await service.list(root))[2] instanceof MemoryNode);
  assert.ok(
    (await service.get(file("mem/one/index.md"))) instanceof MemoryNode,
  );
  const custom = new NodeService({
    managedRoot: root,
    modelForReference: (_p, _r, target) =>
      target === file("mem/one/index.md") ? NoteNode : undefined,
  });
  assert.ok((await custom.list(root))[2] instanceof NoteNode);
});
test("update refuses missing, stale and substituted sources and retains ordinary existing file mode", async (t) => {
  const { file, write, service } = fixture(t);
  write("note/index.md", "# Before\n");
  fs.chmodSync(file("note/index.md"), 0o640);
  const note = (await service.get(file("note/index.md"), NoteNode))!;
  await service.update(note, { body: "# After\n" });
  assert.equal(fs.statSync(note.path).mode & 0o777, 0o640);
  write("note/index.md", "# External\n");
  await assert.rejects(
    service.update(note, { body: "wrong" }),
    /source changed/i,
  );
  assert.equal(note.title, "After");
  const fresh = (await service.get(note.path))!;
  fs.renameSync(note.path, file("note/old.md"));
  write("note/index.md", "# External\n");
  await assert.rejects(service.update(fresh, {}), /identity|changed/i);
  fs.unlinkSync(note.path);
  await assert.rejects(service.update(fresh, {}), /Missing/);
  await assert.rejects(
    service.update(new LeafNode(file("new/index.md")), {}),
    /snapshot/,
  );
});
test("symlink reads and destination writes fail without changing targets", async (t) => {
  const { file, write, service } = fixture(t);
  write("outside/index.md", "safe");
  fs.symlinkSync(file("outside"), file("linked"));
  await assert.rejects(service.get(file("linked/index.md")), /symbolic/);
  await assert.rejects(
    service.create(new LeafNode(file("linked/new/index.md")), { body: "bad" }),
    /symbolic/,
  );
  assert.equal(fs.readFileSync(file("outside/index.md"), "utf8"), "safe");
});
test("index-only attach and detach retain physical parent, label and prose", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index());
  write("a/AGENTS.md", index());
  write("b/index.md", "child");
  const parent = (await service.get(file("a/AGENTS.md"), InternalNode))!,
    child = (await service.get(file("b/index.md")))!;
  await attach(service, parent, child, "descendant");
  parent.updateChild(child.id, { name: "Kept", description: "Details" });
  await service.update(parent, {});
  assert.equal(child.parent?.id, file("AGENTS.md"));
  assert.equal(parent.descendantChildren[0]?.name, "Kept");
  await detach(service, parent, child);
  assert.equal(child.parent?.id, file("AGENTS.md"));
  assert.equal(parent.children.length, 0);
});
test("authoritative AGENTS graph validation catches cycles from typed BaseNode and unsaved edits", async (t) => {
  const { file, write, service } = fixture(t);
  write("a/AGENTS.md", index("- [B](../b/AGENTS.md)"));
  write("b/AGENTS.md", index());
  const a = (await service.get(file("a/AGENTS.md"), BaseNode))!,
    b = (await service.get(file("b/AGENTS.md"), InternalNode))!;
  await assert.rejects(attach(service, b, a, "local"), /cycle/i);
  assert.equal(b.children.length, 0);
  await assert.rejects(
    service.update(a, { body: index("- [self](AGENTS.md)") }),
    /cycle/i,
  );
  assert.equal(a.children.length, 0);
  await assert.rejects(
    service.create(new BaseNode(file("new/AGENTS.md")), {
      body: index("- [self](AGENTS.md)"),
    }),
    /cycle/i,
  );
  assert.equal(fs.existsSync(file("new/AGENTS.md")), false);
});
test("referenced indexes permit linked reads and index detach but retain conservative readonly origin", async (t) => {
  const { root, file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Refs](refs/AGENTS.md)"));
  write(
    "refs/AGENTS.md",
    typeIndex("skills", false, "- [Skill](linked/SKILL.md)"),
  );
  write(
    "installed/SKILL.md",
    "---\nname: fixture\ndescription: Test fixture\n---\noriginal",
  );
  fs.symlinkSync(file("installed"), file("refs/linked"));
  const nodes = await service.list(root),
    parent = nodes[1] as InternalNode,
    skill = nodes[2]!;
  await assert.rejects(
    service.update(skill, { body: "bad" }),
    /read.only|symbolic/i,
  );
  await detach(service, parent, skill);
  const alias = (await service.get(file("installed/SKILL.md")))!;
  await assert.rejects(service.destroy(alias), /read.only/i);
  assert.equal(
    fs.readFileSync(alias.path, "utf8"),
    "---\nname: fixture\ndescription: Test fixture\n---\noriginal",
  );
});
test("business write hook denies mutations before index or source bytes change", async (t) => {
  const { root, file, write } = fixture(t);
  write("AGENTS.md", index());
  const service = new NodeService({
    managedRoot: root,
    assertWrite: ({ node }) => {
      if (node.path.includes("/private/"))
        throw new Error("Private destination is not ignored");
    },
  });
  await assert.rejects(
    service.create(new LeafNode(file("private/index.md")), { body: "secret" }),
    /not ignored/,
  );
  assert.equal(fs.existsSync(file("private/index.md")), false);
  assert.equal(
    (await service.get(file("AGENTS.md"), InternalNode))!.children.length,
    0,
  );
});
test("ambiguous multi-link source edit refuses deletion without losing prose or relations", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [One](one/index.md) and [Two](two/index.md)"));
  write("one/index.md", "one");
  write("two/index.md", "two");
  const parent = (await service.get(file("AGENTS.md"), InternalNode))!,
    one = (await service.get(file("one/index.md")))!;
  const before = fs.readFileSync(parent.path, "utf8");
  await assert.rejects(detach(service, parent, one), /multi-link/i);
  assert.equal(fs.readFileSync(parent.path, "utf8"), before);
  assert.equal(one.parent?.id, parent.id);
});
test("encoded directory delimiters stay distinct from href query and fragment", async (t) => {
  const { root, file, write, service } = fixture(t);
  write(
    "AGENTS.md",
    index(
      "- [Hash](a%23b/index.md#heading)\n- [Percent](a%2523b/index.md?q=1)\n- [Question](a%3Fb/index.md)\n- [Literal](a%25b/index.md)",
    ),
  );
  for (const name of ["a#b", "a%23b", "a?b", "a%b"])
    write(`${name}/index.md`, "body");
  assert.deepEqual(
    (await service.list(root)).map((n) => n.path),
    [
      "AGENTS.md",
      "a#b/index.md",
      "a%23b/index.md",
      "a?b/index.md",
      "a%b/index.md",
    ].map(file),
  );
});
test("cached clean copies update while unrelated unsaved constraints survive", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Child](child/index.md)"));
  write("child/index.md", "child");
  const first = (await service.get(file("AGENTS.md"), InternalNode))!,
    second = (await service.get(first.path, InternalNode))!,
    dirty = (await service.get(first.path, InternalNode))!;
  dirty.setConstraints(["Unsaved"]);
  second.updateChild(file("child/index.md"), { name: "Changed" });
  await service.update(second, {});
  assert.equal(first.children[0]?.name, "Changed");
  assert.deepEqual(dirty.constraints, ["Unsaved"]);
});

/** Tests exercise the public model-edit + service-update composition. */
async function attach(
  service: NodeService,
  parent: InternalNode,
  child: BaseNode,
  group: "local" | "descendant",
) {
  const draft = new InternalNode(parent.path).parse(parent.serialize());
  draft.addChild(group, child);
  await service.update(parent, { body: draft.body });
}
async function detach(
  service: NodeService,
  parent: InternalNode,
  child: BaseNode,
) {
  const draft = new InternalNode(parent.path).parse(parent.serialize());
  draft.removeChild(child.id);
  await service.update(parent, { body: draft.body });
}
