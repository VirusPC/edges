# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-09-07

### Changed

- 认识第五个类型 `agent_skills`，并对它跳过全部写操作：不报 `missing-type-dir`、不报 `legacy-type-dir`、`--apply` 时也不补建目录。`.agents/` 归人与生态，一个字节都不碰；本层没有 `.agents/skills/` 时索引是空清单，属正常状态。
- 存量 `AGENTS.md` 因为少一行入口会被判 `outdated-local`，`--apply` 自动刷新并补建 `AGENT_SKILLS.md`。

## [1.3.1] - 2026-09-06

### Changed

- `missing-important` 补上的种子改为当前两句（聚光灯 +「硬约束写在本区块」）。已有硬约束正文仍不覆盖。

## [1.3.0] - 2026-09-06

### Added

- 诊断并删除已废弃的自动化策略区块（`stale-auto`）。

### Removed

- `missing-auto`：不再要求记忆根有独立的自动化策略区块。

## [1.2.0] - 2026-09-06

### Added

- 诊断并补上缺失的本层硬约束区块（`missing-important`），不覆盖已有规则。

## [1.1.0] - 2026-09-06

### Changed

- 要把已有 `AGENTS.md` 的区块外正文拆进 `.memory` 时，改走 `$project-memory-reshape`；doctor 仍只修索引结构。

## [1.0.0] - 2026-09-01

### Added

- 按 semver 标记的首个版本。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-memory-doctor@1.4.0...HEAD
[1.4.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-doctor@1.3.1...skill/project-memory-doctor@1.4.0
[1.3.1]: https://github.com/VirusPC/edges/compare/skill/project-memory-doctor@1.3.0...skill/project-memory-doctor@1.3.1
[1.3.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-doctor@1.2.0...skill/project-memory-doctor@1.3.0
[1.2.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-doctor@1.1.0...skill/project-memory-doctor@1.2.0
[1.1.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-doctor@1.0.0...skill/project-memory-doctor@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-memory-doctor@1.0.0
