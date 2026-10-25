import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";
import { loadServerEnv } from "../../src/services/artifacts/server/env.js";
import {
  initEdgesConfig,
  legacyArtifactsEnvPath,
  showEdgesConfig,
} from "../../src/services/config/edges-env.js";

test("config help lists init path show", async () => {
  const result = await run(["config", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["init", "path", "show"]) {
    assert.match(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
  }
  assert.match(result.stdout, /artifacts-preview\.env/);
});

test("config path prints edges.env even when the file is missing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-config-path-"));
  const result = await run(["config", "path"], { env: { HOME: dir, XDG_CONFIG_HOME: "" } });
  assert.equal(result.exitCode, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, "success");
  assert.equal(payload.command, "config.path");
  assert.equal(payload.path, path.join(dir, ".config", "edges", "edges.env"));
});

test("config init migrates artifacts-preview.env once and show redacts secrets", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-config-init-"));
  const env = { HOME: dir, XDG_CONFIG_HOME: "" };
  const legacy = legacyArtifactsEnvPath(env);
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.dirname(legacy), { recursive: true });
  const legacyBody = [
    "EDGES_ARTIFACTS_TOKEN=super-secret-token",
    "EDGES_ARTIFACTS_HOST=127.0.0.1",
    "LANGFUSE_SECRET_KEY=lf-secret",
    "LANGFUSE_HOST=https://langfuse.example",
    "",
  ].join("\n");
  await writeFile(legacy, legacyBody, { mode: 0o644 });

  await assert.rejects(
    () => loadServerEnv(env),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /edges config init/);
      assert.match(error.message, /artifacts-preview\.env/);
      assert.doesNotMatch(error.message, /super-secret-token/);
      assert.doesNotMatch(error.message, /lf-secret/);
      return true;
    },
  );

  const created = await initEdgesConfig({ env });
  assert.equal(created.migrated, true);
  assert.equal(created.created, true);
  assert.equal((await stat(created.path)).mode & 0o777, 0o600);
  assert.equal(await readFile(legacy, "utf8"), legacyBody);
  const copied = await readFile(created.path, "utf8");
  assert.match(copied, /EDGES_ARTIFACTS_TOKEN=super-secret-token/);
  assert.match(copied, /LANGFUSE_SECRET_KEY=lf-secret/);

  const shown = await showEdgesConfig({ env });
  assert.equal(shown.values.EDGES_ARTIFACTS_TOKEN, "***");
  assert.equal(shown.values.LANGFUSE_SECRET_KEY, "***");
  assert.equal(shown.values.EDGES_ARTIFACTS_HOST, "127.0.0.1");
  assert.equal(shown.values.LANGFUSE_HOST, "https://langfuse.example");

  const cli = await run(["config", "show"], { env });
  assert.equal(cli.exitCode, 0);
  assert.match(cli.stdout, /\*\*\*/);
  assert.doesNotMatch(cli.stdout, /super-secret-token/);
  assert.doesNotMatch(cli.stdout, /lf-secret/);
  assert.doesNotMatch(cli.stderr, /super-secret-token/);

  const again = await initEdgesConfig({ env });
  assert.equal(again.created, false);
  assert.equal(again.migrated, false);
});

test("config init writes a template when nothing exists", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-config-template-"));
  const env = { HOME: dir };
  const created = await initEdgesConfig({ env });
  assert.equal(created.created, true);
  assert.equal(created.migrated, false);
  const raw = await readFile(created.path, "utf8");
  assert.match(raw, /EXPERIMENT_WEBHOOK_/);
  assert.match(raw, /LANGFUSE_/);
  assert.match(raw, /EDGES_ARTIFACTS_/);
  const shown = await run(["config", "show"], { env });
  assert.equal(shown.exitCode, 0);
  const payload = JSON.parse(shown.stdout);
  assert.deepEqual(payload.values, {});
});

test("config show errors when edges.env is missing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-config-missing-"));
  const result = await run(["config", "show"], { env: { HOME: dir } });
  assert.equal(result.exitCode, 2);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.errorCode, "VALIDATION_ERROR");
  assert.match(payload.reason, /edges config init/);
  assert.match(payload.reason, /artifacts-preview\.env/);
});

test("passing the legacy artifacts-preview.env path is rejected", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-config-legacy-"));
  const env = { HOME: dir };
  const legacy = legacyArtifactsEnvPath(env);
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.dirname(legacy), { recursive: true });
  await writeFile(legacy, "EDGES_ARTIFACTS_TOKEN=super-secret-token\n", { mode: 0o600 });
  const result = await run(["config", "show", "--config", legacy], { env });
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stdout, /no longer reads/);
  assert.doesNotMatch(result.stdout, /super-secret-token/);
});
