---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-20T16:40:07.691Z'
  edges-title: 任务状态流转时 CLI 自动追加进展段落
  edges-tasks-status: todo
  edges-task-priority: none
  edges-task-assignee: 全栈开发专家
name: 任务状态流转时 CLI 自动追加进展段落
description: 任务状态流转时 CLI 自动追加进展段落
---
## 背景

现在卡上的结果靠人手在「进展」段补写，容易漏。希望做成 CLI 固定流程。

## 目标

`edges tasks` 变更状态时，自动在卡正文追加一段记录（至少含时间与状态变化，可带结果、PR 等）。

## 前提

- 已定做成 CLI 固定流程、状态流转时追加段落。
- 段落格式、哪些流转必填结果、参数形态 grill 时定。

细节 grill 后补。
