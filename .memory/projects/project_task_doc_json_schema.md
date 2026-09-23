---
name: project_task_doc_json_schema
description: 改 Task frontmatter、CLI 的 Task 文档类型，或看板条目的 doc 时打开：字段真源是 extensions/clis/schemas/task-doc.v1.json（name、description、metadata、body）；不要自造轻量配置，也不要另开看板顶层 schema。决策见 docs/adr/0022。
metadata:
  edges-title: Task Doc 字段真源是 JSON Schema
  edges-type: project
  edges-origin-session-id: bc-0b785d16-25ab-56b2-9ca1-640f22eaeb0d
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-23T15:57:45+00:00"
---

Task 文档的字段约定是独立可复用的 JSON Schema `extensions/clis/schemas/task-doc.v1.json`（`$id` 为 `edges.task-doc/v1`）：`name`、`description`、`metadata`、`body`。CLI frontmatter 与看板条目的 `doc` 都对齐它。`metadata` 允许未知键；`edges-tasks-status` 与 `edges-task-priority` 用既有枚举。`body` 是 Markdown。本轮只放契约文件，CLI 尚未消费它。用户所述，grill 确认于 2026-09-23。

**Why:**
自造轻量配置会和 frontmatter、看板 `doc`、以后的 LLM 结构化输出各维护一份。另开看板顶层 schema 会把 `edges.tasks.grouped/v1` 拆成两套对象。生成器若预编译 HTML，右栏就不再读 Markdown 正文。

**How to apply:**
- 改 Task 文档字段、frontmatter 键或看板 `doc` 时以该 schema 为准，并对照 ADR 0022。
- 不要把 `rawFrontmatter` 或 `bodyHtml` 写进契约。浏览器不读仓内 `.md`。
- 状态枚举是 backlog、todo、in_progress、in_review、done、blocked、cancelled。优先级是 urgent、high、medium、low、none。`edges-task-project` 省略表示 default；不要把目录名 `_default` 或状态夹名写进该字段。
- 看板载荷仍是 `edges.tasks.grouped/v1` 的可选 `items[].doc`。指派在 `metadata.edges-task-assignee`，不要在条目上再造一条与 `doc` 平行的必填字段。
- 实现轮再让 CLI 校验这份 schema。本轮不要为了接线去改 review-page 或搭 React。
