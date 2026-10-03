---
name: project_tasks_with_status_not_todos
description: idea→专家→Cloud 工作流下，目录与概念用 knowledge/tasks/（非 todos），按 Task Project 再按 edges-tasks-status 分夹流转
metadata:
  edges-title: 工作项叫 tasks，支持状态流转
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T04:02:24+00:00"
---

在 idea → 专家细聊 → Cursor Cloud Agent 开发 → 改状态 的工作模式下，工作项应叫 tasks（不是 todos），先按 Task Project 分组，再按 `edges-tasks-status` 分夹存放。

**Why:**
todo 暗示一次性勾选清单；这套流程是跨 Agent 接力的工作项，需要状态机。ADR 0009 把状态夹嵌进 project-slug 下。

**How to apply:**
- 新工作项落到 `knowledge/tasks/<project-slug>/<status>/`，未分组用 `_default/`，默认 `backlog/`
- 状态字段只用 `metadata.edges-tasks-status`（backlog | todo | in_progress | in_review | done | blocked | cancelled）
- 分组字段 `metadata.edges-task-project` 与目录 slug 双写
- 不要再写 `knowledge/todos/`，也不要在 `knowledge/tasks/` 根下直接放 status 夹
- 角色文案用 Task 记录员
