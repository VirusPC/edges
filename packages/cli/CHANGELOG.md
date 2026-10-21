# Changelog

`@viruspc/edges` 的版本记录。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Changed

- 被组合仓库可写。删掉 Compose 的只读特例之后，已检出的子模块工作区可以直接写。见 [ADR 0045](../../docs/adr/0045-compose-checkout-writable.md)。

## [0.2.4] - 2026-10-21

### Changed

- **破坏性：** Compose 入口改为磁盘上的 `.harness/compose/README.md`（`ComposeReadmeNode extends ReadmeNode`），由 `.harness/README.md` 链接。不再有虚拟节点 `<owner>/.compose/README.md`，`AGENTS.md` 不再写 Compose 区块。子节点 id 是被组合仓库的 `README.md`。默认 traverse 和系统根扫描都会进入 scope 自己的 `.harness/compose/`。根级 `--exclude <modules>` 取代 `--with-composed`；`--exclude compose` 同时跳过扫描和遍历。未知模块名直接报错。`compose add` / `list` / `update` 读写这份 README，缺失时连同索引链接一起创建。`edges compose doctor`（默认预览，`--apply` 才写）把旧区块从 `AGENTS.md` 迁过来，不删除文档里的 `--with-composed`（`.agents/skills/`、CHANGELOG 和 ADR 跳过，其余只报告）。见 [ADR 0043](../../docs/adr/0043-compose-readme-entry.md)。
- **破坏性：** `edges compose` 只剩三个日常子命令，名字对应 git submodule：`add`（取代 `register`，选项名不变）、`list`、`update`（取代 `clone` 与 `pull`）。`register`、`unregister`、`clone`、`pull`、`push` 直接删除，不留别名，旧命令以用法错误退出（退出码 2）。去掉条目改为手删 `.harness/compose/README.md` 的那一行（要删子模块时用 `git submodule deinit` / `git rm`）；推送改在子模块里用原生 `git push`。
- `edges compose` 底层改用 git submodule。`add` 不传 `--path` 时目录从 `~/.edges/composed/<name>` 改为仓内 `.harness/compose/<name>`；写进 README 的 href 相对于 `.harness/compose/`。`--path` 相对于 scope 目录，只收相对路径，不再被改写成绝对路径；绝对路径和 `~` 路径以校验错误拒绝。带 `--remote` 且条目在主仓库工作树里时，`add` 先跑 `git submodule add <remote> <path>`；同一 URL 的子模块已存在时只登记，URL 不同时报错。`add` 的 JSON 带 `href` 和 `submodule`（`added` / `existing`）。
- `compose update` 对仓内条目跑 `git submodule update --init -- <path>`（不带 `--recursive`）；`--remote` 时加 `--remote`，子模块在分支上时再加 `--merge`；`--name` 只处理一条。每条的 `action` 是 `initialized`、`present`、`updated` 或 `failed`。旧的 `~/...` / 绝对路径条目、仓外条目：目录不存在时 `git clone`，`--remote` 时 `git pull`。
- `compose list` 的每条多了 `href` 和 `initialized`（目录存在且非空）。
- **不递归：** 只看当前仓库自己的 Compose 条目。系统森林扫描（`forest list`、`--all` 等）默认进入 scope 自己的 `.harness/compose/`，不进入被组合仓库内部的 `.harness/compose/`，也不走进已登记的组合目录去展开下一层。被组合的入口即使在主仓库目录里也只读。
- **新提示：** 条目目录不存在或为空（子模块未初始化）时，`compose list` 和默认会读到该条目的命令在 stderr 提示运行 `edges compose update --name <name>`；`--exclude compose` 时不提示。旧路径条目会提示迁移到 `.harness/compose/<name>`。
- **逐条失败：** 失败处理落在 `compose update`（原先是 `clone` / `pull` / `push`）。失败的条目在 `entries` 里记为 `action: "failed"` 并带 `error`，stderr 每条打一行 `warning: compose update failed for <name>: <reason>`，其余条目继续执行。至少一条成功时退出码 0；全部请求的条目都失败（含 `--name` 指定的单条失败）时以失败结果退出（`status: "failed"`，仍带 `entries`；单条失败时 `reason` 是该条的错误）。缺少作用域 `AGENTS.md`、`--name` 找不到条目照旧整条命令失败。
- **可排除模块：** `--exclude` 与 `--scope` 同级，逗号分隔，可重复。接受 `compose`、`memory`、`skills`、`notes`、`projects`、`tasks`，与 `--types` 正交。
- **随包 skills：** `edges-compose` 升到 `0.2.0`，说明与本版 `edges compose` 一致。其余随包 skill 只改仓内路径，命令不变：`conversation-to-notes` `2.7.2`（不再点名个人仓）、`conversation-to-tasks` `1.3.2`、`edges-note` `2.3.2`、`edges-onboarding` `0.1.1`、`project-memory-init` `4.0.1`、`project-tasks-classify` `1.3.1`。`project-memory-doctor` 仍是 `3.3.0`，正文里的容器示例改为 `packages/evaluation`，迁移脚本改为 `scripts/migrations/migrate-agents-indexes.mts`。
- **迁移提示：** 任务看板仍带 `task-projects` 旧标记时，报错里的脚本路径改为 `scripts/migrations/migrate-agents-indexes.mts`。

