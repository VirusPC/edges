---
name: project_classify_tasks_and_project_metadata
description: 实现或改 edges tasks project / project-tasks-classify Skill 时打开：能力面 CLI + Skill + MCP；按用户已设质心做 LLM / agent 判断；无 embedding、无 classify 动词。第 4 步人闸是 project review-page（Markdown 表仅无 GUI 回退）。四个 project 动词都会 ensure。Skill 目录/id 是 project-tasks-classify（展示名 classifyTasks）。
metadata:
  edges-title: classifyTasks 与 Task Project 元数据
  edges-type: project
  edges-origin-session-id: bc-4a366c7b-641d-580a-9040-857bf9762aa4
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T08:51:45+00:00"
---

ADR 0010 的 CLI project 子命令与 classifyTasks Skill（id / 目录 `project-tasks-classify`）已落地。按用户已设 Task Project（标题 + 描述）做整板归属建议，LLM / agent 判断，不要求 embedding；第 4 步人闸主路径是 `edges tasks project review-page`（已写进 skill），apply 走 update --project，不改 status / priority。

**Why:**
2026-09-17 grill 锁定 Q18=A、无 classify 动词、能力面 CLI + Skill + MCP。同日曾把方法名写成 Embedding-based 最近质心分类，peng cheng 随即撤回：本轮不要求 embedding，也不把向量分类写成合同。四个 project 动词都必须先 ensure：Issue-layer `create --project` 可能留下没有 AGENTS.md 的目录。人闸改为 render-only 审阅页，避免继续只靠 Markdown 表或聊天 HTML 预览。用户所述（2026-09-17）：Skill 目录/id 用 `project-tasks-classify`，比 `classify-tasks` 更合理；展示名仍可以是 classifyTasks。

**How to apply:**
- 改 project 标题/描述用 `edges tasks project update`；新建用 `project create`。
- `project list|get|create|update` 都会 ensure（update 无 skipId）；orphan 目录会被补种，不要先手写 AGENTS.md。
- 整理看板用 `project-tasks-classify` Skill（路径 `extensions/skills/project-tasks-classify/`），按已有质心做归属建议，禁止手改路径。第 4 步：写建议 JSON → `project review-page --from` → 把 stdout `path` 交给人用系统浏览器打开 → 停止 → 等贴回审阅导出行 → 再 `project create`（如需）/ `update --project`。Markdown 表只作无 GUI 回退。
- 不要把 Task 升成 Memory Type；不要实现 `edges tasks classify` 或 `apply-review`；不要把 generic tasks Skill/MCP CRUD 塞进本 Skill；不要加仓内 embedding 库。
- Skill 正文禁止句里的 `edges tasks classify` 必须保留，探针不要因此失败。
