# Changelog

## [2.0.1] - 2026-10-05

- 同步根层 notes 与 extensions/apps 的目录调整，保持原工作流和内容规范。

## [2.0.0] - 2026-10-05

- 统一目录入口、验证后的整目录导入与显式公开迁移；保留非受控正文，非法入口诊断后由调用方修正。

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-10-05

### Changed

- 补充已审阅 Markdown 的 `--content-file --markdown` 入库，以及 `--format directory --resources` 明确资源边界；CLI 与 MCP 参数覆盖范围分别说明。

## [1.0.0] - 2026-09-11

### Added

- 教 Agent 用 CLI 与 MCP 入库 Note（能力面三入口）。无 git 脚本。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/edges-note@1.1.0...HEAD
[1.1.0]: https://github.com/VirusPC/edges/releases/tag/skill/edges-note@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/edges-note@1.0.0
