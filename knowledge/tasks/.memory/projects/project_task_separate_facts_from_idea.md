---
name: project_task_separate_facts_from_idea
description: 落盘 knowledge/tasks 时，事实背景（已发生、可核对）与抽象 idea/结论（要做成什么）必须分节；禁止混写。
metadata:
  edges-title: Task 正文区分事实背景与抽象 idea
  edges-type: project
  edges-origin-session-id: bc-f7ee1fcb-9d96-50db-b605-09a3643ea4b1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-19T14:13:04+00:00"
---

记 Task 时必须区分事实背景与抽象 idea，不能混为一谈。用户所述（peng cheng，2026-09-19）。

**Why:**
混写会导致后人分不清「已经发生的约束」和「尚待实现的意图」，grill/实现时容易误把猜测当事实，或把事实当可选设计。

**How to apply:**
- 正文建议结构：先一句结论（idea）→ **事实背景:**（可核对事件、现有行为、笔记/ADR 路径）→ **Why:** → **How to apply:**。
- 事实背景只写已发生或仓库里已有的东西；idea/方向写在结论与 How。
- 任务记录员与 conversation-to-task 落盘时遵守；改旧卡时尽量拆开混写段落。
