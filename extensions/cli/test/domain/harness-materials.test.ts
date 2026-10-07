import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  loadHarnessMaterialsConfig,
  harnessRootForScope,
  resolveHarnessMaterial,
  listHarnessMaterialAbsPaths,
  placedMaterialPath,
  placeHarnessMaterial,
} from "../../src/domain/config/harness-materials.js";

test("config lists tasks README and not AGENTS", () => {
  const cfg = loadHarnessMaterialsConfig();
  assert.ok(cfg.materials.some((m) => m.id === "tasks" && m.path === "tasks/README.md"));
  assert.ok(!cfg.materials.some((m) => m.path.endsWith("AGENTS.md")));
});

test("super materials use the scope directory; the scope's own harness is one level down", () => {
  const root = mkdtempSync(path.join(tmpdir(), "hm-"));
  fs.mkdirSync(path.join(root, ".harness/tasks"), { recursive: true });
  fs.mkdirSync(path.join(root, "tasks"), { recursive: true });
  fs.writeFileSync(path.join(root, ".harness/tasks/README.md"), "# maintenance\n");
  fs.writeFileSync(path.join(root, "tasks/README.md"), "# content\n");
  assert.equal(harnessRootForScope(root), path.join(root, ".harness"));
  const hit = resolveHarnessMaterial(root, "tasks");
  assert.equal(hit?.absPath, path.join(root, "tasks/README.md"));
});

test("listHarnessMaterialAbsPaths only returns existing files", () => {
  const root = mkdtempSync(path.join(tmpdir(), "hm-list-"));
  fs.mkdirSync(path.join(root, "tasks"), { recursive: true });
  fs.writeFileSync(path.join(root, "tasks/README.md"), "# t\n");
  const listed = listHarnessMaterialAbsPaths(root);
  assert.ok(listed.some((m) => m.id === "tasks"));
  assert.ok(!listed.some((m) => m.id === "evaluation"));
});

test("optional missing material returns undefined; unknown id throws", () => {
  const root = mkdtempSync(path.join(tmpdir(), "hm-opt-"));
  assert.equal(resolveHarnessMaterial(root, "tasks"), undefined);
  assert.throws(() => resolveHarnessMaterial(root, "no-such-id"), /Unknown harness material id/);
});

test("material placement uses the configured relative path, not a fixed entry name", () => {
  assert.equal(placedMaterialPath("/repo", "queue/BOARD.md"), path.join("/repo", ".harness", "queue/BOARD.md"));
  assert.equal(
    placedMaterialPath("/repo", "queue/BOARD.md", { super: true }),
    path.join("/repo", "queue/BOARD.md"),
  );
  const tasks = loadHarnessMaterialsConfig().materials.find((m) => m.id === "tasks");
  assert.ok(tasks);
  assert.equal(placeHarnessMaterial("/repo", "tasks").absPath, path.join("/repo", ".harness", tasks.path));
  assert.equal(
    placeHarnessMaterial("/repo", "tasks", { super: true }).absPath,
    path.join("/repo", tasks.path),
  );
});
