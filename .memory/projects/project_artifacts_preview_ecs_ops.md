---
name: project_artifacts_preview_ecs_ops
description: 改 artifacts 在阿里云 ECS 上怎么跑、或要不要给 8787 开安全组时打开：和 teach 同机；人机接口是 edges artifacts server（init / install 不启动 / start|stop|restart / status）；user systemd + linger；nginx 反代是一次性 sudo 脚本不是 CLI 动词；不要公网 8787。token 只放盒上。
metadata:
  edges-title: Artifacts 预览 ECS：user unit + nginx :80
  edges-type: project
  edges-origin-session-id: bc-03eab9e8-f0e7-5b5c-93d1-5b97661749f2
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T17:28:04+00:00"
---

Artifacts 预览在已有 teach ECS 上跑：人机接口是 `edges artifacts server`（`init` 只写配置，`install` 装依赖和 user unit 但不启动，`start`/`stop`/`restart` 管进程，`status` 看 health+unit）。Node 走 `cheng-dev` 的 systemd user unit（8787 只绑 127.0.0.1），公网走已有 :80 的 `/health` 与 `/artifacts/` 反代；`/teaching/` 不动。nginx 是宿主机运维，不进 CLI：静态文件 `deploy/nginx-artifacts.conf`，人跑一次 `setup-nginx-artifacts.sh`（助手注不进 sudo 密码，脚本同时 enable linger）。token 只活在盒上 env 与本机 CLI 配置。
**Why:** ADR 0013 只要同一套进程本机+ECS、手机必须可达 URL，没有规定公网端口。teach 已经占用 :80 且安全组由人控；再开 8787 是多余暴露。user unit 让 Actions SSH 能在无 sudo 下重启；没有 linger 的话 SSH 一断服务就死。2026-09-20 用户把日常路径收进 CLI，并两次纠正：install 不得 start；nginx 不是 CLI 动词。这是 ops 层，不是重写 ADR。
**How to apply:** 不要为 artifacts 新开公网端口或另写一套 GitHub rsync。一次性：人跑 `server init`（或手写 server env）、`server install` 然后 `server start`；要暴露 :80 再另跑 setup-nginx 脚本、确认 linger。日常：现有 `deploy-teach.yml` 整仓 pull 后，env 在就 `install` 再 `restart`，不在就跳过（别挡住 teach）。`deploy/bootstrap.sh` 只是这两条 CLI 的薄包装。给手机的 BASE_URL 用 environment 上已有的公网 IP http，不要写 Mesh 名，也不要在备案完成前把域名当可用入口。不要把真实 token 提交进仓。不要加 `nginx-snippet` / `nginx-setup` / `configure-proxy`。
