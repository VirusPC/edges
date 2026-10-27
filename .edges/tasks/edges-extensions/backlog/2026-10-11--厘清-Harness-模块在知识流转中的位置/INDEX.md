---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-11T15:02:52.919Z'
  edges-title: 厘清 Harness 模块在知识流转中的位置
  edges-tasks-status: backlog
  edges-task-priority: none
name: 厘清_harness_模块在知识流转中的位置
description: Harness 模块在增多，但各模块在知识流转里该站哪一格还不够清楚。要把这条流转关系设计清楚，让新模块也能对号入座，而不是各自堆目录。
---
**背景：**
今天对话里用户先说，Harness 模块越来越多，需要仔细设计它们之间的流转关系。随后用户纠正：不是「谁触发谁」那种命令或事件链，而是潜意识里这些东西本就该有一套知识流转关系；README 里最初写的内容是底子，模块逐步扩充后，要给新模块找到合适的位置。
- 相关现状可核对：根 README 把路径写成「海量经验知识从不同端捕获到仓库 → 提炼成可复用判断（Edge）→ 再变成博客、播客、视频、PPT 等对外资料」；表里把 `notes/`、`projects/`、`teaching/` 标成知识生产，把 `.edges/` 标成维护记忆、技能、评测与观测。`CONTEXT.md` 也把 Note / Edge、维护知识、知识资产、任务进度与评测结果分属各模块等说法写进了术语。
- 现状缺口：`.edges` 下已有 `memory`、`notes`、`projects`、`skills`、`tasks`、`evaluation`、`observation` 等组成，后加的模块与这条知识流转如何对位，还没有统一写清。
- 兄弟卡「增强 CLI 可扩展性：模块配置化…」管的是怎么声明、挂上模块；本卡管的是挂上之后，它在知识流转里站哪一格。
- 非目标：不设计模块间的自动触发链；本卡也不实现「加自定义模块」的配置化能力。
- 关联：上述兄弟卡；「CLI 与根 harness 补齐 notes / edges / projects / archive」；「Memory 把 Agent 行为类条目与项目知识分开」。

**目标：**
有一份可依据的说明：Harness 各模块分别对应知识流转的哪一段；新模块出现时，能对照同一套约定找到位置，而不是只按目录名堆上去。

完成标准待 grill-with-docs。grill 里建议先对齐：以 README / CONTEXT 里已有的捕获→提炼→分发、以及 Note / Edge / 维护知识等说法为底，核对现有模块各站哪格，再定缺口怎么补、产出落在 ADR 还是 README / CONTEXT。
