# Changelog

## [2.0.1] - 2026-10-05

- 统一 AGENTS 节点身份与三类内容组织；保留显式类型采用、写权限和局部归属，不用 Memory 标记或独立职责筛选节点。

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-10-03

### Changed

- 按作用域直接发现 Memory 与 Skills 类型入口；容器和业务 AGENTS 不自动成为子层，引用不扩散来源规则。

## [1.2.1] - 2026-09-08

### Changed

- `updatedAt` 可能在顶层，也可能在 `metadata:`；有则可用。

## [1.2.0] - 2026-09-06

### Changed

- 封面与检索时机补上「动手改代码前也要查」；本轮查过不重复。

## [1.1.0] - 2026-09-06

### Changed

- 加载一层 `AGENTS.md` 时直接遵守本层硬约束，不要当成可跳过的索引。

## [1.0.0] - 2026-09-01

### Added

- 按 semver 标记的首个版本。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-memory-ask@1.2.1...HEAD
[1.2.1]: https://github.com/VirusPC/edges/compare/skill/project-memory-ask@1.2.0...skill/project-memory-ask@1.2.1
[1.2.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-ask@1.1.0...skill/project-memory-ask@1.2.0
[1.1.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-ask@1.0.0...skill/project-memory-ask@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-memory-ask@1.0.0
