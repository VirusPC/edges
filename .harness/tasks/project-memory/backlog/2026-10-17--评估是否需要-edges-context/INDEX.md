---
metadata:
  edges-type: task
  edges-task-project: project-memory
  edges-updated-at: '2026-10-17T14:09:50.784Z'
  edges-title: 评估是否需要 edges context
  edges-tasks-status: backlog
  edges-task-priority: none
name: 评估是否需要_edges_context
description: >-
  ADR 0034 第九轮暂缓了 edges context，前提是 Agent 会顺着 AGENTS.md 里 Compose block
  的路径往下读；要实测核实这一点，再决定要不要做这个命令。
---
**背景：**
ADR 0034 第九轮修订（2026-10-17）把 `edges context` 命令和「客户端配置里写一句开场先运行 `edges context`」一起暂缓了。
- 原设计：从当前作用域 `AGENTS.md` 顺树取本层硬约束和一级索引（name / description），拼成 Markdown 输出，Agent 开场先运行。
- 暂缓原因：主流代码 Agent 开场本来就读 `AGENTS.md`；Compose block 写在 `AGENTS.md` 里、算本层，Agent 开场就能看到各入口的路径和 name / description，自己顺着走。`edges context` 和这一步重复，还多了一个必须做的开场步骤。
- 这个决定依赖的前提「Agent 会可靠地顺着 Compose block 的路径往下读」还没核实。
- 回头再议的条件：组合树很深，硬约束要手动展开才看得到；或者 Agent 实际不顺着 Compose block 的路径走。
- 关联：[ADR 0034](<../../../../../docs/adr/0034-compose-harness-repos-into-workspace.md>)（Decision #6、Considered Options、Consequences）；PR #260。

**目标：**
核实代码 Agent 开场读到 `AGENTS.md` 的 Compose block 后，是否会可靠地顺着入口路径去读被组合仓库的硬约束和索引；据此决定要不要做 `edges context` 这类开场命令。

**完成标准：**
- [ ] 准备至少一棵组合树（就地 `.harness/` + Compose block 挂上至少一个本地 clone 的仓库，被组合仓库里放一条可检查的硬约束）。
- [ ] 至少用一个代码 Agent 在这棵树上开新会话测试，记录它是否读了 Compose block 指向的入口、是否遵守了那条硬约束。
- [ ] 根据结果决定「仍不需要」或「需要 `edges context`（或别的做法）」，结论写进 ADR 0034（新一轮修订或新 ADR）。
