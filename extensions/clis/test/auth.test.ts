import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { checkAuth } from "../src/auth.js";

test("checkAuth skips when no expected token", async () => {
  const result = await checkAuth({ expectedToken: undefined });
  assert.equal(result.ok, true);
});

test("checkAuth reports AUTH_MISSING when token configured but not presented", async () => {
  const result = await checkAuth({ expectedToken: "secret" });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.failure.errorCode, "AUTH_MISSING");
  }
});

test("checkAuth reports AUTH_INVALID_TOKEN on mismatch", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "edges-cli-auth-"));
  const tokenFile = path.join(tmp, "token");
  await fs.writeFile(tokenFile, "wrong\n");
  const result = await checkAuth({ expectedToken: "secret", tokenFile });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.failure.errorCode, "AUTH_INVALID_TOKEN");
  }
});

test("checkAuth accepts matching token file", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "edges-cli-auth-"));
  const tokenFile = path.join(tmp, "token");
  await fs.writeFile(tokenFile, "secret\n");
  const result = await checkAuth({ expectedToken: "secret", tokenFile });
  assert.equal(result.ok, true);
});
