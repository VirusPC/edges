# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-10-04

### Changed

- 执行入口迁至 TypeScript `edges memory` CLI；使用前需安装或构建 CLI，模板随构建产物分发，保留原有工作流与权限边界。

## [2.0.0] - 2026-10-03

### Changed

- 仅打包 `.harness/memory/users/`，拒绝旧布局并提示 project-memory-migrate；写入前建立忽略规则，归档权限 0600，拒绝同名覆盖和源符号链接。

## [1.0.0] - 2026-09-11

### Added

- 把 `.memory/USER.md` 与 `.memory/users/` 打成仓库根默认名 `user-memory-backup-<时间戳>.tar.gz`。不 `git add`。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/user-memory-backup@2.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/user-memory-backup@1.0.0

[2.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/user-memory-backup@2.0.0
