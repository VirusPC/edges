---
name: project_task_separate_facts_from_idea
description: 写/改 Task 时：分节事实/idea + 一句话讲清问题与预期结果；从对话经 conversation-to-tasks 开的新卡改走背景→目标→完成标准。
metadata:
  edges-title: Task 正文分节事实/idea，并一句话讲清问题与结果
  edges-type: project
  edges-origin-session-id: bc-f7ee1fcb-9d96-50db-b605-09a3643ea4b1
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-24T16:27:49+08:00"
---

记 Task 时必须区分事实背景与抽象 idea，不能混为一谈；并且每张卡要用一句话（最多两句短句）讲清：解决什么问题、做成后预期是什么结果。这句话优先放 frontmatter `description` 和/或开头结论。**从对话经 `conversation-to-tasks` 新开的卡**改用该技能正文：**背景 → 目标 → 完成标准**（动作可选），不再套本条的 Why/How 分节；本条仍适用于手工改旧卡、或未走该技能的写法。

**Why:**
混写会导致后人分不清「已经发生的约束」和「尚待实现的意图」。2026-09-24 已定 conversation-to-tasks 模板与人审落库流程；继续要求对话开卡走旧 Why/How 会与技能冲突。

**How to apply:**
- 经 `conversation-to-tasks`：跟 skill（背景须含对话过程；完成标准可验收；人审后 CLI 落库）。细节见仓根记忆 `conversation_to_tasks_body_review_persist`。
- 其他 Task：`description`/开头结论一句话讲清问题与预期结果；正文可先结论 → **事实背景:** → **Why:** → **How to apply:**；不写执行流水。
- 改旧卡时尽量拆开混写，并补上问题-结果一句话。
