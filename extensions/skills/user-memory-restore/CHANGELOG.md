# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-10-04

### Changed

- 执行入口迁至 TypeScript `edges memory` CLI；使用前需安装或构建 CLI，模板随构建产物分发，保留原有工作流与权限边界。

## [2.0.0] - 2026-10-03

### Fixed

- 仅逐字节等于当前生成模板的空用户索引可免 --force；空条目区外的人工说明、未知元数据和其他编辑均保留并视为已占用。

### Changed

- 仅恢复 `.harness/memory/users/`，旧归档明确要求转换；先验证完整归档再替换，保留索引与正文原字节，拒绝重复/穿越/特殊成员及链接祖先，任何已有资产均需 --force。

## [1.0.0] - 2026-09-11

### Added

- 从 `user-memory-backup-*.tar.gz` 回注 `.memory/USER.md` 与 `.memory/users/`。已有条目时需 `--force`，语义是整份替换（先清空再解压），不合并。只接受普通文件成员。不 `git add`。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/user-memory-restore@2.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/user-memory-restore@1.0.0

[2.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/user-memory-restore@2.0.0
