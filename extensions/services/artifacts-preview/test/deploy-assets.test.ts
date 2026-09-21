import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, access, constants } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");
const deployDir = path.join(pkgRoot, "deploy");
const repoRoot = path.resolve(pkgRoot, "../../..");

async function readDeploy(name: string): Promise<string> {
  return readFile(path.join(deployDir, name), "utf8");
}

test("deploy nginx include proxies /health, POST /artifacts, and /artifacts/ without stealing /teaching/", async () => {
  const conf = await readDeploy("nginx-artifacts.conf");
  assert.match(conf, /location\s+=\s+\/health\s*\{/);
  assert.match(conf, /location\s+=\s+\/artifacts\s*\{/);
  assert.match(conf, /location\s+\/artifacts\/\s*\{/);
  assert.match(conf, /POST \/artifacts/);
  assert.match(conf, /proxy_pass\s+http:\/\/127\.0\.0\.1:8787;/);
  assert.doesNotMatch(conf, /proxy_pass\s+http:\/\/127\.0\.0\.1:8787\//);
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

test("README is CLI-first and documents the locked server surface", async () => {
  const readme = await readFile(path.join(pkgRoot, "README.md"), "utf8");
  assert.match(readme, /edges artifacts server install/);
  assert.match(readme, /edges artifacts server start/);
  assert.match(readme, /edges artifacts server setup-nginx/);
  assert.match(readme, /edges artifacts server status/);
  assert.match(readme, /edges artifacts init --base-url http:\/\/182\.92\.131\.89 --token/);
  assert.match(readme, /install --force/);
  assert.match(readme, /server restart/);
  assert.doesNotMatch(readme, /edges artifacts server init/);
  assert.doesNotMatch(readme, /nginx-snippet|nginx-setup|configure-proxy/);
  assert.match(readme, /migrate-teaching-nginx-prefix\.py/);
  assert.match(readme, /teaching\.conf must contain `?\/teaching\/`?/);
  assert.match(readme, /\/etc\/nginx\/conf\.d\/teaching\.conf/);
});

test("bootstrap and nginx setup scripts are executable and restart without inventing a public 8787", async () => {
  const bootstrap = path.join(deployDir, "bootstrap.sh");
  const setup = path.join(deployDir, "setup-nginx-artifacts.sh");
  await access(bootstrap, constants.X_OK);
  await access(setup, constants.X_OK);

  const boot = await readFile(bootstrap, "utf8");
  assert.match(boot, /set -euo pipefail/);
  assert.match(boot, /artifacts server install/);
  assert.match(boot, /artifacts server restart/);
  assert.doesNotMatch(boot, /systemctl --user restart/);
  assert.doesNotMatch(boot, /nginx-snippet|nginx-setup|configure-proxy/);
  assert.match(boot, /XDG_RUNTIME_DIR/);

  const nginxSetup = await readFile(setup, "utf8");
  assert.match(nginxSetup, /TEACHING_CONF=/);
  assert.match(nginxSetup, /\/etc\/nginx\/conf\.d\/teaching\.conf/);
  assert.match(nginxSetup, /enable-linger/);
  assert.match(nginxSetup, /\/teaching\//);
  assert.match(nginxSetup, /nginx-artifacts\.conf/);
  assert.match(nginxSetup, /inject_nginx_include\.py/);
  assert.match(nginxSetup, /migrate-teaching-nginx-prefix\.py/);
  assert.doesNotMatch(nginxSetup, /TEACH_CONF|teach\.conf|\/teach\//);
  assert.doesNotMatch(nginxSetup, /nginx-snippet|configure-proxy/);

  const injectSrc = await readDeploy("inject_nginx_include.py");
  assert.match(injectSrc, /<teaching\.conf>/);
  assert.doesNotMatch(injectSrc, /teach\.conf|migrate-teach-nginx-prefix|TEACH_CONF/);
});

const INCLUDE_LINE = "include /etc/nginx/snippets/edges-artifacts.conf;";
const injectScript = path.join(deployDir, "inject_nginx_include.py");
const migrateScript = path.join(deployDir, "migrate-teaching-nginx-prefix.py");
const legacyTeachingFixture = path.join(here, "fixtures", "teaching.conf.legacy-prefix");

test("nginx include injector only patches server blocks that already serve /teaching/", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-nginx-"));
  const confPath = path.join(dir, "teaching.conf");
  await writeFile(
    confPath,
    [
      "server {",
      "    listen 80 default_server;",
      "    location /teaching/ { alias /var/www/teaching/; }",
      "}",
      "server {",
      "    listen 8080;",
      "    location /other/ { }",
      "}",
      "",
    ].join("\n"),
  );
  const first = spawnSync("python3", [injectScript, confPath, INCLUDE_LINE], { encoding: "utf8" });
  assert.equal(first.status, 0, first.stderr);
  const once = await readFile(confPath, "utf8");
  assert.equal(once.split(INCLUDE_LINE).length - 1, 1);
  assert.match(once, /location \/teaching\//);
  assert.match(once, /listen 8080;/);
  assert.doesNotMatch(once, /listen 8080;[\s\S]*edges-artifacts\.conf/);

  const second = spawnSync("python3", [injectScript, confPath, INCLUDE_LINE], { encoding: "utf8" });
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /already includes/);
  assert.equal((await readFile(confPath, "utf8")).split(INCLUDE_LINE).length - 1, 1);
  await rm(dir, { recursive: true, force: true });
});

test("nginx include injector refuses a file without /teaching/ and points at the teaching migrator", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-nginx-legacy-"));
  const confPath = path.join(dir, "teaching.conf");
  await writeFile(confPath, await readFile(legacyTeachingFixture, "utf8"));
  const result = spawnSync("python3", [injectScript, confPath, INCLUDE_LINE], { encoding: "utf8" });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /\/teaching\//);
  assert.match(result.stderr, /migrate-teaching-nginx-prefix\.py/);
  assert.doesNotMatch(result.stderr, /teach\.conf|dual-match|or \/teach\//);
  const unchanged = await readFile(confPath, "utf8");
  assert.equal(unchanged.split(INCLUDE_LINE).length - 1, 0);
  assert.doesNotMatch(unchanged, /location \/teaching\//);
  await rm(dir, { recursive: true, force: true });
});

test("teaching nginx prefix migrator rewrites both 80 and 443 servers toward /teaching/", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-teaching-prefix-"));
  const confPath = path.join(dir, "teaching.conf");
  await writeFile(confPath, await readFile(legacyTeachingFixture, "utf8"));

  const first = spawnSync("python3", [migrateScript, confPath], { encoding: "utf8" });
  assert.equal(first.status, 0, first.stderr);
  const migrated = await readFile(confPath, "utf8");
  assert.equal((migrated.match(/location \/teaching\//g) || []).length, 2);
  assert.match(migrated, /listen 80[\s\S]*location = \/\s*\{\s*return 30[12] \/teaching\//);
  assert.match(migrated, /listen 443[\s\S]*location = \/\s*\{\s*return 30[12] \/teaching\//);
  assert.match(migrated, /listen 80[\s\S]*rewrite \^\/teach\/\(\.\*\)\$ \/teaching\/\$1 permanent;/);
  assert.match(migrated, /listen 443[\s\S]*rewrite \^\/teach\/\(\.\*\)\$ \/teaching\/\$1 permanent;/);
  assert.match(migrated, /ssl_certificate /);
  assert.match(migrated, /root \/home\/cheng-dev\/projects\/edges\/knowledge;/);
  assert.match(migrated, /location \/teaching\/\s*\{\s*try_files \$uri \$uri\/ =404;/);

  const second = spawnSync("python3", [migrateScript, confPath], { encoding: "utf8" });
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /already|unchanged|idempotent/i);
  assert.equal(await readFile(confPath, "utf8"), migrated);

  const injected = spawnSync("python3", [injectScript, confPath, INCLUDE_LINE], { encoding: "utf8" });
  assert.equal(injected.status, 0, injected.stderr);
  const after = await readFile(confPath, "utf8");
  assert.equal(after.split(INCLUDE_LINE).length - 1, 2);
  const servers = after.split(/^[ \t]*server[ \t]*\{/m).slice(1);
  assert.equal(servers.length, 2);
  assert.match(servers[0], /listen 80/);
  assert.match(servers[0], /edges-artifacts\.conf;/);
  assert.match(servers[1], /listen 443/);
  assert.match(servers[1], /edges-artifacts\.conf;/);
  assert.match(after, /location \/teaching\//);
  assert.match(after, /rewrite \^\/teach\/\(\.\*\)\$ \/teaching\/\$1 permanent;/);
  await rm(dir, { recursive: true, force: true });
});

test("deploy.yml still full-repo pulls then CLI-installs and restarts artifacts when env exists", async () => {
  const workflow = await readFile(path.join(repoRoot, ".github/workflows/deploy.yml"), "utf8");
  assert.match(workflow, /git reset --hard origin\/main/);
  assert.match(workflow, /artifacts-preview\.env/);
  assert.match(workflow, /replace-with-shared-token/);
  assert.match(workflow, /artifacts server install/);
  assert.match(workflow, /artifacts server restart/);
  assert.doesNotMatch(workflow, /nginx-snippet|nginx-setup|configure-proxy/);
  assert.doesNotMatch(workflow, /artifacts server setup-nginx/);
  assert.match(workflow, /^name:\s*Deploy\s*$/m);
  const deployJob = workflow.split(/\n {2}site-teaching:/)[0];
  assert.match(deployJob, /\n {2}deploy:[\s\S]*\n {4}environment:\s*production\s*\n/);
  assert.doesNotMatch(deployJob, /\n\s*url:/);
  assert.equal(workflow.match(/git reset --hard origin\/main/g)?.length, 1);
  assert.match(
    workflow,
    /site-teaching:\s*\n {4}needs:\s*\[deploy\][\s\S]*?\n {6}name:\s*teaching\s*\n {6}url:\s*https:\/\/edges\.viruspc\.tech\/teaching\//,
  );
  assert.match(
    workflow,
    /site-tasks:\s*\n {4}needs:\s*\[deploy\][\s\S]*?\n {6}name:\s*tasks\s*\n {6}url:\s*https:\/\/edges\.viruspc\.tech\/tasks\//,
  );
  assert.doesNotMatch(workflow, /teach\.viruspc\.tech/);
  assert.doesNotMatch(workflow, /182\.92\.131\.89/);
  assert.match(workflow, /concurrency:\s*\n\s*group:\s*ecs-edges-pull/s);
  assert.doesNotMatch(workflow, /^\s*rsync\b/m);
  assert.match(workflow, /do not rsync-push a path subset/);
});
