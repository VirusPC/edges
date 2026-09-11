import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";

test("loadConfig defaults repo, branch, mode, dryRun and has no scriptPath", () => {
  const config = loadConfig({
    EDGES_AUTH_TOKEN: "",
    EDGES_REPO: "/tmp/edges-fixture",
    EDGES_BASE_BRANCH: "develop",
    EDGES_MODE: "pr",
    EDGES_DRY_RUN: "true",
  });
  assert.equal(config.repoPath, "/tmp/edges-fixture");
  assert.equal(config.baseBranch, "develop");
  assert.equal(config.mode, "pr");
  assert.equal(config.dryRun, true);
  assert.equal("scriptPath" in config, false);
});
