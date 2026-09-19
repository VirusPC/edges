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

## ECS / reachable URL

Same binary as local. Set:

```
EDGES_ARTIFACTS_TOKEN=<shared token from init>
EDGES_ARTIFACTS_BASE_URL=https://your-public-host
EDGES_ARTIFACTS_HOST=0.0.0.0
EDGES_ARTIFACTS_PORT=8787
# optional:
EDGES_ARTIFACTS_DATA_DIR=/var/tmp/edges-artifacts
```

`EDGES_ARTIFACTS_BASE_URL` is what `publish` prints (no trailing slash). If a phone must open the page, this cannot be `http://127.0.0.1` or `localhost`.

## HTTP

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/health` | no |
| `POST` | `/artifacts` | Bearer token |
| `GET` | `/artifacts/:id/` and `/artifacts/:id/:relpath` | no (UUID path + TTL) |
| `DELETE` | `/artifacts/:id` | Bearer token |

Default TTL is 24h (`ttlSeconds` on POST, or `edges artifacts publish --ttl 2h`). Server sweeps expired artifacts about every 60s and also on GET. Writes stay under a disk temp dir (`0700` / files `0600`); relative paths cannot traverse or follow symlinks out (every path component is `lstat`’d). On ECS set `EDGES_ARTIFACTS_DATA_DIR` off a shared `/tmp`.

## Tests

```bash
pnpm --filter edges-artifacts-preview test
```
