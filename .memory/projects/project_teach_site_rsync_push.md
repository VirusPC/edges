---
name: project_teach_site_rsync_push
description: "改 teach 站点或 ECS 上的 edges 部署时：用 GitHub Actions SSH 触发整仓 git fetch/reset，不要再 rsync 推送；deploy job 保持 environment: ecs，根 README 保留工作流徽章。"
metadata:
  edges-title: ECS 上 edges 用 Actions SSH 整仓 pull
  edges-type: project
  edges-origin-session-id: bc-31ce0dac-8f77-4d3e-a5f7-da2a844da092
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-14T06:13:37+00:00"
---

ECS 上的 edges 整仓由 GitHub Actions SSH 触发 `git fetch` + `reset --hard origin/main` 对齐，不再 rsync 推送。`deploy` job 使用 `environment: ecs`，根 README 标题下有 `deploy-teach.yml` 状态徽章。
**Why:** 用户确认国内 ECS 现已能经 HTTPS 访问 GitHub（git fetch 可用），并要求整仓 pull，而不是只同步 knowledge/teaching。仓库 secrets `TEACH_DEPLOY_SSH_KEY` / `TEACH_DEPLOY_HOST` / `TEACH_DEPLOY_USER` 仍复用。静态文件改完磁盘即可，不必 reload nginx。2026-09-14 用户要求仓库首页能看见部署状态：Actions 徽章 + GitHub Deployments（environment 名 `ecs`）。
**How to apply:** 改部署链路只动 `.github/workflows/deploy-teach.yml`。保持 job 上的 `environment: ecs`，不要改 workflow 名除非必要。根 README 标题下保留徽章，链到 `https://github.com/VirusPC/edges/actions/workflows/deploy-teach.yml`。触发是 main 任意路径 push 或 workflow_dispatch。远端在既有 checkout 路径执行 fetch / checkout / reset --hard origin/main。不要改回 rsync，不要 `git clean -fd` 清掉机器上与仓无关的本地目录，也不要把私钥、公网 IP、Tailscale 地址写进仓库或 PR。
