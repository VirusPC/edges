# project-memory-init

本目录是 project-memory 系列 skill 的共享家。协议与布局在 `references/`，开发流程与设计决策见本层维护记忆，见[开发规范](.harness/memory/projects/project_development/index.md)。



<!-- project-memory-important:start -->
## 本层硬约束

- 本目录有项目记忆。提问或动手前用 `$project-memory-ask`；该沉淀用 `$project-memory-remember`。本轮查过不重复。
- 本层硬约束直接写在这个区块里，不要通过记忆正文链接代替本区块的硬约束。
- 改这套 skill 的顺序：`PROTOCOL.md` → `LAYOUT.md` → `project-memory-init` → 其他非 doctor skill → `project-memory-doctor`。不能跳到下游再反过来定义上游。
- Init 只在用户明确要求时运行；Remember / Ask / Doctor 不得代为 Init。
<!-- project-memory-important:end -->


<!-- project-memory-local:start -->
## 本层记忆

- [.harness/memory/feedbacks/AGENTS.md](<.harness/memory/feedbacks/AGENTS.md>) — 用户的纠正、确认过的做法与必须遵守的禁止模式。
- [.harness/memory/projects/AGENTS.md](<.harness/memory/projects/AGENTS.md>) — 进行中的工作、关键时间点，无法从代码或 git 历史推导的决策，以及项目内的规范。兜底：对不上更具体类型时走这里。
- [.harness/memory/references/AGENTS.md](<.harness/memory/references/AGENTS.md>) — 需求文档、设计稿、接口文档、监控面板等外部资料。
- [.harness/skills/managed/AGENTS.md](<.harness/skills/managed/AGENTS.md>) — 从会话里沉淀出来的可复用流程，动手前先看本层有没有现成的。
- [.harness/skills/referenced/AGENTS.md](<.harness/skills/referenced/AGENTS.md>) — 本层 .agents/skills/ 下人写或装入的标准技能，工具只索引不改写。
<!-- project-memory-local:end -->
