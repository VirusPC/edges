# Changelog

`@viruspc/edges` 的版本记录。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Changed

- **破坏性：随包技能与标记改为 `edges-*`。** 改名技能的版本重启为 `0.1.0`。删除 `project-memory-doctor` 与 `project-memory-reshape`，不设替代技能。索引诊断仍是 `edges memory doctor`。类型标记改为 `edges-memory-type`，组织清单改为 `edges-entries-local` / `edges-entries-descendants`。运行时不读 `project-memory-type`、`project-entries-*`、`project-memory-entries`，也不把 `project-memory` / `project-memory-important` / `project-memory-local` / `project-memory-children` 当受管层标记。一次性改写仍是 `scripts/migrations/rewrite-project-harness-markers.mts`。见 [ADR 0049](../../docs/adr/0049-edges-skills-markers-rename.md)。本条尚未发版；建议下一次 npm 版本为 `0.4.0`。

## [0.3.0] - 2026-10-27

### Changed

- **破坏性：材料目录改为 `.edges`。** `edges init` 写出 `.edges/`。层标记是 `<!-- edges:start -->`、`edges-constraints`、`edges-local`、`edges-descendants`、`edges-compose`。不再读取 `.harness` 或 `project-harness`。`project-memory-*` 与 `edges-entries-*` 保持原名。见 [ADR 0047](../../docs/adr/0047-rename-harness-directory-to-edges.md) 与 [迁移说明](../../docs/migrations/2026-10-27-rename-harness-to-edges.md)。布局就此冻结。
- **破坏性：删除 `edges memory migrate`。** 命令与随包技能 `project-memory-migrate` 一并删除，不留指向 `.edges/memory` 的版本。仍停在 `.memory` 的，用 `@viruspc/edges@0.2.7` 的 `edges memory migrate` 完成后再改目录名。本版在旧 `.memory` 上初始化会报 `migration-required`，并指向上述说明。
- **内部配置文件改名：** 材料清单实现文件改为 `edges-materials.json` 与 `edges-materials.ts`。用户目录仍是 `.edges/`。
- **随包技能：** 路径或步骤跟着改的技能已升版本，见各技能 changelog。其中 `edges-memory-init` `5.0.0`、`edges-memory-remember` `4.0.0`、`project-memory-reshape` `4.0.0`、`edges-memory-add-type` `4.0.0`、`project-memory-doctor` `4.0.0`、`edges-user-memory-backup` `4.0.0`、`edges-user-memory-restore` `4.0.0` 不再指引已删除的迁移命令。
- 本文件 0.3.0 之前的条目里，材料目录与层标记已写成现行名。当时的目录名是 `.harness`，层标记前缀是 `project-harness`。

## [0.2.7] - 2026-10-26

### Routines

- **把例行工作记在仓库里：** `edges routines init` 在当前作用域启用例程。无参 `edges init` 不会顺手启用。然后用 `edges routines create`、`edges routines list`、`edges routines get`、`edges routines update`、`edges routines delete` 维护每条记录的说明和正文。记录在 `<scope>/.edges/routines/<name>/INDEX.md`，名称是稳定的小写 kebab-case。`edges routines create` 要带 `--description`，可以用 `--body` 写日程，用重复的 `--metadata key=value` 写前置信息。Edges 只保存这些记录，不到点替你执行。
- **平台每次执行前重新读：** 随包技能 `edges-routines` 说明外部平台怎么接。触发时读取这条记录和它引用的 Skill。没写版本就用来源仓库默认分支的最新内容；写了 branch、tag 或 commit 就用那一版。读不到记录或 Skill 就停止这一次并报告原因，不沿用旧副本。日程改了之后，平台上的触发时间要另外更新。

## [0.2.6] - 2026-10-25

稳定版。`0.2.6-beta.0` 里的评测服务从这一版进入 npm 的 `latest`。安装：`npm install -g @viruspc/edges`。

### 评测服务

