---
name: project_classify_tasks_and_project_metadata
description: 实现或改 edges tasks project / classify-tasks Skill 时打开：计划 docs/superpowers/plans/2026-09-17-classify-tasks.md；能力面 CLI + Skill + MCP；无 embedding、无 classify 动词。四个 project 动词都会 ensure。
metadata:
  edges-title: classifyTasks 与 Task Project 元数据
  edges-type: project
  edges-origin-session-id: bc-13b41ece-8169-5e93-99d7-adb3cfaa13c3
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T03:19:31+00:00"
---

ADR 0010 的 CLI project 子命令与 classifyTasks Skill 已按 docs/superpowers/plans/2026-09-17-classify-tasks.md 落地。元数据只在索引/描述层；apply 走 update --project，不改 status / priority。

**Why:**
grill 锁定 Q18=A、软聚类、无 embedding、无 classify 动词。能力面始终是 CLI + Skill + MCP。四个 project 动词都必须先 ensure：Issue-layer `create --project` 可能留下没有 AGENTS.md 的目录。

**How to apply:**
- 改 project 标题/描述用 `edges tasks project update`；新建用 `project create`。
- `project list|get|create|update` 都会 ensure（update 无 skipId）；orphan 目录会被补种，不要先手写 AGENTS.md。
- 整理看板用 classify-tasks Skill，禁止手改路径。
- 不要把 Task 升成 Memory Type；不要实现 `edges tasks classify`；不要把 generic tasks Skill/MCP CRUD 塞进本 Skill。
- Skill 正文禁止句里的 `edges tasks classify` 必须保留，探针不要因此失败。
