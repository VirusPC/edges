---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-11T18:03:08.618Z'
  edges-title: 探索新的 CR 方式
  edges-tasks-status: backlog
  edges-task-priority: none
name: 探索新的_cr_方式
description: 在 Cursor Bugbot 之外，为 edges 找到可控、可试点的自动/半自动 PR Code Review 方式。
---
**背景：**
这轮先聊了除 Cursor 以外有哪些自动 review 方案，又点名核对 Codex、Kimi、MiniMax、GLM、Droid、Devin、Amp、Gemini、Claude Code、Cursor 是否支持；调研已写进内容项目 [code-review](../../../../projects/2026-10-11--code-review/INDEX.md)（PR #224，已合入）。更早有一张「搁置：只让 CLI 的 PR 自动触发 Bugbot」——Bugbot 按目录自动跑不通，本卡不重做那条触发机制调研。
- 调研初步排序：手动 `@codex review` 优先；需要按目录自动审时，用带 `paths` 的官方 Action（如 `anthropics/claude-code-action`）。尚未选定。
- 非目标：本卡不直接在全仓落地自动审；不同时开两套互相抢评论的 bot。
- 关联：内容项目 [code-review](../../../../projects/2026-10-11--code-review/INDEX.md)；[搁置：只让 CLI 的 PR 自动触发 Bugbot](../../todo/2026-10-11--搁置只让-CLI-的-PR-自动触发-Bugbot/INDEX.md)；PR #224。

**目标：**
在调研基础上选定并验证 1～2 种适合 edges 的 CR 方式，明确怎么触发、审哪些路径、规则写在哪。

**动作：**
- 按 code-review 项目的试点建议，先试 Codex 手动审，再视需要上 Action + `paths`
- 试点结果回写到 code-review 项目或本卡 log
