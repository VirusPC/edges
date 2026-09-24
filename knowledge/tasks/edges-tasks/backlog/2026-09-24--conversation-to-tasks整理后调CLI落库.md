---
name: conversation_to_tasks_then_cli_persist
description: conversation-to-tasks 只整理成文；另一步用 edges tasks CLI 把草稿写入看板
metadata:
  edges-type: task
  edges-title: conversation-to-tasks 整理后，用 CLI 落库
  edges-tasks-status: backlog
  edges-task-project: edges-tasks
  edges-task-priority: medium
  edges-updated-at: "2026-09-24T07:54:59.000Z"
---

把「从对话整理出 Task 草稿」和「把草稿写入看板」拆成两步。

整理由 `conversation-to-tasks` 负责，只成文、不落库（与 `conversation-to-notes` 对称）。本卡负责后半步：整理完成后，再通过 `edges tasks` CLI 写入看板。

【背景/场景】

- 2026-09-24 定下对话三角色：`conversation-to-notes`（这次澄清了什么）、`project-memory-remember`（以后还该记住什么）、`conversation-to-tasks`（谁下一步做什么、怎样算完）。
- 做薄 skill 时曾想「整理完立刻调 CLI 落库」，后来改成与 notes 对齐：整理 skill 只成文；落库单独成步，记为本卡。
- 触发点：此前从对话记 Task 时，Why / How 有了，但「为何此刻出现、出自哪次对话或 PR」常常偏薄，读者只能猜。
- 本卡取代旧卡 `2026-09-13--conversation-to-task-skill调用CLI`（那张把总结与落盘捆在一起，已 cancelled）。

交付物 / 完成标准

- 有一条可加载入口（独立薄 skill，或并入统一的 Task CRUD skill）：在 `conversation-to-tasks` 产出草稿后，调用现行 `edges tasks create` / `update`（含已有的 `--body`、`--project`、`--status` 等）写入看板，并回报 path / stem。
- 落库前用 `list` / `get` 去重：已有开放 Task 覆盖同一意图则 `update`，不造近义新建。
- 禁止把手改 `knowledge/tasks/` 当主路径；能力面仍是 CLI + Skill + MCP（ADR 0004）。

非目标

- 不改 `conversation-to-tasks`，让它内嵌落库（那会破坏与 notes 的对称）。
- 不在本卡实现通用 tasks MCP；不另造 `edges tasks classify` 一类动词。
- 不把 `conversation-to-notes` 改成调 CLI（笔记是否也要「整理后落库」另议）。

TBD

- 落库入口形态：独立薄 skill、并进 Task CRUD skill，还是写在 conversation-to-tasks 的「可选后续步骤」里。
- 具体命令与 flag 以当时 CLI `--help` 为准（今日已有 `create --title --description --body --project --status --priority --assignee`）。
- notes 是否要对齐「整理后调 `edges note`」：对照 `edges-note` skill。
- 与 backlog「edges tasks 的 Skill + MCP 封装」的依赖顺序。

关联

- 薄 skill PR：https://github.com/VirusPC/edges/pull/127（只整理，不落库）
- `extensions/skills/conversation-to-notes/SKILL.md`
- `extensions/skills/edges-note/SKILL.md`
- 兄弟：`2026-09-16--edges-tasks的Skill与MCP封装`
- 旧卡（cancelled）：`2026-09-13--conversation-to-task-skill调用CLI`

**Why:**
整理与落库解耦后，skill 可在无写权限的环境里先出草稿；落库统一走 CLI，避免手搓路径和 frontmatter 漂移。

**How to apply:**
实现前先 grill-with-docs；复用现有 CRUD skill / CLI，不要在 conversation-to-tasks 目录加脚本。未指派。
