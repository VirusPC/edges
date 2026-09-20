import test from "node:test";
import assert from "node:assert/strict";
import { access, constants, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const deployDir = path.join(pkgRoot, "deploy");
const repoRoot = path.resolve(pkgRoot, "../../..");

async function readDeploy(name: string): Promise<string> {
  return readFile(path.join(deployDir, name), "utf8");
}

test("deploy nginx snippet proxies /health and /artifacts/ without stealing /teaching/", async () => {
  const conf = await readDeploy("nginx-artifacts-proxy.conf");
  assert.match(conf, /location\s+=\s+\/health\s*\{/);
  assert.match(conf, /location\s+\/artifacts\/\s*\{/);
  assert.match(conf, /proxy_pass\s+http:\/\/127\.0\.0\.1:8787/);
  assert.match(conf, /\/teaching\//);
  assert.doesNotMatch(conf, /^\s*listen\s+/m);
  assert.doesNotMatch(conf, /^\s*default_server/m);
});

test("deploy env example has placeholders only and binds loopback", async () => {
  const env = await readDeploy("artifacts.env.example");
  assert.match(env, /^EDGES_ARTIFACTS_TOKEN=replace-with-shared-token$/m);
  assert.match(env, /^EDGES_ARTIFACTS_BASE_URL=http:\/\/182\.92\.131\.89$/m);
  assert.match(env, /^EDGES_ARTIFACTS_HOST=127\.0\.0\.1$/m);
  assert.match(env, /^EDGES_ARTIFACTS_PORT=8787$/m);
  assert.doesNotMatch(env, /EDGES_ARTIFACTS_TOKEN=[0-9a-f]{32,}/i);
});

test("deploy unit is a systemd user unit that loads the server env file", async () => {
  const unit = await readDeploy("edges-artifacts-preview.service");
  assert.match(unit, /WantedBy=default\.target/);
  assert.doesNotMatch(unit, /WantedBy=multi-user\.target/);
  assert.match(unit, /EnvironmentFile=%h\/\.config\/edges\/artifacts-preview\.env/);
  assert.match(unit, /artifacts-preview\/dist\/index\.js/);
});

test("bootstrap and nginx setup scripts are executable and restart without inventing a public 8787", async () => {
  const bootstrap = path.join(deployDir, "bootstrap.sh");
  const setup = path.join(deployDir, "setup-nginx-artifacts.sh");
  await access(bootstrap, constants.X_OK);
  await access(setup, constants.X_OK);

  const boot = await readFile(bootstrap, "utf8");
  assert.match(boot, /set -euo pipefail/);
  assert.match(boot, /pnpm/);
  assert.match(boot, /edges-artifacts-preview/);
  assert.match(boot, /systemctl --user/);
  assert.match(boot, /XDG_RUNTIME_DIR/);
  assert.match(boot, /127\.0\.0\.1:8787\/health/);

  const nginxSetup = await readFile(setup, "utf8");
  assert.match(nginxSetup, /\/etc\/nginx\/conf\.d\/teach\.conf/);
  assert.match(nginxSetup, /enable-linger/);
  assert.match(nginxSetup, /\/teaching\//);
  assert.match(nginxSetup, /edges-artifacts-proxy\.conf/);
});

test("deploy-teach.yml still full-repo pulls then bootstraps artifacts when env exists", async () => {
  const workflow = await readFile(path.join(repoRoot, ".github/workflows/deploy-teach.yml"), "utf8");
  assert.match(workflow, /git reset --hard origin\/main/);
  assert.match(workflow, /artifacts-preview\.env/);
  assert.match(workflow, /deploy\/bootstrap\.sh/);
  assert.match(workflow, /environment:\s*\n\s*name:\s*production/s);
  assert.match(workflow, /url:\s*http:\/\/182\.92\.131\.89\/teaching\//);
  assert.match(workflow, /concurrency:\s*\n\s*group:\s*ecs-edges-pull/s);
  assert.doesNotMatch(workflow, /^\s*rsync\b/m);
  assert.match(workflow, /do not rsync-push a path subset/);
});
