---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-17T10:19:39.076Z'
  edges-title: 把日复盘沉淀为 dream 机制
  edges-tasks-status: backlog
  edges-task-priority: medium
name: 把日复盘沉淀为_dream_机制
description: 把已在跑的日复盘例程（每天回看对话、挑出值得沉淀的内容、交人确认后入库）提炼成 Edges 框架里通用的 dream 机制。
---
**背景：**
2026-11-17，peng cheng 在任务记录员对话里提出：把日复盘沉淀为 dream 机制。
- 现状：日复盘是 Grok Bot 上的一个助手例程，每天 5:00（Asia/Shanghai）回看过去 24 小时各助手的对话，按仓库根 AGENTS.md 判断哪些该沉淀为笔记、任务或记忆，先交 peng cheng 确认再入库；成果在个人大脑 `retrospectives/daily/` 下。它目前只是个人用法，没有沉淀进框架。
- 框架里已有 dream 的定义（CONTEXT.md「dream」词条，见 ADR 0034）：从工作空间的 Compose block 入口自下而上整理组合树，合并删除记忆、清理目录、刷新 name / description，把可跨项目复用的内容经 PR 提升到上层仓库；每 24 小时检查一次，主分支有新提交才跑。但还没有可跑的实现。
- 预期收益：日复盘已经跑出来的做法（定时回看、按 AGENTS.md 判断、人确认后入库）可以成为 dream 的第一个可跑版本，不用从零设计。
- 关联：[dream — 自动整理对话记忆并产生知识](../2026-09-27--dream-自动整理对话记忆并产生知识/INDEX.md)（同 Project，偏「对话记忆→知识」）；个人大脑里的 urgent 卡「建立产物间自动流转的 dream 机制」（memory、notes、edges、posts 之间的流转）；edges 下的「将 edges 拆为主框架和 personal harness 扩展」（内置 routine 可能属于 personal harness）。

**目标：**
日复盘的做法沉淀成 Edges 的 dream 机制：有可加载的 Skill 或例程定义，任何 scope 都能按同一套规则定期回看材料、整理并经人确认（或 PR）后入库，日复盘改为调用这套机制。

**待定问题（出栈前 grill-with-docs）：**
- 日复盘的输入是对话记录，CONTEXT.md 里的 dream 输入是组合树里的已有材料，两者怎么合到一起，还是分成两个阶段。
- dream 放进框架核心，还是放进 personal harness 扩展。
- 和现有两张 dream 卡是合并、拆分还是互为前后置。
