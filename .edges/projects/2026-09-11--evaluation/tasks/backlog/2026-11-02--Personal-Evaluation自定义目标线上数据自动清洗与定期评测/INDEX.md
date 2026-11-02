---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-01T17:17:24.787Z'
  edges-title: Evaluation：自定义目标、线上数据自动清洗与定期评测
  edges-tasks-status: backlog
  edges-task-priority: urgent
name: evaluation自定义目标线上数据自动清洗与定期评测
description: 结合通用评测框架，围绕被 harness 的目录自定义目标，自动清洗相关线上会话数据，并通过 Routine 定期评测。
---

**背景：**

讨论 README 时，用户强调评测需要验证 harness 是否真正有用，随后澄清通用表述应围绕被 harness 的目录及其目标。代码模块、Skill 和个人大脑可以有不同的目标、材料和判断标准；只有当 Edges 用于个人大脑时，这个具体用例才称为 Personal Evaluation。

仓库已提供多种编码 Agent 与 Grok Bot 等 personal agent 的 Langfuse 接入说明，并有记忆消融、仓库检索等具体评测用例。下一步需要结合通用评测框架，将相关线上会话数据与用户自定义的评测目标连接起来，形成持续反馈：分析实际工作、判断 harness 是否有效，以及发现可能过时、需要更新或拆除的 harness 内容。

**目标：**

结合通用评测框架，让用户为被 harness 的目录自由定义评测目标与判断标准；系统根据目标自动清洗相关线上会话数据、准备评测输入，并设置 Routine 定期执行评测，帮助用户持续度量和改进 Agent 使用方式与 harness。个人大脑中的 Personal Evaluation 是这项能力的一个用例。

具体框架、数据清洗规则、调度频率与完成标准留待后续细化。

**关联任务：**

[知识库 Evaluation 系统：先做 edges 自有记忆问答评测](../2026-09-13--%E7%9F%A5%E8%AF%86%E5%BA%93Evaluation%E7%B3%BB%E7%BB%9F/INDEX.md) 聚焦记忆问答的具体评测用例；本任务关注用户自定义目标、线上数据处理和定期评测的通用闭环。
