---
name: project_evaluation_observation_placeholder_projects
description: 改看板 Task Project 分组或往 knowledge/tasks/<slug> 落卡时打开：用户已确认七个空壳质心（project-memory、edges-tasks、edges-cli-platform、evaluation、observation、site-and-content、agent-clients-ux）；现有卡仍留 _default，等 classify/#78 再迁。仓根 evaluation/ 不是看板 project。
metadata:
  edges-title: 七个 Task Project 占位已确认
  edges-type: project
  edges-origin-session-id: bc-a9eb3ef9-a105-5d64-aecb-d6fa0cc4f741
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T04:53:38+00:00"
---

用户已确认七个 Task Project 占位作为看板质心：`project-memory`、`edges-tasks`、`edges-cli-platform`、`evaluation`、`observation`、`site-and-content`、`agent-clients-ux`。当前只建轻量 AGENTS.md 与空状态夹，不迁 `_default` 里的既有卡。

**Why:**
2026-09-17 用户先开 evaluation / observation 空壳，随后确认全部七个质心。等 classify / #78 的 project CLI 再整理归属。仓根 `evaluation/` 是评测系统工作区，不是看板 Task Project。

**How to apply:**
- 新开工作项可以落到对应 project；现有 `_default` 卡先不动。
- 不要对 `knowledge/tasks/<project>/` 跑 `project-memory-init`（只要轻量 AGENTS.md）。
- 不要手改根 `knowledge/tasks/AGENTS.md` 的 Task Projects 节（#78 CLI 维护；本轮未写该节）。
- 不要把仓根 `evaluation/` 当成看板 project，也不要在本轮实现 classify 或合并 #78/#79。
- 七个 slug 与职责：project-memory（类型/索引/reshape/与 docs 边界）；edges-tasks（看板与 Task 工作流）；edges-cli-platform（CLI/脚手架/发布/鉴权）；evaluation（评测与可重复 cases）；observation（观测，与 evaluation 分开）；site-and-content（站点/posts/badge/内容整理）；agent-clients-ux（客户端/插件/外设与本地 UX）。
