# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- 登记产物改为 `.memory/<plural>/AGENTS.md`（与条目同处），不再写根部 `.memory/<TYPE>.md`（ADR-0012）。

## [1.0.0] - 2026-09-13

### Added

- 按 LAYOUT 在指定记忆目录登记用户 Memory Type（入口文件 + 复数目录 + AGENTS 本层一行）。决策见仓库根 `docs/adr/0006-extensible-project-memory-types.md`。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-memory-add-type@1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-memory-add-type@1.0.0
