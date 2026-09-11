---
name: project_teach_site_rsync_push
description: 改 teach 站点部署或想在 ECS 上更新 knowledge/teach 时：用 GitHub Actions rsync 推送，不要 SSH 进机器 git pull。
metadata:
  edges-title: teach 站点用 Actions rsync 推送到 ECS
  edges-type: project
  edges-origin-session-id: bc-31ce0dac-8f77-4d3e-a5f7-da2a844da092
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T10:08:45+00:00"
---

teach 静态站（knowledge/teach → ECS nginx root）由 GitHub Actions 从 runner rsync 推送到机器，禁止在 ECS 上 git pull。
**Why:** 用户确认国内 ECS 访问 GitHub HTTPS 443 超时，源站拉仓不可用；仓库 secrets `TEACH_DEPLOY_SSH_KEY` / `TEACH_DEPLOY_HOST` / `TEACH_DEPLOY_USER` 已配好，公钥已在部署用户 authorized_keys。静态文件改完磁盘即可，不必 reload nginx。
**How to apply:** 改部署链路只动 `.github/workflows/deploy-teach.yml`；触发是 main 上 `knowledge/teach/**` 或 workflow_dispatch。同步命令保持 `rsync -az --delete` 推到 `/home/cheng-dev/projects/edges/knowledge/teach/`。不要改成远程 git pull / clone，也不要把私钥、公网 IP、Tailscale 地址写进仓库或 PR。
