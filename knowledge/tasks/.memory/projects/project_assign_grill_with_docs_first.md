---
name: project_assign_grill_with_docs_first
description: 写或派发 tasks 时：阶段为 grill→plan→implement→validate→close；validate 是质量/设计/行为门禁（英文阶段名，不用「验收」），可派给非实现者，看板 in_review 大致对应；未 validate 不标 done，用户当次跳过除外。
metadata:
  edges-title: tasks 工作流阶段：grill → plan → implement → validate → close
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-25T01:02:05+00:00"
---

edges tasks 工作流阶段是：idea → 落盘 → 出栈指派 → grill（grill-with-docs：CONTEXT/ADR，定做什么/不做什么）→ plan（writing-plans：定顺序/拆分/完成标准）→ implement → validate → close。grill、plan、implement、validate、close 是不同阶段；grill 不能顶替 plan。implement 之后必须经过 validate，再 close；用户当次明确跳过除外。阶段名用英文 implement、validate、close；validate 不用「验收」当阶段标签。validate 是质量/设计/行为门禁，可派给非实现者（例如 UI 交给视觉&交互&设计同学，QA 交给测试同学）。看板状态 `in_review` 大致对应 validate。peng cheng 2026-09-25 锁定。

**Why:**
grill 定范围，plan 定顺序、拆分与完成标准，implement 动手，validate 把门禁，close 才收口。2026-09-12 peng cheng 把派发默认定先 grill-with-docs（#21 曾有人先 brainstorming / 直接开写）。2026-09-25 他把执行链定为 grill → plan → implement，随即补上 validate → close：implement 一结束就标 done 会跳过质量、设计与行为检查，而 validate 不必由原实现者做。

**How to apply:**
- 派发、README 与通知按 grill → plan → implement → validate → close 写；阶段名用 implement、validate、close。
- 执行方：grill 过关后再 plan；plan 过关后再 implement；implement 之后进入 validate，通过后再 close。
- validate 可派给非实现者。看板进入 `in_review` 表示大致在 validate。implement 结束时不要直接标 done。
- 例外：用户当次明确说跳过细聊，或跳过 validate。
