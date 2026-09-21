---
name: project_teach_site_rsync_push
description: "改 teach 站点、/tasks/ 持久站或 ECS 上的 edges 部署时：用 GitHub Actions SSH 触发整仓 git fetch/reset，不要再 rsync 推送；deploy job 保持 environment: production，根 README 保留工作流徽章。artifacts 仅在盒上已有 server env 时于 pull 后 bootstrap。/tasks/ 扩展同一 deploy-teach.yml，不要新开 workflow（ADR 0021）。"
metadata:
  edges-title: ECS 上 edges 用 Actions SSH 整仓 pull
  edges-type: project
  edges-origin-session-id: bc-31ce0dac-8f77-4d3e-a5f7-da2a844da092
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T07:45:29+00:00"
---

ECS 上的 edges 整仓由 GitHub Actions SSH 触发 `git fetch` + `reset --hard origin/main` 对齐，不再 rsync 推送。`deploy` job 使用 `environment: production`，根 README 标题下有 `deploy-teach.yml` 状态徽章。盒上若已有 artifacts 的 server env，同一 job 在 pull 之后跑 bootstrap / 重启 user unit；env 不存在就跳过，不要因此挡住 teach。持久 `/tasks/` 看板站（ADR 0021）也走这条 workflow，不要新开 Actions 文件。
**Why:** 用户确认国内 ECS 现已能经 HTTPS 访问 GitHub（git fetch 可用），并要求整仓 pull，而不是只同步 knowledge/teaching。仓库 secrets `TEACH_DEPLOY_SSH_KEY` / `TEACH_DEPLOY_HOST` / `TEACH_DEPLOY_USER` 仍复用。teach 静态文件改完磁盘即可；artifacts 是同机 Node 进程，需要构建和重启。2026-09-14 用户要求仓库首页能看见部署状态：Actions 徽章 + GitHub Deployments（environment 名 `production`）。2026-09-20 用户要求补上 artifacts 的 ops 层，但仍走同一条 SSH pull，不另开 rsync、不另开公网 8787。2026-09-21 grill 确认 `/tasks/` 扩展同一 workflow，不新开。
**How to apply:**
- 改部署链路只动 `.github/workflows/deploy-teach.yml`。保持 job 上的 `environment: production`，不要改 workflow 文件名除非必要。根 README 标题下保留徽章，链到 `https://github.com/VirusPC/edges/actions/workflows/deploy-teach.yml`。触发是 main 任意路径 push 或 workflow_dispatch。远端在既有 checkout 路径执行 fetch / checkout / reset --hard origin/main；然后仅当 `~/.config/edges/artifacts-preview.env` 存在时跑 artifacts bootstrap。不要改回 rsync，不要 `git clean -fd` 清掉机器上与仓无关的本地目录，也不要把私钥、Tailscale 地址写进仓库或 PR。公网入口沿用 environment 上已有的 IP http（teach 带 `/teaching/`），不要把 Mesh 名当网址。
- 实现 `/tasks/` 时继续扩展这份 workflow（ADR 0021），不要新开 YAML。本轮 docs 不改 workflow。
