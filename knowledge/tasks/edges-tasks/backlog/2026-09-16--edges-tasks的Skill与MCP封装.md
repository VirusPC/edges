---
name: edges_tasks_skill_mcp_wrappers
description: 在现有 edges tasks CLI 契约上补 Skill 与 MCP；优先 Task 增删改查等基本操作 Skill；不另造动词
metadata:
  edges-type: task
  edges-title: edges tasks 的 Skill + MCP 封装
  edges-tasks-status: backlog
  edges-task-priority: high
  edges-task-project: edges-tasks
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-18T03:31:00+08:00"
---

在现有 `edges tasks` CLI 契约上补 **Skill** 与 **MCP** 封装，三者共用同一套动词与语义；不要另造一套操作面。

**特别重要（优先切片）：** 先补齐 **Task 增删改查等基本操作** 的 Skill（create / get / list / update / status 改状态，以及必要的 delete/cancel 语义若 CLI 已有）。通用 CRUD Skill 是对话落盘、派发、改状态的底座；`project-tasks-classify` 只做整板归属，**不能**代替 CRUD。

**Why / 结论:**
ADR 0005（tasks CLI）与 ADR 0009（Project 分组）落地的是 **CLI + 看板路径**。能力面仍按 ADR 0004：CLI + Skill + MCP **三者并列**。目前仓内与 Tasks 直接相关的 Skill 基本只有 `project-tasks-classify`；任务记录员沉淀仍靠手写推看板。#15「tasks 配套 skill」早期路径已 done，但需在 **现行 CLI 契约**（含 Project / `_default`、priority、review-page 等）上把 Skill 与 MCP 对齐补齐。peng cheng（2026-09-18）明确：补充 Tasks 相关 Skill，**CRUD 基本操作特别重要**。

**How to apply:**
- **P0 Skill：** Task 基本操作——list / get / create / update（含 `--project` / `--priority`）/ status（搬家与 frontmatter 双写）；薄封装现行 CLI，禁止手改路径当主路径。
- **P1：** MCP 与同一套动词对齐；鉴权见交叉卡「CLI与MCP需加鉴权」。
- **其后 / 相关：** `conversation-to-task`（对话→总结→调同一套 create/update）；勿与 classify 并卡。
- **不包含：** Multica daemon、parent/sub-issue/stage、本条不重做 GitHub 关联；不另造 classify 动词。
- 交叉：`conversation-to-task-skill调用CLI`、已有 `project-tasks-classify`、ADR 0004/0005/0009。
- 派发时默认先 grill-with-docs；未指派。
