# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

本文件只记 Edges 这个仓库本身的重要变化，方便扫一眼「系统最近能做什么」。某个对外技能自己的版本记录，看 [`extensions/skills/`](extensions/skills/) 下面各自的 changelog；跨机器共用、但不绑定 Edges 的扩展，看 [`shared-extensions/CHANGELOG.md`](shared-extensions/CHANGELOG.md)。尚未发版的变化按功能模块分组。Unreleased 的 `###` 用功能模块原名，不要改成「模块：摘要」或只留摘要；每条 `-` 前面加短小标题，写成 `- **小标题：** 正文…`。完整约定在项目记忆 `project_repo_changelog`，示例是 commit `a80d1b0`。

领域决策、术语表和实现计划不写进这份根 changelog，分别看 [`docs/adr/`](docs/adr/)、[`CONTEXT.md`](CONTEXT.md) 和 [`docs/superpowers/plans/`](docs/superpowers/plans/)。

## [Unreleased]

### 项目记忆（project-memory）

- **统一 CLI 执行入口：** Project Memory 的初始化、写入、类型登记、检查、旧布局迁移和私有归档统一由 TypeScript 的 `edges memory` 执行；模板随 CLI 分发。相关 Skill 改为调用 CLI，移除原 Python 执行层。需先构建或安装 Edges CLI，再升级这些 Skill。

### 文档与系统

- **按归属迁移目录：** 根维护记忆、技能、任务、评测和观测进入 `.harness/`，领域任务位于 `tasks/`，研究与教学分别位于 `projects/`、`teaching/`。`pnpm migrate:recursive-layout --worktree <独立工作树绝对路径> --dry-run` 审阅实例清单，改用 `--apply` 执行并保留本机恢复记录；各克隆的私有旧材料须分别迁移。任务命令通过 `--scope` 与 `--purpose domain|maintenance` 选择真源。

## [1.3.0] - 2026-09-30

### 任务看板与项目

- **共用三栏审阅页：** `edges tasks project review-page` 和固定入口 `/tasks/` 共用同一个审阅页，按 Projects、Tasks、Details 展示项目、任务和正文。左侧点项目筛选，中间按状态展示任务，右侧渲染所选任务的 Markdown 正文；任务名显示在 Details 标题下面。卡片突出任务标题，带日期的文件标识默认收起。
- **筛选与归属调整：** 可以按全文、`urgent` / `high` / `medium` / `low` / `none`、指派和 `edges-tasks-status` 筛选任务。把卡片拖到左侧项目，或使用「移到项目…」，只调整页内的项目归属；「复制导出 JSON」会带上调整结果，供审阅后回传。状态列只负责展示，页面操作不会直接写回仓库。
- **桌面布局可调：** 宽屏把 Edges 顶栏和筛选控件放在同一行，详情栏默认宽 220px，为中间看板留出更多空间。两条分隔线可以拖动调整栏宽，中栏不会被拖没；桌面状态列间距保持不变。
- **窄屏纵向浏览：** 页面窄于 768px 时，Projects、Tasks、Details 接在同一页中纵向滚动。项目列表收成显示数量的下拉框，弹出层锚在触发器上；筛选收进 Lucide `ListFilter` 图标按钮，抽屉标题为「筛选」，右上角用 × 关闭。任务按 Backlog、In Progress、Done 等英文状态标题分段，空状态不显示，有卡片的状态默认展开。
- **分段吸顶与折叠：** 窄屏当前章节标题吸在 Edges 下方，状态标题吸在 Tasks 下方，两者均可通过箭头图标折叠。同一时间只吸顶当前章节；所有状态段收起时，标题紧挨成一列，不留深色空隙；仍有状态段展开时，保留卡片与段间距。项目下拉和项目列表的间距不受这次状态折叠调整影响。
- **标题层级更清楚：** 顶栏使用色带，Edges 旁是 Lucide `Layers2` 浅色图标块。章节标题使用介于顶栏与页面背景之间的过渡色面，不加左侧色条；状态标题贴近页面背景，字号比章节标题小一档，保持扁平列表的层级。
- **跳转与返回定位：** 双击 Projects、Tasks、Details 标题可滚到对应章节，双击 Edges 回到页顶。窄屏 Details 中的「回到看板」会滚到当前卡片、保留选中状态，并让开吸顶的 Tasks 和状态标题。修复窄屏滚动范围问题后，从页顶可以滚到详情，返回看板后也能再滚回 Projects。
- **按项目分组列出：** 可以用 `edges tasks list --group-by project` 按任务项目分组列出看板，需要时加 `--format json`。输出为稳定的 `edges.tasks.grouped/v1` 分组 JSON；原有筛选和排序先执行，再分组。这个输出与审阅页输入格式不同，部署生成器会完成转换。
- **构建为单份页面：** 生成审阅页前，先用 `pnpm --filter tasks-review-app run build` 构建前端资源，随后由 `edges tasks project review-page` 将脚本和样式内联到一份 HTML 中；构建产物不进 git。`deploy.yml` 会在同步 main 后完成构建、格式转换和静态页生成，并修复了读取 Artifacts token 的引号错误，避免部署因语法错误中断。
- **固定看板随部署更新：** nginx 首次配置完成后，`/tasks/` 与 `/teaching/` 在同一台机器上提供固定入口；看板随 main 的成功部署更新。首次配置使用 `extensions/cli/deploy/setup-nginx-tasks.sh`，后续部署自动生成页面。它是长期入口，不使用 Artifacts 临时链接的到期机制。

