# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-09-06

### Added

- 诊断并补上缺失的本层硬约束区块（`missing-important`），不覆盖已有规则。

## [1.1.0] - 2026-09-06

### Changed

- 要把已有 `AGENTS.md` 的区块外正文拆进 `.memory` 时，改走 `$project-memory-reshape`；doctor 仍只修索引结构。

## [1.0.0] - 2026-09-01

### Added

- 按 semver 标记的首个版本。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-memory-doctor@1.2.0...HEAD
[1.2.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-doctor@1.1.0...skill/project-memory-doctor@1.2.0
[1.1.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-doctor@1.0.0...skill/project-memory-doctor@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-memory-doctor@1.0.0
