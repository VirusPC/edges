---
name: feedback_teach_public_url_prefix
description: 对外给课页地址形如 /teach/<topic>/...；不要用站点根下的 /changelog 或 /openhands
metadata:
  edges-title: 公网 URL 必须带 /teach/ 前缀
  edges-type: feedback
  edges-origin-session-id: bc-14e9582e-56e5-4577-835c-d9afc57e61a0
  edges-agent-client: cursor
  edges-username: 讲者
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T10:34:04+00:00"
---

对外课页站点 URL 必须带 `/teach/` 路径前缀（主题页形如 `/teach/<topic>/...`）。

**Why:** 用户明确要求部署路径都加 `/teach/`。原先 nginx root 直接挂 `knowledge/teach/`，导致 `/openhands`、`/changelog` 顶在站点根，语义不清。不检索就会漏前缀，所以本条同时写进本层硬约束。

**How to apply:** 收尾给在线地址时写成 `http(s)://<host>/teach/<topic>/...`（备案前用公网 IP 的 http；备案后用 `https://teach.viruspc.tech/teach/<topic>/...`）。不要报站点根下的 `/changelog`、`/openhands`。仓库内相对路径仍是 `knowledge/teach/<topic>/...`。
