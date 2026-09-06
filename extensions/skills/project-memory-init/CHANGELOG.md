# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2026-09-06

### Changed

- `AGENTS.md` 内层区块之间、以及与外层标记之间各空一行。

## [1.2.0] - 2026-09-06

### Added

- `AGENTS.md` 增加本层硬约束区块：规则直接写在入口里，init / doctor 只保证区块存在、不覆盖已有正文。

## [1.1.0] - 2026-09-06

### Changed

- 用户要求 reshape 某一份已有 `AGENTS.md` 时，视为同时同意对该目录 Init。
- 拆已有 `AGENTS.md` 区块外正文改走 `$project-memory-reshape`；init 仍不覆盖已有正文。

## [1.0.0] - 2026-09-01

### Added

- 按 semver 标记的首个版本。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.2.1...HEAD
[1.2.1]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.2.0...skill/project-memory-init@1.2.1
[1.2.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.1.0...skill/project-memory-init@1.2.0
[1.1.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.0.0...skill/project-memory-init@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-memory-init@1.0.0
