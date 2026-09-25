---
name: project_artifacts_preview_ecs_ops
description: 改 artifacts 在阿里云 ECS 上怎么跑、客户端 BASE_URL，或 POST 被 Cloudflare 1010 拦住时打开：和 teaching 同机；客户端 init --base-url https://edges.viruspc.tech；对该主机 POST /artifacts 缺浏览器式 User-Agent 会 1010，带上则 201，GET 通常正常；install 不启动；teaching.conf 必须带 /teaching/；不要公网 8787。已有盒上 env 的 BASE_URL 在 ECS 上手动改。
metadata:
  edges-title: Artifacts 预览 ECS：user unit + nginx :80
  edges-type: project
  edges-origin-session-id: bc-64f20364-5e66-5924-903e-9e45abedf3ff
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-25T04:36:24+00:00"
---

Artifacts 预览在已有 teaching ECS 上跑：人机接口是 `edges artifacts server`（`install` 写盒上 env 并装 unit 但不启动，`start`/`stop`/`restart` 管进程，`status` 看 health+unit，`setup-nginx` 把反代写进 `/etc/nginx/conf.d/teaching.conf`）。没有 `server init`。`TEACHING_CONF` 默认 `/etc/nginx/conf.d/teaching.conf`，必须带 `/teaching/`。2026-09-21 核实生产一度仍是 `teach.conf` + `/teach/`：先改名再跑 `migrate-teaching-nginx-prefix.py`，不要双认旧名。轮换 token 必须再 `restart` 才能让 unit 读到新 `EnvironmentFile`。客户端用 `edges artifacts init --base-url https://edges.viruspc.tech --token <server-token>`。不要公网 8787。token 只活在盒上 env 与本机 CLI 配置。已有盒上 `artifacts-preview.env` 的 `EDGES_ARTIFACTS_BASE_URL` 由人在 ECS 上手动改；`install` 保留已有值，仓库部署不重写。
**Why:** ADR 0013 只要同一套进程本机+ECS、手机必须可达 URL。teaching 站点已经占用 :80。2026-09-20 用户锁定公开面。2026-09-21 用户最终命名：`teaching.conf` + `/teaching/`。`EnvironmentFile` 只在进程启动时读取，所以 `install --force` 单独不够。2026-09-25 公网入口改为 Cloudflare 域名 `https://edges.viruspc.tech`，`/health` 与 `/artifacts` 路径不变。用户指出对这个主机的 `POST /artifacts` 缺浏览器式 User-Agent 会 Cloudflare 1010，带正常 UA 则 201；GET 通常正常。这是写路径的坑，不是某台机器当天是否在线。
**How to apply:** 不要为 artifacts 新开公网端口或另写一套 GitHub rsync。一次性：`server install` → `server start` →（若盒上还是旧站点文件则先改名为 `teaching.conf` 并 migrate）→ `server setup-nginx` → `server status`。日常：`deploy.yml` 整仓 pull 后，env 在且 token 不是占位符才 `install` 再 `restart`。轮换：`install --force` → `restart` → 客户端 `init --token … --force`。给手机的 BASE_URL 用 `https://edges.viruspc.tech`。不要把真实 token 提交进仓。不要把裸 IP 写成推荐 BASE_URL。`publish` / `rm` 必须固定发送浏览器式 User-Agent（CLI 已发送 `Chrome/131` 那条），不要依赖 Node/undici 默认 `node`。手写 curl POST 同样要带 `-A`。权威说明在 ADR 0013、`extensions/services/artifacts-preview/README.md` 与 `knowledge/notes/2026-09-20--Artifacts预览服务ECS部署.md`，不要在别的笔记里再堆一份。
