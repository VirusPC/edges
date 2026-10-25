---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-25T06:00:46.470Z'
  edges-title: 框架附带可接入评测能力（含 Experiment Webhook 适配层）
  edges-tasks-status: backlog
  edges-task-priority: none
name: 框架附带可接入评测能力含_experiment_webhook_适配层
description: AGIS/Edges 附带评测能力总目的卡。已拆两子卡：① 实验程序+Webhook（Dataset→跑实验）；② Skill（收集数据→Dataset）。
---

**背景：**
合完脑仓 [#378](https://github.com/VirusPC/edges-brain-viruspc/pull/378) 后，讨论怎么把 Langfuse Custom Experiment webhook 合进框架当公共对外接口，并收敛成统一适配层。对话对清总目的：AGIS/Edges 应附带一套评测能力，让接入方看见系统在自有场景下变好还是变坏。进一步拆成两条解耦链路：Skill 收集用户数据并产生 Dataset；实验程序 + Webhook 用 Dataset 跑实验。本卡保留总目的，执行拆到两张子卡。
- 子卡：`2026-10-25--评测实验程序-Experiment-Webhook用-Dataset-跑实验`
- 子卡：`2026-10-25--评测-Skill收集用户数据并产生-Dataset`
- 关联：brain #378（`6ce8e28`）；框架 #30（`0acebff`）；任务卡 PR #31。

**目标：**
Edges 框架附带一套可接入的评测能力，让使用方能方便地对照系统在自有场景下变好还是变坏，从而判断价值。落地拆为 Skill→Dataset 与 Webhook+实验程序→跑实验两条链路。
