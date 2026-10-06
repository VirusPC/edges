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

test("runtime lock is excluded from snapshots/import while active locks block relocation", async (t) => {
  const { resourceSnapshot, validateResources } =
    await import("../../src/services/node-resources.js");
  const { NodeService } = await import("../../src/services/node-service.js");
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "node-runtime-lock-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, "source");
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, "index.md"), "Source\n");
  fs.writeFileSync(
    path.join(source, ".edges-write.lock-notes"),
    "keep ordinary attachment",
  );
  const lock = path.join(source, "nested", ".edges-write.lock");
  fs.mkdirSync(path.dirname(lock));
  // Baseline includes the ordinary nested directory; only the exact runtime name
  // is excluded, so unrelated files and directories remain in the snapshot.
  const baseline = resourceSnapshot(source);
  fs.mkdirSync(lock);
  fs.writeFileSync(path.join(lock, "AGENTS.md"), "runtime data");
  assert.doesNotThrow(() => validateResources(baseline));
  assert.ok(
    ![...resourceSnapshot(source).entries.keys()].some((name) =>
      name.includes(".edges-write.lock/"),
    ),
  );
  const service = new NodeService({ managedRoot: root });
  const imported = await service.import(
    path.join(source, "index.md"),
    path.join(root, "copy", "index.md"),
  );
  assert.equal(
    fs.existsSync(
      path.join(imported.directoryPath, "nested", ".edges-write.lock"),
    ),
    false,
  );
  assert.equal(
    fs.readFileSync(
      path.join(imported.directoryPath, ".edges-write.lock-notes"),
      "utf8",
    ),
    "keep ordinary attachment",
  );
  const node = (await service.get(path.join(source, "index.md")))!;
  await assert.rejects(
    service.move(node, path.join(root, "moved", "index.md")),
    /active.*write lock/i,
  );
  await assert.rejects(service.destroy(node), /active.*write lock/i);
  assert.equal(fs.existsSync(lock), true);
  assert.equal(fs.readFileSync(node.path, "utf8"), "Source\n");
});
