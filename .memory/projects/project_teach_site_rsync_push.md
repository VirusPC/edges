---
name: project_teach_site_rsync_push
description: 改 teach 站点或 ECS 上的 edges 部署时：用 GitHub Actions SSH 触发整仓 git fetch/reset，不要再 rsync 推送。
metadata:
  edges-title: ECS 上 edges 用 Actions SSH 整仓 pull
  edges-type: project
  edges-origin-session-id: bc-31ce0dac-8f77-4d3e-a5f7-da2a844da092
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T10:20:48+00:00"
---

ECS 上的 edges 整仓由 GitHub Actions SSH 触发 `git fetch` + `reset --hard origin/main` 对齐，不再 rsync 推送。
**Why:** 用户确认国内 ECS 现已能经 HTTPS 访问 GitHub（git fetch 可用），并要求整仓 pull，而不是只同步 knowledge/teach。仓库 secrets `TEACH_DEPLOY_SSH_KEY` / `TEACH_DEPLOY_HOST` / `TEACH_DEPLOY_USER` 仍复用。静态文件改完磁盘即可，不必 reload nginx。
**How to apply:** 改部署链路只动 `.github/workflows/deploy-teach.yml`。触发是 main 任意路径 push 或 workflow_dispatch。远端在 `/home/cheng-dev/projects/edges` 执行 fetch / checkout / reset --hard origin/main。不要改回 rsync，不要 `git clean -fd` 清掉机器上与仓无关的本地目录，也不要把私钥、公网 IP、Tailscale 地址写进仓库或 PR。
