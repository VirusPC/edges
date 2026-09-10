---
name: todos更名为tasks并支持状态流转
description: 工作项从 todos 更名为 tasks，并支持状态流转
metadata:
  edges-type: task
  edges-title: todos 更名为 tasks 并支持状态流转
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T08:00:00+08:00"
---

在 idea → 专家细聊 → Cloud Agent 开发 → 改状态 模式下，叫 todo 不合适；应叫 `tasks`，同时支持设置状态流转。

**Why:**
todo = 勾选清单；task = 带生命周期的工作项。命名要跟接力流程对齐。

**How to apply:**
- 约定目录：`knowledge/tasks/`（替代或迁出 `knowledge/todos/`）。
- 约定状态枚举与流转（候选：`open` → `discussing` → `building` → `done`，可再议）。
- 迁移存量 todos；更新 README / 项目记忆 / 记录员角色命名。
- 关闭或合并「todos需支持状态字段」相关条目，避免重复。