- **第一次：先写配置，再登记，再让它一直跑：** 在本仓克隆里用这里构建出的 `edges`（`pnpm --filter @viruspc/edges exec -- edges`）。先 `edges config init` 写好本机配置，然后 `edges evaluation server install` 在这台机器上登记评测服务。登记完它还不会自己跑；要它留在后台、一直接着实验，再跑 `edges evaluation server start`。服务代码在 `packages/services/evaluation`，不在 `npm install -g` 的安装包里。
- **看输出、改完就停，用 `--dev`；要长期留在这台机器上，不要加 `--dev`：** 本机调试用 `edges evaluation server start --dev`，它在前台跑，看着输出，结束进程就停。要当后台服务长期跑，走上面的 `install`，再用不带 `--dev` 的 `start`。
- **配好之后能干什么：** 评测和 `edges artifacts server` 都读 `~/.config/edges/edges.env`，不用再各维护一份。`edges config init` 会在新文件还不存在时，把以前单独的预览配置抄进来一次。服务跑起来以后，在 Langfuse 里按数据集名字发起 Custom Experiment，就会跑本仓已经登记的实验。对外入口是 `edges evaluation server`，实现在 `packages/services/evaluation`（以前的 `packages/services/experiment-webhook` 已收进这里）。

### 随包技能

- **把 Agent 会话接到 Langfuse：** 安装包里多了五份技能。还没确定是本机、Codex Cloud、Cursor Cloud 还是 Grok Bot 时，先打开 `edges-langfuse-agent-tracing`，它只帮你选该用哪一份。`edges init` 或 `edges skills init` 会把包内技能装上。Codex Cloud 的轮询脚本和 Grok Bot 的导出脚本不在这个 npm 包里，步骤写在对应技能里。

## [0.2.5] - 2026-10-22

### Fixed

- `edges notes create`、`edges projects create` 与 `edges tasks create` 在内容面组织清单缺失时创建 README 再登记叶子，这些叶子不再回落到 `AGENTS.md`。见 [ADR 0046](../../docs/adr/0046-content-face-org-list.md)。

### Changed

- 被组合仓库可写。删掉 Compose 的只读特例之后，已检出的子模块工作区可以直接写。见 [ADR 0045](../../docs/adr/0045-compose-checkout-writable.md)。

## [0.2.4] - 2026-10-21

### Changed

