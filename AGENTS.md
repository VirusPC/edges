# Agent Developer Guide

你是维护 Edges 系统的 AI 工程师：维护仓库基础设施、开发 extensions 与 shared-extensions、辅助知识库结构。

目录约定、业务逻辑与内容标准看 [README.md](README.md)，那是唯一真理源。

<!-- project-memory:start -->
<!-- project-memory-important:start -->
## 本层硬约束

- 本目录有项目记忆。提问或动手前用 `$project-memory-ask`；该沉淀用 `$project-memory-remember`。本轮查过不重复。
- 本层硬约束直接写在这个区块里，不要链到 `.memory` 文件。
- 本仓公开（`github.com/VirusPC/edges`）。凭据、个人信息、未公开 IP、办公文档不入库；内部信息脱敏后再写；截图按「能不能上公开博客」判断。细则见 README 的「隐私与脱敏」。
- Git：`type: subject`；AI 参与加 `Co-authored-by`；不提交 `.obsidian/workspace.json`；`pull` / `rebase` 加 `--autostash`。
- `knowledge/posts/` 存放对外博客（将公开发表的成稿），由人仔细维护。AI 不得自动创建、编辑、移动、删除、重构或重写该路径下的任何文件。
<!-- project-memory-important:end -->

<!-- project-memory-local:start -->
## 本层记忆

下面三个是索引，不是正文。按条目说明挑要读的，再打开对应的 `<type>_<slug>.md`。

- [.memory/FEEDBACK.md](.memory/FEEDBACK.md) — 用户的纠正、确认过的做法与必须遵守的禁止模式。
- [.memory/PROJECT.md](.memory/PROJECT.md) — 进行中的工作、关键时间点，以及无法从代码或 git 历史推导的决策。
- [.memory/REFERENCE.md](.memory/REFERENCE.md) — 需求文档、设计稿、接口文档、监控面板等外部资料。
<!-- project-memory-local:end -->

<!-- project-memory-children:start -->
## 下层记忆索引

按任务目录加载对应 `AGENTS.md`。

- [extensions/AGENTS.md](extensions/AGENTS.md) — 对外接口层：skills、MCP、tools 等供外部 Agent 接入的扩展。
- [shared-extensions/AGENTS.md](shared-extensions/AGENTS.md) — 跨机器、跨 Agent 共享的个人 harness：skills、MCP 配置、plugins、hooks。
<!-- project-memory-children:end -->

<!-- project-memory-auto:start -->
## 记忆自动化

- 回答问题或动手改代码之前先查项目记忆（`$project-memory-ask`），不用等用户说「搜索」；本轮查过就别重复查。
- 用户纠正了你，或者任务产出了已验证、以后还用得上的结论，就沉淀（`$project-memory-remember`），动手前先读它的「什么时候写」。
- 索引是分层的：按当前任务涉及的目录，取从这里到那些目录之间的各层，不要一次加载全部。
<!-- project-memory-auto:end -->
<!-- project-memory:end -->
