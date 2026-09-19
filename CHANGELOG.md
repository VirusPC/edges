# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

本文件只记 Edges 这个仓库本身的重要变化，方便扫一眼「系统最近能做什么」。某个对外技能自己的版本记录，看 [`extensions/skills/`](extensions/skills/) 下面各自的 changelog；跨机器共用、但不绑定 Edges 的扩展，看 [`shared-extensions/CHANGELOG.md`](shared-extensions/CHANGELOG.md)。尚未发版的变化按功能模块分组。

领域决策、术语表和实现计划不写进这份根 changelog，分别看 [`docs/adr/`](docs/adr/)、[`CONTEXT.md`](CONTEXT.md) 和 [`docs/superpowers/plans/`](docs/superpowers/plans/)。

## [Unreleased]

### Artifacts 预览

- 可以把短生命周期的静态页（例如审阅页 HTML）上传成真浏览器能打开的 URL，到期自动删。起服务用 `pnpm --filter edges-artifacts-preview start`（开发用 `pnpm --filter edges-artifacts-preview dev` 或根上的 `pnpm start:artifacts` / `pnpm dev:artifacts`）；本机先 `edges artifacts init` 写下 token 和 `EDGES_ARTIFACTS_BASE_URL`，再 `edges artifacts publish <path>` 打印公开 URL（默认记下 `from` 为 `cli`/`edges-cli`，也可用 `--from-kind` / `--from-name`），`edges artifacts rm <id|url>` 提前删。写接口要共享 token；浏览器打开 URL 不登录。手机审阅必须用 ECS / 可达地址，不能假定 localhost。`edges tasks project review-page` 仍只渲染，不发布。本轮没有 artifacts MCP。

### 笔记入库与能力面

- `conversation-to-notes` 技能（`extensions/skills/conversation-to-notes`）现在要求整理出来的笔记写给人审阅：白话完整句，例子与上下文要够独立读懂；密表放进补充说明；所学只写判断与边界；行动指南须带触发与步骤。该技能的 2.1.0 / 2.1.1 已写在技能 changelog 里，这里不再复述明细。

## [1.2.0] - 2026-09-18

### 任务看板与项目

- 跨 Agent 接力的工作项看板改到 [`knowledge/tasks/`](knowledge/tasks/)。原来 `knowledge/todos/` 里的条目已经改成现在的任务记录格式并迁了过来；旧目录已删除，没有再留跳转说明。
- 可以用 `edges tasks` 管理这块看板：`edges tasks list`（列出）、`edges tasks get`（查看）、`edges tasks create`（创建）、`edges tasks update`（更新）、`edges tasks status`（改状态）。运行记录可以只读查看：`edges tasks runs`、`edges tasks run-messages`。目前还不能从命令行删除任务，也还没有和 GitHub 同步。创建或更新时可以用 `--priority` 标优先级，取值为 `urgent` / `high` / `medium` / `low` / `none`（写在 `metadata.edges-task-priority`，缺省为 `none`）；列出时可以用 `edges tasks list --sort priority` 按优先级排序。改优先级不会把任务挪到别的状态文件夹。
- 任务可以归到一个任务项目里，文件放在 `knowledge/tasks/<项目>/` 下；还没分组的放在 `_default`。创建或筛选时用 `--project`，换项目用 `edges tasks update --project`；`edges tasks status` 只在同一个项目内移动。项目的标题和说明用 `edges tasks project list`、`edges tasks project get`、`edges tasks project create`、`edges tasks project update` 管理；任务正文仍以看板上的 markdown 为准。
- 新增命令 `edges tasks project review-page`：根据分组建议生成一个本地网页，方便用浏览器拖拽调整任务归属。点左侧分组可以筛选列表，拖到分组上可以改归属。新增 classifyTasks 技能（`extensions/skills/project-tasks-classify`）按你已经建好的任务项目给整板提出归属建议；确认时默认打开上面的审阅页，再用 `edges tasks update --project` 落地。没有图形界面时可以退回用表格。

### 项目记忆（project-memory）

- 可以用 `$project-memory-add-type` 给某个项目的记忆目录登记一种新的记忆类型；之后查询和写入都会认到它。官方自带的六类不变。用户个人记忆可以写在本机的 `.memory/users/`，这份副本不进 git；换机器时用 `$user-memory-backup` 打包，用 `$user-memory-restore` 恢复。
- 类型记忆入口从 `.memory/FEEDBACK.md` 一类平铺文件改到对应复数目录下的 `AGENTS.md`（例如 `.memory/feedbacks/AGENTS.md`），与该类型条目同处。层入口 `AGENTS.md` 的本层清单改链到这些类型入口。旧平铺文件由 `$project-memory-doctor` 迁走后删除。

### 评测与观测

- 仓库里新增 `evaluation/`，用来检查整套 Edges 能不能跑通。目前有一条 LoCoMo 冒烟评测：只能说明评测链路能跑，不能当成「项目记忆有效」的公开证明。同时新增 `observation/`，用来放脱敏后的运行记录和指标笔记，不替代记忆里的决策。

### 笔记入库与能力面

- 把笔记写入仓库的入口现在是命令 `edges note`、对应的 `edges-note` 技能（`extensions/skills/edges-note`），以及 MCP。旧命令名 `edges-note` 和仓库根目录脚本已经去掉，没有留下兼容别名。仓库根目录不再提供 `bin/` 脚本，也不再用 `EDGES_SCRIPT` 环境变量去找这些脚本；安装时也不会再把仓库根的 `bin/` 加进 PATH。笔记入库时的 git 操作改在命令 `edges note` 里完成。根目录 `inbox/` 里旧的自动入库测试草稿已删除。

### 教学站点

- 教学工作区从 `knowledge/teach/` 改名为 `knowledge/teaching/`，网站上的路径也一起改了。部署改成：GitHub Actions 登录服务器后，在仓库里直接拉取最新的 main，不再单独推送教学目录。README 上加了部署状态徽章。新增 `learn-repo` 技能（`extensions/skills/learn-repo`）：把要长期学习的外部仓库挂到对应教学主题下，主仓库只记一个提交指针。Obsidian 会忽略这些学习仓库，避免搜索和图谱被外部文件占满。

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

[Unreleased]: https://github.com/VirusPC/edges/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/VirusPC/edges/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/VirusPC/edges/releases/tag/v1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/v1.0.0
