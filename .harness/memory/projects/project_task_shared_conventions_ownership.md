---
name: project_task_shared_conventions_ownership
description: >-
  Tasks 执行流程与 CLI 约定存根 Project Memory；STAR 记忆仅保留原因范围并引用 Skill；extensions/memory
  留后续高优待办，其他条目按职责归属。
metadata:
  edges-title: Tasks 旧记忆逐条审阅后的共享范围与归属
  edges-type: project
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T18:35:32+08:00'
---

原 Tasks 的 8 条内容已按实际适用范围逐条审阅，不能整批认定为根维护看板的局部规则。

**Why:** 跨层共用规则、特定看板决策、仓库部署逻辑与一次性操作要求属于不同维护对象。共享通过引用复用，不改变内容归属。

**How to apply:**
- 任务执行阶段（grill→research→plan→implement→validate→close）：所有层级 .harness/tasks 的通用约定，不自动扩展到领域 tasks。用户已确认当前存放于根 .harness/memory/projects/，对外分发后续提炼。
- 看板变更优先走 CLI：覆盖所有层级的维护 .harness/tasks 与领域 tasks。用户已确认当前存放于根 .harness/memory/projects/，对外分发后续提炼。
- STAR 任务结构、事实与 idea 分开及简述问题结果：覆盖所有层级两类任务，具体方法统一由 conversation-to-tasks Skill 维护，各看板引用；历史决策记忆与方法正文区分，避免重复规范。
- 七个初始 Task Project 分组：仅根维护看板，留在 .harness/tasks 的局部记忆；空壳和暂缓迁移为历史状态，当前分组以看板索引为准。
- 云端 Obsidian vault 配置：用户明确属于 Edges 仓库部署逻辑，归根节点部署记忆，不归 Tasks 或预览 Skill 的局部记忆。
- 初始化后先留本地：用户要求删除；这是一次性要求，不继续作为活跃规则。该条及索引已删除，不应重新恢复成通用审批门槛。
- preview-tasks-with-box-obsidian：用户确认归根 .harness/skills/managed/preview-tasks-with-box-obsidian/SKILL.md；它保存操作步骤，第六条保存部署约定与缘由。

上述是 2026-10-05 用户逐条确认的范围与归属决定。指定删除、前两条向根 Project Memory 的迁移和 STAR 记忆精简已执行；其余物理迁移与第 4 条写作规范整理尚未执行，不得将设计确认表述为全部迁移完成。详见 docs/discussions/2026-10-05-implementation-rulings.md 第 3 项。


2026-10-05 后续提议：用户提出 extensions/memory，用于对外分发预定义 Project Memory。该方向可能承接需跨仓复用的通用任务约定；尚未确认目录配置与安装方式，不把原始历史记忆直接视为分发内容，也不因此推翻写作方法归 conversation-to-tasks 的决定。现有 init 模板负责结构，预定义 memory 负责可选的复用内容；默认引用安装内容是助手建议，仍待讨论。


2026-10-05 用户强调：预定义 Project Memory 分发待办必须覆盖刚刚逐条确认的 Tasks Project Memory，不能只记录目录与分发机制。首批内容须包含维护任务执行流程、两类任务共用的 CLI 操作约定，以及对 conversation-to-tasks 写作规范的引用；保持先前确认的适用范围与方法单一真源，不把根看板分组或仓库部署记录泛化为通用任务规则。已将这些要求补进 project-memory/backlog 的“提供可分发的预定义 Project Memory”任务。


2026-10-05 用户纠正：extensions/memory 是后续高优待办，当前先存 Project Memory。前两条执行流程与 CLI 操作约定已通过 Memory 服务移动到根 .harness/memory/projects/ 并同步两端索引；回复路径时须区分当前存放位置与未来分发目标。


2026-10-05 用户确认第 3 条的整理方式：conversation-to-tasks 已覆盖 STAR，无需重复合并；Skill 保持现状。STAR 记忆只保留采用原因与适用范围，引用 Skill，去掉重复方法正文和固定版本号。已通过 CLI 完成精简与索引更新，原记忆路径保持不变；第 4 条仍需单独整理。
