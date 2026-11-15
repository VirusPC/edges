---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-15T09:19:34.157Z'
  edges-title: .edges 下支持自定义材料类别（如 plan、决策点）
  edges-tasks-status: backlog
  edges-task-priority: high
name: edges_下支持自定义材料类别如_plan决策点
description: 现在 .edges 下只有内置类别，plan、决策点这类材料没有对应位置。目标是让使用者在 .edges 下声明自己的类别，并按统一规则存放、登记和查找。
---
**背景：**
2026-11-15 讨论各类文件之间能否有内容包含关系（比如 tasks、projects 里包含 notes，routines 里包含 skills）。核对后确认 Project 已经能包含 notes、tasks、memory、skills、routines 和子 Project（ADR 0052）。接着用户提出记一张高优卡：.edges 下要支持自定义类别，例如用来记录 plan、决策点。
- 现状：.edges 下的类别是内置的 notes、tasks、projects、memory、skills、routines，没有让使用者自己加类别的途径。
- 现状：Memory 已经能用 `edges memory add-type` 登记自定义 Memory Type，但那是 memory 内部的类型，不是和 tasks、notes 平级的类别。
- 关联：兄弟卡「增强 CLI 可扩展性：模块配置化，支持通过 CLI 添加自定义模块」（同一 Project，backlog）。两张卡方向接近，本卡更偏使用者要加的具体类别；用户确认单独开高优卡并与它关联。
- 关联：ADR 0052（Project 作为递归主题材料容器）、`edges-memory-add-type`、本次关于内容包含关系的讨论。

**目标：**
使用者可以在 .edges 下声明自定义类别（如 plans、decisions），这些类别和内置类别一样有固定的存放位置、登记方式和查找方式。

完成标准待 grill-with-docs 补。待定：自定义类别和自定义 Memory Type 的边界怎么划，决策点算哪一种；决策点和框架仓现有 `docs/adr/` 是什么关系；自定义类别是否也能放进 Project（`P/<类别>/`）和 `--super` 材料面；和兄弟卡后续是否合并实现。
