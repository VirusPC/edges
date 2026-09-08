import test from "node:test";
import assert from "node:assert/strict";
import { accessSync, constants } from "node:fs";
import { loadConfig } from "../src/config.js";

test("default scriptPath points at repo bin/new-note", () => {
  const config = loadConfig({ EDGES_AUTH_TOKEN: "" });
  assert.match(config.scriptPath, /bin\/new-note$/);
  accessSync(config.scriptPath, constants.X_OK);
});
