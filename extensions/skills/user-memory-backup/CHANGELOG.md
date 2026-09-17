# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- 打包 `.memory/users/`（含 ADR-0012 的 `users/AGENTS.md`）；仍接受尚未迁走的 `.memory/USER.md`。

## [1.0.0] - 2026-09-11

### Added

- 把 `.memory/USER.md` 与 `.memory/users/` 打成仓库根默认名 `user-memory-backup-<时间戳>.tar.gz`。不 `git add`。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/user-memory-backup@1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/user-memory-backup@1.0.0