- **破坏性：** Compose 入口改为磁盘上的 `.edges/compose/README.md`（`ComposeReadmeNode extends ReadmeNode`），由 `.edges/README.md` 链接。不再有虚拟节点 `<owner>/.compose/README.md`，`AGENTS.md` 不再写 Compose 区块。子节点 id 是被组合仓库的 `README.md`。默认 traverse 和系统根扫描都会进入 scope 自己的 `.edges/compose/`。根级 `--exclude <modules>` 取代 `--with-composed`；`--exclude compose` 同时跳过扫描和遍历。未知模块名直接报错。`compose add` / `list` / `update` 读写这份 README，缺失时连同索引链接一起创建。`edges compose doctor`（默认预览，`--apply` 才写）把旧区块从 `AGENTS.md` 迁过来，不删除文档里的 `--with-composed`（`.agents/skills/`、CHANGELOG 和 ADR 跳过，其余只报告）。见 [ADR 0043](../../docs/adr/0043-compose-readme-entry.md)。
- **破坏性：** `edges compose` 只剩三个日常子命令，名字对应 git submodule：`add`（取代 `register`，选项名不变）、`list`、`update`（取代 `clone` 与 `pull`）。`register`、`unregister`、`clone`、`pull`、`push` 直接删除，不留别名，旧命令以用法错误退出（退出码 2）。去掉条目改为手删 `.edges/compose/README.md` 的那一行（要删子模块时用 `git submodule deinit` / `git rm`）；推送改在子模块里用原生 `git push`。
- `edges compose` 底层改用 git submodule。`add` 不传 `--path` 时目录从 `~/.edges/composed/<name>` 改为仓内 `.edges/compose/<name>`；写进 README 的 href 相对于 `.edges/compose/`。`--path` 相对于 scope 目录，只收相对路径，不再被改写成绝对路径；绝对路径和 `~` 路径以校验错误拒绝。带 `--remote` 且条目在主仓库工作树里时，`add` 先跑 `git submodule add <remote> <path>`；同一 URL 的子模块已存在时只登记，URL 不同时报错。`add` 的 JSON 带 `href` 和 `submodule`（`added` / `existing`）。
- `compose update` 对仓内条目跑 `git submodule update --init -- <path>`（不带 `--recursive`）；`--remote` 时加 `--remote`，子模块在分支上时再加 `--merge`；`--name` 只处理一条。每条的 `action` 是 `initialized`、`present`、`updated` 或 `failed`。旧的 `~/...` / 绝对路径条目、仓外条目：目录不存在时 `git clone`，`--remote` 时 `git pull`。
- `compose list` 的每条多了 `href` 和 `initialized`（目录存在且非空）。
- **不递归：** 只看当前仓库自己的 Compose 条目。系统森林扫描（`forest list`、`--all` 等）默认进入 scope 自己的 `.edges/compose/`，不进入被组合仓库内部的 `.edges/compose/`，也不走进已登记的组合目录去展开下一层。被组合的入口即使在主仓库目录里也只读。
- **新提示：** 条目目录不存在或为空（子模块未初始化）时，`compose list` 和默认会读到该条目的命令在 stderr 提示运行 `edges compose update --name <name>`；`--exclude compose` 时不提示。旧路径条目会提示迁移到 `.edges/compose/<name>`。
- **逐条失败：** 失败处理落在 `compose update`（原先是 `clone` / `pull` / `push`）。失败的条目在 `entries` 里记为 `action: "failed"` 并带 `error`，stderr 每条打一行 `warning: compose update failed for <name>: <reason>`，其余条目继续执行。至少一条成功时退出码 0；全部请求的条目都失败（含 `--name` 指定的单条失败）时以失败结果退出（`status: "failed"`，仍带 `entries`；单条失败时 `reason` 是该条的错误）。缺少作用域 `AGENTS.md`、`--name` 找不到条目照旧整条命令失败。
- **可排除模块：** `--exclude` 与 `--scope` 同级，逗号分隔，可重复。接受 `compose`、`memory`、`skills`、`notes`、`projects`、`tasks`，与 `--types` 正交。
- **随包 skills：** `edges-compose` 升到 `0.2.0`，说明与本版 `edges compose` 一致。其余随包 skill 只改仓内路径，命令不变：`edges-conversation-to-notes` `2.7.2`（不再点名个人仓）、`edges-conversation-to-tasks` `1.3.2`、`edges-note` `2.3.2`、`edges-onboarding` `0.1.1`、`edges-memory-init` `4.0.1`、`edges-tasks-classify` `1.3.1`。`project-memory-doctor` 仍是 `3.3.0`，正文里的容器示例改为 `packages/evaluation`，迁移脚本改为 `scripts/migrations/migrate-agents-indexes.mts`。
- **迁移提示：** 任务看板仍带 `task-projects` 旧标记时，报错里的脚本路径改为 `scripts/migrations/migrate-agents-indexes.mts`。

## [0.2.3] - 2026-10-19

### Added

- 随包 skills 新增 `edges-compose`（`0.1.0`，beta）。它说明如何用 `edges compose register`、`clone`、`list`，以及可选的 `pull`、`push`、`unregister`，把外部 harness 仓库挂到当前 scope。`register` 必须带 `--description`。

### Changed

- `edges compose register` 的 `--description` 改为必填。缺少或只有空白时以校验错误退出（退出码 2，`errorCode` 为 `VALIDATION_ERROR`），不写 `AGENTS.md`。

## [0.2.2] - 2026-10-19

### Fixed

- `edges init` 在旧 `.memory` 上的 `migration-required` 改为提示 `edges memory migrate --dry-run`，然后再执行 `edges memory migrate`。
- `edges memory migrate` 能迁移早期平铺布局：大写类型索引、`project_` / `feedback_` / `reference_` / `user_<slug>.md`，以及被条目相对路径引用的附件目录，目标是 `.edges/memory/<plural>/README.md` 与 `<type>_<slug>/INDEX.md`。无法归类的路径在 `--dry-run` 和正式结果里列全，正式迁移时挪到 `.project-memory-migration/unclassified/`，不因其中一个文件失败。平铺层 `AGENTS.md` 的旧 `project-memory` 标记改写为 `edges`。
- `edges tasks project list` / `get` / `update` 只把看板直接子目录里的 `README.md` 当作 Task Project 元数据。同目录的 `AGENTS.md` 是系统入口，不提供标题或描述，也不会被补成 README。项目目录已存在但缺少 `README.md` 时，`get` / `update` 失败并在原因里带上该路径；`list` 跳过这个目录。`tasks/.edges/README.md` 不再被当成项目。某个项目的 README 不合法时，失败原因里带上该文件路径。

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
