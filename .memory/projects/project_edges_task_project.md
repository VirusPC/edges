---
name: project_edges_task_project
description: 看板 Task Project 为 directory-first + frontmatter 双写；未分组用 _default。决策见 docs/adr/0008-edges-task-project-grouping.md（修订 ADR 0002 路径）。本轮只定文档，不迁看板、不改 CLI；后续 status 只在同 project 内移动。
metadata:
  edges-title: Task 看板按 Task Project 目录优先分组
  edges-type: project
  edges-origin-session-id: bc-0d273906-f06e-480c-b79b-991da4a75cc8
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T03:20:11+00:00"
---

看板内 Task 分组单位是 Task Project：directory-first（约定路径 `knowledge/tasks/<project-slug>/<edges-tasks-status>/`）并与 frontmatter `metadata.edges-task-project` 双写；未分组用保留目录 `_default`（字段 `default` 或不写）。与 status、priority 正交。用户所述、grill 确认于 2026-09-16；本轮只定文档，未迁看板、未改 CLI。后续实现：`status` 只在同一 project 内搬家；跨 project 必须显式 `update --project`（或等价入口）。

**Why:**
2026-09-16 grill 确认要对齐 Multica Project，但不能把状态夹当 project，也不能只改标签不改路径。ADR 0008 修订 ADR 0002 的路径：状态夹仍按 `edges-tasks-status`，但嵌在 project-slug 下。一次性迁移现有 `tasks/<status>/*` → `tasks/_default/<status>/*` 后，tasks 根下不再直接放 status 夹。本轮不做 parent/sub-issue/stage，也不改写 Skill/MCP；实现轮必须先让 `edges tasks` CLI 跟上新路径。能力面仍是 CLI + Skill + MCP。决策见 `docs/adr/0008-edges-task-project-grouping.md`。

**How to apply:**
- 改看板路径、CLI 或 glossary 时按 ADR 0008 与 CONTEXT 术语；目录与 `edges-task-project` 必须一起改。
- 迁移前不要把 CONTEXT 的约定路径当成当前 CLI/看板已经生效；现网仍是 `knowledge/tasks/<status>/`。
- 不要把 `edges-tasks-status` 当 project，不要用任意深层目录当 project，迁移后不要在 `knowledge/tasks/` 根下直接放 status 夹。
- 不要只用 frontmatter 或只改路径；不要用 `status` 跨 project 搬家。
- 本轮不要迁看板文件、不要实现 CLI、不要做 parent/sub-issue/stage、不要全量改写 Skill/MCP。
- 对照 ADR `docs/adr/0008-edges-task-project-grouping.md`；叠 ADR 0002 / 0005 / 0007。
