import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  defaultArtifactsConfigPath,
  readArtifactsConfig,
  writeArtifactsConfig,
} from "../../src/artifacts/utils/config.js";

test("writeArtifactsConfig then readArtifactsConfig round-trips token and base URL", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-config-"));
  const configPath = path.join(dir, "artifacts.env");
  await writeArtifactsConfig(configPath, {
    token: "abc123",
    baseUrl: "http://127.0.0.1:8787",
  });
  const raw = await readFile(configPath, "utf8");
  assert.match(raw, /EDGES_ARTIFACTS_TOKEN=abc123/);
  assert.match(raw, /EDGES_ARTIFACTS_BASE_URL=http:\/\/127.0.0.1:8787/);
  const loaded = readArtifactsConfig({ HOME: "/unused" }, configPath);
  assert.equal(loaded.token, "abc123");
  assert.equal(loaded.baseUrl, "http://127.0.0.1:8787");
  assert.equal(loaded.configPath, configPath);
});

test("env overrides file values", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-config-"));
  const configPath = path.join(dir, "artifacts.env");
  await writeArtifactsConfig(configPath, {
    token: "file-token",
    baseUrl: "http://file.example",
  });
  const loaded = readArtifactsConfig(
    {
      EDGES_ARTIFACTS_TOKEN: "env-token",
      EDGES_ARTIFACTS_BASE_URL: "http://env.example",
    },
    configPath,
  );
  assert.equal(loaded.token, "env-token");
  assert.equal(loaded.baseUrl, "http://env.example");
});

test("defaultArtifactsConfigPath uses HOME/.config/edges/artifacts.env", () => {
  assert.equal(
    defaultArtifactsConfigPath({ HOME: "/tmp/home" }),
    "/tmp/home/.config/edges/artifacts.env",
  );
});
