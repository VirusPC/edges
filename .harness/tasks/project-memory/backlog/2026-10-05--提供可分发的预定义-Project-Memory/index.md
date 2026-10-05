---
name: predefined-project-memory-distribution
description: 设计 extensions/memory 的预定义记忆分发，并以已确认的 Tasks 执行流程、CLI 操作约定及写作规范引用为首批内容。
metadata:
  edges-type: task
  edges-title: 提供可分发的预定义 Project Memory
  edges-tasks-status: backlog
  edges-task-project: project-memory
  edges-updated-at: '2026-10-05T10:27:29.858Z'
  edges-task-priority: high
---

**背景：**
在梳理递归节点及原 Tasks 记忆归属时，明确了仓内共享与对外分发的区别：根 AGENTS.md 和 .harness 服务本仓，供其他仓库安装复用的能力应沉淀到 extensions 或 shared-extensions。用户进一步提出新增 extensions/memory，提供预定义的 Project Memory，让其他仓库除安装 CLI 和 Skill 外，也能采用可复用的规则、约定与背景知识。

当前 Project Memory 初始化模板主要生成入口、索引和条目骨架，尚未提供独立的预定义记忆内容分发机制。各层维护任务的默认执行流程可作为候选内容；仓库特定的历史上下文不应直接随扩展分发。

关联：docs/discussions/2026-10-05-implementation-rulings.md 中“对外分发预定义 Project Memory”的讨论。

**目标：**
提供可对外分发的预定义 Project Memory，使其他仓库能按需采用，并与自身作用域中持续产生的本地记忆共存。

**动作：**
- 讨论 extensions/memory 的目录组织、内容收录边界，以及与初始化模板和 Skill 的职责划分。
- 复用既定的目录入口与 MemoryNode 模型，不因分发来源不同新增节点类型。
- 确定安装、采用与更新方式。通过 AGENTS 引用已安装内容是当前建议，尚未确认；不要预先固定为复制或强制导入。
- 将本次逐条确认的 Tasks 相关 Project Memory 列为首批内容，不能只交付分发机制而遗漏约定本身：
  - 维护任务执行流程（project_assign_grill_with_docs_first）：grill → research → plan → implement → validate → close，适用于所有层级的 .harness/tasks，不自动扩展到领域 tasks。
  - 看板变更优先走 CLI（project_tasks_board_mutations_via_cli）：覆盖所有层级的维护 .harness/tasks 和领域 tasks，已有 Skill 优先采用，工具缺口明确反馈。
  - STAR 任务结构与事实／idea 区分（project_star_for_agent_task_formulation、project_task_separate_facts_from_idea）：覆盖两类任务；预定义记忆保留适用约定并引用 conversation-to-tasks，具体写作方法仍由该 Skill 维护，不复制出第二套方法正文。
- 按已确认的范围提炼可分发内容，不直接打包原始历史记忆。根维护看板的七个初始分组、Edges 特定部署记录不纳入通用 Tasks 预定义记忆；已删除的“初始化后先留本地”要求不得重新带入。

完成标准待后续设计讨论补充。
