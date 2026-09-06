# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-09-06

### Changed

- 封面补上「被纠正时也要主动用」，与硬约束聚光灯对齐。

## [1.2.1] - 2026-09-06

### Changed

- 允许手改的受管区块只剩硬约束；本层索引和下层索引仍不要手改。

## [1.2.0] - 2026-09-06

### Changed

- 不检索就会做错事的规则写进该层 `AGENTS.md` 的硬约束区块，不走 remember、不另建记忆文件。

## [1.1.0] - 2026-09-06

### Changed

- 从一份已有 `AGENTS.md` 批量抽记忆并改区块外正文，改走 `$project-memory-reshape`，不要一条条手搬。

## [1.0.0] - 2026-09-01

### Added

- 按 semver 标记的首个版本。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.3.0...HEAD
[1.3.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.2.1...skill/project-memory-remember@1.3.0
[1.2.1]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.2.0...skill/project-memory-remember@1.2.1
[1.2.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.1.0...skill/project-memory-remember@1.2.0
[1.1.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.0.0...skill/project-memory-remember@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-memory-remember@1.0.0
