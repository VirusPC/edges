import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, access, constants, mkdir, chmod } from "node:fs/promises";
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
  assert.match(env, /^EDGES_ARTIFACTS_BASE_URL=https:\/\/edges\.viruspc\.tech$/m);
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
  assert.match(readme, /edges artifacts init --base-url https:\/\/edges\.viruspc\.tech --token/);
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
  assert.match(migrated, /location \/teaching\/\s*\{\s*root \/home\/cheng-dev\/projects\/edges;\s*try_files \$uri \$uri\/ =404;/);

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


test("teaching migration updates inherited and explicit physical roots while preserving other locations", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-teaching-roots-"));
  try {
    const conf = path.join(dir, "teaching.conf");
    const original = await readFile(path.join(here, "fixtures/teaching.conf.legacy-roots"), "utf8");
    await writeFile(conf, original);
    const result = spawnSync("python3", [migrateScript, conf], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const changed = await readFile(conf, "utf8");
    assert.equal((changed.match(/location \/teaching\/ \{\s*root \/srv\/edges;/g) || []).length, 2);
    assert.match(changed, /location \/teaching\/assets\/ \{ alias \/srv\/edges\/teaching\/assets\/;/);
    assert.match(changed, /location \/other\/ \{ root \/srv\/edges\/knowledge; \}/);
    assert.match(changed, /location \/assets\/ \{ alias \/srv\/edges\/knowledge\/teaching\/assets\/; \}/);
    assert.ok(changed.endsWith(original.slice(original.lastIndexOf("server {"))));
    assert.equal((changed.split("server {")[1]!.match(/location = \/ \{/g) || []).length, 1);
    assert.match(changed, /location = \/ \{ return 200 "other homepage"; \}/);
    assert.match(changed, /listen 80;\s*# shared root for unrelated locations\s*root \/srv\/edges\/knowledge;/);
    const again = spawnSync("python3", [migrateScript, conf], { encoding: "utf8" });
    assert.equal(again.status, 0, again.stderr);
    assert.equal(await readFile(conf, "utf8"), changed);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("deployment layout migration updates existing sites and restores both configs when nginx validation fails", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-deploy-layout-"));
  try {
    const conf = path.join(dir, "teaching.conf");
    const tasks = path.join(dir, "tasks.conf");
    const bin = path.join(dir, "bin");
    await mkdir(bin);
    const log = path.join(dir, "nginx.log");
    await writeFile(path.join(bin, "nginx"), '#!/bin/sh\nprintf "%s\n" "$*" >> "$NGINX_LOG"\nif [ "$*" = "-t" ]; then exit "${NGINX_STATUS:-0}"; fi\n');
    await chmod(path.join(bin, "nginx"), 0o755);
    const before = await readFile(path.join(here, "fixtures/teaching.conf.legacy-roots"), "utf8");
    const beforeTasks = "location /tasks/ { alias /srv/edges/knowledge/tasks/_site/; }\n# leave /srv/edges/knowledge alone\n";
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, TEACHING_CONF: conf, TASKS_CONF: tasks, NGINX_LOG: log };
    const script = path.join(deployDir, "migrate-site-layout.sh");
    for (const status of ["1", "0"]) {
      await writeFile(conf, before);
      await writeFile(tasks, beforeTasks);
      await writeFile(log, "");
      const result = spawnSync("bash", [script], { env: { ...env, NGINX_STATUS: status }, encoding: "utf8" });
      if (status === "1") {
        assert.notEqual(result.status, 0);
        assert.equal(await readFile(conf, "utf8"), before);
        assert.equal(await readFile(tasks, "utf8"), beforeTasks);
        assert.equal(await readFile(log, "utf8"), "-t\n");
      } else {
        assert.equal(result.status, 0, result.stderr);
        assert.match(await readFile(conf, "utf8"), /root \/srv\/edges;/);
        assert.equal(await readFile(tasks, "utf8"), "location /tasks/ { alias /srv/edges/tasks/_site/; }\n# leave /srv/edges/knowledge alone\n");
        assert.equal(await readFile(log, "utf8"), "-t\n-s reload\n");
        const again = spawnSync("bash", [script], { env, encoding: "utf8" });
        assert.equal(again.status, 0, again.stderr);
        assert.equal(await readFile(log, "utf8"), "-t\n-s reload\n");
      }
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
