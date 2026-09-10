---
name: project_memory_tree_algorithm
description: 从算法角度看，project memory 仍是一种基于树结构的算法
metadata:
  edges-type: task
  edges-title: project memory 是树结构算法
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T17:17:00+08:00"
---

从算法角度，project memory 仍是一种基于树结构的算法。

**Why:**
目录分层、记忆入口索引、reshape / 节点增删改查，都按树的父子与路径来组织；状态与检索也依赖这棵树上的位置，而不是扁平袋或图优先的模型。

**How to apply:**
- 设计或重构 project-memory（含 reshape、原子操作）时，默认按树算法思考：遍历、挂载、剪枝、搬迁节点。
- 与「reshape 底层拆树原子操作」任务对照推进，避免另起一套非树模型却又用树形目录落盘。
