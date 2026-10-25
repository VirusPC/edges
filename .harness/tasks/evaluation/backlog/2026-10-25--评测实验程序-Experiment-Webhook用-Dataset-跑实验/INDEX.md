---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-25T06:00:15.532Z'
  edges-title: 评测实验程序 + Experiment Webhook（用 Dataset 跑实验）
  edges-tasks-status: backlog
  edges-task-priority: none
name: 评测实验程序_experiment_webhook用_dataset_跑实验
description: 把可复用实验 runner 与统一 Experiment Webhook 收进框架：Webhook 用用户 Dataset 触发并跑实验。
---
**背景：**
母卡「框架附带可接入评测能力」拆出的第一张子卡。对话约定两条解耦链路：Skill 负责收集用户数据并产生 Dataset；Webhook（加实验程序）负责用 Dataset 跑实验。本卡只覆盖后者。脑仓 #378 已有 Langfuse webhook 原型；框架 #30 已整理 `packages/evaluation/experiments/`。
- 非目标：不做「从对话/场景收集数据成 Dataset」的 skill（见兄弟卡）。
- 关联：母卡 `2026-10-25--框架附带可接入评测能力含-Experiment-Webhook-适配层`；brain #378；兄弟卡「评测 Skill → Dataset」。

**目标：**
框架内具备可复用的实验程序，以及统一 Experiment Webhook：外部（先支持 Langfuse）用用户自己的 Dataset 触发并跑对应实验。

（动作与完成标准待 grill-with-docs 补。）
