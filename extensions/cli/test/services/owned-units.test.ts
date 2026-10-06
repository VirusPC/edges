import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  BaseNode,
  AgentsNode,
  LeafNode,
  MemoryNode,
  NoteNode,
  SkillNode,
  TaskNode,
} from "../../src/domain/models/index.js";
import { NodeService } from "../../src/services/node/node-service.js";
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
test("update leaves binary bytes untouched and destroy removes only the selected unit", async (t) => {
  const { file, write, service } = fixture(t);
  write("unit/index.md", "body");
  fs.writeFileSync(file("unit/image.bin"), Buffer.from([0, 255, 1]));
  write("other.md", "ordinary");
  const node = (await service.get(file("unit/index.md")))!;
  await service.update(node, { body: "changed" });
  assert.deepEqual(
    fs.readFileSync(file("unit/image.bin")),
    Buffer.from([0, 255, 1]),
  );
  await service.destroy(node);
  assert.equal(fs.existsSync(file("unit")), false);
  assert.equal(fs.readFileSync(file("other.md"), "utf8"), "ordinary");
});
test("resource inode drift since load prevents destructive directory movement and deletion", async (t) => {
  const { file, write, service } = fixture(t);
  write("unit/index.md", "body");
  write("unit/asset", "same");
  const node = (await service.get(file("unit/index.md")))!;
  fs.renameSync(file("unit/asset"), file("unit/old"));
  write("unit/asset", "same");
  fs.unlinkSync(file("unit/old"));
  await assert.rejects(
    service.move(node, file("moved/index.md")),
    /resources changed/,
  );
  await assert.rejects(service.destroy(node), /resources changed/);
  assert.equal(fs.existsSync(node.path), true);
});
test("move persists requested unsaved body and keeps shared references usable after relocation", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Kept](old/index.md) — Details"));
  write("old/index.md", "---\nid: user-data\n---\nBefore\n");
  write("old/tool", "tool");
  const node = (await service.get(file("old/index.md")))!;
  const copy = (await service.get(node.path))!;
  node.body = "Changed\n";
  const parent = (await service.get(file("AGENTS.md"), AgentsNode))!;
  assert.equal(await service.move(node, file("new/index.md")), node);
  assert.equal(copy.path, node.path);
  assert.equal(node.id, file("new/index.md"));
  assert.equal(node.metadata?.id, "user-data");
  assert.equal(fs.readFileSync(node.path, "utf8").includes("Changed"), true);
  assert.equal(parent.children[0]?.name, "Kept");
  assert.equal(parent.children[0]?.description, "Details");
  await service.update(node, { body: "again" });
  assert.equal(copy.body, node.body);
});
test("move changes image and reference definitions but leaves ordinary files and code examples alone", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Unit](old/index.md)"));
  write(
    "old/index.md",
    '![asset](../shared/image.png "Title")\n\n[ref]: ../shared/page.md?q=1#part "Definition"\n\n```md\n[example](../shared/page.md)\n```\n',
  );
  write("shared/image.png", "img");
  write("shared/page.md", "external");
  write("README.md", "[unchanged](old/index.md)");
  await service.move(
    (await service.get(file("old/index.md")))!,
    file("deep/new/index.md"),
  );
  const text = fs.readFileSync(file("deep/new/index.md"), "utf8");
  assert.match(text, /!\[asset\]\(\.\.\/\.\.\/shared\/image.png "Title"\)/);
  assert.match(
    text,
    /\[ref\]: \.\.\/\.\.\/shared\/page.md\?q=1#part "Definition"/,
  );
  assert.match(text, /\[example\]\(\.\.\/shared\/page.md\)/);
  assert.equal(
    fs.readFileSync(file("README.md"), "utf8"),
    "[unchanged](old/index.md)",
  );
});
test("move preflights destination business policies and restores source on post-rename policy failure", async (t) => {
  const { root, file, write } = fixture(t);
  write("AGENTS.md", index("- [Unit](old/index.md)"));
  write("old/index.md", "original");
  write("old/asset", "bytes");
  const service = new NodeService({
    managedRoot: root,
    assertWrite: ({ operation, node }) => {
      if (
        operation === "move" &&
        node.path === file("new/index.md") &&
        fs.existsSync(node.path)
      )
        throw new Error("Changed policy");
    },
  });
  const node = (await service.get(file("old/index.md")))!;
  await assert.rejects(service.move(node, file("new/index.md")), /restored/);
  assert.equal(fs.readFileSync(node.path, "utf8"), "original");
  assert.equal(fs.readFileSync(file("old/asset"), "utf8"), "bytes");
  assert.equal(fs.existsSync(file("new")), false);
});
test("multi-document move rollback restores directory and both parent indexes after later file failure", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [A](a/AGENTS.md)\n- [B](b/AGENTS.md)"));
  write("a/AGENTS.md", index("- [Unit](unit/index.md)"));
  write("b/AGENTS.md", index());
  write("a/unit/index.md", "[outside](../../outside.md)");
  write("outside.md", "outside");
  const node = (await service.get(file("a/unit/index.md")))!;
  const before = fs.readFileSync(file("a/AGENTS.md"), "utf8");
  const parent = (await service.get(file("a/AGENTS.md"), AgentsNode))!;
  parent.setConstraints(["Pending parent"]);
  const { default: mutableFs } = await import("node:fs");
  const { syncBuiltinESMExports } = await import("node:module");
  const rename = mutableFs.renameSync;
  let failed = false;
  const mocked = t.mock.method(
    mutableFs,
    "renameSync",
    (a: fs.PathLike, b: fs.PathLike) => {
      if (b === file("b/AGENTS.md") && !failed) {
        failed = true;
        throw new Error("Second parent fails");
      }
      return rename(a, b);
    },
  );
  syncBuiltinESMExports();
  t.after(() => {
    mocked.mock.restore();
    syncBuiltinESMExports();
  });
  await assert.rejects(service.move(node, file("b/unit/index.md")), /restored/);
  assert.equal(node.path, file("a/unit/index.md"));
  assert.equal(fs.existsSync(file("b/unit")), false);
  assert.equal(fs.readFileSync(file("a/AGENTS.md"), "utf8"), before);
  assert.deepEqual(parent.constraints, ["Pending parent"]);
  assert.equal(parent.children[0]?.id, node.path);
});
test("failed index rollback retains original source in a named recovery document", async (t) => {
  const { root, file, write, service } = fixture(t);
  write("AGENTS.md", index("- [A](a/AGENTS.md)\n- [B](b/AGENTS.md)"));
  write("a/AGENTS.md", index("- [Unit](unit/index.md)"));
  write("b/AGENTS.md", index());
  write("a/unit/index.md", "original");
  const node = (await service.get(file("a/unit/index.md")))!;
  const before = fs.readFileSync(file("a/AGENTS.md"), "utf8");
  const { default: mutableFs } = await import("node:fs");
  const { syncBuiltinESMExports } = await import("node:module");
  const rename = mutableFs.renameSync;
  let changed = false;
  const mocked = t.mock.method(
    mutableFs,
    "renameSync",
    (a: fs.PathLike, b: fs.PathLike) => {
      if (b === file("b/AGENTS.md") || (b === file("a/AGENTS.md") && changed))
        throw new Error("Persistent failure");
      rename(a, b);
      if (b === file("a/AGENTS.md")) changed = true;
    },
  );
  syncBuiltinESMExports();
  t.after(() => {
    mocked.mock.restore();
    syncBuiltinESMExports();
  });
  await assert.rejects(service.move(node, file("b/unit/index.md")), (error) => {
    const recovery = fs
      .readdirSync(file("a"))
      .find((n) => n.startsWith(".node-recovery-"));
    assert.ok(recovery);
    assert.ok(String(error).includes(file(`a/${recovery}`)));
    assert.equal(fs.readFileSync(file(`a/${recovery}`), "utf8"), before);
    return true;
  });
  assert.equal(fs.existsSync(root), true);
});
test("destroy authorizes staging location before moving private bytes", async (t) => {
  const { root, file, write } = fixture(t);
  write("unit/index.md", "private");
  write("unit/secret", "bytes");
  const service = new NodeService({
    managedRoot: root,
    assertWrite: ({ node }) => {
      if (node.path.includes(".node-recovery-"))
        throw new Error("Recovery is not ignored");
    },
  });
  await assert.rejects(
    service.destroy((await service.get(file("unit/index.md")))!),
    /not ignored/,
  );
  assert.equal(fs.readFileSync(file("unit/secret"), "utf8"), "bytes");
});
test("destroy never deletes a replaced staged directory and reports its location", async (t) => {
  const { root, file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Unit](unit/index.md)"));
  write("unit/index.md", "original");
  write("unit/asset", "owned");
  const node = (await service.get(file("unit/index.md")))!;
  const { default: mutableFs } = await import("node:fs");
  const { syncBuiltinESMExports } = await import("node:module");
  const rename = mutableFs.renameSync;
  let recovery = "";
  const mocked = t.mock.method(
    mutableFs,
    "renameSync",
    (a: fs.PathLike, b: fs.PathLike) => {
      rename(a, b);
      if (a === file("unit")) {
        recovery = String(b);
        rename(b, String(b) + "-original");
        fs.mkdirSync(b);
        fs.writeFileSync(path.join(String(b), "unrelated"), "keep");
      }
    },
  );
  syncBuiltinESMExports();
  t.after(() => {
    mocked.mock.restore();
    syncBuiltinESMExports();
  });
  await assert.rejects(service.destroy(node), (error) => {
    assert.ok(String(error).includes(recovery));
    return true;
  });
  assert.equal(
    fs.readFileSync(path.join(recovery, "unrelated"), "utf8"),
    "keep",
  );
  assert.equal(fs.existsSync(root), true);
});
test("import leaves source and parent index untouched when preflight validation fails", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index());
  write(
    "source/SKILL.md",
    "---\nname: fixture\ndescription: Test fixture\n---\nsource",
  );
  write("source/.harness/AGENTS.md", index("- [Missing](missing/index.md)"));
  const before = fs.readFileSync(file("AGENTS.md"), "utf8");
  await assert.rejects(
    service.import(file("source/SKILL.md"), file("new/SKILL.md"), { indexGroup: "local" }),
    /Missing/,
  );
  assert.equal(fs.existsSync(file("new")), false);
  assert.equal(
    fs.readFileSync(file("source/SKILL.md"), "utf8"),
    "---\nname: fixture\ndescription: Test fixture\n---\nsource",
  );
  assert.equal(fs.readFileSync(file("AGENTS.md"), "utf8"), before);
});
test("destroy refreshes a dirty cached index without leaving references to the deleted entry", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Child](child/index.md)"));
  write("child/index.md", "child");
  const dirty = (await service.get(file("AGENTS.md"), AgentsNode))!;
  dirty.setConstraints(["Unsaved"]);
  await service.destroy((await service.get(file("child/index.md")))!);
  assert.deepEqual(dirty.constraints, ["Unsaved"]);
  assert.equal(dirty.children.length, 0);
});
test("an unrelated update does not silently bless an externally changed loaded snapshot", async (t) => {
  const { file, write, service } = fixture(t);
  write("one/index.md", "one");
  write("two/index.md", "two");
  const one = (await service.get(file("one/index.md")))!;
  const two = (await service.get(file("two/index.md")))!;
  write("two/index.md", "human");
  await service.update(one, { body: "updated" });
  await assert.rejects(
    service.update(two, { body: "overwrite" }),
    /source changed/,
  );
  assert.equal(fs.readFileSync(two.path, "utf8"), "human");
});
test("import outside managedRoot validates nested registered memory nodes using source directory contracts", async (t) => {
  const { root, file, write, service } = fixture(t);
  const outside = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "outside-import-"),
  );
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.mkdirSync(path.join(outside, "memory/bad"), { recursive: true });
  fs.writeFileSync(
    path.join(outside, "AGENTS.md"),
    index("- [Memory](memory/AGENTS.md)"),
  );
  fs.writeFileSync(
    path.join(outside, "memory/AGENTS.md"),
    typeIndex("memory", true, "- [Bad](bad/index.md)"),
  );
  fs.writeFileSync(
    path.join(outside, "memory/bad/index.md"),
    "---\nmetadata:\n  edges-type: 123\n---\nbody",
  );
  await assert.rejects(
    service.import(path.join(outside, "AGENTS.md"), file("imported/AGENTS.md"), { indexGroup: "local" }),
    /edges-type|memory/i,
  );
  assert.equal(fs.existsSync(file("imported")), false);
  assert.equal(fs.existsSync(root), true);
});
test("move does not rewrite unrelated registered documents that need no link changes", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [A](a/index.md)\n- [B](b/index.md)"));
  write("a/index.md", "a");
  const untouched =
    '---\n# authored YAML comment\nname: "B"\n---\nUnrelated body  \n';
  write("b/index.md", untouched);
  await service.move(
    (await service.get(file("a/index.md")))!,
    file("moved/index.md"),
  );
  assert.equal(fs.readFileSync(file("b/index.md"), "utf8"), untouched);
});
test("cross-parent move transfers authored query and fragment to the new parent registration", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [A](a/AGENTS.md)\n- [B](b/AGENTS.md)"));
  write(
    "a/AGENTS.md",
    index("- [Child](child/index.md?view=compact#details) — Kept"),
  );
  write("b/AGENTS.md", index());
  write("a/child/index.md", "child");
  await service.move(
    (await service.get(file("a/child/index.md")))!,
    file("b/child/index.md"),
  );
  assert.match(
    fs.readFileSync(file("b/AGENTS.md"), "utf8"),
    /child\/index.md\?view=compact#details/,
  );
  assert.match(fs.readFileSync(file("b/AGENTS.md"), "utf8"), /Kept/);
});
test("dirty constraints are saved with creation and survive the next save", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index());
  const parent = (await service.get(file("AGENTS.md"), AgentsNode))!;
  parent.setConstraints(["unsaved"]);
  await service.create(new LeafNode(file("child/index.md")), { body: "child" }, { indexGroup: "local" });
  assert.equal(parent.children[0]?.id, file("child/index.md"));
  assert.deepEqual(parent.constraints, ["unsaved"]);
  await service.update(parent, {});
  assert.match(fs.readFileSync(parent.path, "utf8"), /child\/index.md/);
});
test("dirty old and new parents save cross-parent move registration", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [A](a/AGENTS.md)\n- [B](b/AGENTS.md)"));
  write("a/AGENTS.md", index("- [Child](child/index.md)"));
  write("b/AGENTS.md", index());
  write("a/child/index.md", "child");
  const a = (await service.get(file("a/AGENTS.md"), AgentsNode))!,
    b = (await service.get(file("b/AGENTS.md"), AgentsNode))!;
  a.setConstraints(["A dirty"]);
  b.setConstraints(["B dirty"]);
  await service.move(
    (await service.get(file("a/child/index.md")))!,
    file("b/child/index.md"),
  );
  assert.equal(a.children.length, 0);
  assert.equal(b.children[0]?.id, file("b/child/index.md"));
  await service.update(a, {});
  await service.update(b, {});
  assert.match(fs.readFileSync(b.path, "utf8"), /child\/index.md/);
  assert.deepEqual(a.constraints, ["A dirty"]);
  assert.deepEqual(b.constraints, ["B dirty"]);
});
test("shared reference edits save the latest assigned label", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Original](child/index.md)"));
  write("child/index.md", "child");
  const dirty = (await service.get(file("AGENTS.md"), AgentsNode))!,
    other = (await service.get(dirty.path, AgentsNode))!;
  dirty.updateChild(file("child/index.md"), { name: "Dirty" });
  other.updateChild(file("child/index.md"), { name: "Other" });
  assert.strictEqual(dirty, other);
  await service.update(other, {});
  assert.match(fs.readFileSync(dirty.path, "utf8"), /Other/);
  assert.equal(dirty.children[0]?.name, "Other");
});
test("move rejects destination readonly type contract without changing either index or source", async (t) => {
  const { file, write, service } = fixture(t);
  write(
    "AGENTS.md",
    index("- [Source](src/index.md)\n- [Refs](refs/AGENTS.md)"),
  );
  write("src/index.md", "source");
  write("refs/AGENTS.md", typeIndex("skills", false));
  const before = fs.readFileSync(file("AGENTS.md"), "utf8"),
    refs = fs.readFileSync(file("refs/AGENTS.md"), "utf8");
  await assert.rejects(
    service.move(
      (await service.get(file("src/index.md")))!,
      file("refs/target/index.md"),
    ),
    /read.only/i,
  );
  assert.equal(fs.readFileSync(file("src/index.md"), "utf8"), "source");
  assert.equal(fs.readFileSync(file("AGENTS.md"), "utf8"), before);
  assert.equal(fs.readFileSync(file("refs/AGENTS.md"), "utf8"), refs);
});
test("Internal move refuses descendant loss of known Note layout type", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Notes](notes/group/AGENTS.md)"));
  write("notes/group/AGENTS.md", index("- [One](one/index.md)"));
  write("notes/group/one/index.md", "# Note");
  const node = (await service.get(file("notes/group/AGENTS.md")))!,
    child = (await service.get(file("notes/group/one/index.md")))!;
  const before = fs.readFileSync(file("AGENTS.md"), "utf8");
  assert.equal(child.type, "note");
  await assert.rejects(
    service.move(node, file("elsewhere/AGENTS.md")),
    /business type/i,
  );
  assert.equal(fs.existsSync(child.path), true);
  assert.equal(fs.readFileSync(file("AGENTS.md"), "utf8"), before);
  assert.equal(fs.existsSync(file("elsewhere")), false);
});
test("Internal relocation resolves descendant type with its proposed moved Memory contract", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Memory](old/AGENTS.md)"));
  write("old/AGENTS.md", typeIndex("memory", true, "- [One](one/index.md)"));
  write("old/one/index.md", "body");
  const node = (await service.get(file("old/AGENTS.md")))!,
    child = (await service.get(file("old/one/index.md")))!;
  await service.move(node, file("new/AGENTS.md"));
  assert.equal(child.type, "memory");
  assert.equal((await service.get(child.path))!.type, "memory");
});
test("link relocation distinguishes destination from title delimiters and escaped nested labels", async (t) => {
  const { file, write, service } = fixture(t);
  write(
    "a/index.md",
    '[x](../asset.png "see ](example)")\n![a [nested] label](../asset.png "title ](foo)")\n[escaped \\] label](../asset.png "safe")',
  );
  write("asset.png", "asset");
  await service.move(
    (await service.get(file("a/index.md")))!,
    file("deep/a/index.md"),
  );
  assert.equal(
    fs.readFileSync(file("deep/a/index.md"), "utf8"),
    '[x](../../asset.png "see ](example)")\n![a [nested] label](../../asset.png "title ](foo)")\n[escaped \\] label](../../asset.png "safe")',
  );
});
test("shared reference name and group changes save together", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Original](child/index.md)"));
  write("child/index.md", "child");
  const dirty = (await service.get(file("AGENTS.md"), AgentsNode))!,
    other = (await service.get(file("AGENTS.md"), AgentsNode))!;
  dirty.updateChild(file("child/index.md"), { name: "Dirty name" });
  other.moveChild(file("child/index.md"), "descendant");
  await service.update(other, {});
  assert.equal(dirty.localChildren.length, 0);
  assert.equal(dirty.descendantChildren[0]?.name, "Dirty name");
  await service.update(dirty, {});
  assert.equal(
    (await service.get(dirty.path, AgentsNode))!.descendantChildren[0]?.name,
    "Dirty name",
  );
});
test("readonly indexes remain editable while relocation into a readonly subtree is denied", async (t) => {
  const { file, write, service } = fixture(t);
  write(
    "AGENTS.md",
    index("- [Refs](refs/AGENTS.md)\n- [Tree](tree/AGENTS.md)"),
  );
  write("refs/AGENTS.md", typeIndex("skills", false));
  write("tree/AGENTS.md", index("- [Child](child/index.md)"));
  write("tree/child/index.md", "body");
  const refs = (await service.get(file("refs/AGENTS.md"), AgentsNode))!;
  await service.update(refs, { metadata: { description: "editable index" } });
  const before = fs.readFileSync(refs.path, "utf8");
  await assert.rejects(
    service.move(
      (await service.get(file("tree/AGENTS.md")))!,
      file("refs/tree/AGENTS.md"),
    ),
    /read.only/i,
  );
  assert.equal(fs.readFileSync(refs.path, "utf8"), before);
  assert.equal(fs.readFileSync(file("tree/child/index.md"), "utf8"), "body");
});
for (const label of ["a `[` b", "a `]` b", "a ``[`]`` b", "a ```]``[` ``` b"]) {
  test(`relocation uses parsed label bounds for inline code: ${label}`, async (t) => {
    const { file, write, service } = fixture(t);
    const source = `[${label}](../asset.png "title ](literal)")\n![${label}](../asset.png)`;
    write("a/index.md", source);
    write("asset.png", "asset");
    await service.move(
      (await service.get(file("a/index.md")))!,
      file("deep/a/index.md"),
    );
    assert.equal(
      fs.readFileSync(file("deep/a/index.md"), "utf8"),
      `[${label}](../../asset.png "title ](literal)")\n![${label}](../../asset.png)`,
    );
  });
}
test("unrelated create preserves dirty query and fragment through refresh and subsequent save", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [A](a/index.md?old=1#old)"));
  write("a/index.md", "a");
  const dirty = (await service.get(file("AGENTS.md"), AgentsNode))!;
  dirty.body = dirty.body.replace("?old=1#old", "?dirty=1#dirty");
  await service.create(new LeafNode(file("b/index.md")), { body: "b" }, { indexGroup: "local" });
  assert.match(dirty.body, /a\/index.md\?dirty=1#dirty/);
  assert.equal(dirty.children.length, 2);
  await service.update(dirty, {});
  assert.match(
    fs.readFileSync(dirty.path, "utf8"),
    /a\/index.md\?dirty=1#dirty/,
  );
});
test("shared suffix edits follow sequential assignment", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [A](a/index.md#old)"));
  write("a/index.md", "a");
  const dirty = (await service.get(file("AGENTS.md"), AgentsNode))!,
    other = (await service.get(file("AGENTS.md"), AgentsNode))!;
  dirty.body = dirty.body.replace("#old", "#dirty");
  other.body = other.body.replace("#dirty", "?committed=1#other");
  assert.strictEqual(dirty, other);
  await service.update(other, {});
  assert.match(fs.readFileSync(dirty.path, "utf8"), /\?committed=1#other/);
  assert.match(dirty.body, /\?committed=1#other/);
});
test("shared suffix removal saves current dirty constraints", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [A](a/index.md#old)"));
  write("a/index.md", "a");
  const dirty = (await service.get(file("AGENTS.md"), AgentsNode))!,
    other = (await service.get(file("AGENTS.md"), AgentsNode))!;
  dirty.setConstraints(["unsaved"]);
  other.body = other.body.replace("#old", "");
  await service.update(other, {});
  assert.doesNotMatch(dirty.body, /#old/);
  assert.deepEqual(dirty.constraints, ["unsaved"]);
});
test("image labels containing a link preserve label syntax while the outer destination relocates", async (t) => {
  const { file, write, service } = fixture(t);
  const source = '![a [b](../page.md)](../asset.png "title")';
  write("a/index.md", source);
  write("asset.png", "asset");
  await service.move(
    (await service.get(file("a/index.md")))!,
    file("deep/a/index.md"),
  );
  assert.equal(
    fs.readFileSync(file("deep/a/index.md"), "utf8"),
    '![a [b](../page.md)](../../asset.png "title")',
  );
});

for (const operation of ['move', 'destroy'] as const) {
  test(`${operation} maintains references from explicitly loaded unregistered nodes and their harness`, async t => {
    const {file, write, service} = fixture(t);
    write('AGENTS.md', index());
    write('target/index.md', 'target');
    write('unregistered/index.md', 'unregistered');
    write('unregistered/AGENTS.md', index('- [Target](../target/index.md)'));
    const target = (await service.get(file('target/index.md')))!;
    await service.get(file('unregistered/index.md'));
    if (operation === 'move') await service.move(target, file('moved/index.md'));
    else await service.destroy(target);
    const maintained = (await service.get(file('unregistered/AGENTS.md'), AgentsNode))!;
    assert.deepEqual(maintained.children.map(child => child.id), operation === 'move' ? [file('moved/index.md')] : []);
    assert.equal(fs.existsSync(file('target/index.md')), false);
    assert.equal(fs.readFileSync(file('unregistered/index.md'),'utf8'), 'unregistered');
  });
}

test('move shares traversal across overlapping planned index roots', async t => {
  const {root, file, write} = fixture(t);
  write('AGENTS.md', index('- [A](a/AGENTS.md)\n- [B](b/AGENTS.md)'));
  const links = '- [Target](../target/index.md)\n- [Shared](../shared/index.md)';
  write('a/AGENTS.md', index(links));
  write('b/AGENTS.md', index(links));
  write('target/index.md', 'target');
  write('shared/index.md', 'shared');
  let sharedArrivals = 0;
  const service = new NodeService({managedRoot: root, modelForReference: (_parent, _ref, target) => {
    if (target === file('shared/index.md')) sharedArrivals++;
    return undefined;
  }});
  const target = (await service.get(file('target/index.md')))!;
  await service.move(target, file('moved/index.md'));
  // One registered-graph traversal and one planned-graph traversal.
  assert.equal(sharedArrivals, 2);
  for (const name of ['a', 'b']) {
    const node = (await service.get(file(`${name}/AGENTS.md`), AgentsNode))!;
    assert.deepEqual(node.children.map(ref => ref.id), [file('moved/index.md'), file('shared/index.md')]);
  }
});

test('registered collection skips an optional harness removed after its owner was loaded', async t => {
  const {file, write, service} = fixture(t);
  write('AGENTS.md', index());
  write('owner/index.md', 'owner');
  write('owner/AGENTS.md', index());
  write('target/index.md', 'target');
  const owner = (await service.get(file('owner/index.md')))!;
  assert.equal(owner.harness?.id, file('owner/AGENTS.md'));
  fs.unlinkSync(file('owner/AGENTS.md'));
  const target = (await service.get(file('target/index.md')))!;
  await service.move(target, file('moved/index.md'));
  assert.equal(fs.readFileSync(file('moved/index.md'), 'utf8'), 'target');
  assert.equal(fs.existsSync(file('owner/AGENTS.md')), false);
});
