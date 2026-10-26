---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-26T16:09:30.377Z'
  edges-title: 框架附带可接入评测能力（含 Experiment Webhook 适配层）
  edges-tasks-status: done
  edges-task-priority: none
name: 框架附带可接入评测能力含_experiment_webhook_适配层
description: AGIS/Edges 附带评测能力总目的卡。链路：Skill→Dataset → Webhook+实验程序跑实验 → CLI 启服务。子卡三张解耦落地。
---

**背景：**
合完脑仓 [#378](https://github.com/VirusPC/edges-brain-viruspc/pull/378) 后，讨论框架附带评测能力。总目的：让接入方看见系统在自有场景下变好还是变坏。本卡保留总目的与整条链路；落地拆三张子卡。
- 子卡：`2026-10-25--评测实验程序-Experiment-Webhook用-Dataset-跑实验`
- 子卡：`2026-10-25--评测-Skill收集用户数据并产生-Dataset`
- 子卡：`2026-10-25--CLI评测-Experiment-Webhook-服务启动入口`
- 关联：brain #378；框架 #30；#31；#32。

**目标：**
Edges 框架附带一套可接入的评测能力，让使用方能对照自有场景判断价值。

**整条链路：**

1. **Skill → Dataset**  
   评测 Skill 从用户真实用法收数据，整理成可复跑 Dataset（输入、期望/标注、场景标签）。

2. **Dataset → 跑实验**  
   实验程序读 Dataset；Langfuse Custom Experiment 经 **Experiment Webhook 适配层**（验签、202、派任务）触发同一套 runner，产出可比对的结果/分数。

3. **CLI → 启服务**  
   `edges` CLI 提供本地/本机启动入口，把 Webhook（及所需配套）拉起来，便于开发与自托管，不必依赖脑仓部署脚本。

**拆仓约定：**
- 框架仓：Skill 模板、runner、Webhook 适配层（`packages/services/`）、CLI 启动入口。
- 脑仓 / 用户侧：自有 Dataset、场景配置、报表、隧道与域名。
- 顺序：先合脑仓 #378（已合），再从业务实现抽统一适配层进框架。

报表落盘与指标定义挂在「实验程序 + Webhook」子卡，不另开第四张。

**收口（2026-10-26）：**
三张子卡都已落到 `evaluation/done/`，本卡按拆卡约定收口。Skill→Dataset 子卡落地的是 Langfuse 接入 skills（主入口 + 四份）随包分发；从 trace 生成 Dataset 按该子卡不在范围内。实验程序 + Experiment Webhook、CLI 启服务两张此前已 done。
