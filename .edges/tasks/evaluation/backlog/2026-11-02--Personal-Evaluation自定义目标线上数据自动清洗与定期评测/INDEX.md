---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-11-01T16:51:16.972Z'
  edges-title: Personal Evaluation：自定义目标、线上数据自动清洗与定期评测
  edges-tasks-status: backlog
  edges-task-priority: urgent
name: personal_evaluation自定义目标线上数据自动清洗与定期评测
description: 结合通用评测框架，让用户自由定义 eval 目标，自动清洗个人线上会话数据，并设置 Routine 定期评测。
---
**背景：**

Personal Evaluation 是 Edges 的关键价值之一：围绕用户自己的会话、任务与判断标准，评估 Agent 和 harness 是否真正帮助了日常工作，而不只参考通用 benchmark。

仓库已提供多种编码 Agent 与 Grok Bot 等 personal agent 的 Langfuse 接入说明，并有记忆消融、仓库检索等具体评测用例。下一步需要结合通用评测框架，将个人线上会话数据与用户自定义的评测目标连接起来，形成持续反馈：分析日常工作、判断 harness 是否有效，以及发现可能过时、需要更新或拆除的 harness 内容。

**目标：**

结合通用评测框架，让用户方便、自由地定义 eval 目标与判断标准；系统根据目标自动清洗线上会话数据、准备评测输入，并设置 Routine 定期执行评测，帮助用户持续度量和改进自己的 Agent 使用方式与 harness。

具体框架、数据清洗规则、调度频率与完成标准留待后续细化。

**关联任务：**

[知识库 Evaluation 系统：先做 edges 自有记忆问答评测](../2026-09-13--知识库Evaluation系统/INDEX.md) 聚焦记忆问答的具体评测用例；本任务关注用户自定义目标、线上数据处理和定期评测的通用闭环。
