import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";
import { ensureServerEnv } from "../../src/artifacts/server/env.js";
import {
  installArtifactsServer,
  restartArtifactsServer,
  setupNginxArtifacts,
  startArtifactsServer,
  statusArtifactsServer,
  stopArtifactsServer,
} from "../../src/artifacts/server/ops.js";

test("artifacts help lists server", async () => {
  const result = await run(["artifacts", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /^\s+server\b/m);
  assert.match(result.stdout, /server install \| start \| stop \| restart \| status \| setup-nginx/);
  assert.doesNotMatch(result.stdout, /server init/);
  assert.doesNotMatch(result.stdout, /^\s+nginx-/m);
});

test("artifacts server help lists install start stop restart status setup-nginx", async () => {
  const result = await run(["artifacts", "server", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["install", "start", "stop", "restart", "status", "setup-nginx"]) {
    assert.match(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
  }
  assert.doesNotMatch(result.stdout, /^\s+init\b/m);
  assert.doesNotMatch(result.stdout, /^\s+nginx-/m);
  assert.match(result.stdout, /Never combine install and start/);
});

test("artifacts server init is not a command", async () => {
  const result = await run(["artifacts", "server", "init"]);
  assert.notEqual(result.exitCode, 0);
});

test("artifacts server has no nginx-snippet or nginx-setup command", async () => {
  const snippet = await run(["artifacts", "server", "nginx-snippet"]);
  assert.notEqual(snippet.exitCode, 0);
  const setup = await run(["artifacts", "server", "nginx-setup"]);
  assert.notEqual(setup.exitCode, 0);
});

test("ensureServerEnv creates a token when the file is missing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-env-"));
  const configPath = path.join(dir, "artifacts-preview.env");
  const ensured = await ensureServerEnv({
    env: { HOME: dir },
    configPath,
  });
  assert.equal(ensured.tokenCreated, true);
  assert.equal(ensured.tokenRotated, false);
  assert.equal(ensured.baseUrl, "https://edges.viruspc.tech");
  assert.equal(ensured.host, "127.0.0.1");
  assert.equal(ensured.port, 8787);
  const raw = await readFile(configPath, "utf8");
  assert.match(raw, /EDGES_ARTIFACTS_TOKEN=[0-9a-f]{64}/);
  assert.match(raw, /EDGES_ARTIFACTS_BASE_URL=https:\/\/edges\.viruspc\.tech/);
  assert.equal((await stat(configPath)).mode & 0o777, 0o600);
});

test("ensureServerEnv keeps an existing token unless --force", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-env-"));
  const configPath = path.join(dir, "artifacts-preview.env");
  const first = await ensureServerEnv({ env: { HOME: dir }, configPath });
  const second = await ensureServerEnv({ env: { HOME: dir }, configPath });
  assert.equal(second.tokenCreated, false);
  assert.equal(second.tokenRotated, false);
  assert.equal(second.token, first.token);
  const rotated = await ensureServerEnv({ env: { HOME: dir }, configPath, force: true });
  assert.equal(rotated.tokenCreated, false);
  assert.equal(rotated.tokenRotated, true);
  assert.notEqual(rotated.token, first.token);
});

test("installArtifactsServer creates env when missing and does not start", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-ops-"));
  const repo = path.join(dir, "repo");
  const deploy = path.join(repo, "extensions/services/artifacts-preview/deploy");
  await mkdir(deploy, { recursive: true });
  await writeFile(
    path.join(deploy, "edges-artifacts-preview.service"),
    "[Unit]\nDescription=test\n[Service]\nExecStart=/bin/true\n[Install]\nWantedBy=default.target\n",
  );
  const envFile = path.join(dir, "artifacts-preview.env");
  const calls: string[] = [];
  const result = await installArtifactsServer({
    env: { HOME: dir },
    envFile,
    repoRoot: repo,
    runCommand: async (command, args) => {
      calls.push([command, ...args].join(" "));
      return { exitCode: 0, stdout: "ok\n", stderr: "" };
    },
  });
  assert.equal(result.started, false);
  assert.equal(result.tokenCreated, true);
  const raw = await readFile(envFile, "utf8");
  assert.match(raw, /EDGES_ARTIFACTS_TOKEN=[0-9a-f]{64}/);
  assert.ok(calls.some((line) => line.includes("pnpm") && line.includes("edges-artifacts-preview")));
  assert.ok(calls.some((line) => line.includes("systemctl --user enable")));
  assert.ok(calls.some((line) => line.includes("systemctl --user daemon-reload")));
  assert.ok(!calls.some((line) => /\b(start|restart|stop)\b/.test(line)));
});

