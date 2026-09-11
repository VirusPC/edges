---
name: cli_refactor_commanderjs
description: CLI 用 Commander.js 重构
metadata:
  edges-type: task
  edges-title: CLI 用 Commander.js 重构
  edges-tasks-status: in_progress
  edges-task-assignee: Coding Agent 专家
  edges-task-assignee-id: ac913463-5bf6-4c16-adc0-900c61a8692d
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T19:15:00+08:00"
---

CLI 用 Commander.js（commander）重构。

**Why:**
现有 CLI 若手写参数解析，子命令、帮助文案与选项校验会越堆越脆；Commander.js 是 Node 生态常见的命令行框架，适合把命令树、options、help 收成统一结构。

**How to apply:**
- 确认目标 CLI 是哪一个（edges 仓内 / 其它工具链），盘点现有入口与子命令。
- 用 Commander.js 重建命令树；迁移兼容旧调用方式或给迁移说明。
- 与「CLI/MCP 鉴权」等任务交叉时，把 auth 相关子命令一并纳入同一套结构。
