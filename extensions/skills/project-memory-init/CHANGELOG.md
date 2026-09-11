# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.7.0] - 2026-09-11

### Added

- 可写类型 `user`：入口 `.memory/USER.md`，内容目录 `.memory/users/`，条目 `user_<slug>.md`。权威副本在工作树内且 gitignore（ADR-0003）。存量 `AGENTS.md` 会被 `$project-memory-doctor` 判为 `outdated-local` 并补上 `USER.md` 那一行。

## [1.6.0] - 2026-09-08

### Changed

- 普通记忆（`feedback` / `project` / `reference`）写入改为 Agent Skills 闭集：顶层只留 `name` / `description` / `metadata`，实现字段进 `metadata.edges-*`。读取仍兼容旧的扁平顶层键，两边都有时 metadata 赢。

## [1.5.0] - 2026-09-07

### Added

- 第五个类型 `agent_skills`：索引本层 `.agents/skills/` 下人写或 `npx skills` 装入的技能，入口是 `.memory/AGENT_SKILLS.md`。它是唯一内容根在 `.memory/` 之外的类型，**本套工具绝不往那里写**——不建目录、不生成内容、不改写既有文件。
- `SKILL.tmpl.md`：`skills` 的产物模板，生成合法的 Agent Skills 目录 `skills/<name>/SKILL.md`。

### Changed

- `SKILLS.md` 入口改为只收自动沉淀的流程，人写或装入的移到 `AGENT_SKILLS.md`。分界线是谁有权改写。
- `lib/paths.py` 的 `type_dir()` 改名 `type_content_dir()`，内容根越出 `.memory/` 的类型集中在 `EXTERNAL_CONTENT_DIRS`；该表同时意味着只读。
- 索引条目路径改用 `relative_link()` 渲染，允许 `../` 越界，所以外部类型渲染成 `../.agents/skills/<name>/SKILL.md`。

### Migration

- 存量 `AGENTS.md` 会被 `$project-memory-doctor` 判为 `outdated-local` 并自动补上第五行，同时补建缺失的 `AGENT_SKILLS.md`。不需要手工迁移。

## [1.4.0] - 2026-09-06

### Changed

- 硬约束种子收成两句：ask / remember 聚光灯，以及「硬约束写在本区块」。不编排 init / doctor / reshape。

## [1.3.0] - 2026-09-06

### Removed

- `AGENTS.md` 不再生成独立的自动化策略区块；检索与沉淀时机写进硬约束种子。

### Changed

- init 的 JSON 不再返回 `autoAction`。

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

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.7.0...HEAD
[1.7.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.6.0...skill/project-memory-init@1.7.0
[1.6.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.5.0...skill/project-memory-init@1.6.0
[1.5.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.4.0...skill/project-memory-init@1.5.0
[1.4.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.3.0...skill/project-memory-init@1.4.0
[1.3.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.2.1...skill/project-memory-init@1.3.0
[1.2.1]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.2.0...skill/project-memory-init@1.2.1
[1.2.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.1.0...skill/project-memory-init@1.2.0
[1.1.0]: https://github.com/VirusPC/edges/compare/skill/project-memory-init@1.0.0...skill/project-memory-init@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-memory-init@1.0.0
