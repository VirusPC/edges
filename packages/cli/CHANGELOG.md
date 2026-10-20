# Changelog

`@viruspc/edges` 的版本记录。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Changed

- `edges compose` 底层改用 git submodule。`register` 不传 `--path` 时目录从 `~/.edges/composed/<name>` 改为仓内 `.harness/compose/<name>`；区块里只写相对路径（相对于所属 `AGENTS.md` 的目录），相对的 `--path` 不再被改写成绝对路径，绝对路径和 `~` 路径以校验错误拒绝。带 `--remote` 且条目在主仓库工作树里时，`register` 先跑 `git submodule add <remote> <path>`；同一 URL 的子模块已存在时只登记，URL 不同时报错。`register` 的 JSON 多了 `href` 和 `submodule`（`added` / `existing`）。
- 仓内条目的 `clone` 是 `git submodule update --init -- <path>`（不带 `--recursive`），`pull` 是 `git submodule update --init --remote -- <path>`（子模块在分支上时加 `--merge`），`push` 在子模块里 `git push`，detached HEAD 时这一条失败并提示先切到分支。PR #13 的逐条失败处理不变。旧的 `~/...` / 绝对路径条目、仓外条目仍走 `git clone` / `pull` / `push`。
- 不递归：`--with-composed` 和读取只看当前仓库自己的 Compose 条目。系统森林扫描（`forest list`、`--all` 等）跳过 `.harness/compose/` 和已登记的组合目录。被组合的入口即使在主仓库目录里也只读。
- 新提示：条目目录不存在或为空（子模块未初始化）时，`compose list` 和带 `--with-composed` 的命令在 stderr 提示运行 `edges compose clone`；旧路径条目会提示迁移到 `.harness/compose/<name>`。

- `edges compose clone`、`pull`、`push` 不再在第一条失败的登记处中止。失败的条目在 `entries` 里记为 `action: "failed"` 并带 `error`，stderr 每条打一行 `warning: compose <clone|pull|push> failed for <name>: <reason>`，其余条目继续执行。至少一条成功时退出码 0；全部请求的条目都失败（含 `--name` 指定的单条失败）时以失败结果退出（`status: "failed"`，仍带 `entries`；单条失败时 `reason` 是该条的错误）。缺少作用域 `AGENTS.md`、`--name` 找不到条目照旧整条命令失败。

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
