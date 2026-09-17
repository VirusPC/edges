---
name: project_classify_tasks_and_task_project_metadata
description: 改 Task Project 元数据、classifyTasks 工作流或看板 AGENTS.md 时：只做索引/描述层（Q18=A），不把 Task 升成 Memory Type。决策见 docs/adr/0010-classify-tasks-and-task-project-metadata.md。本轮只定文档。
metadata:
  edges-title: classifyTasks 软聚类；Task Project 元数据只做索引层
  edges-type: project
  edges-origin-session-id: bc-2d4af9b7-e5e3-5779-8830-e955882a72f7
  edges-agent-client: cursor
  edges-username: Coding Agent 专家
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T02:22:57+00:00"
---

classifyTasks 是独立工作流 Skill（`extensions/skills/classify-tasks/`），以带描述的 Task Project 为质心对整板做软 K-means 式建议，人改表后再经 `edges tasks` CLI 落地；Task Project 管理只在索引/描述层对齐 Project Memory（Q18=A），看板 markdown 仍是 Task 真源。用户所述、grill 确认于 2026-09-17；本轮只落地 CONTEXT + ADR 0010。

**Why:**
2026-09-17 grill 确认：缺的是整理工作流和 project 标题/描述，不是再改 ADR 0009 的分组形状。Q18=A 先做索引同构；Q18=B（每条 Task 升 Memory Type）与 `tasks-memory与看板语义合并` 重叠，以后再谈。无 embedding 就不把 classify 做成 CLI 动词。能力面仍是 CLI + Skill + MCP。

**How to apply:**
- 改 glossary、CLI `project` 子命令或 classifyTasks skill 时按 ADR 0010 与 CONTEXT 术语。
- 根 `knowledge/tasks/AGENTS.md` 的 Task Projects 节在 project-memory 受管标记外，由 CLI 维护、不手改；每 project（含 `_default`）只要轻量 AGENTS.md，不要完整 `project-memory-init`。
- 不要自动批量建 project；不要用 classify / `update --project` 改 status 或 priority。
- 不要本轮实现 embedding、公开 `edges tasks classify`、Task-as-Memory-Type、Multica parent/stage、或通用 Skill+MCP CRUD。
- 对照 ADR `docs/adr/0010-classify-tasks-and-task-project-metadata.md`；叠 ADR 0004 / 0005 / 0009。
