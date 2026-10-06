import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import { tmpdir } from "node:os";
import { readEntry, saveEntries } from "../../src/services/node-files.js";

for (const failure of ["writeSync", "fsyncSync", "renameSync"] as const)
  test(`atomic overwrite preserves original and cleans staging on ${failure} failure`, (t) => {
    const root = fs.mkdtempSync(
      path.join(fs.realpathSync(tmpdir()), "atomic-node-"),
    );
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const file = path.join(root, "index.md");
    fs.writeFileSync(file, "original");
    const before = readEntry(file)!;
    const mock = t.mock.method(fs, failure, () => {
      throw new Error("injected persistence failure");
    });
    syncBuiltinESMExports();
    t.after(() => {
      mock.mock.restore();
      syncBuiltinESMExports();
    });
    assert.throws(
      () => saveEntries([{ path: file, before, source: "changed" }]),
      /injected persistence failure/,
    );
    assert.equal(fs.readFileSync(file, "utf8"), "original");
    assert.deepEqual(fs.readdirSync(root), ["index.md"]);
  });
test("atomic overwrite refreshes identity for the next save and still rejects external same-byte replacement", (t) => {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "atomic-node-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, "index.md");
  fs.writeFileSync(file, "original");
  const before = readEntry(file)!;
  const first = saveEntries([{ path: file, before, source: "first" }]).get(
    file,
  )!;
  assert.notEqual(first.inode, before.inode);
  const second = saveEntries([
    { path: file, before: first, source: "second" },
  ]).get(file)!;
  assert.equal(second.source, "second");
  fs.renameSync(file, file + ".old");
  fs.writeFileSync(file, "second");
  assert.throws(
    () => saveEntries([{ path: file, before: second, source: "third" }]),
    /identity changed/,
  );
});
