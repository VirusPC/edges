---
name: project_classify_tasks_and_project_metadata
description: 实现或改 edges tasks project / classify-tasks Skill 时打开：计划在 docs/superpowers/plans/2026-09-17-classify-tasks.md；能力面 CLI + Skill + MCP；无 embedding。Skill 正文必须保留禁止句 edges tasks classify，探针不要因此失败。
metadata:
  edges-title: classifyTasks 与 Task Project 元数据实现计划
  edges-type: project
  edges-origin-session-id: bc-13b41ece-8169-5e93-99d7-adb3cfaa13c3
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T03:06:04+00:00"
---

ADR 0010 的实现计划在 `docs/superpowers/plans/2026-09-17-classify-tasks.md`。元数据只在索引/描述层（Q18=A），看板 markdown 仍是 Task 真源。classify-tasks Skill 是工作流入口，不是 clustering 代码。

**Why:**
2026-09-17 grill / ADR 0010 锁定软聚类、整板重聚、人改建议表后再 CLI 应用；无 embedding、无公开 classify 动词。能力面始终是 CLI + Skill + MCP。Task 6 裁定：锁定 Skill 正文必须写出「不要 `edges tasks classify`」；后置探针要扫 Whole-board / wait，并禁止 openai.embeddings / kmeans / KMeans，但不得因禁止句里出现该动词失败。Generic tasks Skill/MCP CRUD 与 embedding K-means / classify-in-CLI 仍是另卡。

**How to apply:**
- 实现或改 Task Project 元数据、classifyTasks 工作流时打开该计划，不要重开产品决策。
- 改 `extensions/skills/classify-tasks/SKILL.md` 时保留禁止 / 不要句子里的 `edges tasks classify`；不要写成「run edges tasks classify」落地配方。
- 能力面必须写成 CLI + Skill + MCP；不要说「必要时 MCP」；不要加 classify MCP，不要在本 skill 下写 `scripts/`。
- 不要把 Task 升成 Memory Type；不要手改根 `knowledge/tasks/AGENTS.md` 的 Task Projects 节（那是 Task 7）。
