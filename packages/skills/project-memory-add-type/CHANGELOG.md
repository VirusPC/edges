# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- 新类型入口写 `.harness/<module>/<plural>/README.md`，层入口一行链到这份 README。

## [3.0.0] - 2026-10-04

### Changed

- 执行入口迁至 TypeScript `edges memory` CLI；使用前需安装或构建 CLI，模板随构建产物分发，保留原有工作流与权限边界。

## [2.0.0] - 2026-10-03

### Changed

- 新增 `--module memory|skills`，模块与格式独立；保留自定义类型身份，跨模块冲突和非法特权元数据拒绝写入。

## [1.0.0] - 2026-09-13

### Added

- 按 LAYOUT 在指定记忆目录登记用户 Memory Type（入口文件 + 复数目录 + AGENTS 本层一行）。决策见仓库根 `docs/adr/0006-extensible-project-memory-types.md`。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-memory-add-type@1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-memory-add-type@1.0.0
