---
name: classify_tasks_into_edges_cli_needs_embedding
description: 探讨：把 classify 逻辑沉到 edges tasks CLI（需 embedding）；无 embedding 前不做
metadata:
  edges-type: task
  edges-title: classify 沉到 edges tasks CLI（需 embedding，探讨）
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T03:20:00+08:00"
---

探讨：把 Task Project **classify** 逻辑沉到 `edges tasks` CLI（依赖 embedding）。**无 embedding 能力前先不做。**

**Why:**
整理/classify grill **Q8** 现定为 skill 编排 + `project` CLI 元数据。peng cheng 希望 classify 尽量进 CLI，但缺 embedding 时硬塞 CLI 只会做成空壳或再调 LLM 绕一圈。本条记「目标形态 + 前置条件」，不当前实现项。

**How to apply:**
- 前置：仓内/CLI 可用的 embedding（模型、缓存、费用与可复现）。
- 目标：`edges tasks`（或子命令）能跑 classify / 建议归属；skill 变薄编排，不把算法只留在对话里。
- **现在不做：** 无 embedding 就实现 CLI classify。
- **交叉但不合并：**
  - in_progress：`整理 _default project tasks 的 skill`（当前 skill 编排路径）
  - backlog：`交互式主题聚类`（含真 embedding+K-means 补记）
  - backlog：`edges tasks 的 Skill + MCP 封装`（通用薄封装，不是 classify 算法）
- 未指派。有 embedding 方案后再 grill-with-docs。
