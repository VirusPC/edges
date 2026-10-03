---
name: project_conversation_to_tasks_body_review_persist
description: 改 conversation-to-tasks 或从对话开卡时：背景→目标→动作→完成标准（后两栏可选）；必填不足先问；成文后交人审再 CLI 落库；STAR 用于制定任务非复盘。
metadata:
  edges-title: conversation-to-tasks：背景+目标必填，人审后落库
  edges-type: project
  edges-origin-session-id: local-it-asset-2026-09-27
  edges-agent-client: grok-bot
  edges-username: IT资产管理
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-27T09:23:06+08:00"
---

`conversation-to-tasks` 正文顺序：**背景 → 目标**（必填）→ **动作** → **完成标准**（后两栏可选）。流程：**成文 → 交人审 → 落库**。背景/目标依据不足先提问，不编造、不用「无」。完成标准开卡时能写就写；定不清则整栏省略，注明待 `grill-with-docs` 再补，门闩不拦。人审可为对话确认或 PR；落库用 `edges tasks create` / `update`（必要时 `status`），**不限制**是否新建分支。四栏同构 STAR（Situation/Task/Action/Result），用于制定任务尤其是派给 agent，不是写复盘——见 tasks 层 `project_star_for_agent_task_formulation`。

**Why:**
看板写入要有人闸，但落库仍在同一技能（确认后再写）。背景写「怎么谈出这张卡」便于不在场者恢复语境。目标给方向。动作写清怎么做。完成标准收在最后，是循环工程与 `/goal` 的验收核心；对话开卡时常未 grill 透，强制写出会编造，故开卡可选、grill 后补齐。动作不能顶替完成标准。2026-09-27 与 notes 主题行动指南对齐为同一顺序。

**How to apply:**
- 必填只卡背景与目标；动作、完成标准缺了不必追问。
- 成文顺序固定为背景 → 目标 → 动作 → 完成标准；有可核对验收条件就写入完成标准，否则省略并注明待 grill-with-docs。
- 未有完成标准时不要硬造 `/goal` 契约。
- 派给 agent 的 brief 同样跟此序；STAR 用途见 `project_star_for_agent_task_formulation`。
- 人审与落库、分支策略见 skill；与 `/goal`、loop 同构的总原则见 `project_tasks_align_goal_and_loop_engineering`。
