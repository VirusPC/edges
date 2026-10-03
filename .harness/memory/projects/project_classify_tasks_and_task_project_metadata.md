---
name: project_classify_tasks_and_task_project_metadata
description: 改 Task Project 元数据、classifyTasks / project-tasks-classify 工作流或看板 AGENTS.md 时：只做索引/描述层（Q18=A），不把 Task 升成 Memory Type。按用户已设 Task Project 质心做归属建议（LLM / agent 判断），不要求 embedding。人闸主路径是 review-page（ADR 0012）。Skill 路径 extensions/skills/project-tasks-classify/；新类型走 proposeTypes（ADR 0011）。决策见 docs/adr/0010-classify-tasks-and-task-project-metadata.md。
metadata:
  edges-title: classifyTasks 按已有质心分类；Task Project 元数据只做索引层
  edges-type: project
  edges-origin-session-id: bc-4a366c7b-641d-580a-9040-857bf9762aa4
  edges-agent-client: cursor
  edges-username: Coding Agent 专家
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T07:58:06+00:00"
---

classifyTasks 是独立工作流 Skill（`extensions/skills/project-tasks-classify/`，frontmatter `name: project-tasks-classify`，展示名 classifyTasks），按用户已设 Task Project（标题 + 描述）对整板做归属建议（LLM / agent 判断，不要求 embedding）；人闸主路径是 Task Project 审阅页（`edges tasks project review-page`），无 GUI 时 Markdown 建议表回退，人贴回审阅导出行后再经 `edges tasks` CLI 落地。新类型不在本 skill 发明，走 proposeTypes（ADR 0011）。Task Project 管理只在索引/描述层对齐 Project Memory（Q18=A），看板 markdown 仍是 Task 真源。用户所述、grill 确认于 2026-09-17；同日撤回 Embedding-based 最近质心分类作为本轮方法名；ADR 0011 同日修订路径与类型发现边界；ADR 0012 同日修订人闸主路径。Skill id 由用户改为 `project-tasks-classify`（比 `classify-tasks` 更合理）。

**Why:**
2026-09-17 grill 确认：缺的是整理工作流和 project 标题/描述，不是再改 ADR 0009 的分组形状。同日撤回 Embedding NCC / 软 K-means 命名（无真向量）。类型发现从 classify 拆到 ADR 0011，避免一边分类一边发明质心。人闸从 Markdown 表改到 render-only 审阅页（ADR 0012），CLI 不算归属。Q18=A 先做索引同构；Q18=B 以后再谈。无 embedding 就不把 classify 做成 CLI 动词。能力面仍是 CLI + Skill + MCP。

**How to apply:**
- 改 glossary、CLI `project` 子命令或 classifyTasks / `project-tasks-classify` skill 时按 ADR 0010（经 ADR 0011、0012 修订）与 CONTEXT 术语（用户已设质心 + LLM / agent 判断 + Task Project 审阅页）。
- Skill 路径是 `extensions/skills/project-tasks-classify/`，不要再创建 `classify-tasks/`。
- 人闸主路径：建议 JSON → `edges tasks project review-page` → 给人 HTML 路径并停止 → 等贴回导出 JSON → 现有 `project create` / `update --project`。Markdown 表只作无 GUI 回退。
- 根 `knowledge/tasks/AGENTS.md` 的 Task Projects 节在 project-memory 受管标记外，由 CLI 维护、不手改；每 project（含 `_default`）只要轻量 AGENTS.md，不要完整 `project-memory-init`。
- 不要自动批量建 project；不要在 classify 表内发明新类型；不要用 classify / `update --project` 改 status 或 priority。
- 不要本轮实现 embedding、公开 `edges tasks classify`、`apply-review`、审阅页 MCP、Task-as-Memory-Type、Multica parent/stage、或通用 Skill+MCP CRUD。
- 对照 ADR `docs/adr/0010-classify-tasks-and-task-project-metadata.md`、`docs/adr/0011-propose-task-project-types-from-default.md` 与 `docs/adr/0012-task-project-review-page-is-render-only-cli.md`；叠 ADR 0004 / 0005 / 0009。
