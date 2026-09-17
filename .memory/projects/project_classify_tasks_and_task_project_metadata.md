---
name: project_classify_tasks_and_task_project_metadata
description: 改 Task Project 元数据、classifyTasks / project-tasks-classify 工作流或看板 AGENTS.md 时：只做索引/描述层（Q18=A），不把 Task 升成 Memory Type。方法是 Embedding-based NCC，质心由用户预先设定。Skill 路径 extensions/skills/project-tasks-classify/。决策见 docs/adr/0010-classify-tasks-and-task-project-metadata.md。
metadata:
  edges-title: classifyTasks 用 NCC 分类；Task Project 元数据只做索引层
  edges-type: project
  edges-origin-session-id: bc-9bef6b65-c2fe-5e7c-a2fe-3006e85b01e8
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T03:36:36+00:00"
---

classifyTasks 是独立工作流 Skill（`extensions/skills/project-tasks-classify/`，frontmatter `name: project-tasks-classify`，展示名 classifyTasks），用 Embedding-based Nearest Centroid Classification（NCC）把整板 Task 分到用户已设的 Task Project 质心，人改表后再经 `edges tasks` CLI 落地；Task Project 管理只在索引/描述层对齐 Project Memory（Q18=A），看板 markdown 仍是 Task 真源。用户所述、grill 确认于 2026-09-17；同日 peng cheng 纠正概念模型为 NCC（质心已设，不是发现簇）。Skill id 由用户改为 `project-tasks-classify`（比 `classify-tasks` 更合理）。

**Why:**
2026-09-17 grill 确认：缺的是整理工作流和 project 标题/描述，不是再改 ADR 0009 的分组形状。Q18=A 先做索引同构；Q18=B（每条 Task 升 Memory Type）与 `tasks-memory与看板语义合并` 重叠，以后再谈。embedding 走宿主 / runtime，不把 classify 做成 CLI 动词，也不加仓内 embedding 库。能力面仍是 CLI + Skill + MCP。

**How to apply:**
- 改 glossary、CLI `project` 子命令或 classifyTasks / `project-tasks-classify` skill 时按 ADR 0010 与 CONTEXT 术语（NCC，用户已设质心）。
- 根 `knowledge/tasks/AGENTS.md` 的 Task Projects 节在 project-memory 受管标记外，由 CLI 维护、不手改；每 project（含 `_default`）只要轻量 AGENTS.md，不要完整 `project-memory-init`。
- 不要自动批量建 project；不要用 classify / `update --project` 改 status 或 priority。
- 不要本轮实现仓内 embedding 库、公开 `edges tasks classify`、Task-as-Memory-Type、Multica parent/stage、或通用 Skill+MCP CRUD。
- 对照 ADR `docs/adr/0010-classify-tasks-and-task-project-metadata.md`；叠 ADR 0004 / 0005 / 0009。
