---
name: project_locomo_generator_structure_before_interaction
description: 决定从 LoCoMo 借什么、或评 PM / 事件图世界模型时：可借的是 persona→G→按日切 session→接地对话，不是官方 QA 分。只跑 QA 测不到 online write→use 或事件图世界模型。全文见 knowledge/projects/memory/2026-09-16-LoCoMo-paper-10-questions.md「补充：合成造数逻辑、宣传落差与审稿站台」。四臂仍 paused；分数按 ADR 0008 不是 PM proof。
metadata:
  edges-title: LoCoMo 可借的是造数哲学（结构先于互动），不是 QA 分
  edges-type: project
  edges-origin-session-id: bc-00931fed-b513-541b-945e-2597d9d27f15
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T11:02:47+00:00"
---

LoCoMo 对 Project Memory 更值得借的是生成哲学（结构先于互动：persona → 因果图 G → 按日切 session → 接地对话），不是官方 QA 分数。用户所述（peng cheng / 2026-09-16）；全文见知识笔记，本条只作评测侧指针。

**Why:**
社区几乎只消费成品对话+QA；事件摘要与多模态臂闲置，官方事件评测脚本长期 "Coming soon."。只跑 QA 既测不到 online write→use，也测不到事件图世界模型。把 QA 分当 PM 证据是构念错位。论文也未把生成器效度证完（LLM↔LLM 世界、事件摘要循环性）。ADR 0008 已规定 Evaluation Smoke ≠ Benchmark Proof / PM proof。

**How to apply:**
- 完整讨论读 [`knowledge/projects/memory/2026-09-16-LoCoMo-paper-10-questions.md`](../../../knowledge/projects/memory/2026-09-16-LoCoMo-paper-10-questions.md) 的「补充：合成造数逻辑、宣传落差与审稿站台（2026-09-16）」。
- 不要把官方 QA / 冒烟分数写成 PM proof，也不要把 LoCoMo 读成「已证明像人的生成器」。
- 四臂 exploratory 仍 paused；本条不恢复实现，不接 Project Memory 当 LoCoMo 后端。
