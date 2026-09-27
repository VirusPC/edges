---
name: project_star_for_agent_task_formulation
description: 写/派 agent 任务时用 STAR 同构排正文（背景→目标→动作→完成标准）；不要拿 STAR 写复盘。
metadata:
  edges-title: STAR 用来制定任务（尤其给 agent），不是复盘
  edges-type: project
  edges-origin-session-id: local-it-asset-2026-09-27
  edges-agent-client: grok-bot
  edges-username: IT资产管理
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-27T09:23:06+08:00"
---

制定（尤其是派给 agent 的）任务时，用 STAR 同构来排正文：背景（Situation）→ 目标（Task）→ 动作（Action）→ 完成标准（Result）。这是开卡与下发 brief 的写法，不是用来写复盘笔记。

**Why:**
2026-09-27 用户明确：STAR 与 task 场景、agent 场景结合，是为了「制定任务」，特别是 for agent 的任务；不要拿它去套复盘。标准放最后，执行者（人或 agent）先知道语境与目标、再看怎么做、最后用可核对条件收口。笔记主题行动指南与 `conversation-to-tasks` 同序，便于从笔记平移开卡，再交给 agent 执行。

**How to apply:**
- 写/改派给 agent 的任务卡或 brief：跟 `conversation-to-tasks` **1.2.0**（背景 → 目标 → 动作 → 完成标准）；完成标准优先可被命令或明确观察证伪。
- 从笔记开卡：主题行动指南的背景/核心问题/核心解决方案/验收标准分别对到上列四栏，勿把 STAR 写进「过程」「所学」当复盘模板。
- 复盘仍走 `conversation-to-notes`；不要把 STAR 四段当成笔记主结构。
- 细节见 skill；开卡门闩与人审落库见仓根 `project_conversation_to_tasks_body_review_persist`。
