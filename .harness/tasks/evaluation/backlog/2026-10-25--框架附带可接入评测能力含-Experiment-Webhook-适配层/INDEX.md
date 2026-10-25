---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-25T06:01:23.776Z'
  edges-title: 框架附带可接入评测能力（含 Experiment Webhook 适配层）
  edges-tasks-status: backlog
  edges-task-priority: none
name: 框架附带可接入评测能力含_experiment_webhook_适配层
description: AGIS/Edges 附带评测能力总目的卡。子卡：① 实验程序+Webhook；② Skill→Dataset；③ CLI 服务启动入口。
---

**背景：**
合完脑仓 [#378](https://github.com/VirusPC/edges-brain-viruspc/pull/378) 后，讨论框架附带评测能力。总目的：让接入方看见系统在自有场景下变好还是变坏。落地拆成三条解耦链路：Skill 收集数据→Dataset；实验程序 + Webhook 用 Dataset 跑实验；CLI 提供服务启动入口。本卡保留总目的。
- 子卡：`2026-10-25--评测实验程序-Experiment-Webhook用-Dataset-跑实验`
- 子卡：`2026-10-25--评测-Skill收集用户数据并产生-Dataset`
- 子卡：`2026-10-25--CLI评测-Experiment-Webhook-服务启动入口`
- 关联：brain #378；框架 #30；#31；PR #32。

**目标：**
Edges 框架附带一套可接入的评测能力，让使用方能对照自有场景判断价值。落地拆为 Skill→Dataset、Webhook+实验程序→跑实验、CLI 服务启动入口。
