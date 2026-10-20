---
name: recommend_related_tasks_and_ask_deps
description: 每次记录 task 时推荐相关条目并提问依赖，逐步建出依赖 graph
metadata:
  edges-type: task
  edges-title: 落盘时推荐相关 task 并问依赖
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:12.416Z"
  edges-task-project: edges-tasks
---

每次记录 task 时，推荐相关的已有 task，并提问依赖关系。这样每加一个节点就能补一部分依赖，逐步建成 task 依赖 graph，用来指导处理顺序。

**Why:**
现在条目是平的 backlog，靠人脑记先后。落盘当下最容易想起「和哪条有关、谁先谁后」；错过就难补。依赖 graph 不是事后大扫除，而是每次加节点时攒出来的。

**How to apply:**
- 落盘流程加一步：根据标题/正文检索相近 task，推荐候选；问阻塞谁 / 被谁阻塞 / 仅相关。
- 依赖字段与看板约定细聊（frontmatter 边、还是 sidecar）；要能导出/可视化顺序。
- 与 conversation-to-task skill、tasks CLI、需求优先级、按需求分组交叉，不另起一套看板。
- 未指派。派发时默认先 grill-with-docs。
