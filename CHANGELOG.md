# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

本文件只记 **Edges 仓库级**变更。Skill 各自独立 semver，明细见 [`extensions/skills/<name>/CHANGELOG.md`](extensions/skills/)。

## [Unreleased]

### Added

- MIT 许可证。

## [1.0.0] - 2026-09-06

从 2026-01 起的系统收成首个按 semver 跟踪的仓库版本。`package.json` 的 `version` 自 2026-02-19 起就是 `1.0.0`，此前没有 changelog 和 `v*` tag。

### Added

- 知识库流转：`knowledge/notes` → `edges` → `archive`，`new-note` MCP 作为写入入口。
- 对外接口层 `extensions/`：skills、MCP、tools、system-prompt。
- 用 `npx skills@latest` 分发 skill；本机中枢 `~/.agents/skills`，Claude Code 走软链。
- project-memory 系列 skill（init / ask / remember / doctor / reshape）及仓库内 `.memory/`。
- 公开仓库的隐私与脱敏规则。
- 每个 skill 一份 Keep a Changelog，tag 为 `skill/<name>@<version>`。

### Changed

- 维护脚本收到 `scripts/`，用户命令留在 `bin/`。
- 卸掉 OpenSpec；规划与决策改走 `.memory`。
- 各 agent 目录里的 skill 拷贝收到 `.agents/skills` 一份中枢。

### Removed

- 办公文档（`.docx` / `.xlsx` / `.pptx`）入库。
- 未公开的专利交底材料。

[Unreleased]: https://github.com/VirusPC/edges/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/v1.0.0
