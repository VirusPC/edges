---
name: project_teach_site_rsync_push
description: 改 teaching、/tasks/ 或 ECS 部署时：Actions SSH 整仓 pull，不要 rsync；workflow 是 .github/workflows/deploy.yml，name 为 Deploy；environment 保持 production，url 为 https://edges.viruspc.tech/teaching/，summary 同时列 /tasks/；不要用 teach.* 或裸 IP 当对外入口。不要新开 workflow（ADR 0021）。
metadata:
  edges-title: ECS 上 edges 用 Actions SSH 整仓 pull
  edges-type: project
  edges-origin-session-id: bc-31ce0dac-8f77-4d3e-a5f7-da2a844da092
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T17:18:12+00:00"
---

ECS 上的 edges 整仓由 GitHub Actions SSH 触发 `git fetch` + `reset --hard origin/main` 对齐，不再 rsync 推送。`deploy` job 使用 `environment: production`。reset 之后始终生成 `/tasks/` 静态页；盒上若已有 artifacts 的 server env，同一 job 再 bootstrap / 重启 user unit，env 不存在就跳过，不要因此挡住 teach 或 `/tasks/`。Actions 上的公网入口是 `https://edges.viruspc.tech/teaching/`（`environment.url`，GitHub 只允许一个）以及 job summary 里同时列出的 `https://edges.viruspc.tech/tasks/`。用户所述，2026-09-22 Cloudflare Tunnel 已作为当前对外入口。

**Why:**
用户确认国内 ECS 现已能经 HTTPS 访问 GitHub（git fetch 可用），并要求整仓 pull。teach 静态文件改完磁盘即可；`/tasks/` 是同机生成的 HTML；artifacts 是同机 Node 进程，需要构建和重启。2026-09-21 实现轮把 generate 放进同一条 SSH pull，不另开 workflow。2026-09-22 用户把 Actions 对外入口从裸 IP HTTP 改为 Tunnel 上的 `edges.viruspc.tech` HTTPS；GitHub environment 只能挂一个 URL，所以 tasks 入口写在 job summary。

**How to apply:**
- 改部署链路只动 `.github/workflows/deploy.yml`（workflow `name` 是 `Deploy`）。保持 job 上的 `environment: production`。不要再改回 `deploy-teach.yml`。根 README 标题下保留徽章，链到 `https://github.com/VirusPC/edges/actions/workflows/deploy.yml`。触发是 main 任意路径 push 或 workflow_dispatch。远端 fetch / checkout / reset --hard origin/main 之后：先 hoist PATH/nvm，再始终跑 tasks site generate；然后仅当 `~/.config/edges/artifacts-preview.env` 存在且 token 不是占位符时跑 artifacts `install` 再 `restart`。
- `/tasks/` nginx 是一次性 `setup-nginx-tasks.sh`，不要从 Action 调 setup-nginx。不要改回 rsync，不要 `git clean -fd`，也不要把私钥、Tailscale 地址写进仓库或 PR。`environment.url` 用 `https://edges.viruspc.tech/teaching/`；job summary 同时列出该地址和 `https://edges.viruspc.tech/tasks/`。不要用 teach.* 主机名，也不要把裸 IP HTTP 写成 Actions 的对外入口。
