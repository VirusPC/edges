---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-25T05:56:53.535Z'
  edges-title: 框架附带可接入评测能力（含 Experiment Webhook 适配层）
  edges-tasks-status: backlog
  edges-task-priority: none
name: 框架附带可接入评测能力含_experiment_webhook_适配层
description: AGIS/Edges 应附带一套评测能力，让接入方能方便看见系统在自有场景下变好还是变坏；统一 Experiment Webhook 适配层是落地入口之一。
---
**背景：**
合完脑仓 [#378](https://github.com/VirusPC/edges-brain-viruspc/pull/378) 后，讨论怎么把 Langfuse Custom Experiment webhook 合进框架当公共对外接口。先想过整包迁到 `packages/services/`，再收敛成统一接口适配层（HTTP 入口、签名、202、job 分发；Langfuse 只是其中一个 adapter）。并确认：可复用 runner 留在 `packages/evaluation/experiments/`，个人题集与报告仍在脑仓；运维壳与个人域名不进公开仓。拍板两步走：先合 #378 落盘，再抽框架适配层。对话里进一步对清目的：直觉上 AGIS 应附带一套评测能力，让接入用户方便知道系统有没有在变好或变坏，从而看见整套系统在自己场景下的价值。本卡记录这一目的；Webhook 适配层是落地入口之一，不是最终目的本身。
- 现状：业务在脑仓 `projects/services/langfuse-experiment-webhook/`；框架已有 `packages/services/`（如 artifacts-preview）与 `packages/evaluation/experiments/`。
- 预期收益：接入方能用框架自带评测能力对照自有场景；Langfuse UI 等外部触发经统一入口调度仓内实验，不必为每个实验复制一套 HTTP 壳。
- 非目标：本卡不部署公网、不改消融/retrieval 实验逻辑、不把个人 Dataset 搬进框架。
- 关联：brain #378（`6ce8e28`）；框架 #30 evaluation 目录重整（`0acebff`）。

**目标：**
Edges 框架附带一套可接入的评测能力（含统一 Experiment Webhook 适配层），让使用方能方便地对照系统在自有场景下变好还是变坏，从而判断价值；不是只为自家 Langfuse 挂一个专用服务。

（动作与完成标准待 grill-with-docs 补。）
