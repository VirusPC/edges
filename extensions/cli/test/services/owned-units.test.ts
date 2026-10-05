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
test("move persists requested unsaved body and keeps all aliases usable after relocation", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Kept](old/index.md) — Details"));
  write("old/index.md", "---\nid: user-data\n---\nBefore\n");
  write("old/tool", "tool");
  const node = (await service.get(file("old/index.md")))!;
  const copy = (await service.get(node.path))!;
  node.body = "Changed\n";
  const parent = (await service.get(file("AGENTS.md"), InternalNode))!;
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
  write("source/SKILL.md", "source");
  write("source/.harness/AGENTS.md", index("- [Missing](missing/index.md)"));
  const before = fs.readFileSync(file("AGENTS.md"), "utf8");
  await assert.rejects(
    service.import(file("source/SKILL.md"), file("new/SKILL.md")),
    /Missing/,
  );
  assert.equal(fs.existsSync(file("new")), false);
  assert.equal(fs.readFileSync(file("source/SKILL.md"), "utf8"), "source");
  assert.equal(fs.readFileSync(file("AGENTS.md"), "utf8"), before);
});
test("destroy refreshes a dirty cached index without leaving references to the deleted entry", async (t) => {
  const { file, write, service } = fixture(t);
  write("AGENTS.md", index("- [Child](child/index.md)"));
  write("child/index.md", "child");
  const dirty = (await service.get(file("AGENTS.md"), InternalNode))!;
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
    service.import(path.join(outside, "AGENTS.md"), file("imported/AGENTS.md")),
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
