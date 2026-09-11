---
name: feedback_teach_html_index_homepage
description: 每次 teach 交付后重建 knowledge/teach/index.html，与 README Topics 对齐；不要只改 Markdown
metadata:
  edges-title: teach 交付后必须重建 HTML 首页索引
  edges-type: feedback
  edges-origin-session-id: bc-9315e6f7-7dbe-4b61-8215-470efa08cca2
  edges-agent-client: cursor
  edges-username: 讲者
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T10:42:49+00:00"
---

每次 teach 交付后必须重建 `knowledge/teach/index.html`，使公网 `/teach/` 主题索引与 README Topics 一致。

**Why:** 公网站点打开 `/teach/` 应是主题首页，而不是 nginx 目录列表。只改 README 或只建主题目录，首页会漏课。不检索就会漏，所以本条同时写进本层硬约束。

**How to apply:** 新建主题、新增课页入口、或改 Topics 文案后，同步改 `knowledge/teach/index.html`。条目与 README Topics 一一对应；链接用主题相对路径（`./<topic>/`）。不要只更新 Markdown。
