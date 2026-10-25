import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../../src/program.js";
import { initEdgesConfig } from "../../src/services/config/edges-env.js";
import {
  installEvaluationServer,
  startEvaluationServer,
  statusEvaluationServer,
  stopEvaluationServer,
} from "../../src/services/evaluation/server/ops.js";

const UNIT = `[Unit]
Description=Edges evaluation server
ConditionPathExists=%h/.config/edges/edges.env

[Service]
Type=simple
WorkingDirectory=@SERVICE_DIR@
Environment=PYTHONPATH=@SERVICE_DIR@
EnvironmentFile=%h/.config/edges/edges.env
ExecStart=/usr/bin/python3 -m experiment_webhook
Restart=on-failure

[Install]
WantedBy=default.target
`;

async function fixtureRepo(dir: string): Promise<string> {
  const repo = path.join(dir, "repo");
  const deploy = path.join(repo, "packages/services/evaluation/deploy");
  await mkdir(deploy, { recursive: true });
  await writeFile(path.join(deploy, "edges-evaluation.service"), UNIT);
  return repo;
}

test("evaluation server help lists install start stop restart status", async () => {
  const result = await run(["evaluation", "server", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["install", "start", "stop", "restart", "status"]) {
    assert.match(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
  }
  assert.match(result.stdout, /--dev/);
  assert.match(result.stdout, /edges config init/);
  assert.match(result.stdout, /Never combine install and start/);
});

test("evaluation server without a verb is a usage error", async () => {
  const result = await run(["evaluation", "server"]);
  assert.equal(result.exitCode, 2);
  assert.match(result.stdout, /missing evaluation server subcommand/);
});

test("install and start fail closed when edges.env is missing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-eval-missing-"));
  const env = { HOME: dir };
  const calls: string[] = [];
  const repo = await fixtureRepo(dir);
  await assert.rejects(
    () =>
      installEvaluationServer({
        env,
        repoRoot: repo,
        runCommand: async (command, args) => {
          calls.push([command, ...args].join(" "));
          return { exitCode: 0, stdout: "", stderr: "" };
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /edges config init/);
      assert.match(error.message, /artifacts-preview\.env/);
      return true;
    },
  );
  assert.deepEqual(calls, []);
  const cli = await run(["evaluation", "server", "start", "--dev"], { env });
  assert.equal(cli.exitCode, 2);
  assert.match(cli.stdout, /edges config init/);
  assert.match(cli.stdout, /artifacts-preview\.env/);
});

test("install enables the user unit and does not start it", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-eval-install-"));
  const env = { HOME: dir };
  const repo = await fixtureRepo(dir);
  await initEdgesConfig({ env });
  const calls: string[] = [];
  const installed = await installEvaluationServer({
    env,
    repoRoot: repo,
    runCommand: async (command, args) => {
      calls.push([command, ...args].join(" "));
      return { exitCode: 0, stdout: "ok\n", stderr: "" };
    },
  });
  assert.equal(installed.started, false);
  assert.equal(installed.unit, "edges-evaluation.service");
  assert.equal(installed.host, "127.0.0.1");
  assert.equal(installed.port, 8791);
  assert.ok(calls.some((line) => line.includes("systemctl --user enable")));
  assert.ok(calls.some((line) => line.includes("daemon-reload")));
  assert.ok(!calls.some((line) => /\b(start|restart|stop)\b/.test(line)));
  const unit = await readFile(path.join(dir, ".config/systemd/user/edges-evaluation.service"), "utf8");
  const serviceDir = path.join(repo, "packages/services/evaluation");
  assert.match(unit, new RegExp(`WorkingDirectory=${serviceDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(unit, /ExecStart=\/usr\/bin\/python3 -m experiment_webhook/);
  assert.match(unit, /EnvironmentFile=%h\/\.config\/edges\/edges\.env/);
  assert.doesNotMatch(unit, /@SERVICE_DIR@/);
  assert.doesNotMatch(unit, /artifacts-preview\.env/);
  const raw = await readFile(installed.configPath, "utf8");
  assert.match(raw, /EXPERIMENT_WEBHOOK_HOST=127\.0\.0\.1/);
  assert.match(raw, /EXPERIMENT_WEBHOOK_PORT=8791/);
});

test("default start uses systemd and --dev runs python in the service directory", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-eval-start-"));
  const env = { HOME: dir, LANGFUSE_WEBHOOK_SECRET: "from-process" };
  const repo = await fixtureRepo(dir);
  await initEdgesConfig({ env });
  const configPath = path.join(dir, ".config", "edges", "edges.env");
  await writeFile(
    configPath,
    [
      "EXPERIMENT_WEBHOOK_HOST=127.0.0.1",
      "EXPERIMENT_WEBHOOK_PORT=8791",
      "LANGFUSE_WEBHOOK_SECRET=from-file",
      "LANGFUSE_HOST=https://langfuse.example",
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  const calls: string[] = [];
  const fetchHealth = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
  const started = await startEvaluationServer({
    env,
    repoRoot: repo,
    fetchHealth,
    runCommand: async (command, args) => {
      calls.push([command, ...args].join(" "));
      return { exitCode: 0, stdout: "active\n", stderr: "" };
    },
  });
  assert.equal(started.mode, "systemd");
  assert.equal(started.healthy, true);
  assert.ok(calls.some((line) => line.includes("systemctl --user start edges-evaluation.service")));
  assert.ok(!calls.some((line) => line.includes("python3")));

  let spec: { command: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv } | undefined;
  const dev = await startEvaluationServer({
    env,
    repoRoot: repo,
    dev: true,
    runForeground: async (next) => {
      spec = next;
      return { exitCode: 0 };
    },
    runCommand: async () => {
      throw new Error("systemd should not run for --dev");
    },
  });
  assert.equal(dev.mode, "dev");
  assert.ok(spec);
  assert.equal(spec.command, "python3");
  assert.deepEqual(spec.args, ["-m", "experiment_webhook"]);
  assert.equal(spec.cwd, path.join(repo, "packages/services/evaluation"));
  assert.equal(spec.env.LANGFUSE_WEBHOOK_SECRET, "from-process");
  assert.equal(spec.env.LANGFUSE_HOST, "https://langfuse.example");
  assert.match(spec.env.PYTHONPATH ?? "", /packages\/services\/evaluation/);

  const stopped = await stopEvaluationServer({
    env,
    runCommand: async (command, args) => {
      calls.push([command, ...args].join(" "));
      return { exitCode: 0, stdout: "inactive\n", stderr: "" };
    },
  });
  assert.equal(stopped.stopped, true);

  const status = await statusEvaluationServer({
    env,
    fetchHealth,
    runCommand: async (command, args) => {
      calls.push([command, ...args].join(" "));
      return { exitCode: 0, stdout: "active\n", stderr: "" };
    },
  });
  assert.equal(status.healthy, true);
});

test("shipped unit template is the user unit and names edges.env", async () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
  const unit = await readFile(
    path.join(repoRoot, "packages/services/evaluation/deploy/edges-evaluation.service"),
    "utf8",
  );
  assert.match(unit, /WantedBy=default\.target/);
  assert.match(unit, /EnvironmentFile=%h\/\.config\/edges\/edges\.env/);
  assert.match(unit, /python3 -m experiment_webhook/);
  assert.match(unit, /@SERVICE_DIR@/);
  assert.doesNotMatch(unit, /artifacts-preview\.env/);
});
