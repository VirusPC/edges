---
name: feedback_classify_tasks_centroids_not_embeddings
description: 写或改 project-tasks-classify / classifyTasks 时：按用户已设 Task Project（标题+描述）做归属建议，用 LLM / agent 判断；不要写成 Embedding-based 最近质心分类，不要要求 embedding，也不要把方法名写成 K-means。Embedding / 真向量分类另卡。缘起 https://github.com/VirusPC/edges/pull/78。
metadata:
  edges-title: classifyTasks 按已有质心归类，不要求 embedding
  edges-type: feedback
  edges-origin-session-id: bc-db072a0c-c236-52dd-84cf-6588495c573c
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T03:50:19+00:00"
---

写或改 `project-tasks-classify` / classifyTasks 时，按用户已设 Task Project（标题 + 描述）做整板归属建议，用 LLM / agent 判断；不要写成 Embedding-based 最近质心分类，不要要求 embedding，也不要把方法名写成 K-means。

**Why:**
2026-09-17 peng cheng 对 PR #78 决定：撤回刚写上的 Embedding-based 最近质心分类文档/Skill 改写；embedding / 真向量分类另卡。质心仍是人预先设定的 project 描述，工作流仍是出建议表等人改再经 CLI 落地。

**How to apply:**
- Skill、CONTEXT、ADR 0010、计划与记忆用「按已有质心归类 / LLM 或 agent 判断」，不要要求向量，也不要把本轮方法名写成 K-means。
- `project create` 只在人先显式补新质心之后；apply 仍走 `update --project`。
- 不要加仓内 embedding 库，也不要公开 `edges tasks classify`。
