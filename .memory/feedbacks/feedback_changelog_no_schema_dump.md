---
name: feedback_changelog_no_schema_dump
description: 写根 CHANGELOG Unreleased 时打开：用人话完整句写能做什么，对照 [1.2.0]；不要把 schema 字段表或 flag 汤塞进一段。缘起 https://github.com/VirusPC/edges/pull/110。
metadata:
  edges-title: 根 changelog 不要堆 schema 字段表
  edges-type: feedback
  edges-origin-session-id: bc-58ed36dc-a709-54d2-91ab-1e96861d7ceb
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T08:24:20+00:00"
---

根 `CHANGELOG.md` 的 Unreleased 条目要像 `[1.2.0]` 那样用完整中文写人能做什么；不要把 schema 字段表或一长串 flag 堆进一段。

**Why:**
2026-09-21 用户纠正 PR #110：`任务看板与项目` 那条把 `edges.tasks.grouped/v1` 的字段列表和筛选 flag 全塞进一段，读起来像 jargon，不像 `[1.2.0]`。用户所述。

**How to apply:**
- 先写人能做什么，再立刻给出真实命令名（如 `edges tasks list --group-by project`、`edges tasks project review-page`）。
- schema 只写稳定名字（如 `edges.tasks.grouped/v1`），不要展开 `{ schema, groups[{id,title…}] }`。
- 同一能力若有几步（列出、部署生成、nginx、只渲染），宁可拆成几条短句，也不要为了「一条更密」把读者噎死。
- 对照 `[1.2.0]` 的「任务看板与项目」语气；不要改成电报体。
