---
name: feedback_classify_tasks_ncc_not_clustering
description: 写或改 project-tasks-classify / classifyTasks 时：方法是 Embedding-based NCC，质心由用户预先设定；不要写成聚类发现或迭代更新质心。缘起 https://github.com/VirusPC/edges/pull/78。
metadata:
  edges-title: classifyTasks 是 NCC，不是发现簇
  edges-type: feedback
  edges-origin-session-id: bc-9bef6b65-c2fe-5e7c-a2fe-3006e85b01e8
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T03:36:36+00:00"
---

写或改 `project-tasks-classify` / classifyTasks 时，方法名是 Nearest Centroid Classifier（最近质心分类器，NCC），具体为 Embedding-based Nearest Centroid Classification；质心由用户预先设定，Skill 只做最近质心归类。

**Why:**
2026-09-17 peng cheng 纠正 PR #78：Task Project 与描述 / AGENTS.md 已经存在，工作流是分类到已有质心，不是迭代发现簇。把 Skill 写成聚类会诱导 agent 自动长新质心或重算中心。

**How to apply:**
- Skill、CONTEXT、ADR 0010、计划与记忆用 NCC / 最近质心分类，不要写聚类发现。
- `project create` 只在人先显式补新质心之后；apply 仍走 `update --project`。
- embedding 写成宿主 / runtime 能力，不要加仓内库，也不要公开 `edges tasks classify`。
