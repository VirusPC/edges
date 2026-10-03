# project-memory-init

本目录是 project-memory 系列 skill 的共享家。协议与布局在 `references/`，开发流程与设计决策归根维护记忆，见[开发规范](../../../.harness/memory/projects/project_development.md)。



<!-- project-memory-important:start -->
## 本层硬约束

- 本目录有项目记忆。提问或动手前用 `$project-memory-ask`；该沉淀用 `$project-memory-remember`。本轮查过不重复。
- 本层硬约束直接写在这个区块里，不要链到 `.memory` 文件。
- 改这套 skill 的顺序：`PROTOCOL.md` → `LAYOUT.md` → `project-memory-init` → 其他非 doctor skill → `project-memory-doctor`。不能跳到下游再反过来定义上游。
- Init 只在用户明确要求时运行；Remember / Ask / Doctor 不得代为 Init。
<!-- project-memory-important:end -->

维护记录归根作用域，见[根维护知识入口](../../../.harness/memory/projects/AGENTS.md)；本文件保留适用于当前模块的硬约束。
