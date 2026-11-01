import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { datedLeafFile, NOTE_LEAF, PROJECT_LEAF } from "../../src/services/node/dated-leaf.js";

for (const spec of [NOTE_LEAF, PROJECT_LEAF]) {
  for (const superScope of [false, true]) {
    test(`${spec.folder} paths stay inside the ${superScope ? "super" : "default"} material folder`, () => {
      const scope = path.resolve("/tmp/edges-dated-leaf-scope");
      const folder = superScope ? spec.folder : `.edges/${spec.folder}`;
      const otherFolder = superScope ? `.edges/${spec.folder}` : spec.folder;
      const reach = { super: superScope };
      for (const entry of ["INDEX.md", "index.md"]) {
        assert.equal(
          datedLeafFile(scope, `${folder}/hello/${entry}`, spec, reach),
          path.join(scope, folder, "hello", entry),
        );
      }
      for (const entryPath of [
        "../secrets/INDEX.md",
        `${folder}/hello/README.md`,
        `${otherFolder}/hello/INDEX.md`,
        `${folder}-other/hello/INDEX.md`,
      ]) {
        assert.throws(
          () => datedLeafFile(scope, entryPath, spec, reach),
          { message: `${spec.label} path must be ${folder}/<stem>/INDEX.md` },
        );
      }
    });
  }
}
