# project-memory-init

本目录是 project-memory 系列 skill 的共享家。协议与布局在 `references/`，开发流程、设计决策与调研史料在 `.memory/`。

<!-- project-memory:start -->
<!-- project-memory-important:start -->
## 本层硬约束

- 改这套 skill 的顺序：`PROTOCOL.md` → `LAYOUT.md` → `project-memory-init` → 其他非 doctor skill → `project-memory-doctor`。不能跳到下游再反过来定义上游。
- Init 只在用户明确要求时运行；Remember / Ask / Doctor 不得代为 Init。
- 本层硬约束直接写在这个区块里，不要链到 `.memory` 文件。
<!-- project-memory-important:end -->
<!-- project-memory-local:start -->
## 本层记忆

下面四个是索引，不是正文。按条目说明挑要读的，再打开对应内容。

- [.memory/FEEDBACK.md](.memory/FEEDBACK.md) — 用户的纠正、确认过的做法与必须遵守的禁止模式。
- [.memory/PROJECT.md](.memory/PROJECT.md) — 进行中的工作、关键时间点，以及无法从代码或 git 历史推导的决策。
- [.memory/REFERENCE.md](.memory/REFERENCE.md) — 需求文档、设计稿、接口文档、监控面板等外部资料。
- [.memory/SKILLS.md](.memory/SKILLS.md) — 可复用的能力说明、操作流程与使用规范。
<!-- project-memory-local:end -->

<!-- project-memory-auto:start -->
## 记忆自动化

- 回答问题或动手改代码之前先查项目记忆（`$project-memory-ask`），不用等用户说「搜索」；本轮查过就别重复查。
- 用户纠正了你，或者任务产出了已验证、以后还用得上的结论，就沉淀（`$project-memory-remember`），动手前先读它的「什么时候写」。
- 索引是分层的：按当前任务涉及的目录，取从这里到那些目录之间的各层，不要一次加载全部。
<!-- project-memory-auto:end -->
<!-- project-memory:end -->
