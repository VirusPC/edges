---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-25T06:00:24.280Z'
  edges-title: 评测 Skill：收集用户数据并产生 Dataset
  edges-tasks-status: backlog
  edges-task-priority: none
name: 评测_skill收集用户数据并产生_dataset
description: 框架附带评测 skill：在用户场景下收集数据并落到 Dataset，供后续实验消费。
---
**背景：**
母卡「框架附带可接入评测能力」拆出的第二张子卡。对话约定：Skill 收集用户数据并产生 Dataset；Webhook + 实验程序再用 Dataset 跑实验。两条解耦，本卡只覆盖 Skill → Dataset。
- 非目标：不实现 Webhook、不实现具体实验 runner（见兄弟卡）。
- 关联：母卡 `2026-10-25--框架附带可接入评测能力含-Experiment-Webhook-适配层`；兄弟卡「评测实验程序 + Experiment Webhook」。

**目标：**
框架提供评测相关 skill，使接入方能在自有场景下收集数据并产生 Dataset，作为后续实验输入。

（动作与完成标准待 grill-with-docs 补。）
