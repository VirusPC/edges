---
name: project_todos_direct_main
description: 往 knowledge/todos/ 写只追加速记时，直接提交 main、不提 PR
metadata:
  edges-title: todos 只追加直接推 main
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 记事本
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-09T04:31:57+00:00"
---

往 `knowledge/todos/` 写只追加的速记时，直接提交到 `main`，不提 PR；怎么快怎么来。

**Why:**
这类内容是人记人看的待办清单，只追加、不改历史主干逻辑；走 PR 会拖慢记事节奏。用户已明确要求对 todos 速记跳过默认 PR 流程。

**How to apply:**
- 新增/补充 `knowledge/todos/*.md`：pull 最新 `main` → 只改 todos 相关文件 → commit（带 `Co-authored-by: 记事本 <grok-bot@users.noreply.github.com>`）→ push `main`
- 不要为这类速记开 PR
- `knowledge/notes/` 等知识归档仍可按原 edges-publish / 可 review 流程；本约定仅覆盖 `knowledge/todos/` 的只追加速记
