---
name: project_classify_tasks_and_project_metadata
description: 实现或改 edges tasks project / classify-tasks Skill 时打开：计划在 docs/superpowers/plans/2026-09-17-classify-tasks.md；本轮只做计划；能力面 CLI + Skill + MCP；无 embedding、无 classify 动词。
metadata:
  edges-title: classifyTasks 与 Task Project 元数据实现计划
  edges-type: project
  edges-origin-session-id: bc-13b41ece-8169-5e93-99d7-adb3cfaa13c3
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T02:34:29+00:00"
---

ADR 0010 的实现计划在 `docs/superpowers/plans/2026-09-17-classify-tasks.md`。本轮只落计划；实现轮再写 `edges tasks project list|get|create|update` 与 classify-tasks Skill。元数据只在索引/描述层（Q18=A），看板 markdown 仍是 Task 真源。

**Why:**
2026-09-17 grill / ADR 0010 锁定软聚类、整板重聚、人改建议表后再 CLI 应用；无 embedding、无公开 `edges tasks classify`。能力面始终是 CLI + Skill + MCP。Generic tasks Skill/MCP CRUD 与 embedding K-means / classify-in-CLI 仍是另卡。

**How to apply:**
- 实现或改 Task Project 元数据、classifyTasks 工作流时打开该计划，不要重开产品决策。
- 本计划 PR 不实现 CLI/Skill，不迁看板，只种子元数据的写法写在计划 Task 7。
- 能力面必须写成 CLI + Skill + MCP；不要说「必要时 MCP」。
- 不要把 Task 升成 Memory Type；不要手改根 `knowledge/tasks/AGENTS.md` 的 Task Projects 节。
