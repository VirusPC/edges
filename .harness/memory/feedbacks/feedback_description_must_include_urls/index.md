---
name: feedback_description_must_include_urls
description: 写或更新 .memory/references/* 时：description 与 REFERENCE.md 索引行必须带关键 URL，不能只写在正文 Links。缘起 https://github.com/VirusPC/edges/pull/45。
metadata:
  edges-title: reference 的 description 必须带关键链接
  edges-type: feedback
  edges-origin-session-id: bc-58f1fb06-1ccf-430f-81fc-5c5aefd1ae83
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-13T02:52:27+00:00"
---

写或更新 `.memory/references/*` 时，`description`（以及由它重算的 `.memory/REFERENCE.md` 索引行）必须带上关键 URL，不能只把链接放在正文 Links。

**Why:**
- Multica CLI reference PR #45 最初只把 URL 写在正文 Links，description / 索引行没有可点击链接。
- peng cheng 指出 under-linking，并要求把「reference-memory 的 description 必须带关键链接」写成约定，背景一并记下。
- 规则：写或更新 `.memory/references/*` 时，`description` 与 REFERENCE.md 索引行必须包含关键 URL，不能只写在正文。

**How to apply:**
- 新增或更新 reference 用 `memory.py remember --type reference`，把关键 URL 写进 `--description`，让索引跟着重算。
- 不要只在正文 Links 列链接，而让索引行只写命令或主题摘要。
- 已有条目缺链接时，复用同一 slug 走 remember 更新，不要手改索引。
