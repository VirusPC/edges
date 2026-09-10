---
name: project_tasks_with_status_not_todos
description: idea→专家→Cloud 工作流下，目录与概念用 knowledge/tasks/（非 todos），并支持状态流转
metadata:
  edges-title: 工作项叫 tasks，支持状态流转
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Todo 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T03:35:34+00:00"
---

在 idea → 专家细聊 → Cursor Cloud Agent 开发 → 改状态 的工作模式下，工作项应叫 tasks（不是 todos），并支持设置状态流转。

**Why:**
todo 暗示一次性勾选清单；这套流程是跨 Agent 接力的工作项，需要状态机（如 open → discussing → building → done）。命名与目录应与生命周期一致。

**How to apply:**
- 新工作项落到 `knowledge/tasks/`（或从 `knowledge/todos/` 迁过去后只用 tasks）
- 每条 task 带可更新的状态字段，并约定流转规则
- 存量 `knowledge/todos/` 应迁移或别名过渡，避免两套并存
- Todo 记录员角色/文案可随目录改名对齐（如 Task 记录员），以免名实不符
