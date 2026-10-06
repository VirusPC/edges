---
name: edges_tasks_skill_mcp_wrappers
description: 补大一统 Task CRUD Skill 调 CLI（及 MCP）；理想链路 AGENTS.md→Skill→CLI；不另造动词
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
  edges-updated-at: "2026-09-19T06:19:12.639Z"
---

在现有 `edges tasks` CLI 契约上补 **Skill** 与 **MCP** 封装，三者共用同一套动词与语义；不要另造一套操作面。

**特别重要（P0）：** 先做「大一统 CRUD Skill 调 CLI」——一份尽量统一的 Task 基本操作 Skill（create / get / list / update / status，以及 CLI 已有的 delete/cancel 语义），由 Skill 调用 `edges` CLI，而不是 agent 手搓看板文件。这是对话落盘、派发、改状态的底座；`project-tasks-classify` 只做整板归属，**不能**代替 CRUD。理想发现链路是 **AGENTS.md → Skill → CLI**（见根记忆 `agents_md_to_skill_to_cli`）。

**Why / 结论:**
ADR 0005（tasks CLI）与 ADR 0009（Project 分组）落地的是 **CLI + 看板路径**。能力面仍按 ADR 0004：CLI + Skill + MCP **三者并列**。目前仓内与 Tasks 直接相关的 Skill 基本只有 `project-tasks-classify`；任务记录员沉淀仍靠手写推看板。#15「tasks 配套 skill」早期路径已 done，但需在 **现行 CLI 契约**（含 Project / `_default`、priority、review-page 等）上把 Skill 与 MCP 对齐补齐。peng cheng（2026-09-18）明确：补充 Tasks 相关 Skill，**CRUD 基本操作特别重要**。peng cheng（2026-09-19）明确理想工作方式：读目录 `AGENTS.md` → 被指引到可加载 Skill → 由（尽量大一统的）Skill 调 CLI；项目记忆 `skills` 类型不是自动加载层。

**How to apply:**
- **P0 Skill：** 「大一统 CRUD Skill 调 CLI」——list / get / create / update（含 `--project` / `--priority`）/ status（搬家与 frontmatter 双写）；薄封装现行 CLI，禁止手改路径当主路径。缺口写进 `extensions/skills`（可加载层），不要只沉淀到 `.memory/skills`。
- **P1：** MCP 与同一套动词对齐；鉴权见交叉卡「CLI与MCP需加鉴权」。
- **其后 / 相关：** `conversation-to-task`（对话→总结→调同一套 create/update）；勿与 classify 并卡。
- **不包含：** Multica daemon、parent/sub-issue/stage、本条不重做 GitHub 关联；不另造 classify 动词。
- 交叉：`conversation-to-task-skill调用CLI`、已有 `project-tasks-classify`、ADR 0004/0005/0009；根记忆 `agents_md_to_skill_to_cli`、`prefer_repo_skills_and_cli`；看板层 `tasks_board_mutations_via_cli`。
- 派发时默认先 grill-with-docs；未指派。
