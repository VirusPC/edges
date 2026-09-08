# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.1] - 2026-09-08

### Changed

- 说明普通记忆的实现字段也写进 `metadata.edges-*`，不要手写扁平顶层键。

## [1.5.0] - 2026-09-07

### Changed

- 触发条件扩到对话里用户给出的有用信息（想法、约定、约束），不限于纠正和已验证结论。

## [1.4.0] - 2026-09-07

### Added

- `--type skills`：把可复用流程自动沉淀成 `.memory/skills/<slug>/SKILL.md`。`--slug` 在这一类里是技能目录名，走 kebab-case；`--title` 可省；出处与审计写进 `metadata:`，键名前缀 `edges-`。
- 「沉淀成 skill 还是 feedback」的判据：可执行的重复步骤 → `skills`，「以后别这么干」→ `feedback`，「当初为什么这么定」→ `project`。

### Changed

- `skills` 不再是「不由 remember 写入」的类型。只读的那一半改由新类型 `agent_skills` 承担，它不出现在 `--type` 里。

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

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.5.1...HEAD
[1.5.1]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.5.0...skill/project-memory-remember@1.5.1
[1.5.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.4.0...skill/project-memory-remember@1.5.0
[1.4.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.3.0...skill/project-memory-remember@1.4.0
[1.3.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.2.1...skill/project-memory-remember@1.3.0
[1.2.1]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.2.0...skill/project-memory-remember@1.2.1
[1.2.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.1.0...skill/project-memory-remember@1.2.0
[1.1.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-remember@1.0.0...skill/project-memory-remember@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-memory-remember@1.0.0
