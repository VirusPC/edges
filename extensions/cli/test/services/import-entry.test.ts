import assert from "node:assert/strict";
import test from "node:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { assertImportType } from "../../src/services/import-entry.js";
import { NodeService } from "../../src/services/node-service.js";
function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "source-boundary-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name: string, source: string) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source);
    return file;
  };
  return { root, write };
}
const contract =
  "<!-- project-memory-type:start -->\nname: project\nmodule: memory\nwritable: true\n<!-- project-memory-type:end -->\n";
test("import classification shares runtime nearest physical parent across intermediate directories", async (t) => {
  const { root, write } = fixture(t);
  write(".harness/memory/projects/AGENTS.md", contract);
  const entry = write(
    ".harness/memory/projects/group/item/index.md",
    "# Memory\n",
  );
  assert.equal(
    (await new NodeService({ managedRoot: root }).get(entry))?.type,
    "memory",
  );
  assert.throws(() => assertImportType(entry, "note"), /source type memory/);
  assert.equal(assertImportType(entry, "memory"), entry);
});
test("source discovery stops at enclosing Git boundary and an explicit managed root", (t) => {
  const { root, write } = fixture(t);
  write("AGENTS.md", contract);
  write("checkout/.git", "gitdir: unused-fixture\n");
  const entry = write("checkout/group/item/index.md", "# External\n");
  assert.equal(assertImportType(entry, "note"), entry);
  const external = write("external/group/item/index.md", "# External\n");
  assert.equal(
    assertImportType(external, "note", path.join(root, "external")),
    external,
  );
  assert.throws(
    () => assertImportType(external, "note", path.join(root, "elsewhere")),
    /boundary/,
  );
});
test("nearest unclassified physical owner stops inherited Memory classification", async (t) => {
  const { root, write } = fixture(t);
  write("AGENTS.md", contract);
  write("scope/AGENTS.md", "# Independent scope\n");
  const entry = write("scope/group/item/index.md", "# Generic\n");
  assert.equal(
    (await new NodeService({ managedRoot: root }).get(entry))?.type,
    "leaf",
  );
  assert.equal(assertImportType(entry, "note"), entry);
});

test("physical parent discovery and containment support the filesystem root boundary", async (t) => {
  const { write } = fixture(t);
  const entry = write("nested/item/index.md", "body\n");
  const owner = write("AGENTS.md", contract);
  const { physicalParent } =
    await import("../../src/services/node-layout.js");
  const filesystemRoot = path.parse(entry).root;
  const { isWithinPath } = await import("../../src/utils/filesystem.js");
  assert.equal(isWithinPath(entry, filesystemRoot), true);
  assert.equal(physicalParent(entry, filesystemRoot), owner);
});
