---
name: knowledge_base_evaluation_system
description: 为整个知识库建立 Evaluation 系统：能评测条目质量、覆盖与回答是否可信
metadata:
  edges-type: task
  edges-title: 知识库 Evaluation 系统
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:12.057Z"
  edges-task-project: evaluation
---

为整个知识库（notes / tasks / memory 及相关产物）建 Evaluation 系统：能对条目质量、缺口、回答可信度打分或跑集。

**Why:**
知识库在长，没有 Evaluation 就只能靠体感。这条是「怎么判这库好不好」，不是 Observation（看实际怎么被用）。与 backlog「找公开 benchmark 证明 memory 有效性」相关但更宽：benchmark 是可用的外部标尺，本条是仓内评测系统本身。

**How to apply:**
- 先细聊评测对象（笔记 / task / memory / 检索回答）、指标与金标出处。
- 与 Observation 条目分开设计：Observation 产跑踪与使用记录，Evaluation 用这些数据和金标打分。
- 公开 memory benchmark 可以当评测源之一，不要把本条混成只找公开集。
- 派发时默认先 grill-with-docs。
