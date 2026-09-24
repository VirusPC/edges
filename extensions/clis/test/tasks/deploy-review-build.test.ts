import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const deploy = readFileSync(path.join(repoRoot, ".github/workflows/deploy.yml"), "utf8");

test("deploy builds tasks-review-app before generating /tasks/ and not only when node_modules is missing", () => {
  const buildAt = deploy.indexOf("pnpm --filter tasks-review-app run build");
  const generateAt = deploy.indexOf("scripts/generate-tasks-site.ts");
  assert.ok(buildAt >= 0, "deploy.yml must build tasks-review-app");
  assert.ok(generateAt > buildAt, "build must run before generate-tasks-site.ts");

  const ifAt = deploy.indexOf("if [ ! -d node_modules ]");
  if (ifAt !== -1) {
    const fiAt = deploy.indexOf("\n             fi\n", ifAt);
    assert.ok(fiAt > ifAt);
    const insideConditionalInstall = buildAt > ifAt && buildAt < fiAt;
    assert.equal(insideConditionalInstall, false);
  }
});
