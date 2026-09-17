---
name: project_classify_tasks_and_project_metadata
description: 实现或改 edges tasks project / project-tasks-classify Skill 时打开：计划 docs/superpowers/plans/2026-09-17-classify-tasks.md；能力面 CLI + Skill + MCP；Embedding-based NCC（用户已设质心）；无 classify 动词。四个 project 动词都会 ensure。Skill 目录/id 是 project-tasks-classify（展示名 classifyTasks）。
metadata:
  edges-title: classifyTasks 与 Task Project 元数据
  edges-type: project
  edges-origin-session-id: bc-9bef6b65-c2fe-5e7c-a2fe-3006e85b01e8
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T03:36:36+00:00"
---

ADR 0010 的 CLI project 子命令与 classifyTasks Skill（id / 目录 `project-tasks-classify`）已按 docs/superpowers/plans/2026-09-17-classify-tasks.md 落地。方法是 Embedding-based Nearest Centroid Classification（NCC）：质心由用户预先设定，embedding 走宿主 / runtime，apply 走 update --project，不改 status / priority。

**Why:**
2026-09-17 grill 锁定 Q18=A、无 classify 动词、能力面 CLI + Skill + MCP。同日 peng cheng 纠正：质心已经设好，Skill 是分类到已有质心，不是迭代发现簇；不要把工作流写成聚类。四个 project 动词都必须先 ensure：Issue-layer `create --project` 可能留下没有 AGENTS.md 的目录。用户所述（2026-09-17）：Skill 目录/id 用 `project-tasks-classify`，比 `classify-tasks` 更合理；展示名仍可以是 classifyTasks。

**How to apply:**
- 改 project 标题/描述用 `edges tasks project update`；新建用 `project create`（人先显式补质心）。
- `project list|get|create|update` 都会 ensure（update 无 skipId）；orphan 目录会被补种，不要先手写 AGENTS.md。
- 整理看板用 `project-tasks-classify` Skill（路径 `extensions/skills/project-tasks-classify/`），按 NCC 归到已有质心，禁止手改路径。
- 不要把 Task 升成 Memory Type；不要实现 `edges tasks classify`；不要把 generic tasks Skill/MCP CRUD 塞进本 Skill；不要加仓内 embedding 库。
- Skill 正文禁止句里的 `edges tasks classify` 必须保留，探针不要因此失败。
