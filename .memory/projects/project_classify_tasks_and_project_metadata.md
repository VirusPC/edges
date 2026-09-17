---
name: project_classify_tasks_and_project_metadata
description: 实现或改 edges tasks project / project-tasks-classify Skill 时打开：计划 docs/superpowers/plans/2026-09-17-classify-tasks.md；能力面 CLI + Skill + MCP；按用户已设质心做 LLM / agent 判断；无 embedding、无 classify 动词。四个 project 动词都会 ensure。Skill 目录/id 是 project-tasks-classify（展示名 classifyTasks）。
metadata:
  edges-title: classifyTasks 与 Task Project 元数据
  edges-type: project
  edges-origin-session-id: bc-13b41ece-8169-5e93-99d7-adb3cfaa13c3
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T03:50:18+00:00"
---

ADR 0010 的 CLI project 子命令与 classifyTasks Skill（id / 目录 `project-tasks-classify`）已按 docs/superpowers/plans/2026-09-17-classify-tasks.md 落地。按用户已设 Task Project（标题 + 描述）做整板归属建议，LLM / agent 判断，不要求 embedding；apply 走 update --project，不改 status / priority。

**Why:**
2026-09-17 grill 锁定 Q18=A、无 classify 动词、能力面 CLI + Skill + MCP。同日曾把方法名写成 Embedding-based 最近质心分类，peng cheng 随即撤回：本轮不要求 embedding，也不把向量分类写成合同。四个 project 动词都必须先 ensure：Issue-layer `create --project` 可能留下没有 AGENTS.md 的目录。用户所述（2026-09-17）：Skill 目录/id 用 `project-tasks-classify`，比 `classify-tasks` 更合理；展示名仍可以是 classifyTasks。

**How to apply:**
- 改 project 标题/描述用 `edges tasks project update`；新建用 `project create`。
- `project list|get|create|update` 都会 ensure（update 无 skipId）；orphan 目录会被补种，不要先手写 AGENTS.md。
- 整理看板用 `project-tasks-classify` Skill（路径 `extensions/skills/project-tasks-classify/`），按已有质心做归属建议，禁止手改路径。
- 不要把 Task 升成 Memory Type；不要实现 `edges tasks classify`；不要把 generic tasks Skill/MCP CRUD 塞进本 Skill；不要加仓内 embedding 库。
- Skill 正文禁止句里的 `edges tasks classify` 必须保留，探针不要因此失败。
