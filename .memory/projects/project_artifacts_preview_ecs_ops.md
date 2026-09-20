---
name: project_artifacts_preview_ecs_ops
description: 改 artifacts 在阿里云 ECS 上怎么跑、或要不要给 8787 开安全组时打开：和 teach 同机；人机接口是 edges artifacts server（install 不启动 / start|stop|restart / status / setup-nginx）；没有 server init；不要公网 8787。token 只放盒上。
metadata:
  edges-title: Artifacts 预览 ECS：user unit + nginx :80
  edges-type: project
  edges-origin-session-id: bc-64f20364-5e66-5924-903e-9e45abedf3ff
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T17:36:18+00:00"
---

Artifacts 预览在已有 teach ECS 上跑：人机接口是 `edges artifacts server`（`install` 写盒上 env 并装 unit 但不启动，`start`/`stop`/`restart` 管进程，`status` 看 health+unit，`setup-nginx` 做 :80 反代）。没有 `server init`。Node 走 `cheng-dev` 的 systemd user unit（8787 只绑 127.0.0.1），公网走已有 :80；`/teaching/` 不动。不要公网 8787。token 只活在盒上 env 与本机 CLI 配置。
**Why:** ADR 0013 只要同一套进程本机+ECS、手机必须可达 URL。teach 已经占用 :80。2026-09-20 用户锁定公开面并废止「nginx 不是 CLI 动词 / 保留 server init」。这是 ops 层，不是重写 ADR。
**How to apply:** 不要为 artifacts 新开公网端口或另写一套 GitHub rsync。一次性：`server install` → `server start` → `server setup-nginx` → `server status`。日常：`deploy-teach.yml` 整仓 pull 后，env 在就 `install` 再 `restart`，不在就跳过。给手机的 BASE_URL 用 `http://182.92.131.89`。不要把真实 token 提交进仓。不要发明 Cloudflare/备案步骤。轮换 token：`server install --force` 然后客户端重新 `edges artifacts init`。
