---
name: project_evaluation_observation_placeholder_projects
description: 改评测/观测看板分组或往 knowledge/tasks/evaluation|observation 落卡时打开：用户把原 Evaluation 桶拆成两个空壳质心；现有相关卡仍留 _default，等 classify/#78 再迁。仓根 evaluation/ 不是看板 project。
metadata:
  edges-title: Evaluation 与 Observation 拆成两个 Task Project 占位
  edges-type: project
  edges-origin-session-id: bc-a9eb3ef9-a105-5d64-aecb-d6fa0cc4f741
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T04:52:39+00:00"
---

用户把原先混在一起的 Evaluation 桶拆成两个 Task Project 占位：`evaluation`（评测与可重复 cases）与 `observation`（观测/观察系统）。当前只建轻量 AGENTS.md 与空状态夹，不迁 `_default` 里的既有卡。

**Why:**
2026-09-17 用户明确要求先开空壳质心，等 classify / #78 的 project CLI 再整理归属。仓根 `evaluation/` 是评测系统工作区，不是看板 Task Project。

**How to apply:**
- 新开评测或观测工作项可以落到对应 project；现有 `_default` 卡先不动。
- 不要对 `knowledge/tasks/evaluation/` 或 `observation/` 跑 `project-memory-init`（只要轻量 AGENTS.md）。
- 不要手改根 `knowledge/tasks/AGENTS.md` 的 Task Projects 节（#78 CLI 维护；本轮未写该节）。
- 不要把仓根 `evaluation/` 当成看板 project，也不要在本轮实现 classify 或合并 #78/#79。
