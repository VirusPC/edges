---
name: project-memory可扩展memory-type
description: 为 project-memory skill 设计可自由扩展的 memory type 机制
metadata:
  edges-type: task
  edges-title: project-memory 可扩展 memory type
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T08:00:00+08:00"
---

project-memory 需要支持自由扩展 memory type；已有示例含 `docs`、`progress`，可选扩展还包括 `tasks`、`research`、`reminder`、`scheduler`，每个扩展 type 都由用户定义 name、description、metadata。

**Why:**
memory type 不应写死；应做成可配置/可扩展的类型系统，由用户为每个扩展 type 分别声明 name、description、metadata。

**How to apply:**
- 设计扩展方案：每个自定义 type 均可声明 name、description、metadata。
- 用可选类型 `tasks` / `docs` / `research` / `progress` / `reminder` / `scheduler` 作为示例类型验证方案。
