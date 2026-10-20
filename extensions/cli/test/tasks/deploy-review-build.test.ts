import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const deployPath = path.join(repoRoot, ".github/workflows/deploy.yml");
// After the repo split the framework repo may not carry deploy.yml yet.
const skip = existsSync(deployPath) ? false : "deploy.yml not in this checkout";
const deploy = skip ? "" : readFileSync(deployPath, "utf8");

test("deploy sudo only runs the root-owned site-layout entry after /tasks/ generation", { skip }, () => {
  const generateAt = deploy.indexOf("scripts/generate-tasks-site.ts");
  const entry = "/usr/local/sbin/edges-migrate-site-layout";
  const sudoAt = deploy.indexOf(`sudo -n ${entry}`);
  assert.ok(sudoAt > generateAt, "sudo of the installed entry must follow generate-tasks-site.ts");
  assert.equal(deploy.includes("sudo -n bash extensions/services/artifacts-preview/deploy/migrate-site-layout.sh"), false);
  assert.match(deploy, /install-site-layout\.sh/);
  assert.match(deploy, /::warning::/);
  assert.match(deploy, /sha256sum/);
});

test("deploy builds schema artifacts before generating /tasks/ and before the tsx CLI fallback", { skip }, () => {
  const schemasAt = deploy.indexOf("pnpm --filter @viruspc/edges run build:schemas");
  const generateAt = deploy.indexOf("scripts/generate-tasks-site.ts");
  const tsxCliAt = deploy.indexOf("tsx src/index.ts artifacts server install");
  assert.ok(schemasAt >= 0, "deploy.yml must run edges-cli build:schemas");
  assert.ok(generateAt > schemasAt, "build:schemas must run before generate-tasks-site.ts");
  assert.ok(tsxCliAt > schemasAt, "build:schemas must run before the tsx CLI fallback");
});

test("deploy builds tasks-review-app before generating /tasks/ and not only when node_modules is missing", { skip }, () => {
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
