---
name: knowledge_base_observation_system
description: 为整个知识库建立 Observation 系统：能看到检索、更新与代理使用过程
metadata:
  edges-type: task
  edges-title: 知识库 Observation 系统
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-13T12:09:00+08:00"
---

为整个知识库（notes / tasks / memory 及相关产物）建 Observation 系统：能看到检索、读写、代理使用过程与异常。

**Why:**
没有 Observation 就不知道知识库实际怎么被用、哪里漏、哪里漂。这条是「看到发生了什么」，不是 Evaluation（打分 / 跑集判好坏）。可以给 Evaluation 提供跑踪与用法数据，但本身不做评测裁判。

**How to apply:**
- 先细聊观测面：检索、落盘、改状态、跨 Agent 使用、失败 / 空命中等。
- 与 Evaluation 条目分开设计：本条产 traces / logs / dashboard；Evaluation 用这些评分。
- 不要和本地 memory 可视化、数据/视图 HTML 混成同一条——那两条是看结构，本条是看运行。
- 派发时默认先 grill-with-docs。
