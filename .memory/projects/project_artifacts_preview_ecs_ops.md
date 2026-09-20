---
name: project_artifacts_preview_ecs_ops
description: 改 artifacts 在阿里云 ECS 上怎么跑、或要不要给 8787 开安全组时打开：和 teach 同机；user systemd + linger；nginx 反代 /health 与 /artifacts/；不要公网 8787。人 sudo 一次装 nginx，token 只放盒上。
metadata:
  edges-title: Artifacts 预览 ECS：user unit + nginx :80
  edges-type: project
  edges-origin-session-id: bc-03eab9e8-f0e7-5b5c-93d1-5b97661749f2
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T17:05:01+00:00"
---

Artifacts 预览在已有 teach ECS 上跑：Node 走 `cheng-dev` 的 systemd user unit（8787 只绑 127.0.0.1），公网走已有 :80 的 `/health` 与 `/artifacts/` 反代；`/teaching/` 不动。助手注不进 sudo 密码，nginx + linger 由人跑一次 setup 脚本。token 只活在盒上 env 与本机 CLI 配置。
**Why:** ADR 0013 只要同一套进程本机+ECS、手机必须可达 URL，没有规定公网端口。teach 已经占用 :80 且安全组由人控；再开 8787 是多余暴露。user unit 让 Actions SSH 能在无 sudo 下重启；没有 linger 的话 SSH 一断服务就死。这是 2026-09-20 用户所述的 ops 层，不是重写 ADR。
**How to apply:** 不要为 artifacts 新开公网端口或另写一套 GitHub rsync。一次性：人放 server env、跑 setup-nginx 脚本、确认 linger。日常：现有 `deploy-teach.yml` 整仓 pull 后，env 在就 bootstrap，不在就跳过（别挡住 teach）。给手机的 BASE_URL 用 environment 上已有的公网 IP http，不要写 Mesh 名，也不要在备案完成前把域名当可用入口。不要把真实 token 提交进仓。
