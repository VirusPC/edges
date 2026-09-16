# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

本文件只记 **Edges 仓库级**变更。对外 skill 各自独立 semver，明细见 [`extensions/skills/<name>/CHANGELOG.md`](extensions/skills/)。跨机器 harness 整层一份版本，明细见 [`shared-extensions/CHANGELOG.md`](shared-extensions/CHANGELOG.md)。

## [Unreleased]

### Added

- `evaluation/cases/locomo-smoke/`：LoCoMo 评测冒烟（截断上下文基线）。dummy dry-run 无 API；真实 run 走 OpenAI-compatible `kimi-for-coding`。SUT 为上游 locomo 打分/out-file schema。不是 Benchmark Proof，不接 Project Memory。
- CONTEXT 增加评测冒烟（Evaluation Smoke）、公开基准证明（Benchmark Proof）、评测报告（Evaluation Report）：冒烟只证明链路可跑，不是项目记忆或 Agent Memory 有效性证据。
- `docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md`：本轮 LoCoMo 只做评测冒烟；SUT 为上游 harness；分数不得引用为对项目记忆的公开基准证明。
- `edges tasks` Issue 层 `--project` 与看板路径 `knowledge/tasks/<project-slug>/<status>/`（ADR-0009）。未分组 `_default` ↔ 字段 `default`/省略；目录与 `metadata.edges-task-project` 双写。`status` 只在同一 project 内移动；跨 project 用 `update --project`。一次性把根下 status 夹迁入 `_default/`。无 Skill/MCP 封装。
- `docs/superpowers/plans/2026-09-16-edges-task-project.md`：ADR-0009 的实现计划（本轮只做计划；`edges tasks` CLI `--project`、路径 `tasks/<project-slug>/<status>/`、一次性迁到 `_default`；不实现 Skill/MCP，本计划 PR 不改 CLI、不迁看板）。
- CONTEXT 增加 Task Project（edges）、`edges-task-project`；收紧 Task / `edges-tasks-status` / `edges-task-priority` / edges tasks（CLI）：约定分组在 `knowledge/tasks/<project-slug>/`，未分组 `_default`；目录与 frontmatter 双写。后续实现：`status` 只在同一 project 内移动；跨 project 用 `update --project`（或等价入口）。
- `docs/adr/0009-edges-task-project-grouping.md`：directory-first 的 Multica-like Project + frontmatter 双写；修订 ADR 0002 的路径（嵌在 project-slug 下）。本轮只定文档，不迁看板、不改 CLI；实现轮必须先让 CLI 跟上。
- `edges tasks` Issue 层 `--priority` / `list --sort priority`（ADR-0007）。枚举 `urgent|high|medium|low|none`，写在 `metadata.edges-task-priority`；缺省为 `none`。`status` 不改 priority；改 priority 不搬状态夹。无 Skill/MCP 封装。
- `docs/superpowers/plans/2026-09-16-edges-task-priority.md`：ADR-0007 的实现计划（本轮只做 `edges tasks` CLI `--priority` / `--sort priority`；不实现 Skill/MCP）。
- CONTEXT 增加 `edges-task-priority`；收紧 Task / `edges-tasks-status` / edges tasks（CLI）的文档约定：优先级与状态正交；后续 create/update 用 `--priority`，list 可用 `--sort priority`。
- `docs/adr/0007-edges-task-priority.md`：Issue 层优先级用 `urgent|high|medium|low|none`（非 P0–P3），写在 `metadata.edges-task-priority`；缺省为 `none`；改 priority 不搬状态夹。本轮只定文档，CLI 后做。
- 根 README 增加 `deploy-teach.yml` 工作流状态徽章，链到 Actions 工作流页。
- `$project-memory-add-type`：按 LAYOUT 在指定记忆目录登记用户 Memory Type；remember / ask / doctor 从该层产物发现。官方种子仍是六类（ADR-0006）。
- `edges tasks` CLI：Issue 层 list/get/create/update/status；Run 层只读 `runs` / `run-messages`（ADR-0005）。无硬删除、无 GitHub 同步、无 Skill/MCP 封装。
- 可写项目记忆类型 `user`（ADR-0003）：`.memory/users/` + `.memory/USER.md` 为仓内权威副本且 gitignore；`$user-memory-backup` / `$user-memory-restore` 做换机逃生。不做 `private` 条目元数据。
- `evaluation/`：评测整套 Edges（用例、harness、报告）。系统元工作，不是知识生命周期阶段。
- `observation/`：观测运行与使用（脱敏 run log、指标与仪表盘笔记）。不替代 `.memory` 决策。
- `docs/adr/`：记录领域决策；首条为对话整理采用复盘四栏。
- CONTEXT 增加「复盘四栏」及四栏术语。
- CONTEXT 增加 Task、`edges-tasks-status`、Task Run Log、backlog（Task）。
- CONTEXT 增加 edges tasks（CLI）、Task Run（edges）；收紧 Task Run Log：本轮 CLI 动词为 `runs` / `run-messages` 且只读。
- `docs/adr/0005-edges-tasks-cli.md`：本轮 tasks 看板只做 CLI；Run 层只读；不硬删、不接 GitHub、不抄 Multica daemon。
- CONTEXT 增加 Memory Type（项目记忆）、可扩展 Memory Type；用户记忆改称一种 Memory Type；Task 避免与 `tasks` Memory Type 混称。
- `docs/adr/0006-extensible-project-memory-types.md`：Memory Type 扩展面只在 LAYOUT；用 `$project-memory-add-type` 登记；官方 init 种子仍是六类；示例 type 不进种子；`tasks` Memory Type 本轮不与看板合并。
- CONTEXT 增加能力面（Capability Surface）、CLI、Skill（调用说明）、MCP（Edges）。
- `docs/adr/0002-knowledge-tasks-status-folders.md`：`knowledge/todos` 迁为按状态分夹的 `knowledge/tasks`。
- `docs/adr/0004-capability-surface-cli-skill-mcp.md`：能力面定为 CLI + Skill + MCP，删除仓根 `bin/`（实现见本 Unreleased 的 Removed/Changed）。
- `extensions/skills/edges-note`：教 Agent 何时如何调用 CLI 与 MCP（能力面三入口）。
- `docs/superpowers/plans/2026-09-13-extensible-project-memory-types.md`：ADR-0006 的实现计划（LAYOUT 登记用户 Memory Type；`$project-memory-add-type`；官方种子仍是六类；本计划 PR 不实现 skill）。
- `docs/superpowers/plans/2026-09-13-edges-tasks-cli.md`：ADR-0005 的实现计划（本轮只做 `edges tasks` CLI；Run 层只读 `runs` / `run-messages`）。
- `docs/superpowers/plans/2026-09-11-capability-surface-bin-cli-skill-mcp.md`：ADR-0004 的实现计划（CLI 内 TS git、Skill、MCP 子进程调 `edges note`）。
- [`knowledge/tasks/`](knowledge/tasks/)：跨 Agent 接力的 Task 看板。
- `extensions/skills/learn-repo`：把要学习的外部仓库以 git submodule 挂进 `knowledge/teaching/<topic>/repos/`，主仓库只记指针不涨体积，并在主题 RESOURCES.md 登记来源与用途。
- Obsidian `userIgnoreFilters` 排除 `knowledge/teaching/*/repos/`，学习仓库的文件不进 vault 搜索与关系图谱。

