---
name: project_tasks_with_status_not_todos
description: >-
  Task 工作项按 Task Project 与 edges-tasks-status 分夹；当前领域板在 tasks/，Edges 维护板在
  .harness/tasks/，旧 knowledge/tasks/ 仅是迁移史料。
metadata:
  edges-title: 工作项叫 tasks，支持状态流转
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: codex
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T05:54:28+08:00'
---

在 idea → 专家细聊 → Cursor Cloud Agent 开发 → 改状态 的工作模式下，工作项应叫 tasks（不是 todos），先按 Task Project 分组，再按 `edges-tasks-status` 分夹存放。

**现行目录（2026-10-05）：**领域 Task 位于 `tasks/`，Edges 维护 Task 位于 `.harness/tasks/`。早期的 `knowledge/tasks/` 是迁移前路径，以下状态与 Project 语义沿用，实际读写选定的当前看板。

**Why:**
todo 暗示一次性勾选清单；这套流程是跨 Agent 接力的工作项，需要状态机。ADR 0009 把状态夹嵌进 project-slug 下。

**How to apply:**
- 新工作项落到所选板 `tasks/<project-slug>/<status>/` 或 `.harness/tasks/<project-slug>/<status>/`，未分组用 `_default/`，默认 `backlog/`
- 状态字段只用 `metadata.edges-tasks-status`（backlog | todo | in_progress | in_review | done | blocked | cancelled）
- 分组字段 `metadata.edges-task-project` 与目录 slug 双写
- 不要沿用旧 `knowledge/todos/` 或 `knowledge/tasks/` 路径，也不要在当前看板根下直接放 status 夹
- 角色文案用 Task 记录员
