---
name: feedback_grill_must_remember_settlements
description: >-
  做节点模型/系统二设计讨论或 grill 时：用户确认的取舍与纠正当轮用 edges memory remember 落库；不能只改 CONTEXT
  或留在对话里。翻案则更新同一 slug。
metadata:
  edges-title: grill 与设计讨论必须当轮 remember
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:12:57+00:00'
---

设计讨论、grill、改模型时，关键取舍一经用户确认或用户明确纠正，必须当轮用 `$project-memory-remember` 落库；不能只改 CONTEXT / 对话里达成一致却不写记忆。

**Why:** 用户 2026-10-06 在节点模型 grill 中明确要求。grill 轮次多、结论会翻案，只靠对话或未提交的 CONTEXT 时，后续 Agent 会丢基础假设（例如系统入口是否带组成登记）。

**How to apply:** 每轮 frontier 答完、或用户纠正/补充关键用途后，立刻 remember（`project` 记取舍，`feedback` 记纠正与禁区）。未闭环的选项标「grill 进行中 / 待答」；被翻案的旧条更新同一 slug，不要另起近义条。CONTEXT / ADR 与记忆同步，但记忆不能省略。
