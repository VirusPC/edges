# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-09-17

### Changed

- 概念模型改为 Embedding-based Nearest Centroid Classification（NCC）：质心由用户预先设定，Skill 只做最近质心归类；embedding 走宿主 / runtime 能力，不加仓内库。不再把工作流写成软聚类。
- Skill id 与目录从 `classify-tasks` 改为 `project-tasks-classify`（展示名仍是 classifyTasks）。

## [1.0.0] - 2026-09-17

### Added

- classifyTasks：整板软聚类建议表，人改后再用 `edges tasks project` 与 `update --project` 落地。无 embedding，无 `classify` 动词。能力面 CLI + Skill + MCP。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-tasks-classify@1.1.0...HEAD
[1.1.0]: https://github.com/VirusPC/edges/compare/skill/project-tasks-classify@1.0.0...skill/project-tasks-classify@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-tasks-classify@1.0.0
