# Persistent `/tasks/` board (ops)

Public URL: [https://edges.viruspc.tech/tasks/](https://edges.viruspc.tech/tasks/) and [https://edges.viruspc.tech/teaching/](https://edges.viruspc.tech/teaching/) (Cloudflare Tunnel to the same Aliyun ECS nginx). Decision: [ADR 0021](../../../docs/adr/0021-persistent-tasks-board-site.md).

This is generated HTML only. It is not Artifacts (`publish` / UUID / TTL) and not a new status-station product. `edges tasks project review-page` still only renders.

## Generate (every deploy)

After `git fetch` / `reset --hard origin/main`, the existing `.github/workflows/deploy.yml` job always runs:

```bash
pnpm --filter edges-cli exec -- tsx scripts/generate-tasks-site.ts \
  --out "$PWD/knowledge/tasks/_site/index.html"
```

From a checkout with PATH already set (same as the Action):

```bash
pnpm --filter edges-cli exec -- tsx extensions/clis/scripts/generate-tasks-site.ts \
  --out "$PWD/knowledge/tasks/_site/index.html"
```

If `node_modules` is missing, `pnpm install --frozen-lockfile --filter edges-cli...` first. Output is gitignored (`knowledge/tasks/_site/`). A failed generate fails the Action; nginx keeps serving the last good `index.html` until the next success.

The Action does **not** re-run nginx setup.

## One-time nginx (sudo)

Requires `/etc/nginx/conf.d/teaching.conf` with `/teaching/` already in a `server { }` block. Leftover `teach.conf` / `/teach/` must be migrated first (`extensions/services/artifacts-preview/deploy/migrate-teaching-nginx-prefix.py`), then:

```bash
sudo bash /home/cheng-dev/projects/edges/extensions/clis/deploy/setup-nginx-tasks.sh
```

That installs `/etc/nginx/snippets/edges-tasks.conf` (`/tasks/` → `<repo>/knowledge/tasks/_site/`) and includes it only in `teaching.conf` servers that contain `/teaching/`. Do not add `/tasks/` to the artifacts snippet. Do not dual-recognize `/teach/`.

## Checks

These curls hit the ECS origin over HTTP. The public entry is the HTTPS URLs above.

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://182.92.131.89/teaching/
curl -fsS -o /dev/null -w '%{http_code}\n' http://182.92.131.89/tasks/
curl -fsS http://182.92.131.89/health
```

`/teaching/` is still the teach site. `/tasks/` is the generated board. `/health` is still artifacts JSON `{"ok":true}`.

## PATH on ECS

Generate uses the just-pulled tree via `pnpm --filter edges-cli exec -- tsx`. The deploy job hoists `~/.local/share/pnpm`, `~/.local/bin`, `/usr/local/bin`, and optional nvm so this does not depend on the artifacts env file.
