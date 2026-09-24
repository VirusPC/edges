# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- 人审可为对话确认或 PR；落库所在分支是否新建不限。
- 落库写入本技能步骤 6：交人审阅后，用户确认再用 `create` / `update`（及必要时 `status`）写盘。
- 步骤 5 为交人审阅关卡；确认前不写盘。
- 约束不再重复禁止写盘命令（开场与步骤 5 已覆盖）。
- 压缩步骤前导言；正文不再写三角分工（分工留给 CONTEXT，本技能靠步骤 1 判项）。
- 步骤：判是否任务 → 只读去重 → 必填门闩 → 按模板成文 → 交人审阅 → 确认后落库。各栏写法单独成节。

## [1.0.0] - 2026-09-24

### Added

- 从对话整理任务草稿；正文为背景 → 目标 → 完成标准（必填），动作为可选。背景给人读，须写出产生本任务的对话过程；完成标准给循环验收。必填项依据不足时先提问，不硬编。
- 与 `conversation-to-notes`、`project-memory-remember` 分工：本技能只回答「谁下一步做什么、怎样算完」。
- 只成文，不落库；写入看板是另一步。
- 栏名与说明用中文，避免中英混写。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/conversation-to-tasks@1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/conversation-to-tasks@1.0.0
