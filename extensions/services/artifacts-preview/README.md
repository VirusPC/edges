# edges-artifacts-preview

Short-lived static **Artifacts 预览服务** (ADR 0013): upload → public URL → TTL delete.

This package is the HTTP process. The thin command surface is `edges artifacts` in [`../../clis`](../../clis/). `edges tasks project review-page` stays render-only; Skill orchestration is render → `edges artifacts publish` → give the human the URL. Capability Surface is CLI + Skill + MCP; this round has no artifacts MCP.

Phone review needs a **reachable** `EDGES_ARTIFACTS_BASE_URL` (ECS / public host). Localhost only works on the same machine.

## Run locally

```bash
# 1. Create ~/.config/edges/artifacts.env (local token + base URL)
pnpm --filter edges-cli exec tsx src/index.ts artifacts init

# 2. Start this service with the printed token
EDGES_ARTIFACTS_TOKEN=… \
EDGES_ARTIFACTS_BASE_URL=http://127.0.0.1:8787 \
pnpm --filter edges-artifacts-preview dev

# 3. Publish a file or directory; stdout JSON includes url
pnpm --filter edges-cli exec tsx src/index.ts artifacts publish /tmp/review.html
pnpm --filter edges-cli exec tsx src/index.ts artifacts rm <id-or-url>
```

After `pnpm --filter edges-artifacts-preview build`, `start` runs `node dist/index.js`. Root scripts: `pnpm dev:artifacts` / `pnpm start:artifacts`.

## ECS / reachable URL (Aliyun, same box as teach)

Same Node process as local. Phone review uses the **public IP http** origin (the same pattern teach used before 备案). Do not put `:8787` in printed URLs; nginx on :80 reverse-proxies `/health` and `/artifacts/` to loopback. Leave `/teaching/` as it is. This ECS must serve the teach site at **`/teaching/`** (not `/teach/`). `teach.viruspc.tech` exists but 备案 is a separate concern — do not invent Cloudflare or 备案 steps here.

`edges artifacts publish` only uploads to whatever `EDGES_ARTIFACTS_BASE_URL` points at. It does not deploy the service.

The host process CLI is `edges artifacts server`:

```
edges artifacts server install [--force]
edges artifacts server start | stop | restart
edges artifacts server status
edges artifacts server setup-nginx
```

There is no `server init` (client `edges artifacts init` is the laptop command). `install` ensures `~/.config/edges/artifacts-preview.env` (creates a token if missing; `--force` may rotate), runs pnpm install/build, and installs + enables the user unit. It does **not** start. Never combine install and start. Token stays on the server (and in your local CLI config). Never commit `EDGES_ARTIFACTS_TOKEN`. Thin scripts under [`deploy/`](deploy/) are called by the CLI; do not treat them as the public surface.

### First time on the ECS

1. **Node ≥ 20 + pnpm** on `cheng-dev` PATH (user systemd cannot sudo-install them). `corepack enable` then `corepack prepare pnpm@latest --activate` is enough if Node is already there.
2. **Install (config + unit, no process):**

   ```bash
   edges artifacts server install
   ```

   Share the printed token with the laptop client. Do not open a public 8787 security-group port.

3. **Start, then expose :80, then check:**

   ```bash
   edges artifacts server start
   edges artifacts server setup-nginx
   edges artifacts server status
   ```

   `setup-nginx` installs `deploy/nginx-artifacts.conf` into `/etc/nginx/snippets/` and `include`s it inside `/etc/nginx/conf.d/teach.conf`. **teach.conf must contain `/teaching/`** — the injector matches that prefix only (same as today). If the box still has legacy `location /teach/`, rename the path to `/teaching/` first; do not teach `inject_nginx_include.py` to accept `/teach/`:

   ```bash
   sudo python3 /home/cheng-dev/projects/edges/extensions/services/artifacts-preview/deploy/migrate-teach-nginx-prefix.py /etc/nginx/conf.d/teach.conf
   sudo nginx -t && sudo systemctl reload nginx
   edges artifacts server setup-nginx
   ```

   The migrator keeps 80 + 443 server blocks, turns serving `location /teach/` into `location /teaching/`, and adds `/` plus legacy `/teach/` redirects. Location reference: [`deploy/teach-locations.conf`](deploy/teach-locations.conf). `setup-nginx` also `loginctl enable-linger` so the user unit survives deploy SSH logout. If sudo is needed, the CLI prints the exact `sudo bash …/setup-nginx-artifacts.sh` command. There is no user-facing `apply.sh`.

