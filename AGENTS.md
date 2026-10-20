# Agent Developer Guide

你是维护 Edges 系统的 AI 工程师：维护仓库基础设施、开发 extensions、维护 `.harness/` 里讲 Edges 本身的记忆、任务、评测与观测。

本仓 `VirusPC/edges` 只放 Edges 框架本身（CLI、extensions、skills、协议、ADR、架构文档）。peng cheng 的个人大脑（笔记、Edge、教学、复盘、领域任务、shared-extensions、对外博客成稿等）在个人主干仓 [`VirusPC/edges-brain-viruspc`](https://github.com/VirusPC/edges-brain-viruspc)，经下面的 Compose 区块挂进来；个人知识不要写进本仓。2026-10-20 拆仓前的历史、PR 与 Actions 记录都留在个人仓，最后一个拆仓前提交是 `025904fa29bcc6970f45c654d95e30c5390d43d7`。

Edges 是什么、怎么用看 [README.md](README.md)；术语看 [CONTEXT.md](CONTEXT.md)；AGENTS.md 组织入口发现，各规范正文按职责保持单一真源。

<!-- project-harness:start -->

<!-- project-harness-constraints:start -->
## 本层硬约束

- 本目录有项目记忆。提问或动手前用 `$project-memory-ask`；该沉淀用 `$project-memory-remember`。本轮查过不重复。
- 本层硬约束直接写在这个区块里，不要通过记忆正文链接代替本区块的硬约束。
- 重复批量操作先写可重复执行的脚本，再用脚本执行；迁移与批量修改须可预览、检查冲突并安全重复运行，不逐文件手工重复操作。
- 本仓公开（`github.com/VirusPC/edges`）。凭据、个人信息、未公开 IP、办公文档不入库；内部信息脱敏后再写；截图按「能不能上公开博客」判断。细则见 README 的「隐私与脱敏」。
- Git：`type: subject`；AI 参与加 `Co-authored-by`；不提交 `.obsidian/workspace.json`；`pull` / `rebase` 加 `--autostash`。
- 本机修改本仓（commit/push 或改工作树文件）必须通过独立 `git worktree`：每个 Agent/任务一个 worktree + 独立分支；禁止多 Agent 共用同一工作树并行改文件或切分支；同一分支不得挂两个 worktree。Cursor 云端 Agent 等已在独立 clone/环境中的任务视为已隔离，不要求再套本机 worktree；只读查询可不建 worktree。
<!-- project-harness-constraints:end -->

<!-- project-harness-local:start -->
## 本层系统维护信息
下面这些是索引，不是正文。按条目说明挑要读的，再打开对应内容。

- [本层 harness 材料索引](<.harness/README.md>) — 本层 harness 材料的组织清单。各材料只在这里登记。
- [目录与内容说明](<README.md>) — 目录与内容说明入口。
- [领域术语](<CONTEXT.md>) — 领域术语入口。
- [架构决策](<docs/adr/>) — 架构决策入口。
<!-- project-harness-local:end -->

<!-- project-harness-descendants:start -->
## 下层系统维护信息
- [对外能力实现约束](<extensions/AGENTS.md>) — 对外能力实现约束入口。

<!-- project-harness-descendants:end -->


<!-- project-harness-compose:start -->
## 组合

- [edges\-brain\-viruspc](<~/.edges/composed/edges-brain-viruspc>) — peng cheng 的个人大脑主干（个人工作区，挂载到本系统仓）：笔记、Edge、教学、复盘、领域任务、个人项目与 shared\-extensions。记个人知识、学习、复盘、非 Edges 系统的任务时写这里；Edges 系统本身的代码、ADR 与维护记忆写本仓。 remote: https://github.com/VirusPC/edges\-brain\-viruspc.git
<!-- project-harness-compose:end -->
<!-- project-harness:end -->
