import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";
import {
  installArtifactsServer,
  restartArtifactsServer,
  startArtifactsServer,
  statusArtifactsServer,
  stopArtifactsServer,
} from "../../src/artifacts/server/ops.js";

test("artifacts help lists server", async () => {
  const result = await run(["artifacts", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /^\s+server\b/m);
});

test("artifacts server help lists init install start stop restart status only", async () => {
  const result = await run(["artifacts", "server", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["init", "install", "start", "stop", "restart", "status"]) {
    assert.match(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
  }
  assert.doesNotMatch(result.stdout, /^\s+nginx-/m);
});

test("artifacts server init writes preview env and does not start a process", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-server-"));
  const configPath = path.join(dir, "artifacts-preview.env");
  const result = await run(
    [
      "artifacts",
      "server",
      "init",
      "--config",
      configPath,
      "--base-url",
      "http://182.92.131.89",
    ],
    { env: { HOME: dir } },
  );
  assert.equal(result.exitCode, 0, result.stderr);
  const payload = JSON.parse(result.stdout) as {
    status: string;
    command: string;
    configPath: string;
    baseUrl: string;
    host: string;
    port: number;
    tokenCreated: boolean;
  };
  assert.equal(payload.status, "success");
  assert.equal(payload.command, "artifacts.server.init");
  assert.equal(payload.configPath, configPath);
  assert.equal(payload.baseUrl, "http://182.92.131.89");
  assert.equal(payload.host, "127.0.0.1");
  assert.equal(payload.port, 8787);
  assert.equal(payload.tokenCreated, true);
  const raw = await readFile(configPath, "utf8");
  assert.match(raw, /EDGES_ARTIFACTS_TOKEN=[0-9a-f]{64}/);
  assert.match(raw, /EDGES_ARTIFACTS_BASE_URL=http:\/\/182\.92\.131\.89/);
  assert.match(raw, /EDGES_ARTIFACTS_HOST=127\.0\.0\.1/);
  assert.match(raw, /EDGES_ARTIFACTS_PORT=8787/);
  assert.match(raw, /EDGES_ARTIFACTS_DATA_DIR=/);
  assert.equal((await stat(configPath)).mode & 0o777, 0o600);
  assert.match(result.stderr, /EDGES_ARTIFACTS_TOKEN=/);
  assert.match(result.stderr, /edges artifacts server install/);
  assert.match(result.stderr, /edges artifacts server start/);
  assert.doesNotMatch(result.stderr, /nginx-snippet|nginx-setup/);
  assert.doesNotMatch(result.stderr, /install-and-start|install and start/i);
});

test("artifacts server init refuses to overwrite a token without --force", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-server-"));
  const configPath = path.join(dir, "artifacts-preview.env");
  const first = await run(
    ["artifacts", "server", "init", "--config", configPath, "--base-url", "http://182.92.131.89"],
    { env: { HOME: dir } },
  );
  assert.equal(first.exitCode, 0, first.stderr);
  const second = await run(
    ["artifacts", "server", "init", "--config", configPath, "--base-url", "http://182.92.131.89"],
    { env: { HOME: dir } },
  );
  assert.equal(second.exitCode, 2);
  const payload = JSON.parse(second.stdout) as { errorCode: string };
  assert.equal(payload.errorCode, "VALIDATION_ERROR");
});

test("artifacts server has no nginx subcommand", async () => {
  const snippet = await run(["artifacts", "server", "nginx-snippet"]);
  assert.notEqual(snippet.exitCode, 0);
  const setup = await run(["artifacts", "server", "nginx-setup"]);
  assert.notEqual(setup.exitCode, 0);
});

test("artifacts server install fails when the server env file is missing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-server-"));
  const result = await run(["artifacts", "server", "install"], {
    env: { HOME: dir, EDGES_REPO: dir },
  });
  assert.equal(result.exitCode, 2);
  const payload = JSON.parse(result.stdout) as { errorCode: string; reason: string };
  assert.equal(payload.errorCode, "VALIDATION_ERROR");
  assert.match(payload.reason, /artifacts-preview\.env/);
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
      "EDGES_ARTIFACTS_BASE_URL=http://182.92.131.89",
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
  assert.ok(calls.some((line) => line.includes("pnpm") && line.includes("edges-artifacts-preview")));
  assert.ok(calls.some((line) => line.includes("systemctl --user enable")));
  assert.ok(calls.some((line) => line.includes("systemctl --user daemon-reload")));
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
