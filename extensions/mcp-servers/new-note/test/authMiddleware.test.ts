import test from "node:test";
import assert from "node:assert/strict";
import { createAuthMiddleware } from "../src/authMiddleware.js";
import type { RuntimeConfig } from "../src/types.js";

function makeConfig(authToken?: string): RuntimeConfig {
  return {
    repoPath: "/repo",
    baseBranch: "main",
    scriptPath: "/repo/bin/new-note",
    skillsPath: "/repo/extensions/skills",
    mode: "direct",
    authToken,
  };
}

function createRes() {
  return {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.payload = body;
      return this;
    },
  };
}

test("auth middleware skips auth when EDGES_AUTH_TOKEN is not set", () => {
  const middleware = createAuthMiddleware(makeConfig(undefined));
  let nextCalled = false;
  const req = {
    path: "/new-note",
    headers: {},
  };
  const res = createRes();

  middleware(req as never, res as never, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload, undefined);
});

test("auth middleware rejects protected route when token is configured but header is missing", () => {
  const middleware = createAuthMiddleware(makeConfig("secret-token"));
  let nextCalled = false;
  const req = {
    path: "/new-note",
    headers: {},
  };
  const res = createRes();

  middleware(req as never, res as never, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, {
    status: "failed",
    errorCode: "AUTH_MISSING",
    reason: "Authorization header is required",
  });
});
