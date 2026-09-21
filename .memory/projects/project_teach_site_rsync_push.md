---
name: project_teach_site_rsync_push
description: 改 teaching、/tasks/ 或 ECS 部署时：SSH 只在 deploy.yml 的 deploy job；production 不挂 url；site-teaching 与 site-tasks 都 needs deploy，分别登记 https://edges.viruspc.tech/teaching/ 与 /tasks/；summary 列两个 URL。不要拆成两次 SSH，不要用 teach.* 或裸 IP。不要新开 workflow（ADR 0021）。
metadata:
  edges-title: ECS 上 edges 用 Actions SSH 整仓 pull
  edges-type: project
  edges-origin-session-id: bc-31ce0dac-8f77-4d3e-a5f7-da2a844da092
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T17:23:25+00:00"
---

ECS 上的 edges 整仓由 GitHub Actions SSH 触发 `git fetch` + `reset --hard origin/main` 对齐，不再 rsync 推送。只有 `deploy` 这一个 job 做 SSH pull；它可保留 `environment: production`，但不挂站点 URL。reset 之后始终生成 `/tasks/` 静态页；盒上若已有 artifacts 的 server env，同一 job 再 bootstrap / 重启 user unit，env 不存在就跳过，不要因此挡住 teach 或 `/tasks/`。公网入口是两个后置轻量 job：`site-teaching` 的 environment `teaching` 指向 `https://edges.viruspc.tech/teaching/`，`site-tasks` 的 environment `tasks` 指向 `https://edges.viruspc.tech/tasks/`，都 `needs: [deploy]`，部署成功后并行登记。job summary 仍同时列出这两个 URL。用户 2026-09-22 确认这个三 job 形状；Cloudflare Tunnel 是当前对外入口。

**Why:**
用户确认国内 ECS 现已能经 HTTPS 访问 GitHub（git fetch 可用），并要求整仓 pull。teach 静态文件改完磁盘即可；`/tasks/` 是同机生成的 HTML；artifacts 是同机 Node 进程，需要构建和重启。2026-09-21 实现轮把 generate 放进同一条 SSH pull，不另开 workflow。2026-09-22 用户确认不要用一个 environment URL 同时代表两个站：GitHub 每个 environment 只有一个 url，所以 teaching 与 tasks 各是一个 `needs: [deploy]` 的轻量 job，SSH 不拆成两次部署。

**How to apply:**
- 改部署链路只动 `.github/workflows/deploy.yml`（workflow `name` 是 `Deploy`）。`deploy` job 做唯一一次 SSH，可留 `environment: production` 且不要给它 url。不要再改回 `deploy-teach.yml`，也不要新开 workflow。根 README 标题下保留徽章，链到 `https://github.com/VirusPC/edges/actions/workflows/deploy.yml`。触发是 main 任意路径 push 或 workflow_dispatch。保持 `concurrency.group: ecs-edges-pull`。远端 fetch / checkout / reset --hard origin/main 之后：先 hoist PATH/nvm，再始终跑 tasks site generate；然后仅当 `~/.config/edges/artifacts-preview.env` 存在且 token 不是占位符时跑 artifacts `install` 再 `restart`。
- `site-teaching` 与 `site-tasks` 都 `needs: [deploy]`，各自只登记一个 environment url：`https://edges.viruspc.tech/teaching/` 与 `https://edges.viruspc.tech/tasks/`。不要把 SSH pull 复制进这两个 job。job summary 同时列出这两个地址。`/tasks/` nginx 是一次性 `setup-nginx-tasks.sh`，不要从 Action 调 setup-nginx。不要改回 rsync，不要 `git clean -fd`，也不要把私钥、Tailscale 地址写进仓库或 PR。不要用 teach.* 主机名，也不要把裸 IP HTTP 写成 Actions 的对外入口。
