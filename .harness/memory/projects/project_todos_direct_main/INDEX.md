---
name: project_todos_direct_main
description: 旧约定：往 knowledge/todos/ 只追加速记曾直接推 main；该路径已删除，现行入口见 tasks_direct_main
metadata:
  edges-title: todos 只追加直接推 main（已由 tasks 路径取代）
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T08:00:40+00:00"
---

往 `knowledge/todos/` 写只追加速记、直接推 main 的约定已被 `knowledge/tasks/` 取代；旧路径不再是活跃捕获入口。

**Why:**
grill-with-docs 已决定删除 `knowledge/todos/`（不留 stub），工作项按 `edges-tasks-status` 分夹落在 `knowledge/tasks/`。继续写 todos 会指向不存在的目录。

**How to apply:**
- 不要再往 `knowledge/todos/` 追加
- 新人侧 / Task 记录员只追加速记：写 `knowledge/tasks/backlog/`，直接推 main（见 `project_tasks_direct_main`）
- 本条只保留「曾经对 todos 跳过 PR」的历史，不再作为现行路径