## [0.2.3] - 2026-10-19

### Added

- 随包 skills 新增 `edges-compose`（`0.1.0`，beta）。它说明如何用 `edges compose register`、`clone`、`list`，以及可选的 `pull`、`push`、`unregister`，把外部 harness 仓库挂到当前 scope。`register` 必须带 `--description`。

### Changed

- `edges compose register` 的 `--description` 改为必填。缺少或只有空白时以校验错误退出（退出码 2，`errorCode` 为 `VALIDATION_ERROR`），不写 `AGENTS.md`。

## [0.2.2] - 2026-10-19

### Fixed

- `edges init` 在旧 `.memory` 上的 `migration-required` 改为提示 `edges memory migrate --dry-run`，然后再执行 `edges memory migrate`。
- `edges memory migrate` 能迁移早期平铺布局：大写类型索引、`project_` / `feedback_` / `reference_` / `user_<slug>.md`，以及被条目相对路径引用的附件目录，目标是 `.harness/memory/<plural>/README.md` 与 `<type>_<slug>/INDEX.md`。无法归类的路径在 `--dry-run` 和正式结果里列全，正式迁移时挪到 `.project-memory-migration/unclassified/`，不因其中一个文件失败。平铺层 `AGENTS.md` 的旧 `project-memory` 标记改写为 `project-harness`。
- `edges tasks project list` / `get` / `update` 只把看板直接子目录里的 `README.md` 当作 Task Project 元数据。同目录的 `AGENTS.md` 是系统入口，不提供标题或描述，也不会被补成 README。项目目录已存在但缺少 `README.md` 时，`get` / `update` 失败并在原因里带上该路径；`list` 跳过这个目录。`tasks/.harness/README.md` 不再被当成项目。某个项目的 README 不合法时，失败原因里带上该文件路径。

## [0.2.1] - 2026-10-19

跳过 `0.2.0`：该版本号曾被一次后来拒绝的 `npm stage publish` 占用，npm 不允许再次发布同一版本。GitHub Actions 发布 `@viruspc/edges@0.2.0` 时返回 `E409 Cannot publish over previously staged version "0.2.0"`。本版没有相对那次记录的功能变更。

## [0.2.0] - 2026-10-18

### Added

- `edges init` 与 `edges skills init` 在建类型索引之后，用依赖 `skills@1.7.2` 安装随包 skills：`skills add <包内 skills 目录> --skill '*'`。`--` 之后的 token 原样转交。安装器非零退出时，这两条命令以同一退出码失败。
- npm 包带上构建时拷入的 `packages/skills/`，含 14 个调用 edges CLI 的 skill。

### Changed

- `engines.node` 从 `>=22` 改为 `>=22.20.0`，与 `skills@1.7.2` 一致。

### Removed

- 不调用 edges CLI 的 6 个 skill 改收在 `shared-extensions/skills/`，不再打进本包：`paper-10-questions`、`summarize-ai-article`、`summarize-ai-article-ultra`、`weekly-ai-blogs-digest`、`horizontal-vertical-research`、`learn-repo`。

## [0.1.0] - 2026-10-18

### Added

- 首次发布到 npm。包名 `@viruspc/edges`，命令名 `edges`。