### Artifacts 预览

- **发布临时预览链接：** 可以把静态文件或目录上传成浏览器和手机可打开的 URL，到期自动删除。本机先用 `edges artifacts init --base-url <url> --token <server-token>` 保存服务地址并复用服务器的 token，再用 `edges artifacts publish` 发布，提前删除用 `edges artifacts rm`。审阅页先由 `edges tasks project review-page` 渲染，再单独发布。
- **公网地址与鉴权：** 公网示例和 `edges artifacts init --base-url` 使用 `https://edges.viruspc.tech`，`/health`、`/artifacts` 路径不变。上传和删除需要共享 token，浏览器打开预览链接无需登录；给手机的地址必须从手机可达。客户端写请求带固定的浏览器式 User-Agent，以处理该公网入口对缺少此标识的 `POST /artifacts` 返回 Cloudflare 1010 的问题。
- **安装与启停分开：** 在与教学站点相同的宿主上，用 `edges artifacts server install` 准备环境和服务，再用 `edges artifacts server start` 启动。日常通过 `stop` / `restart` 管进程、`status` 查看状态；`install` 不启动进程，也没有 `server init` 命令。
- **复用现有反代：** 一次性运行 `edges artifacts server setup-nginx`，把反代写入已有的 `teaching.conf`；配置必须包含 `/teaching/`，不另开公网端口。后续常规部署不需要重复配置 nginx。
- **部署后更新服务：** 合并到 main 后，若服务器已有 Artifacts 服务配置且 token 已设置，`deploy.yml` 会在同步 main 后执行 `edges artifacts server install` 和 `edges artifacts server restart`；缺少配置或仍使用占位 token 时跳过。
- **修复 CLI 完整编译：** `edges artifacts server setup-nginx` 成功结果中的 `command` 保留子命令名 `artifacts.server.setup-nginx`，sudo shell 命令字符串放到 `sudoCommand`。修复两个含义共用字段的问题后，`pnpm --filter edges-cli build` 可以完整通过。

### 笔记入库与能力面

- **任务人审后落库：** 新增 `conversation-to-tasks`（`extensions/skills/conversation-to-tasks`），从对话整理任务草稿，正文按背景 → 目标 → 动作 → 完成标准组织，使用中文栏名。背景和目标必填，动作和完成标准可选；完成标准可在 `grill-with-docs` 后补齐。通过 `edges tasks create` 或 `edges tasks update` 落库，可以在对话确认后写入，也可以写在独立分支上提 PR 审阅。
- **CLI 目录改名：** 多命令 CLI 的代码目录从 `extensions/clis` 改为 `extensions/cli`，引用旧路径的本地脚本需要同步调整。npm 包名仍为 `edges-cli`，二进制仍为 `edges`，`pnpm --filter edges-cli` 和命令行为不变。
- **明确本地 CLI 使用方式：** 文档明确 `edges-cli` 保持 `private`，不发布到 npm registry。日常可用 `pnpm --filter edges-cli exec tsx src/index.ts` 运行；本地 `edges` 二进制来自 `dist/index.js`，需先让 `pnpm --filter edges-cli build` 成功，`prepack` 会运行同一构建流程。

### 文档与系统

- **本地窗口状态不再入库：** `.obsidian/workspace.json` 已移出版本管理并加入忽略规则，Obsidian 的本地窗口布局不再随仓库提交共享。

## [1.2.0] - 2026-09-18

### 任务看板与项目

- 跨 Agent 接力的工作项看板改到 [`knowledge/tasks/`](.harness/tasks)。原来 `knowledge/todos/` 里的条目已经改成现在的任务记录格式并迁了过来；旧目录已删除，没有再留跳转说明。
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
- `extensions/cli/`：面向 agent 的 `edges-note` CLI（JSON stdout，复用 `bin/new-note`）。本地 agent 优先走它；MCP `new-note` 保留。
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

[Unreleased]: https://github.com/VirusPC/edges/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/VirusPC/edges/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/VirusPC/edges/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/VirusPC/edges/releases/tag/v1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/v1.0.0
