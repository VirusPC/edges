# edges-artifacts-preview

Short-lived static **Artifacts 预览服务** (ADR 0013): upload → public URL → TTL delete.

This package is the HTTP process. The thin command surface is `edges artifacts` in [`../../clis`](../../clis/). `edges tasks project review-page` stays render-only; Skill orchestration is render → `edges artifacts publish` → give the human the URL. Capability Surface is CLI + Skill + MCP; this round has no artifacts MCP.

Phone review needs a **reachable** `EDGES_ARTIFACTS_BASE_URL` (ECS / public host). Localhost only works on the same machine.

## Run locally

```bash
# 1. Create ~/.config/edges/artifacts.env and print the server env
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

Same Node process as local. Phone review uses the **public IP http** origin (the same pattern teach used before 备案). Do not put `:8787` in printed URLs; nginx on :80 reverse-proxies `/health` and `/artifacts/` to loopback. Leave `/teaching/` as it is. `teach.viruspc.tech` exists but 备案 is a separate concern — do not invent Cloudflare or 备案 steps here.

`edges artifacts publish` only uploads to whatever `EDGES_ARTIFACTS_BASE_URL` points at. It does not deploy the service.

The host process CLI is `edges artifacts server` (`init`, `install`, `start` / `stop` / `restart`, `status`). `install` does not start. nginx reverse-proxy is host ops, not a CLI verb — static files live in [`deploy/`](deploy/) (`nginx-artifacts.conf` plus the one-shot sudo script). Token stays on the server (and in your local CLI config). Never commit `EDGES_ARTIFACTS_TOKEN`.

### One-time on the ECS

1. **Node ≥ 20 + pnpm** on `cheng-dev` PATH (user systemd cannot sudo-install them). `corepack enable` then `corepack prepare pnpm@latest --activate` is enough if Node is already there.
2. **Server env** (no sudo; writes token + listen/public URL only):

   ```bash
   edges artifacts server init --base-url http://182.92.131.89
   # or copy deploy/artifacts.env.example → ~/.config/edges/artifacts-preview.env
   # and paste the shared token — do not leave replace-with-shared-token
   ```

3. **Install then start the user unit** (no sudo; two commands, never combined):

   ```bash
   edges artifacts server install
   edges artifacts server start
   edges artifacts server status
   ```

   `deploy/bootstrap.sh` is a thin wrapper of `install` then `restart` (used by humans after a manual pull). Do not open a public 8787 security-group port.

4. **Expose on :80** (sudo once, separately; assistants cannot inject the password — same as `~/setup-teach-nginx80.sh`):

   ```bash
   sudo bash ~/projects/edges/extensions/services/artifacts-preview/deploy/setup-nginx-artifacts.sh
   ```

   That installs `deploy/nginx-artifacts.conf` into `/etc/nginx/snippets/` and `include`s it inside `/etc/nginx/conf.d/teach.conf` (the server that already serves `/teaching/`). It also `loginctl enable-linger` so the user unit survives deploy SSH logout.

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
edges artifacts init --base-url http://182.92.131.89
# or, if a token already exists:
# edit ~/.config/edges/artifacts.env so BASE_URL is http://182.92.131.89
# and TOKEN matches the ECS file

edges artifacts publish /tmp/review.html
```

`init` stderr may still mention `EDGES_ARTIFACTS_HOST=0.0.0.0` (old “expose 8787” hint). Behind this nginx proxy the server env must stay `127.0.0.1`. Phone opens the printed `http://182.92.131.89/artifacts/<uuid>/` in a system browser, not localhost.

### After each main pull

GitHub Actions [`.github/workflows/deploy-teach.yml`](../../../.github/workflows/deploy-teach.yml) already SSH-pulls the full repo (`git fetch` / `reset --hard origin/main`, concurrency `ecs-edges-pull`). **Only when** `~/.config/edges/artifacts-preview.env` exists, it runs `edges artifacts server install` then `edges artifacts server restart` (skipped until the one-time token file is in place, so teach deploys stay green). After the env exists, a failure fails the job so the restart is visible; the tree is already at `origin/main`.

If `git fetch` from the ECS is flaky: keep the Action as primary (it already works for teach). Fallback is a full-repo tar over SSH from a machine that can reach both GitHub and the box, then the same two CLI commands (or `deploy/bootstrap.sh`) — do not rsync a path subset.

Server env (see [`deploy/artifacts.env.example`](deploy/artifacts.env.example)):

```
EDGES_ARTIFACTS_TOKEN=<shared token from init>
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
