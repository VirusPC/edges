---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-25T11:49:36.606Z'
  edges-title: 评测实验程序 + Experiment Webhook（用 Dataset 跑实验）
  edges-tasks-status: done
  edges-task-priority: none
name: 评测实验程序_experiment_webhook用_dataset_跑实验
description: >-
  实验 runner + 统一 Experiment Webhook：JSON 注册表路由，首挂
  harness_memory_ablation；验签/202/超时；回写 Langfuse+本地 reports；本机 CLI 隧道真联调。
---

**背景：**
母卡「框架附带可接入评测能力」拆出的第一张子卡。两条解耦链路：Skill → Dataset；本卡 = 实验程序 + Webhook 用 Dataset 跑实验。脑仓 #378 已有原型；框架 #30 已整理 `packages/evaluation/experiments/`。
- 非目标：不做 Skill 收集数据（见兄弟卡）；CLI 启服务见第三张子卡（本卡真联调可用本机 CLI 隧道）。
- 关联：母卡 `2026-10-25--框架附带可接入评测能力含-Experiment-Webhook-适配层`；brain #378；`harness_memory_ablation`。

**目标：**
框架内具备可复用实验 runner 与统一 Experiment Webhook：外部（先支持 Langfuse Custom Experiment）按 experiment/dataset 名路由并跑实验；首挂 `harness_memory_ablation`。

**动作：**
1. 新建 `packages/services/experiment-webhook/`：Langfuse 官方验签（开发模式可关）、立刻 202、进程内调 runner、超时可配置（默认 10min）。
2. JSON 配置注册表：experiment/dataset 名 → runner 模块；支持多实验挂载。
3. 注册并薄适配 `harness_memory_ablation`（从 webhook / Dataset item 调到现有 runner；本地 cases 不是 Langfuse Dataset，需适配层）。
4. 结果回写 Langfuse experiment run/scores，并写本地 `packages/evaluation/reports/`。
5. 单测：验签、注册表路由、超时失败路径；本地伪造 payload 打通一次；本机 CLI 起服务 + 隧道对自建 Langfuse 真发一次 Custom Experiment。
6. 跟进：脑仓 #378 改为薄包装/配置，逐步去掉重复实现（可同批或紧随 PR）。

**完成标准：**
- [x] `packages/services/experiment-webhook/` 可启动，验签与开发关签行为符合约定
- [x] JSON 注册表能按名路由；至少挂上 `harness_memory_ablation`
- [x] 伪造 payload 端到端跑通（202 → runner → 回写路径有记录）
- [x] 结果同时可见于 Langfuse 与本地 reports（真联调路径）
- [x] 自建 Langfuse 经本机 CLI 隧道真触发一次成功或失败有可诊断日志
- [ ] 脑仓薄包装跟进 PR 已开（或本卡注明阻塞原因）
