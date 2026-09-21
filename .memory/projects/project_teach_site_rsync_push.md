---
name: project_teach_site_rsync_push
description: "改 teach 站点、/tasks/ 持久站或 ECS 上的 edges 部署时：用 GitHub Actions SSH 触发整仓 git fetch/reset，不要再 rsync 推送；deploy job 保持 environment: production；reset 后始终生成 /tasks/；artifacts 仅在盒上已有 server env 时 bootstrap。不要新开 workflow（ADR 0021）。"
metadata:
  edges-title: ECS 上 edges 用 Actions SSH 整仓 pull
  edges-type: project
  edges-origin-session-id: bc-31ce0dac-8f77-4d3e-a5f7-da2a844da092
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T08:12:53+00:00"
---

ECS 上的 edges 整仓由 GitHub Actions SSH 触发 `git fetch` + `reset --hard origin/main` 对齐，不再 rsync 推送。`deploy` job 使用 `environment: production`。reset 之后始终生成 `/tasks/` 静态页；盒上若已有 artifacts 的 server env，同一 job 再 bootstrap / 重启 user unit，env 不存在就跳过，不要因此挡住 teach 或 `/tasks/`。

**Why:**
用户确认国内 ECS 现已能经 HTTPS 访问 GitHub（git fetch 可用），并要求整仓 pull。teach 静态文件改完磁盘即可；`/tasks/` 是同机生成的 HTML；artifacts 是同机 Node 进程，需要构建和重启。2026-09-21 实现轮把 generate 放进同一条 SSH pull，不另开 workflow。

**How to apply:**
- 改部署链路只动 `.github/workflows/deploy-teach.yml`。保持 job 上的 `environment: production`，不要改 workflow 文件名除非必要。根 README 标题下保留徽章，链到 `https://github.com/VirusPC/edges/actions/workflows/deploy-teach.yml`。触发是 main 任意路径 push 或 workflow_dispatch。远端 fetch / checkout / reset --hard origin/main 之后：先 hoist PATH/nvm，再始终跑 tasks site generate；然后仅当 `~/.config/edges/artifacts-preview.env` 存在且 token 不是占位符时跑 artifacts `install` 再 `restart`。
- `/tasks/` nginx 是一次性 `setup-nginx-tasks.sh`，不要从 Action 调 setup-nginx。不要改回 rsync，不要 `git clean -fd`，也不要把私钥、Tailscale 地址写进仓库或 PR。公网入口沿用 environment 上已有的 IP http（`/teaching/` 与 `/tasks/`），不要把 Mesh 名当网址。
