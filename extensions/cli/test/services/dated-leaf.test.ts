import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { datedLeafFile, NOTE_LEAF, PROJECT_LEAF } from "../../src/services/node/dated-leaf.js";

test("dated leaf paths stay inside the resource folder and use a leaf entry name", () => {
  const scope = path.resolve("/tmp/edges-dated-leaf-scope");
  assert.equal(
    datedLeafFile(scope, "notes/hello/INDEX.md", NOTE_LEAF),
    path.join(scope, "notes/hello/INDEX.md"),
  );
  assert.equal(
    datedLeafFile(scope, "projects/hello/index.md", PROJECT_LEAF),
    path.join(scope, "projects/hello/index.md"),
  );
  assert.throws(
    () => datedLeafFile(scope, "../secrets/INDEX.md", NOTE_LEAF),
    /note path must be notes\/<stem>\/INDEX\.md/,
  );
  assert.throws(
    () => datedLeafFile(scope, "notes/hello/README.md", NOTE_LEAF),
    /note path must be notes\/<stem>\/INDEX\.md/,
  );
  assert.throws(
    () => datedLeafFile(scope, "projects/hello/INDEX.md", NOTE_LEAF),
    /note path must be notes\/<stem>\/INDEX\.md/,
  );
  assert.throws(
    () => datedLeafFile(scope, "notes/hello/INDEX.md", PROJECT_LEAF),
    /project path must be projects\/<stem>\/INDEX\.md/,
  );
});
