---
name: project_memory_tree_algorithm
description: 从算法角度看，project memory 仍是一种基于树结构的算法；与 page index 有相通之处
metadata:
  edges-type: task
  edges-title: project memory 是树结构算法
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T17:33:00+08:00"
---

从算法角度，project memory 仍是一种基于树结构的算法；并与 page index 算法有相通之处。

**Why:**
目录分层、记忆入口索引、reshape / 节点增删改查，都按树的父子与路径来组织；状态与检索也依赖这棵树上的位置，而不是扁平袋或图优先的模型。page index 同样用层级/路径化索引把长文档拆成可定位节点再检索——两边都是「先建树（或树状索引），再在节点上问」而不是整袋向量一把梭。

**How to apply:**
- 设计或重构 project-memory（含 reshape、原子操作）时，默认按树算法思考：遍历、挂载、剪枝、搬迁节点。
- 与「reshape 底层拆树原子操作」任务对照推进，避免另起一套非树模型却又用树形目录落盘。
- 细聊/深研时可对照 page index：哪些检索与定位模式可以直接借到 project-memory 树上。
