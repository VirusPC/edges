---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-25T06:01:07.584Z'
  edges-title: CLI：评测 / Experiment Webhook 服务启动入口
  edges-tasks-status: backlog
  edges-task-priority: none
name: cli评测_experiment_webhook_服务启动入口
description: edges CLI 提供启动评测相关长驻服务（含 Experiment Webhook）的入口，接入方不必手写 systemd 命令。
---
**背景：**
评测能力拆成 Skill→Dataset 与 实验程序+Webhook→跑实验 后，还缺一层给接入方的启动面：用 edges CLI 起服务，而不是只靠脑仓 ops/systemd 示例。与 artifacts-preview 的 `edges artifacts` 客户端类似，这里要的是「服务怎么被拉起来」。
- 非目标：不实现 Webhook 业务本身、不做 Dataset 收集 skill（见兄弟卡）。
- 关联：母卡 `2026-10-25--框架附带可接入评测能力含-Experiment-Webhook-适配层`；兄弟卡「评测实验程序+Webhook」「评测 Skill→Dataset」。

**目标：**
框架 CLI 提供评测 / Experiment Webhook 等长驻服务的启动入口，让接入方能用统一命令在本机或部署机拉起服务。

（动作与完成标准待 grill-with-docs 补。）
