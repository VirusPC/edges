---
name: project_assign_grill_with_docs_first
description: 写或派发 tasks 时打开：默认链为 grill→research→plan→implement→validate→close；research 是 deep-research（竞品/开源/现成方案），独立于 grill 与 plan；validate 是质量/设计/行为门禁（英文阶段名，不用「验收」），可派给非实现者，看板 in_review 大致对应；未 validate 不标 done。回环只按证伪退回，不随便跳阶段；全程可派 subagent 做浅调研，但不占正式 research、不改看板。用户当次跳过除外。
metadata:
  edges-title: tasks 工作流阶段：grill → research → plan → implement → validate → close，回环按证伪
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-25T01:13:21+00:00"
---

edges tasks 工作流阶段是：idea → 落盘 → 出栈指派 → grill（grill-with-docs：CONTEXT/ADR，定做什么/不做什么）→ research（deep-research：竞品分析、开源项目调研、现成方案扫描）→ plan（writing-plans：用调研结果定路径、顺序、拆分与完成标准）→ implement → validate → close。grill、research、plan、implement、validate、close 是不同阶段；research 不并进 grill 或 plan，grill 也不能顶替 plan。grill 先圈定问题与不做的事，research 再扫描现成方案，plan 据此选路径。implement 之后必须经过 validate，再 close；用户当次明确跳过除外。阶段名用英文 research、implement、validate、close；validate 不用「验收」当阶段标签。validate 是质量/设计/行为门禁，可派给非实现者（例如 UI 交给视觉&交互&设计同学，QA 交给测试同学）。看板状态 `in_review` 大致对应 validate。回环只按证伪退回，不能任意跳阶段。全程可以派 subagent 做浅调研，但浅调研不算正式 research。peng cheng 2026-09-25 锁定。

**Why:**
grill 定范围与不做的事，research 做竞品、开源与现成方案扫描，plan 用调研选路径并定顺序、拆分与完成标准，implement 动手，validate 把门禁，close 才收口。把 research 折进 grill 或 plan 会让「问什么、不做什么」和「现成方案有哪些」混成一步，plan 也会在没有对照时先选路径。2026-09-12 peng cheng 把派发默认定先 grill-with-docs（#21 曾有人先 brainstorming / 直接开写）。2026-09-25 他把执行链定为 grill → plan → implement，随即补上 validate → close，再把 research 插在 grill 与 plan 之间。implement 一结束就标 done 会跳过质量、设计与行为检查，而 validate 不必由原实现者做。同一天他补上回环：只在某条假设被证伪时退回，避免阶段之间自由乱跳、空转；并允许全程派 subagent 做浅调研，但不能顶掉 grill 之后那次正式 research。

**How to apply:**
- 阶段链不变：派发、README 与通知按 grill → research → plan → implement → validate → close 写；阶段名用英文。
- 执行方：grill 过关后再 research；research 过关后再 plan；plan 过关后再 implement；implement 之后进入 validate，通过后再 close。不要把竞品分析、开源调研或现成方案扫描写进 grill 或 plan 交差。
- validate 可派给非实现者。看板进入 `in_review` 表示大致在 validate。implement 结束时不要直接标 done。
- 强回环：grill ↔ research（research 同时检验 grill 的结果，验不过就回 grill）；validate → implement（多数是把实现修好再验）。
- 条件回环：plan 发现缺口，可回 research 或 grill；implement 卡住可回 plan，目标错了再往前退；validate 只有「做的东西不对」才回 plan 或 grill，「做得不好」留在 implement ↔ validate。
- 不要写成任意阶段随便跳。每次回退，建议在 sidecar Run log（同目录 `.{stem}.log.md`）写一句：退回哪一阶段、因为哪条假设不成立。同一对阶段空转两三圈仍定不下，停下来找人拍板。
- 任意阶段都可以并行派 subagent 做浅调研：摸地形、查名词、扫一眼竞品或开源、补事实。subagent 只向主流程交短结果；不改看板状态，不占正式 research 阶段，不打断主 agent 正在做的 grill / plan / implement。浅 research ≠ 正式 research（deep-research）。
- 例外：用户当次明确说跳过细聊、跳过 research，或跳过 validate。