### Confirm

On the ECS:

```bash
curl -fsS http://127.0.0.1:8787/health
```

From a phone or any outside machine (no extra port):

```bash
curl -fsS http://182.92.131.89/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://182.92.131.89/teaching/
```

`/health` must be JSON `{"ok":true}`. `/teaching/` must still be the teach site.

Write-path smoke (uses the shared token; do not paste the token into the repo):

```bash
# on a machine that has the token; expect 201 then a GET 200
curl -fsS -X POST http://182.92.131.89/artifacts \
  -H "authorization: Bearer $EDGES_ARTIFACTS_TOKEN" \
  -H "content-type: application/json" \
  -d '{"files":[{"path":"index.html","content":"<html>ok</html>"}]}'
```

`edges artifacts publish` is the same `POST /artifacts` (no trailing slash). If that 301s to `/artifacts/`, `deploy/nginx-artifacts.conf` is wrong.

### Laptop / local CLI (publish client)

Use the **same token** as the server env file:

```bash
edges artifacts init --base-url http://182.92.131.89 --token <token from server install>

edges artifacts publish /tmp/review.html
```

Phone opens the printed `http://182.92.131.89/artifacts/<uuid>/` in a system browser, not localhost.

### After each main pull

GitHub Actions [`.github/workflows/deploy-teach.yml`](../../../.github/workflows/deploy-teach.yml) already SSH-pulls the full repo (`git fetch` / `reset --hard origin/main`, concurrency `ecs-edges-pull`). **Only when** `~/.config/edges/artifacts-preview.env` exists, it runs `edges artifacts server install` then `edges artifacts server restart` (skipped until the one-time token file is in place, so teach deploys stay green). After the env exists, a failure fails the job so the restart is visible; the tree is already at `origin/main`. nginx is usually unchanged — do not re-run `setup-nginx` from the Action.

If the unit files did not change, `restart` alone is enough; `install` then `restart` is the conservative path the Action uses.

If `git fetch` from the ECS is flaky: keep the Action as primary (it already works for teach). Fallback is a full-repo tar over SSH from a machine that can reach both GitHub and the box, then the same CLI verbs (or `deploy/bootstrap.sh`, a thin wrapper of `install` then `restart`) — do not rsync a path subset.

Rotate the token: `edges artifacts server install --force`, then `edges artifacts server restart`, then client `edges artifacts init --base-url http://182.92.131.89 --token <printed token> --force`.

Server env (see [`deploy/artifacts.env.example`](deploy/artifacts.env.example)):

```
EDGES_ARTIFACTS_TOKEN=<shared token from install>
EDGES_ARTIFACTS_BASE_URL=http://182.92.131.89
EDGES_ARTIFACTS_HOST=127.0.0.1
EDGES_ARTIFACTS_PORT=8787
EDGES_ARTIFACTS_DATA_DIR=/home/cheng-dev/.local/share/edges-artifacts
```

`EDGES_ARTIFACTS_BASE_URL` is what `publish` prints (no trailing slash). If a phone must open the page, this cannot be `http://127.0.0.1` or `localhost`.

## HTTP

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/health` | no |
| `POST` | `/artifacts` | Bearer token |
| `GET` | `/artifacts/:id/` and `/artifacts/:id/:relpath` | no (UUID path + TTL) |
| `DELETE` | `/artifacts/:id` | Bearer token |

Default TTL is 24h (`ttlSeconds` on POST, or `edges artifacts publish --ttl 2h`). `from` is optional. When present, v1 only allows `{ type: "task", id, project }` (`id` is the edges task stem; both required). Persist only `id`, `entry`, `expiresAt`, and optional `from` in `meta.json`; echo `from` on 201 only when set. CLI: `--from-type task --from-id <stem> --task-project <slug>` (all three together, or omit `from`). No `--from-name`, `--task-stem`, or default `cli`/`edges-cli`. Server sweeps expired artifacts about every 60s and also on GET. Writes stay under a disk temp dir (`0700` / files `0600`); relative paths cannot traverse or follow symlinks out (every path component is `lstat`’d). On ECS set `EDGES_ARTIFACTS_DATA_DIR` to a user-owned directory (default in the env example: `~/.local/share/edges-artifacts`), not a world-writable `/tmp`.

## Tests

```bash
pnpm --filter edges-artifacts-preview test
```
