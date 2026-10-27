---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-26T03:08:51.017Z'
  edges-title: Compose：补卸载能力
  edges-tasks-status: backlog
  edges-task-priority: none
name: compose补卸载能力
description: 现在去掉 Compose 条目只能手改 README；要补一条正式卸载路径。
---
**背景：**
迁 workspace 三仓出 Compose 时发现 CLI 只有 add / list / update，没有卸载。skill 约定是手删区块再 `git submodule deinit` / `git rm`。用户要求记 todo，后面补上；命令名不一定叫 unregister，但能力必须是卸载。

**目标：**
`edges compose` 能正式卸载已登记条目（含文档/skill），不必手改区块。
