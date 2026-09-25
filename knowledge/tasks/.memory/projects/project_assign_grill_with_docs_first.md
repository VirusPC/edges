---
name: project_assign_grill_with_docs_first
description: 写或派发 tasks 时：阶段为 idea→落盘→出栈指派→grill→plan→implement→收口；grill、plan、implement 是不同阶段，grill 不能顶替 plan；实现阶段名用英文 implement；派发默认先 grill 再 plan 再 implement，用户当次跳过细聊除外。
metadata:
  edges-title: tasks 工作流阶段：grill → plan → implement
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-25T01:00:13+00:00"
---

edges tasks 工作流阶段是：idea → 落盘 → 出栈指派 → grill（grill-with-docs：CONTEXT/ADR，定做什么/不做什么）→ plan（writing-plans：定顺序/拆分/验收）→ implement → 改看板状态收口。grill、plan、implement 是不同阶段；grill 不能顶替 plan。对外与约定描述里，这一阶段统一用英文 implement。派发默认要求先 grill，过关后再 plan，再 implement；用户当次明确跳过细聊除外。用户所述（2026-09-25），并收窄 2026-09-12「grill 过关再实现」的阶段名。

**Why:**
grill 定范围（做什么/不做什么），plan 定顺序、拆分与验收，implement 才动手。2026-09-12 peng cheng 把派发默认定先 grill-with-docs（#21 曾有人先 brainstorming / 直接开写）。三个阶段若并成一步，或阶段名写成「实现」，跨 agent 会对不齐「做不做」和「怎么拆、怎么验收」。

**How to apply:**
- 派发、README 与通知按 grill → plan → implement 写；阶段名用 implement。
- 执行方：grill 过关后再 writing-plans；plan 过关后再 implement。grill 的结论不能当作 plan 交差。
- 例外：用户当次明确说跳过细聊 / 直接做。
- implement 之后由任务记录员改看板状态收口。
