---
name: reconsider_reference_memory_type
description: 探讨 Reference 类型是否多余；外链/对照可否归入 Project、User 等其它 type
metadata:
  edges-type: task
  edges-title: 重新评估 Reference memory type 是否必要
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:13.381Z"
  edges-task-project: project-memory
---

感觉 **Reference** 这个 memory type 没啥用：外链、对照资料理论上记到 Project、User 或其它各种 type 之下就好，不必单独一层 Reference。

**Why:**
peng cheng 体感：Reference 与「某项目相关外链」「某人/偏好相关外链」重叠；多一个内置 type 增加索引与心智负担。已有「reference 的 description 应带关键链接」是在**假定 Reference 仍存在**时的写法约定；本条是更上游的问题——**要不要保留这个 type**。可扩展 memory type 已支持自定义 type，更不必死守 Reference 内置位。

**How to apply:**
- 细聊：Reference 取消后，现有 `.memory/references/*` 迁到哪（project 卡片？feedback？自定义 type？）；INDEX / PROTOCOL / LAYOUT / doctor 怎么改。
- 与「reference description 带链接」的关系：若取消 type，那条改为「凡外链卡片不论落在哪 type，摘要都要带 URL」；若保留，那条仍有效。
- 交叉：`明确 .memory 与 docs/ 边界`、`memory 类型索引改为目录下 AGENTS.md`、已 done 的可扩展 memory type。
- **非目标：** 本条不直接删仓内 references；先定去留再迁。
- 未指派。派发时默认先 grill-with-docs。