test("installArtifactsServer --force rotates the token without starting", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-ops-"));
  const repo = path.join(dir, "repo");
  const deploy = path.join(repo, "extensions/services/artifacts-preview/deploy");
  await mkdir(deploy, { recursive: true });
  await writeFile(
    path.join(deploy, "edges-artifacts-preview.service"),
    "[Unit]\nDescription=test\n[Service]\nExecStart=/bin/true\n[Install]\nWantedBy=default.target\n",
  );
  const envFile = path.join(dir, "artifacts-preview.env");
  const original = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  await writeFile(
    envFile,
    [
      `EDGES_ARTIFACTS_TOKEN=${original}`,
      "EDGES_ARTIFACTS_BASE_URL=https://edges.viruspc.tech",
      "EDGES_ARTIFACTS_HOST=127.0.0.1",
      "EDGES_ARTIFACTS_PORT=8787",
      `EDGES_ARTIFACTS_DATA_DIR=${path.join(dir, "data")}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  const calls: string[] = [];
  const result = await installArtifactsServer({
    env: { HOME: dir },
    envFile,
    repoRoot: repo,
    force: true,
    runCommand: async (command, args) => {
      calls.push([command, ...args].join(" "));
      return { exitCode: 0, stdout: "ok\n", stderr: "" };
    },
  });
  assert.equal(result.started, false);
  assert.equal(result.tokenRotated, true);
  assert.notEqual(result.token, original);
  assert.ok(!calls.some((line) => /\b(start|restart|stop)\b/.test(line)));
});

test("installArtifactsServer builds and enables the unit without starting it", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-ops-"));
  const repo = path.join(dir, "repo");
  const deploy = path.join(repo, "extensions/services/artifacts-preview/deploy");
  await mkdir(deploy, { recursive: true });
  await writeFile(
    path.join(deploy, "edges-artifacts-preview.service"),
    "[Unit]\nDescription=test\n[Service]\nExecStart=/bin/true\n[Install]\nWantedBy=default.target\n",
  );
  const envFile = path.join(dir, "artifacts-preview.env");
  await writeFile(
    envFile,
    [
      "EDGES_ARTIFACTS_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "EDGES_ARTIFACTS_BASE_URL=https://edges.viruspc.tech",
      "EDGES_ARTIFACTS_HOST=127.0.0.1",
      "EDGES_ARTIFACTS_PORT=8787",
      `EDGES_ARTIFACTS_DATA_DIR=${path.join(dir, "data")}`,
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  const calls: string[] = [];
  const result = await installArtifactsServer({
    env: { HOME: dir },
    envFile,
    repoRoot: repo,
    runCommand: async (command, args) => {
      calls.push([command, ...args].join(" "));
      return { exitCode: 0, stdout: "ok\n", stderr: "" };
    },
  });
  assert.equal(result.started, false);
  assert.equal(result.tokenCreated, false);
  assert.equal(result.tokenRotated, false);
  assert.ok(calls.some((line) => line.includes("pnpm") && line.includes("edges-artifacts-preview")));
  assert.ok(calls.some((line) => line.includes("systemctl --user enable")));
  assert.ok(!calls.some((line) => /\b(start|restart|stop)\b/.test(line)));
  const unit = await readFile(path.join(dir, ".config/systemd/user/edges-artifacts-preview.service"), "utf8");
  assert.match(unit, /WantedBy=default\.target/);
});

test("start stop restart are process lifecycle only", async () => {
  const calls: string[] = [];
  const fetchHealth = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
  const runCommand = async (command: string, args: string[]) => {
    calls.push([command, ...args].join(" "));
    return { exitCode: 0, stdout: "active\n", stderr: "" };
  };
  const started = await startArtifactsServer({
    env: { HOME: "/tmp" },
    host: "127.0.0.1",
    port: 8787,
    runCommand,
    fetchHealth,
  });
  assert.equal(started.healthy, true);
  const stopped = await stopArtifactsServer({
    env: { HOME: "/tmp" },
    runCommand,
  });
  assert.equal(stopped.stopped, true);
  const restarted = await restartArtifactsServer({
    env: { HOME: "/tmp" },
    host: "127.0.0.1",
    port: 8787,
    runCommand,
    fetchHealth,
  });
  assert.equal(restarted.healthy, true);
  const status = await statusArtifactsServer({
    env: { HOME: "/tmp" },
    host: "127.0.0.1",
    port: 8787,
    runCommand,
    fetchHealth,
  });
  assert.equal(status.healthy, true);
  assert.ok(calls.some((line) => line.includes("systemctl --user start")));
  assert.ok(calls.some((line) => line.includes("systemctl --user stop")));
  assert.ok(calls.some((line) => line.includes("systemctl --user restart")));
  assert.ok(calls.some((line) => line.includes("systemctl") && /\bstatus\b/.test(line)));
  assert.ok(!calls.some((line) => line.includes("pnpm")));
});

test("setupNginxArtifacts runs the deploy script when root", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-nginx-"));
  const repo = path.join(dir, "repo");
  const deploy = path.join(repo, "extensions/services/artifacts-preview/deploy");
  await mkdir(deploy, { recursive: true });
  const script = path.join(deploy, "setup-nginx-artifacts.sh");
  await writeFile(script, "#!/bin/bash\n");
  const calls: string[] = [];
  const result = await setupNginxArtifacts({
    env: { HOME: dir },
    repoRoot: repo,
    getUid: () => 0,
    runCommand: async (command, args) => {
      calls.push([command, ...args].join(" "));
      return { exitCode: 0, stdout: "ok\n", stderr: "" };
    },
  });
  assert.equal(result.applied, true);
  assert.equal(result.sudo, false);
  assert.ok(calls.some((line) => line === `bash ${script}`));
  assert.match(result.command, /sudo bash .*setup-nginx-artifacts\.sh/);
});

test("setupNginxArtifacts prints exact sudo command when not root", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-nginx-"));
  const repo = path.join(dir, "repo");
  const deploy = path.join(repo, "extensions/services/artifacts-preview/deploy");
  await mkdir(deploy, { recursive: true });
  const script = path.join(deploy, "setup-nginx-artifacts.sh");
  await writeFile(script, "#!/bin/bash\n");
  await assert.rejects(
    () =>
      setupNginxArtifacts({
        env: { HOME: dir },
        repoRoot: repo,
        getUid: () => 1000,
        runCommand: async () => ({ exitCode: 1, stdout: "", stderr: "sudo: a password is required" }),
      }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /sudo bash '/);
      assert.match(error.message, /setup-nginx-artifacts\.sh/);
      assert.doesNotMatch(error.message, /location = \/health|nginx-snippet/);
      return true;
    },
  );
});

test("setupNginxArtifacts surfaces script failure when passwordless sudo ran", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-nginx-"));
  const repo = path.join(dir, "repo");
  const deploy = path.join(repo, "extensions/services/artifacts-preview/deploy");
  await mkdir(deploy, { recursive: true });
  await writeFile(path.join(deploy, "setup-nginx-artifacts.sh"), "#!/bin/bash\n");
  await assert.rejects(
    () =>
      setupNginxArtifacts({
        env: { HOME: dir },
        repoRoot: repo,
        getUid: () => 1000,
        runCommand: async () => ({
          exitCode: 1,
          stdout: "",
          stderr: "nginx: [emerg] unexpected end of file",
        }),
      }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /nginx: \[emerg\] unexpected end of file/);
      assert.doesNotMatch(error.message, /setup-nginx needs root/);
      return true;
    },
  );
});
