import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  planContentUnits,
  applyContentUnits,
  contentReferences,
} from "../../scripts/content-directory-migration.js";
function fixture(t: TestContext) {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(tmpdir(), "content-units-")),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q"], { cwd: root });
  return {
    root,
    put: (file: string, body: string | Buffer) => {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), body);
    },
    read: (file: string) => fs.readFileSync(path.join(root, file), "utf8"),
  };
}
test("unused img archives preserve source hierarchy, referenced files and repeatability", (t) => {
  const { root, put, read } = fixture(t);
  put("edges/a/index.md", "![keep](img/keep.png)");
  put("edges/a/img/keep.png", "referenced");
  put("edges/a/img/same.png", "first");
  put("notes/b/img/same.png", "second");
  put("archive/img/already.png", "archived");
  put("archive/unassigned-resources/resources/old.png", "other archive");
  put("notes/b/other.png", "outside img");
  assert.equal(planContentUnits(root).writes.length, 0);
  const plan = planContentUnits(root, { archiveUnusedImages: true });
  assert.equal(plan.writes.length, 2);
  applyContentUnits(plan);
  assert.equal(read("archive/img/edges/a/img/same.png"), "first");
  assert.equal(read("archive/img/notes/b/img/same.png"), "second");
  assert.equal(read("edges/a/img/keep.png"), "referenced");
  assert.equal(read("archive/img/already.png"), "archived");
  assert.equal(
    read("archive/unassigned-resources/resources/old.png"),
    "other archive",
  );
  assert.equal(read("notes/b/other.png"), "outside img");
  assert.equal(
    planContentUnits(root, { archiveUnusedImages: true }).writes.length,
    0,
  );
});
test("directory entries, attachments and incoming links preserve labels, fragments, HTML and code", (t) => {
  const { root, put, read } = fixture(t);
  put(
    "edges/中文 主题.md",
    '# Topic\n![img](../resources/a%20b.png#x)\n[[中文 主题#标题|别名]]\n<img src="../resources/a%20b.png">\n`[[中文 主题]]`\n```md\n![x](../resources/a%20b.png)\n```\n',
  );
  put("resources/a b.png", Buffer.from([0, 255, 17]));
  put("README.md", "[topic](edges/中文%20主题.md#标题)\n[[中文 主题]]\n");
  put("posts/文章.md", "# Post\n[topic](../edges/中文%20主题.md)\n");
  put("posts/README.md", "# Guide\n");
  put("edges/AGENTS.md", "# Scope\n");
  const plan = planContentUnits(root);
  assert(!fs.existsSync(path.join(root, "edges/中文 主题/index.md")));
  applyContentUnits(plan);
  assert.equal(
    read("README.md"),
    "[topic](edges/%E4%B8%AD%E6%96%87%20%E4%B8%BB%E9%A2%98/index.md#标题)\n[[edges/中文 主题/index.md|中文 主题]]\n",
  );
  assert.match(read("edges/中文 主题/index.md"), /!\[img\]\(a%20b.png#x\)/);
  assert.match(read("edges/中文 主题/index.md"), /<img src="a%20b.png">/);
  assert.match(read("edges/中文 主题/index.md"), /`\[\[中文 主题\]\]`/);
  assert.match(
    read("edges/中文 主题/index.md"),
    /```md\n!\[x\]\(\.\.\/resources\/a%20b.png\)\n```/,
  );
  assert.equal(read("posts/README.md"), "# Guide\n");
  assert.deepEqual(
    fs.readFileSync(path.join(root, "edges/中文 主题/a b.png")),
    Buffer.from([0, 255, 17]),
  );
  assert.equal(planContentUnits(root).writes.length, 0);
});
test("shared copies get explicit per-owner paths; unreferenced bytes are archived only by option", (t) => {
  const { root, put, read } = fixture(t);
  put("edges/a.md", "![[pic.png]]");
  put("notes/b/index.md", "![[pic.png]]");
  put("resources/pic.png", "shared bytes");
  put("resources/unused.png", "unclaimed");
  const preview = planContentUnits(root);
  assert(preview.retained.some((x) => x.file === "resources/pic.png"));
  const plan = planContentUnits(root, {
    shared: "copy",
    unreferenced: "archive",
  });
  applyContentUnits(plan);
  assert.equal(read("edges/a/pic.png"), "shared bytes");
  assert.equal(read("notes/b/pic.png"), "shared bytes");
  assert.equal(read("edges/a/index.md"), "![[edges/a/pic.png]]");
  assert.equal(read("notes/b/index.md"), "![[notes/b/pic.png]]");
  assert.equal(
    read("archive/unassigned-resources/resources/unused.png"),
    "unclaimed",
  );
  assert(!fs.existsSync(path.join(root, "resources")));
  assert.equal(
    planContentUnits(root, { shared: "copy", unreferenced: "archive" }).writes
      .length,
    0,
  );
});
test("conflicts and stale plans fail before changing sources", (t) => {
  const { root, put, read } = fixture(t);
  put("edges/a.md", "# A");
  put("edges/a/index.md", "# Existing");
  assert.throws(() => planContentUnits(root), /collision/i);
  fs.unlinkSync(path.join(root, "edges/a/index.md"));
  const plan = planContentUnits(root);
  put("edges/a.md", "# Edited");
  assert.throws(() => applyContentUnits(plan), /changed|stale/i);
  assert.equal(read("edges/a.md"), "# Edited");
});
test("ignored users and symlink targets are never read or migrated", (t) => {
  const { root, put } = fixture(t);
  put(".gitignore", "notes/private/\n");
  put("notes/private/secret.md", "private");
  put("edges/a.md", "# A");
  put("edges/.harness/memory/users/private.md", "private");
  fs.symlinkSync(
    path.join(root, "notes/private/secret.md"),
    path.join(root, "edges/link.md"),
  );
  assert.throws(() => planContentUnits(root), /symbolic|symlink/i);
  fs.unlinkSync(path.join(root, "edges/link.md"));
  applyContentUnits(planContentUnits(root));
  assert(fs.existsSync(path.join(root, "notes/private/secret.md")));
  assert(
    fs.existsSync(path.join(root, "edges/.harness/memory/users/private.md")),
  );
});
test("HTML comments and script examples do not claim or rewrite attachments", (t) => {
  const { root, put, read } = fixture(t);
  const body =
    '<!-- <img src="../resources/example.png"> -->\n<script>let x = \'<img src="../resources/example.png">\';</script>\n';
  put("edges/a.md", body);
  put("resources/example.png", "bytes");
  applyContentUnits(planContentUnits(root, { unreferenced: "archive" }));
  assert.equal(read("edges/a/index.md"), body);
  assert.equal(
    read("archive/unassigned-resources/resources/example.png"),
    "bytes",
  );
});
test("later write failure rolls back content, moved files, permissions and new directories", (t) => {
  const { root, put, read } = fixture(t);
  put("README.md", "[a](edges/a.md)");
  put("edges/a.md", "# A");
  put("edges/b.md", "# B");
  const plan = planContentUnits(root);
  const original = fs.writeFileSync;
  let writes = 0;
  t.mock.method(
    fs,
    "writeFileSync",
    (...args: Parameters<typeof fs.writeFileSync>) => {
      if (++writes === 3) throw new Error("injected failure");
      return original(...args);
    },
  );
  assert.throws(() => applyContentUnits(plan), /injected failure/);
  assert.equal(read("README.md"), "[a](edges/a.md)");
  assert.equal(read("edges/a.md"), "# A");
  assert.equal(read("edges/b.md"), "# B");
  assert(!fs.existsSync(path.join(root, "edges/a")));
});
test("an ignored destination rejects the plan, and ambiguous wiki links do not pick an arbitrary owner", (t) => {
  const { root, put, read } = fixture(t);
  put(".gitignore", "edges/a/\n");
  put("edges/a.md", "# A");
  assert.throws(() => planContentUnits(root), /ignored.*destination/i);
  put(".gitignore", "");
  put("edges/a.md", "![[pic.png]]");
  put("resources/pic.png", "one");
  put("edges/other/pic.png", "two");
  assert.throws(
    () => planContentUnits(root, { unreferenced: "archive" }),
    /Ambiguous wiki target/,
  );
  assert.equal(read("edges/a.md"), "![[pic.png]]");
  assert.equal(read("resources/pic.png"), "one");
  assert.equal(read("edges/other/pic.png"), "two");
});
test("new readers invalidate ownership computed by an earlier preview", (t) => {
  const { root, put, read } = fixture(t);
  put("edges/a.md", "![[pic.png]]");
  put("resources/pic.png", "bytes");
  const plan = planContentUnits(root);
  put("notes/new.md", "![[pic.png]]");
  assert.throws(() => applyContentUnits(plan), /inventory changed/);
  assert.equal(read("resources/pic.png"), "bytes");
});
test("CommonMark escapes/entities and real HTML attributes use parser-decoded destinations", (t) => {
  const { root, put, read } = fixture(t);
  put(
    "edges/a.md",
    '[b](foo\\_bar.md)\n![p](../resources/a&amp;b.png)\n<div>\n<!-- <img src="../resources/example.png"> -->\n<script>const x=`<img src="../resources/example.png">`;</script>\n<img SRC="../resources/a&amp;b.png"><img src=../resources/plain.png>\n</div>\n',
  );
  put("edges/foo_bar.md", "# B");
  put("resources/a&b.png", "amp");
  put("resources/plain.png", "plain");
  put("resources/example.png", "example");
  applyContentUnits(planContentUnits(root, { unreferenced: "archive" }));
  const actual = read("edges/a/index.md");
  assert.match(actual, /\[b\]\(\.\.\/foo_bar\/index.md\)/);
  assert.match(actual, /SRC="a%26b.png"/);
  assert.match(actual, /src=plain.png/);
  assert.match(actual, /<!-- <img src="\.\.\/resources\/example.png"> -->/);
  assert.match(
    actual,
    /<script>const x=`<img src="\.\.\/resources\/example.png">`;<\/script>/,
  );
  assert.equal(
    read("archive/unassigned-resources/resources/example.png"),
    "example",
  );
});
test("a racing destination is retained when exclusive open rejects it", (t) => {
  const { root, put, read } = fixture(t);
  put("edges/a.md", "# A");
  const plan = planContentUnits(root);
  const original = fs.openSync;
  let injected = false;
  t.mock.method(fs, "openSync", (...args: Parameters<typeof fs.openSync>) => {
    if (args[1] === "wx" && !injected) {
      injected = true;
      fs.writeFileSync(args[0], "someone else");
    }
    return original(...args);
  });
  assert.throws(() => applyContentUnits(plan), /EEXIST/);
  assert.equal(read("edges/a/index.md"), "someone else");
  assert.equal(read("edges/a.md"), "# A");
});
test("entity-encoded fragments keep their meaning after a target moves", (t) => {
  const { root, put, read } = fixture(t);
  put("edges/a.md", "[b](foo.md&#35;section)");
  put("edges/foo.md", "# Section");
  applyContentUnits(planContentUnits(root));
  assert.equal(read("edges/a/index.md"), "[b](../foo/index.md#section)");
});
test("HTML and Markdown query/fragment serialization retains valid attribute and link syntax", (t) => {
  const { root, put, read } = fixture(t);
  put("edges/foo.md", "# Target");
  put(
    "edges/a.md",
    '<div>\n<a href="foo.md?x=&quot;hello&quot;">go</a>\n<a href=foo.md?x=one&#32;two>go</a>\n</div>\n\n[b](foo.md#part\\))\n',
  );
  applyContentUnits(planContentUnits(root));
  const refs = contentReferences(read("edges/a/index.md"));
  assert.equal(refs.length, 3);
  assert.equal(refs[0]?.decodedHref, '../foo/index.md?x="hello"');
  assert.equal(refs[1]?.decodedHref, "../foo/index.md?x=one two");
  assert.equal(
    decodeURIComponent(refs[2]!.decodedHref!),
    "../foo/index.md#part)",
  );
});
