---
name: project_langfuse_tailscale_only_access
description: >-
  改自托管 Langfuse 的访问面时打开：公网 HTTPS 经 Cloudflare Tunnel 转到 minigtr；ADR 0017 的仅
  Tailscale 已由 ADR 0033 取代。不要把实例域名、Tailscale 地址或 Cloudflare 账号写进仓库。
metadata:
  edges-title: 自托管 Langfuse 经 Cloudflare Tunnel 提供公网 HTTPS
  edges-type: project
  edges-origin-session-id: bc-8f1d5fb6-9160-5c0a-a840-06865f80e964
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-11T09:27:09+00:00'
---

自托管 Langfuse 的当前访问面是公网 HTTPS，经 Cloudflare Tunnel 转到 minigtr 上的实例。ADR 0017 的「仅 Tailscale」已于 2026-10-11 由 ADR 0033 取代。仓库里用「公网 HTTPS 域名（经 Cloudflare Tunnel）」描述入口，不写实例域名。

**Why:**
2026-09-20 grill 曾把 v1 收成仅 Tailscale，并把公网 HTTPS 留作后续，因为设备不会一直开着 Tailscale。2026-10-11 核实这条后续已经落地：Langfuse v4.38.0 在 minigtr 的 Docker 上，`/api/public/health` 返回 OK。继续把仅 Tailscale 写成现行决策会让仓库和实例不一致。

**How to apply:**
- 写访问方式、冒烟或任务时对照 ADR 0033，不要再把 ADR 0017 当作现行访问面。
- 不要把 Tailscale Funnel、自管反代证书材料、实例域名、Cloudflare 账号、Tailscale 地址或 100.x 写进本仓。
- 密钥仍只留 minigtr 磁盘（ADR 0018）。宿主仍是 minigtr，不是云 VPS（ADR 0014）。
