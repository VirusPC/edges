---
name: ecs_cloudflare_tunnel_teaching_tasks_artifacts
description: 域名直连阿里云因未备案 Beaver + TLS1.2+SNI 不可用；采用 ECS + Cloudflare Tunnel 作为当前最简单对外方案，用域名 HTTPS 进站并保留动态服务。
metadata:
  edges-type: task
  edges-title: ECS 上 Cloudflare Tunnel 对外（teaching/tasks/artifacts）
  edges-tasks-status: in_progress
  edges-task-project: agent-clients-ux
  edges-task-assignee: IT资产管理
  edges-task-assignee-id: 5fcd37e7-eacb-4cc8-b9ed-b96a8ef4e344
  edges-updated-at: "2026-09-21T16:54:00.423Z"
---

结论（idea）：域名直连阿里云因未备案不可用；在现有 ECS 上部署 Cloudflare Tunnel（或同等），用域名 HTTPS 进站并保留动态服务，避开公网回源 Beaver。

**事实背景:**
- 2026-09-22 DNS 结论曾记：用户放弃域名 HTTPS/Flexible/隧道等绕过，入口维持裸 IP；备案或以后 Tunnel 再议。见 done「teaching 与 tasks 站点挂 DNS」（`knowledge/tasks/agent-clients-ux/done/2026-09-22--teaching-与-tasks-站点挂-DNS.md`）。该「放弃隧道」已作废为对外策略；历史不删。
- 用户 peng cheng 2026-09-22 改口：按 ECS+Tunnel 来，好像是目前最简单的方案（相对迁 minigtr、或整段改 Pages 放弃动态服务端）。
- 目标入口仍为 edges.viruspc.tech（或既有 teach/edges 主机名）下 /teaching/ /tasks/，以及 Artifacts 动态能力可留 ECS。
- Pages 专用仓方案仍 backlog，不并、不出栈。见 backlog「Artifacts 预览改走专用仓 + GitHub Pages」（`knowledge/tasks/agent-clients-ux/backlog/2026-09-21--Artifacts-预览改走专用仓-GitHub-Pages.md`）。

**Why:**
域名直连阿里云因未备案 Beaver + TLS1.2+SNI 不可用；采用 ECS + Cloudflare Tunnel 作为当前最简单对外方案，用域名 HTTPS 进站并保留动态服务。

**How to apply:**
- IT资产管理 grill/落地 Tunnel、DNS 指向 CF、证书与路径；与 nginx/deploy-teach 协作；回任务记录员最终 URL。
- 默认 grill-with-docs if ADR needed。
- 不并 Pages 专用仓 backlog，不出栈那张卡。
