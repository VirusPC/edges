# {title}

<!-- project-memory:start -->
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

{index_entries}
<!-- project-memory-children:end -->

<!-- project-memory-auto:start -->
## 记忆自动化

- 回答问题或动手改代码之前先查项目记忆（`$project-memory-ask`），不用等用户说「搜索」；本轮查过就别重复查。
- 用户纠正了你，或者任务产出了已验证、以后还用得上的结论，就沉淀（`$project-memory-remember`），动手前先读它的「什么时候写」。
- 索引是分层的：按当前任务涉及的目录，取从这里到那些目录之间的各层，不要一次加载全部。
<!-- project-memory-auto:end -->
<!-- project-memory:end -->
