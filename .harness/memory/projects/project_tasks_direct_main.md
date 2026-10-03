---
name: project_tasks_direct_main
description: 往 knowledge/tasks/ 写只追加速记时，直接提交 main、不提 PR
metadata:
  edges-title: tasks 只追加直接推 main
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T08:00:53+00:00"
---

往 `knowledge/tasks/` 写只追加的 Task 速记时，直接提交到 `main`，不提 PR。

**Why:**
这类内容是跨 Agent 接力的工作项，只追加、不改历史主干逻辑；走 PR 会拖慢记事节奏。用户已明确要求 Task 记录员追加跳过默认 PR 流程（承接原 todos 直推 main 约定）。

**How to apply:**
- 新增/补充 `knowledge/tasks/**/*.md`（默认 `backlog/`）：pull 最新 `main` → 只改 tasks 相关文件 → commit（带 `Co-authored-by: Task 记录员 <grok-bot@users.noreply.github.com>`）→ push `main`
- 不要为这类速记开 PR
- `knowledge/notes/` 等知识归档仍可按原 edges-publish / 可 review 流程；本约定仅覆盖 Task 看板的只追加速记
