---
name: feedback_changelog_user_perspective
description: >-
  写或切根 CHANGELOG 时打开：从用户能做什么、和以前差在哪来说；扫一眼 ### 与每条小标题要能列出关键模块变化；不要写 systemd
  unit/unit 等运维黑话，目录布局不要摊对照表。缘起 2026-10-25 审 #41。
metadata:
  edges-title: 根 changelog 从用户视角写
  edges-type: feedback
  edges-origin-session-id: bc-b9d66216-b52c-5ac5-b4d6-1c3e716ae64e
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-25T11:26:31+00:00'
---

写根 `CHANGELOG.md`（含切 Unreleased → 版本段）时，用**用户视角**：读者要一眼看出本次有哪些关键模块、各模块关键变化是什么。

**Why:** 2026-10-25 审 VirusPC/edges#41 时用户指出目录写得过细、难以看出关键模块变化，并纠正不要用「装上 unit」这类运维术语——要从用户视角说话（用户所述）。

**How to apply:**
- 每个 `###` 模块下只留该模块最关键的少数几条；小标题像新闻标题，正文说清现在能做什么、和以前差在哪，并写出真实命令名。
- 禁止「unit」「systemd unit」等黑话；改成「在本机登记评测服务」「登记后不会自动跑，要用 start 启动」这类说法。
- 目录布局等迁移用一两句 + ADR/迁移文档链接即可，不要大表枚举旧路径/新路径。
- 仍遵守 `project_repo_changelog` 的模块标题与 `- **小标题：**` 形状，以及 `feedback_changelog_no_schema_dump`（不堆 schema/flag）。
