---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-31T07:27:55.464Z'
  edges-title: Memory AB 分流量开关与 Langfuse 标签评测
  edges-tasks-status: backlog
  edges-task-priority: high
name: memory_ab_分流量开关与_langfuse_标签评测
description: 支持按流量开/关 memory，Langfuse 打标签，再做离线 eval。
---
**背景：**
用户 2026-10-31 点「先全落高优 backlog，细节 grill 后补」，本卡先落高优 backlog，动作与完成标准 grill 后补。

区别于离线 worktree 消融：本卡在真实使用流量上按开关分流 memory，并在 Langfuse 打标签后做离线 eval。流量面（编码 Agent vs Grok Bot）grill 后补。调研笔记 `/workspace/scratch/research-agent-harness-eval-frameworks.md`（box scratch，未入仓）仅作 eval 关联引用。

**目标：**
实现可按流量开/关 memory 的对照，并形成带 Langfuse 标签的评测闭环。
