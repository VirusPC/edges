---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-07T14:22:51.467Z'
  edges-title: CLI 顶层命令与文件夹名对齐（skills / notes）
  edges-tasks-status: done
  edges-task-priority: none
name: cli_skills_notes
description: 能对齐的 edges 顶层命令跟文件夹走；硬改 skill→skills、note→notes，不留别名。
---
**背景：**
合 #170 后讨论 CLI 与 harness 文件夹是否对应。定调不是强求一一对应，但能对齐的名字尽量跟文件夹。不止 skills：核对后改 skill→skills（`.harness/skills`）、note→notes（`notes/`）；memory/tasks 已同名；无文件夹对的 artifacts/schema/forest 不动；不为 evaluation/observation 新开命令。要求硬断、不留旧别名。实现见 PR https://github.com/VirusPC/edges/pull/172。

**目标：**
顶层命令名与可对齐的文件夹一致；旧 skill/note 不可用。

**动作：**
改 CLI 注册、帮助、测试与相关文档/MCP；开 PR 合入。

**完成标准：**
- [x] edges skills / edges notes 可用，edges skill / edges note 为未知命令
- [x] PR #172 合入 main
