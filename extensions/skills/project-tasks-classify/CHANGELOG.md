# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Skill id 与目录从 `classify-tasks` 改为 `project-tasks-classify`（展示名仍是 classifyTasks）。工作流不变。
- 撤回 Embedding-based 最近质心分类措辞；按用户已设 Task Project（标题 + 描述）做整板归属建议（LLM / agent 判断），不要求 embedding。

## [1.0.0] - 2026-09-17

### Added

- classifyTasks：整板按已有 Task Project 质心做归属建议表，人改后再用 `edges tasks project` 与 `update --project` 落地。无 embedding，无 `classify` 动词。能力面 CLI + Skill + MCP。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-tasks-classify@1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-tasks-classify@1.0.0
