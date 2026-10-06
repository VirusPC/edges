---
name: feedback_harness_markers_not_task_project_indexes
description: >-
  解释或改 AGENTS.md 层标记时：project-harness 代表 git
  项目上的系统二层入口；.harness/tasks/<project>/AGENTS.md 这类 Task Project
  索引已经在系统二材料里，不该再套同一套标签。不要用「每个 InternalNode 都是一份系统二」来解释。
metadata:
  edges-title: project-harness 标记不贴在系统二材料索引上
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T14:39:58+00:00'
---

`project-harness` 区域代表给一个 git project 搭建的系统二层入口。`.harness/` 是这份系统二的材料目录，不是另一套入口形状；其中 Task Project 的 `AGENTS.md` 只做任务分组索引。用户 2026-10-06 指出：`.harness/tasks/edges-cli-platform/AGENTS.md` 上的 `project-harness-local` 是语义泄漏。

**Why:** 上一轮把层标记从 `project-memory` 改成 `project-harness` 时，codec 把凡是 InternalNode 的 `AGENTS.md` 都当成层入口重写。这个文件因此带上了系统二标签，正文却只是任务清单。用「每个有 AGENTS.md 的节点都有一份系统二」来解释，会和「Project Harness 是 git 项目上的系统二、`.harness/` 是材料目录、检索系统二不自动进入其系统二」打架。

**How to apply:** 读到 `.harness/tasks/<project>/AGENTS.md` 上的 `project-harness-*` 时，不要把它解释成又一份 git 项目系统二。类型入口继续用 `project-memory-type` / `project-memory-entries`。在用户确认改 codec 之前，不要自行剥掉这些标签或换成另一套前缀。
