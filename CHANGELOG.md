# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

本文件只记 **Edges 仓库级**变更。对外 skill 各自独立 semver，明细见 [`extensions/skills/<name>/CHANGELOG.md`](extensions/skills/)。跨机器 harness 整层一份版本，明细见 [`shared-extensions/CHANGELOG.md`](shared-extensions/CHANGELOG.md)。

## [Unreleased]

### Added

- `evaluation/`：评测整套 Edges（用例、harness、报告）。系统元工作，不是知识生命周期阶段。
- `observation/`：观测运行与使用（脱敏 run log、指标与仪表盘笔记）。不替代 `.memory` 决策。
- `docs/adr/`：记录领域决策；首条为对话整理采用复盘四栏。
- CONTEXT 增加「复盘四栏」及四栏术语。
- CONTEXT 增加 Task、`edges-tasks-status`、Task Run Log、backlog（Task）。
- `docs/adr/0002-knowledge-tasks-status-folders.md`：`knowledge/todos` 迁为按状态分夹的 `knowledge/tasks`。
- [`knowledge/tasks/`](knowledge/tasks/)：跨 Agent 接力的 Task 看板。
- `extensions/skills/learn-repo`：把要学习的外部仓库以 git submodule 挂进 `knowledge/teaching/<topic>/repos/`，主仓库只记指针不涨体积，并在主题 RESOURCES.md 登记来源与用途。
- Obsidian `userIgnoreFilters` 排除 `knowledge/teaching/*/repos/`，学习仓库的文件不进 vault 搜索与关系图谱。

### Changed

- `edges-cli` 二进制改为 `edges`；入库走 `edges note …`。旧的 `edges-note`、根目录默认 ingest、`ingest` 子命令已移除，无 shim。
- 存量 `knowledge/todos/*.md` 改写为 project-memory 形态后迁入 `knowledge/tasks/backlog/`。
- ECS 部署：`.github/workflows/deploy-teach.yml` 改为 SSH 触发整仓 `git fetch` / `reset --hard origin/main`，不再 rsync 推送 `knowledge/teaching/`。
- `obsidian-cli` 教学工作区从 `.teaching/obsidian-cli/` 迁到 `knowledge/teaching/obsidian-cli/`。
- `knowledge/teach/` 重命名为 `knowledge/teaching/`；公网路径 `/teach/` 改为 `/teaching/`。

### Fixed

### Removed

- 根目录 `inbox/` 旧 ingest 自动 PR 测试草稿。
- `knowledge/todos/`（不留重定向 stub）。

## [1.1.0] - 2026-09-09

### Added

- `shared-extensions/`：跨机器、跨 Agent 共享的个人 harness（skills、MCP 配置、plugins、hooks）。接入 Edges 的能力仍在 `extensions/`。整层发版：`VERSION` + `CHANGELOG.md` + tag `shared-extensions@`。
- MIT 许可证。
- README 增加「隐私与脱敏」节。
- `extensions/clis/`：面向 agent 的 `edges-note` CLI（JSON stdout，复用 `bin/new-note`）。本地 agent 优先走它；MCP `new-note` 保留。
- `pnpm skills:link`：把 `extensions/skills` 里每个 skill 以相对软链挂到 `.agents/skills`。
- 项目级 `teach` skill / `knowledge/teaching/` 教学工作区。
- 项目级 `.agents/skills` 增加 `grill-with-docs`：grilling 同时产出 ADR 与 glossary。

### Changed

- 根 README 按“理念 → 知识模型 → 系统实现 → 使用与维护”重构；从投资视角串联认知资本、Agent Memory、Edge、知识流动性、决策收益和反馈复利，并明确各知识角色的边界及演化规则。
- `extensions/` 收录标准收窄为「接入或操作 Edges」；跨机器共用但不绑定 Edges 的扩展改走 `shared-extensions/`。
- project-memory 的 `AGENTS.md` 增加本层硬约束区块：最重要的规则直接写在入口里。
- project-memory 的 `AGENTS.md` 受管区块之间空一行。
- `AGENTS.md` 作为记忆入口只保留硬约束、本层索引、下层索引；检索与沉淀时机写进硬约束。根入口正文收到身份、指针和硬约束，目录细则仍看 README。
- 根 `AGENTS.md` 硬约束收成：ask / remember 聚光灯、硬约束写在本区块、公开仓脱敏、git 纪律。目录约定与交互口吻不再占硬约束。

### Fixed

- 根 `pnpm build`、`pnpm test` 改为通过 `pnpm recursive run` 执行 workspace 的对应脚本。

### Removed

- `AGENTS.md` 独立的自动化策略区块。

## [1.0.0] - 2026-09-06

从 2026-01 起的系统收成首个按 semver 跟踪的仓库版本。`package.json` 的 `version` 自 2026-02-19 起就是 `1.0.0`，此前没有 changelog 和 `v*` tag。

### Added

- 知识库流转：`knowledge/notes` → `edges` → `archive`，`new-note` MCP 作为写入入口。
- 对外接口层 `extensions/`：skills、MCP、tools、system-prompt。
- 用 `npx skills@latest` 分发 skill；本机中枢 `~/.agents/skills`，Claude Code 走软链。
- project-memory 系列 skill（init / ask / remember / doctor / reshape）及仓库内 `.memory/`。
- 公开仓库的隐私与脱敏规则。
- 每个 skill 一份 Keep a Changelog，tag 为 `skill/<name>@<version>`。

### Changed

- 维护脚本收到 `scripts/`，用户命令留在 `bin/`。
- 卸掉 OpenSpec；规划与决策改走 `.memory`。
- 各 agent 目录里的 skill 拷贝收到 `.agents/skills` 一份中枢。

### Removed

- 办公文档（`.docx` / `.xlsx` / `.pptx`）入库。
- 未公开的专利交底材料。

[Unreleased]: https://github.com/VirusPC/edges/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/VirusPC/edges/releases/tag/v1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/v1.0.0
