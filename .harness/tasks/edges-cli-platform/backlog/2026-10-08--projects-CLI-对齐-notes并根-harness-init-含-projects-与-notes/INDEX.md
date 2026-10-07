---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-07T17:12:49.635Z'
  edges-title: projects CLI 对齐 notes，并让根 .harness/init 含 projects 与 notes
  edges-tasks-status: backlog
  edges-task-priority: none
name: projects-cli-and-harness-init-notes-projects
description: >-
  notes/skills CRUD 收口合入后：补 projects CLI（先简单参照 notes 的
  list/get/create/update/delete + meta/--body + filter/group），并在根 `.harness` 与
  init 命令里登记/生成 projects、notes。
---
**背景：**
2026-10-08 在做「notes/skills 的 create·get·update·delete 收口到 NodeService」时，用户确认还要做后续：补 projects 的 CLI（先简单参照 notes），并在根目录 `.harness` 与 init 命令里补上 projects 和 notes。本卡在当前 CRUD 收口合入后自动开干，不问用户。
- 相关现状：已有出栈卡 notes/skills CRUD→NodeService（in_progress，#181）；另有 backlog「CLI 与根 .harness 补齐 notes / edges / projects / archive」部分重叠——本卡聚焦 **projects CLI 对齐 notes** 与 **init/根 harness 生成 projects+notes**；edges/archive 仍归那张更宽卡或拆留。
- 非目标：本卡不等同于完整 archive/edges CLI；不重开 notes CRUD 旁路修复（那是进行中卡）。
- 关联：对话经全栈开发专家转述 2026-10-08；实现 agent https://cursor.com/agents/bc-79c1735d-269f-5741-82b5-c2a9e7618c0c ；兄弟卡 `.harness/tasks/edges-cli-platform/in_progress/2026-10-07--notesskills-的-creategetupdatedelete-收口到-NodeService/`、`.harness/tasks/edges-cli-platform/backlog/2026-10-07--CLI-与根-harness-补齐-notes-edges-projects-archive/`

**目标：**
projects CLI 可用，行为对齐 notes 的标准 list/get/create/update/delete（含 meta/--body 与 filter/group）；根 `.harness` 与 init 登记/生成含 projects、notes。CRUD 经 NodeService。

**动作：**
- 前置：等 notes/skills CRUD→NodeService 实现 PR 合入后再出栈
- 参照 notes 实现 projects CLI（薄封装 + NodeService）
- 根 harness-materials / init 补 projects、notes
- 测试 + PR

**完成标准：**
- [ ] projects CRUD（list/get/create/update/delete）经 NodeService，行为对齐 notes 约定面
- [ ] 根 `.harness` 与 init 含 projects、notes 登记/生成
- [ ] 相关测试通过；经 PR 合入 main
- [ ] 出栈时不问用户（用户已预授权）
