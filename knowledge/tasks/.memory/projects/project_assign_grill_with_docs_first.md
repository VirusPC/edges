---
name: project_assign_grill_with_docs_first
description: 写或派发 tasks 时打开：默认链为 grill→research→plan→implement→validate→close；research 是 deep-research（竞品/开源/现成方案），独立于 grill 与 plan；validate 是质量/设计/行为门禁（英文阶段名，不用「验收」），可派给非实现者，看板 in_review 大致对应；未 validate 不标 done，用户当次跳过除外。
metadata:
  edges-title: tasks 工作流阶段：grill → research → plan → implement → validate → close
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-25T01:04:42+00:00"
---

edges tasks 工作流阶段是：idea → 落盘 → 出栈指派 → grill（grill-with-docs：CONTEXT/ADR，定做什么/不做什么）→ research（deep-research：竞品分析、开源项目调研、现成方案扫描）→ plan（writing-plans：用调研结果定路径、顺序、拆分与完成标准）→ implement → validate → close。grill、research、plan、implement、validate、close 是不同阶段；research 不并进 grill 或 plan，grill 也不能顶替 plan。grill 先圈定问题与不做的事，research 再扫描现成方案，plan 据此选路径。implement 之后必须经过 validate，再 close；用户当次明确跳过除外。阶段名用英文 research、implement、validate、close；validate 不用「验收」当阶段标签。validate 是质量/设计/行为门禁，可派给非实现者（例如 UI 交给视觉&交互&设计同学，QA 交给测试同学）。看板状态 `in_review` 大致对应 validate。peng cheng 2026-09-25 锁定。

**Why:**
grill 定范围与不做的事，research 做竞品、开源与现成方案扫描，plan 用调研选路径并定顺序、拆分与完成标准，implement 动手，validate 把门禁，close 才收口。把 research 折进 grill 或 plan 会让「问什么、不做什么」和「现成方案有哪些」混成一步，plan 也会在没有对照时先选路径。2026-09-12 peng cheng 把派发默认定先 grill-with-docs（#21 曾有人先 brainstorming / 直接开写）。2026-09-25 他把执行链定为 grill → plan → implement，随即补上 validate → close，再把 research 插在 grill 与 plan 之间。implement 一结束就标 done 会跳过质量、设计与行为检查，而 validate 不必由原实现者做。

**How to apply:**
- 派发、README 与通知按 grill → research → plan → implement → validate → close 写；阶段名用 research、implement、validate、close。
- 执行方：grill 过关后再 research；research 过关后再 plan；plan 过关后再 implement；implement 之后进入 validate，通过后再 close。不要把竞品分析、开源调研或现成方案扫描写进 grill 或 plan 交差。
- validate 可派给非实现者。看板进入 `in_review` 表示大致在 validate。implement 结束时不要直接标 done。
- 例外：用户当次明确说跳过细聊、跳过 research，或跳过 validate。
