---
name: project_tasks_align_goal_and_loop_engineering
description: 设计或验收 tasks 时：目标+完成标准要与 /goal、loop engineering 一起想；开卡时完成标准可暂缺、grill 后补；沉淀结论时同时写清背景上下文。
metadata:
  edges-title: Tasks 核心思想：与 /goal、loop engineering 同构
  edges-type: project
  edges-origin-session-id: 6a84b2e0-9d0a-4e83-9016-0590c24dde8c
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-24T16:34:34+08:00"
---

Tasks（尤其是「目标 + 完成标准」这一截）要和 **`/goal` 命令**、**loop engineering（循环工程）** 放在同一套思路里设计与验收，而不是当成孤立的看板文案模板。开卡阶段完成标准可以暂缺，在 `grill-with-docs`（或等价细化）后再补齐，再进入可闭环的 `/goal` / 循环验收。

**Why:**
强目标 ≈ 可核验的完成契约；循环工程要把「怎样算做完」写成可观察、可证伪的条件。没有完成标准，下游循环无法闭环——但对话刚开卡时往往还没 grill 透，此时硬写完成标准容易编造。用户 2026-09-24 定稿：核心思想仍挂 goal + loop；同日又定完成标准在 `conversation-to-tasks` 开卡时可选，留到 grill 后补。

**背景上下文（用户所述 / 同日讨论）：**
- 正文迭代收成背景 → 目标 → 完成标准（动作可选），后改完成标准开卡可选。
- 调研把 agent `/goal` 与循环验收对应到「完成标准」；目标只给方向。
- 流程：成文 → 人审 → CLI 落库；人审可为对话或 PR；分支不限。
- 用户要求记核心思想时集合 goal + loop，并同时记录背景上下文；随后明确完成标准可留到 grill-with-docs。

**How to apply:**
- 设计模板或导出 `/goal`：有完成标准时用「目标 + 完成标准」当契约；没有则先 grill 再闭环，不要空契约。
- `conversation-to-tasks`：必填背景与目标；完成标准能写则写，否则省略待 grill。
- 沉淀 tasks 相关结论时附背景上下文。
- 开卡模板细节见 `project_conversation_to_tasks_body_review_persist`。
