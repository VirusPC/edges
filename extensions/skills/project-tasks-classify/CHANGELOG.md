# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- 第 4 步在 `review-page` 渲出本地 HTML 之后：若人需要可达 URL，再 `edges artifacts publish --from-kind skill --from-name project-tasks-classify` 并把公开 `url` 给人（手机不能假定 localhost）。知道对应 Task 时加 `--task-project` / `--task-stem`。`review-page` 仍只渲染。不实现审阅结果回传 Agent 客户端。本轮没有 artifacts MCP。
- 第 4 步人闸主路径改为 `edges tasks project review-page`（写建议 JSON → 渲 HTML → 给人系统浏览器路径 → 停止 → 等贴回审阅导出行）。Markdown 建议表只作无 GUI 回退。无 `--mode`，无 `edges tasks classify`。proposeTypes（尚未入库）应复用同一 `project review-page` 壳，不要另开命令。
- Skill id 与目录从 `classify-tasks` 改为 `project-tasks-classify`（展示名仍是 classifyTasks）。工作流不变。
- 撤回 Embedding-based 最近质心分类措辞；按用户已设 Task Project（标题 + 描述）做整板归属建议（LLM / agent 判断），不要求 embedding。

## [1.0.0] - 2026-09-17

### Added

- classifyTasks：整板按已有 Task Project 质心做归属建议表，人改后再用 `edges tasks project` 与 `update --project` 落地。无 embedding，无 `classify` 动词。能力面 CLI + Skill + MCP。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/project-tasks-classify@1.0.0...HEAD
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/project-tasks-classify@1.0.0
