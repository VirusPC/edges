---
name: edges_changelog_cli
description: 更新根 CHANGELOG 目前只能手改文件，没有 edges CLI；需要命令支持把 Unreleased 切成版本段并校验忘写，仍不从 git log 自动生成正文。
metadata:
  edges-type: task
  edges-title: edges changelog CLI（切 Unreleased / 校验）
  edges-tasks-status: backlog
  edges-task-project: edges-tasks
  edges-updated-at: "2026-09-20T13:00:29.384Z"
---

结论（idea）：为 edges 增加 changelog 相关 CLI（优先：切 Unreleased→版本节、校验未写条目；可选配合 tag），正文仍人手写。

**事实背景:**
- edges CLI 当前只有 `note` 与 `tasks`（program.ts）；无 changelog 子命令（2026-09-20 查）。
- 项目记忆 `project_changelog_automation`：调研结论是继续手写 `[Unreleased]`；若自动化只做「切版本段 + 打 tag + 校验忘写」，不要从 Conventional Commits / git log 生成条目；脚本尚未落地。
- `project_repo_changelog`：发版时手升 package.json、挪 Unreleased、打 v tag。
- 用户 peng cheng 2026-09-20 问「现在更新 changelog，有 cli 么」→ 答没有 → 要求记待办。
- 勿与已 done「根仓库发版（自 v1.1.0 起）」并卡（那是一次发版执行，不是补 CLI）。

**Why:**
更新根 CHANGELOG 目前只能手改文件，没有 edges CLI；需要命令支持把 Unreleased 切成版本段并校验忘写，仍不从 git log 自动生成正文。

**How to apply:**
- grill 动词面（release/cut/check）、与 package.json version / GitHub Release 边界、是否只根 CHANGELOG 还是含 skill changelog。
- 实现落 extensions/clis。
- 未指派；派发默认 grill-with-docs。
