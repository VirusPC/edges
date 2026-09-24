---
name: project_conversation_to_tasks_body_review_persist
description: 改 conversation-to-tasks 或从对话开卡时：背景→目标必填；完成标准与动作可选（完成标准可留到 grill-with-docs）；必填不足先问；成文后交人审再 CLI 落库；不限制是否新建分支。
metadata:
  edges-title: conversation-to-tasks：背景+目标必填，人审后落库
  edges-type: project
  edges-origin-session-id: 6a84b2e0-9d0a-4e83-9016-0590c24dde8c
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-24T16:34:34+08:00"
---

`conversation-to-tasks` 正文：**背景 → 目标**（必填）；**完成标准**、**动作**可选。流程：**成文 → 交人审 → 落库**。背景/目标依据不足先提问，不编造、不用「无」。完成标准开卡时能写就写；定不清则整栏省略，注明待 `grill-with-docs` 再补，门闩不拦。人审可为对话确认或 PR；落库用 `edges tasks create` / `update`（必要时 `status`），**不限制**是否新建分支。

**Why:**
看板写入要有人闸，但落库仍在同一技能（确认后再写）。背景写「怎么谈出这张卡」便于不在场者恢复语境。目标给方向。完成标准仍是循环工程与 `/goal` 的验收核心，但对话开卡时常未 grill 透，强制写出会编造；故开卡可选、grill 后补齐。动作同理可选且不能顶替完成标准。

**How to apply:**
- 必填只卡背景与目标；完成标准、动作缺了不必追问。
- 有可核对验收条件就写入完成标准；否则省略并注明待 grill-with-docs。
- 未有完成标准时不要硬造 `/goal` 契约。
- 人审与落库、分支策略见 skill；三角分工见 CONTEXT。
- 与 `/goal`、loop 同构的总原则见 `project_tasks_align_goal_and_loop_engineering`。
