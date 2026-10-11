---
name: Code Review
description: 在 Cursor Bugbot 之外，为 edges 选型并试点自动 PR 代码审查方案。
---
# Code Review

在 Cursor Bugbot 之外，为 edges 选型并试点一套自动 PR 代码审查方案。本页只划定选型范围，不在这里重做目录触发。

## 结论

目的：在已经用过的 Cursor Bugbot 之外，给 edges 选一套可以试点的自动 PR 代码审查，并先把候选、评估维度和边界写清楚。选定哪一家、试点怎么验收，留到 grill 之后另开 Task。

## 背景

已经讨论过 Cursor Bugbot。为了少审非 CLI 的 PR，曾经尝试「只让 CLI 的 PR 自动触发 Bugbot」，没有达到预期。这条触发机制的实测结论记在 todo 卡里，本项目不重复做那份调研：

- [搁置：只让 CLI 的 PR 自动触发 Bugbot](../../tasks/edges-extensions/todo/2026-10-11--搁置只让-CLI-的-PR-自动触发-Bugbot/INDEX.md)

用户接着问除 Cursor 以外的自动 review，并点名想了解 Codex、Kimi、MiniMax、GLM、Droid、Devin、Amp、Gemini 等是否支持自动审查。

## 候选范围

下面是评估对象，不是已经选定的方案。

### 专用产品

- CodeRabbit
- Greptile
- GitHub Copilot code review
- Claude Code Review
- Graphite Diamond（仅在已经使用 stacked PR 时考虑）

### Agent / 模型侧

- Codex：云托管 Code Review、`@codex review`、`openai/codex-action`
- Kimi：GitHub Action、`/review`
- MiniMax：社区 Action，或自建 workflow
- GLM / 智谱：Actions、OpenCode 等自建
- Factory Droid：`droid-action` 自动 review
- Devin Review：可自动，或 `/devin review`
- Amp：Sourcegraph `cra-github` / Actions
- Gemini Code Assist on GitHub：`/gemini review`，配合 `.gemini/config.yaml`

## 评估维度

- 能力与误报
- 接入方式（GitHub App、Actions、@mention）
- 路径与规则过滤（能否只审 CLI 等指定范围）
- 成本
- 与 edges 的 `AGENTS.md` 和中文工作流是否契合
- 密钥与安全面

## 非目标

- 不在本项目里重做 Bugbot 的目录触发。
- 不同时在同一仓库开两套自动审查，避免两套评论互相争辩。

## 下一步

grill 之后选定 1 个试点。试点范围和验收另开 Task。
