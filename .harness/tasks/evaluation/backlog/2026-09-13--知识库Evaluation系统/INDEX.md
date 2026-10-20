---
name: knowledge_base_evaluation_system
description: 用 edges 自有内容出可复跑的问答评测集，对照 Edges 项目记忆与无记忆、全文检索的差异。
metadata:
  edges-type: task
  edges-title: 知识库 Evaluation 系统：先做 edges 自有记忆问答评测
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: '2026-10-11T10:05:59.576Z'
  edges-task-project: evaluation
---

**背景：**
2026-10-11 盘点评测进度时，peng cheng 指出现有评测只是拿官方数据跑了 LoCoMo、MemoryBench 的小冒烟，没有真正评测这个仓库。讨论后确认，这两个 benchmark 用的是公开对话数据，测的是「模型加检索」的通用能力，测不到 edges 的笔记、ADR 和记忆好不好用，ADR 0008 也规定冒烟结果不能当作证明。因此把「用仓库自己的内容出题」定为本卡的第一刀，不另开近义新卡。
- 现状：`packages/evaluation/` 只有官方冒烟，没有一道 edges 自有的题，也没有标准答案。
- 非目标：不做写代码类任务的评测，那部分归「SWE-ContextBench 主评测」；不替代公开 benchmark，它们只作对外参照。
- 关联：「SWE-ContextBench 主评测」「evaluation-cases 登记可重复用例」、ADR 0008。

**目标：**
有一套从 edges 自有内容出的、可以重复跑的问答评测集，能对照出 Edges 项目记忆比不给记忆、只做全文检索强在哪、弱在哪。

**动作：**
- 从 notes、ADR、`.harness/memory` 里出 peng cheng 实际会问的问题，每题配好标准答案和出处路径。
- 分三组对照：不给记忆、只做全文检索、走 Edges 项目记忆。
- 能用规则判的部分（出处有没有引对）用脚本判，判断不了的用模型当裁判打分；运行 trace 打进自建的 Langfuse。

（完成标准待 grill-with-docs 补，本栏省略。）
