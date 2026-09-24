---
name: conversation_to_tasks_then_cli_persist
description: conversation-to-tasks 整理成文后，另一步经 edges tasks CLI 落库（create/update）；skill 本身不写盘
metadata:
  edges-type: task
  edges-title: conversation-to-tasks 整理后调 CLI 落库
  edges-tasks-status: backlog
  edges-task-project: edges-tasks
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-24T10:41:28+08:00"
---

把「对话 → Task 草稿」与「CLI 落库」拆开：整理 skill 只成文；落库另一步调 `edges tasks` CLI。

【背景/场景】

- 2026-09-24 决定做薄 skill `conversation-to-tasks`，与 `conversation-to-notes`、`project-memory-remember` 三角色分立。
- 用户最初希望 skill 总结后立刻调 CLI 落库；随后改口：对齐 `conversation-to-notes`（只整理、不调 CLI），把 CLI 落库推迟为本 backlog。
- 触发问题：此前从对话记 Task 时 Why/How 有了，但【背景/场景】（为何此刻出现、出自哪次对话/PR）偏薄，读者只能猜。
- 取代旧卡 `2026-09-13--conversation-to-task-skill调用CLI`（该卡把「总结 skill」与「CLI 落盘」捆在一起；已 cancelled）。

交付物 / 完成标准

- 有一条可加载入口（Skill 或与大一统 Task CRUD Skill 的组合），在 `conversation-to-tasks` 产出草稿后，调用现行 `edges tasks create` / `update`（含 `--body`、`--project`、`--status` 等已有 flag）写入看板，并回报 path/stem。
- 去重：落库前 `list`/`get`；已有开放 Task 覆盖同一意图则 `update`，不造近义新建。
- 禁止手改 `knowledge/tasks/` 当主路径；能力面仍是 CLI + Skill + MCP（ADR 0004）。

非目标

- 不在本卡里改 `conversation-to-tasks` 正文去「内嵌落库」（那会破坏与 notes 的对称）。
- 不在本卡实现 generic tasks MCP；不另造 `edges tasks classify` 类动词。
- 不把 `conversation-to-notes` 改成调 CLI（是否给 notes 同样「整理后落库」另议）。

TBD

- 落库入口形态：独立薄 skill、并进大一统 Task CRUD Skill，还是 conversation-to-tasks 的可选后续步骤说明。
- 具体命令与 flag 以当时 CLI `--help` 为准（今日已有 `create --title --description --body --project --status --priority --assignee`）。
- notes 是否要对齐「整理后调 `edges note`」：对照 `edges-note` skill。
- 与 backlog「edges tasks 的 Skill + MCP 封装」的依赖顺序。

链接

- PR：https://github.com/VirusPC/edges/pull/127（薄 skill，只整理不落库）
- `extensions/skills/conversation-to-notes/SKILL.md`
- `extensions/skills/edges-note/SKILL.md`
- 兄弟：`2026-09-16--edges-tasks的Skill与MCP封装`；旧卡（cancelled）：`2026-09-13--conversation-to-task-skill调用CLI`

**Why:**（边界）

整理与落库解耦后，skill 可在无写权限宿主上先出草稿；落库统一走 CLI，避免手搓路径与 frontmatter 漂移。

**How to apply:**（做法）

实现前先 grill-with-docs；复用 CRUD Skill/CLI，不要在 conversation-to-tasks 目录加 scripts。未指派。
