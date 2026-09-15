---
name: feedback_teach_html_index_homepage
description: 每次 teach 交付后更新 knowledge/teaching/index.html 与 README Topics，公网入口为 /teach/。
metadata:
  edges-title: 维护 /teach/ HTML 首页索引
  edges-type: feedback
  edges-origin-session-id: 49152089-1d16-4f8c-96ce-23391bc2d918
  edges-agent-client: cursor
  edges-updated-at: "2026-09-11T10:36:23+00:00"
---

teach 目录必须维护可公网打开的 HTML 首页 `knowledge/teaching/index.html`，并在每次 teach skill 交付后自动更新该索引与 `README.md` Topics。

**Why:** 用户要求 `/teach/` 有简单首页索引；原先只有 README 或空目录导致公网 `/teach/` 403。

**How to apply:** 新建/更新主题或课后，重写 index.html 列出全部主题（链到主题入口或第一课），同步 README；收尾回复同时给课页 URL 与 `/teach/` 首页 URL。
