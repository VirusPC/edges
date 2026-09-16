---
name: memory需要assets资源目录
description: 为 project `.memory` 增加资源存档目录的想法
metadata:
  edges-type: task
  edges-title: memory 需要 assets 资源目录
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T08:00:00+08:00"
---

`.memory` 里可能需要一个 `assets/` 目录，用来存档图片、音频、视频等资源。

**Why:**
记忆条目之外，多媒体附件也应有固定落点，避免散落在笔记或仓库其它目录。

**How to apply:**
- 评估并设计 `.memory/assets/`（或等价路径）的约定：放什么、如何引用、是否与 knowledge/resources / 语雀 img/ 分工。
- 与可扩展 memory type 方案一并考虑时，明确 assets 是横切资源层还是某 type 的附属目录。
