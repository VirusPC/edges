# Agent Developer Guide

你是维护 Edges 系统的 AI 工程师：维护仓库基础设施、开发 CLI / skill / MCP / 应用与服务、维护 `.edges/` 里讲 Edges 本身的记忆与任务，以及 `packages/evaluation/`、`packages/observation/` 里的评测与观测。

本仓 `VirusPC/edges` 只放 Edges 框架本身（`packages/cli/`、`packages/skills/`、`packages/apps/`、`packages/services/`、`packages/mcp-servers/`、`packages/system-prompt/`、协议、ADR、架构文档）。个人知识（笔记、Edge、教学、复盘、领域任务、不绑定 Edges 的通用 skill、对外博客成稿等）写在使用方自己的内容仓。这份仓就是可 Compose 的共享 `.edges`，由使用方用 `edges compose` 挂到自己的 `.edges/compose/README.md`；不要写进本仓。布局由该仓自定。2026-10-20 拆仓前的历史、PR 与 Actions 记录都留在个人仓，最后一个拆仓前提交是 `025904fa29bcc6970f45c654d95e30c5390d43d7`。2026-10-20 起不再有 `extensions/` 这一层，映射见 [平铺说明](docs/migrations/2026-10-20-flatten-extensions.md)。同日代码目录收进 `packages/`，映射见 [workspace 说明](docs/migrations/2026-10-20-packages-workspace.md)。

Edges 是什么、怎么用看 [README.md](README.md)；术语看 [CONTEXT.md](CONTEXT.md)；AGENTS.md 组织入口发现，各规范正文按职责保持单一真源。

<!-- edges:start -->

<!-- edges-constraints:start -->
## 本层硬约束

- 本目录有项目记忆。提问或动手前用 `$edges-memory-ask`；该沉淀用 `$edges-memory-remember`。本轮查过不重复。
- 本层硬约束直接写在这个区块里，不要通过记忆正文链接代替本区块的硬约束。
- 重复批量操作先写可重复执行的脚本，再用脚本执行；迁移与批量修改须可预览、检查冲突并安全重复运行，不逐文件手工重复操作。
- 本仓公开（`github.com/VirusPC/edges`）。凭据、个人信息、未公开 IP、办公文档不入库；内部信息脱敏后再写；允许点名、链接公开使用案例 `VirusPC/edges-brain-viruspc`，其他个人仓和所有私有仓仍不点名、不链接（含历史旧名）；截图按「能不能上公开博客」判断。细则见 README 的「隐私与脱敏」。
- Git：`type: subject`；AI 参与加 `Co-authored-by`；不提交 `.obsidian/workspace.json`；`pull` / `rebase` 加 `--autostash`。
- 本机修改本仓（commit/push 或改工作树文件）必须通过独立 `git worktree`：每个 Agent/任务一个 worktree + 独立分支；禁止多 Agent 共用同一工作树并行改文件或切分支；同一分支不得挂两个 worktree。Cursor 云端 Agent 等已在独立 clone/环境中的任务视为已隔离，不要求再套本机 worktree；只读查询可不建 worktree。
- 不绑定 Edges 的通用 skill、MCP 配置、plugin、hook 不放本仓，放使用方自己的内容仓，经 `edges compose` 挂载；布局由该仓自定。不再维护 `shared-extensions/` 隔间，也不再打 `shared-extensions@` tag（[ADR 0048](docs/adr/0048-retire-shared-extensions.md)）。
- 顶层 `edges` 命令能对上 harness 或领域目录时，命令名跟目录（`notes/` → `notes`，`.edges/skills` → `skills`）。硬切断，不留旧名别名。`tasks`、`memory` 已对齐则不动。不为 `observation` 发明命令。`evaluation` 只提供已定的长驻服务入口 `edges evaluation server`，不另开评测内容命令。
- 内容节点的 create/get/update/destroy 必须走 NodeService，不得旁路写文件（[ADR 0030](docs/adr/0030-content-leaf-crud-via-nodeservice.md)）。
- 材料目录固定为 `.edges/`。层标记是 `edges` / `edges-*`（外层、constraints、local、descendants、compose）。硬切断，不双读 `.harness` 或 `project-harness`。此布局在 [ADR 0047](docs/adr/0047-rename-harness-directory-to-edges.md) 之后冻结，不借更名改模块结构。
- 对本仓任务卡做 grill-with-docs（或同类 grill）细化时：达成共识后、动手改代码前，必须先写 html-plan（正文用中文），并用 `edges artifacts publish` 发布预览链接交给用户；用户确认（Respond / 明确 OK）后再实现。不要跳过 plan / publish；对话同步用中文。
<!-- edges-constraints:end -->

<!-- edges-local:start -->
## 本层系统维护信息
下面这些是索引，不是正文。按条目说明挑要读的，再打开对应内容。

- [本层 harness 材料索引](<.edges/README.md>) — 本层 harness 材料的组织清单。各材料只在这里登记。
- [目录与内容说明](<README.md>) — 目录与内容说明入口。
- [领域术语](<CONTEXT.md>) — 领域术语入口。
- [架构决策](<docs/adr/>) — 架构决策入口。
- [.edges/tasks/AGENTS.md](<.edges/tasks/AGENTS.md>) — tasks 目录的项目记忆与规范入口。
<!-- edges-local:end -->

<!-- edges-descendants:start -->
## 下层系统维护信息
- [edges-memory-init](<packages/skills/edges-memory-init/AGENTS.md>) — edges-memory 系列 skill 的项目记忆与规范入口。
- [evaluation](<packages/evaluation/AGENTS.md>) — evaluation 目录的项目记忆与规范入口。
- [observation](<packages/observation/AGENTS.md>) — observation 目录的项目记忆与规范入口。

<!-- edges-descendants:end -->
<!-- edges:end -->
