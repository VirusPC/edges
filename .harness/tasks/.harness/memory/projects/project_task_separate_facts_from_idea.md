---
name: project_task_separate_facts_from_idea
description: >-
  所有层级的维护与领域任务须区分事实与想法，简述问题与预期结果；写作规则与 STAR 结构统一由 conversation-to-tasks Skill
  维护。
metadata:
  edges-title: Task 正文分节事实/idea，并一句话讲清问题与结果
  edges-type: project
  edges-origin-session-id: local-it-asset-2026-09-27
  edges-agent-client: grok-bot
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T18:03:33+08:00'
---

在所有层级的维护 `.harness/tasks` 和领域 `tasks/` 中，记 Task 时必须区分事实背景与抽象 idea，不能混为一谈；并且每张卡要用一句话（最多两句短句）讲清：解决什么问题、做成后预期是什么结果。这句话优先放 frontmatter `description` 和/或开头结论。**从对话经 `conversation-to-tasks` 新开的卡**改用该技能正文：**背景 → 目标 → 动作 → 完成标准**（后两栏可选），不再套本条的 Why/How 分节；本条仍适用于手工改旧卡、或未走该技能的写法。派给 agent 时四栏按 STAR 同构排，见 `project_star_for_agent_task_formulation`。

**Why:**
混写会导致后人分不清「已经发生的约束」和「尚待实现的意图」。2026-09-24 已定 conversation-to-tasks 模板与人审落库流程；2026-09-27 正文改为完成标准在动作之后。继续要求对话开卡走旧 Why/How 会与技能冲突。

**How to apply:**
- 经 `conversation-to-tasks`：跟 skill 1.2.0（背景须含对话过程；动作与完成标准可选；人审后 CLI 落库）。细节见仓根记忆 `conversation_to_tasks_body_review_persist`；STAR 用途见 `star_for_agent_task_formulation`。
- 其他 Task：`description`/开头结论一句话讲清问题与预期结果；正文可先结论 → **事实背景:** → **Why:** → **How to apply:**；不写执行流水。
- 改旧卡时尽量拆开混写，并补上问题-结果一句话。


2026-10-05 用户确认：本条适用于所有层级的维护任务与领域任务；事实与想法分开、简述问题与预期结果等写作规则，与 STAR 正文结构统一由 `conversation-to-tasks` Skill 维护，各看板引用。原文新旧模板兼容说明属于待整理内容，不作为另建独立写作规范的理由。本次记录归属决定，尚未搬迁或合并到 Skill。
