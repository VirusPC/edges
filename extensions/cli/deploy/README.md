# Persistent `/tasks/` board (ops)

Public URL: [https://edges.viruspc.tech/tasks/](https://edges.viruspc.tech/tasks/) and [https://edges.viruspc.tech/teaching/](https://edges.viruspc.tech/teaching/) (Cloudflare Tunnel to the same Aliyun ECS nginx). Decision: [ADR 0021](../../../docs/adr/0021-persistent-tasks-board-site.md).

This is generated HTML only. It is not Artifacts (`publish` / UUID / TTL) and not a new status-station product. `edges tasks project review-page` still only renders.

## Generate (every deploy)

After `git fetch` / `reset --hard origin/main`, the existing `.github/workflows/deploy.yml` job always runs. The Vite output under `extensions/cli/src/commands/tasks/project/assets/review-page/` is gitignored and must be built on the box before generate:

```bash
pnpm install --frozen-lockfile --filter edges-cli... --filter tasks-review-app...
pnpm --filter tasks-review-app run build
pnpm --filter edges-cli exec -- tsx scripts/generate-tasks-site.ts \
  --scope "$PWD" --purpose all --out "$PWD/tasks/_site/index.html"
```

From a checkout with PATH already set (same as the Action):

```bash
pnpm --filter edges-cli exec -- tsx scripts/generate-tasks-site.ts \
  --scope "$PWD" --purpose all --out "$PWD/tasks/_site/index.html"
```

If dependencies are missing, `pnpm install --frozen-lockfile --filter edges-cli... --filter tasks-review-app...` then `pnpm --filter tasks-review-app run build`. The Vite files are gitignored and are not in the git checkout. Output HTML is gitignored (`tasks/_site/`). A failed generate fails the Action; nginx keeps serving the last good `index.html` until the next success.

`--scope "$PWD" --purpose all` gathers the root and actual descendant scopes, including domain and maintenance tasks. Public `/tasks/` remains one aggregated board.

The Action does **not** re-run nginx setup. After generation it runs `sudo -n bash extensions/services/artifacts-preview/deploy/migrate-site-layout.sh` to update existing physical paths: teaching locations serve `<repo>/teaching/`, and the installed tasks snippet serves `<repo>/tasks/_site/`. The wrapper preserves inherited server roots and unrelated locations, backs up both configs, validates with `nginx -t`, and reloads only on change. Failure restores both configs and fails the deployment. Provision the deploy user's sudo permission for this wrapper before deploying the layout change. This runs regardless of the artifacts token/env file; fresh hosts still need the one-time nginx setup below.

## One-time nginx (sudo)

Requires `/etc/nginx/conf.d/teaching.conf` with `/teaching/` already in a `server { }` block. Leftover `teach.conf` / `/teach/` must be migrated first (`extensions/services/artifacts-preview/deploy/migrate-teaching-nginx-prefix.py`), then:

```bash
sudo bash /home/cheng-dev/projects/edges/extensions/cli/deploy/setup-nginx-tasks.sh
```

That installs `/etc/nginx/snippets/edges-tasks.conf` (`/tasks/` → `<repo>/tasks/_site/`) and includes it only in `teaching.conf` servers that contain `/teaching/`. Do not add `/tasks/` to the artifacts snippet. Do not dual-recognize `/teach/`.

## Checks

These curls hit the public Cloudflare entry.

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' https://edges.viruspc.tech/teaching/
curl -fsS -o /dev/null -w '%{http_code}\n' https://edges.viruspc.tech/tasks/
curl -fsS https://edges.viruspc.tech/health
```

`/teaching/` is still the teach site. `/tasks/` is the generated board. `/health` is still artifacts JSON `{"ok":true}`.

## PATH on ECS

Generate uses the just-pulled tree via `pnpm --filter edges-cli exec -- tsx`. The deploy job hoists `~/.local/share/pnpm`, `~/.local/bin`, `/usr/local/bin`, and optional nvm so this does not depend on the artifacts env file.