### Changed

- `deploy-teach.yml` 的 `deploy` job 使用 `environment: production`（由 `ecs` 改名），让 GitHub 记录 Deployments。
- `new-note` MCP 改为子进程调用 `edges note`，不再 `execFile` 仓根脚本。
- `pnpm setup` 不再把仓根 `bin/` 写入 PATH。
- 根 README 捕获入口改为 CLI + Skill + MCP（ADR-0004）。
- `edges-cli` 二进制改为 `edges`；入库走 `edges note …`。旧的 `edges-note`、根目录默认 ingest、`ingest` 子命令已移除，无 shim。
- 存量 `knowledge/todos/*.md` 改写为 project-memory 形态后迁入 `knowledge/tasks/backlog/`。
- ECS 部署：`.github/workflows/deploy-teach.yml` 改为 SSH 触发整仓 `git fetch` / `reset --hard origin/main`，不再 rsync 推送 `knowledge/teaching/`。
- `obsidian-cli` 教学工作区从 `.teaching/obsidian-cli/` 迁到 `knowledge/teaching/obsidian-cli/`。
- `knowledge/teach/` 重命名为 `knowledge/teaching/`；公网路径 `/teach/` 改为 `/teaching/`。

### Fixed

### Removed

- 仓根 `bin/`（含 `new-note`）。Note 入库 git 在 `extensions/clis` TypeScript。
- `EDGES_SCRIPT`（MCP / CLI 不再用该环境变量指向仓根脚本）。
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
