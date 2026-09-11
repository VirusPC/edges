# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-11

### Added

- 从 `user-memory-backup-*.tar.gz` 回注 `.memory/USER.md` 与 `.memory/users/`。已有条目时需 `--force`，语义是整份替换（先清空再解压），不合并。只接受普通文件成员。不 `git add`。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/user-memory-restore@1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/user-memory-restore@1.0.0
