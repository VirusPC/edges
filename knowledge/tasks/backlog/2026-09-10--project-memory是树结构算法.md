---
name: project_memory_tree_algorithm
description: 整体从树理解 memory；不同 type 只是不同节点；与 page index 相通
metadata:
  edges-type: task
  edges-title: project memory 是树结构算法
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T13:11:00+08:00"
---

整体都从树的角度去理解 memory。不同的 type 也只是不同的节点。从算法角度看，project memory 仍是一种基于树结构的算法；并与 page index「先建树再在节点上问」有相通之处。

**Why:**
目录分层、记忆入口索引、reshape / 节点增删改查，都按树的父子与路径来组织。把 type 看成树上的一类节点（或节点上的标签/形态），而不是平行于树的另一套配置平面，扩展 type 就不会长成「类型表 + 文件树」双真相源。page index 同样用层级索引把内容拆成可定位节点再检索。

**How to apply:**
- 设计或重构 project-memory（含 reshape、原子操作、可扩展 type）时，默认按树算法思考：遍历、挂载、剪枝、搬迁节点；新增 type ≈ 在约定位置挂一种新节点，而非先上独立 JSON 类型表。
- 与「reshape 底层拆树原子操作」「可扩展 memory type（目录+skill）」对照推进。
- 细聊/深研时可对照 page index 的定位与检索模式。
