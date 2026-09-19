---
name: project_task_separate_facts_from_idea
description: 写/改 Task 时：分节事实/idea + 一句话讲清问题与预期结果
metadata:
  edges-title: Task 正文分节事实/idea，并一句话讲清问题与结果
  edges-type: project
  edges-origin-session-id: bc-f7ee1fcb-9d96-50db-b605-09a3643ea4b1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-19T14:51:54+00:00"
---

记 Task 时必须区分事实背景与抽象 idea，不能混为一谈；并且每张卡要用一句话（最多两句短句）讲清：解决什么问题、做成后预期是什么结果。这句话优先放 frontmatter `description` 和/或开头结论，读者不必翻 Why/How 才看到 punchline。用户所述（peng cheng，2026-09-19；同日加性补充）。

**Why:**
混写会导致后人分不清「已经发生的约束」和「尚待实现的意图」，grill/实现时容易误把猜测当事实，或把事实当可选设计。同日补充：要能一句话讲明白解决了什么问题、预期达成什么样的结果——这是加性要求，不是替换分节规则。执行流水只进 sidecar log，不进 Task 正文。

**How to apply:**
- 每张 Task：`description` 和/或开头结论用一句话（至多两句短句）同时写清问题与预期结果；不要让读者去 Why/How 里拼 punchline。
- 正文结构：先一句结论（idea / 问题+预期结果）→ **事实背景:**（可核对事件、现有行为、笔记/ADR 路径）→ **Why:** → **How to apply:**；**不写**执行流水。
- 事实背景只写已发生或仓库里已有的东西；idea/方向写在结论与 How。
- 任务记录员与 conversation-to-task 落盘时遵守；改旧卡时尽量拆开混写段落，并补上问题-结果一句话。
- 分节事实/idea 与一句话问题-结果同时成立，不要另起近义记忆。
