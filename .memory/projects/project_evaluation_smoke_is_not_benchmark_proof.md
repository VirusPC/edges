---
name: project_evaluation_smoke_is_not_benchmark_proof
description: 写评测或引用 LoCoMo 等公开基准分数时：冒烟只证明链路可跑，不得当成项目记忆 / Agent Memory 的公开基准证明。决策见 docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md。
metadata:
  edges-title: 评测冒烟不是公开基准证明
  edges-type: project
  edges-origin-session-id: bc-bb27e95f-dce0-5ebd-a923-57cf3e408155
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-15T18:49:16+00:00"
---

本轮 LoCoMo 及同类便宜公开基准试跑只算评测冒烟，不得引用为对项目记忆或 Agent Memory 的公开基准证明。术语见 CONTEXT；决策见 docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md。用户所述、grill-with-docs 确认于 2026-09-15/16。

**Why:**
LoCoMo 测长程对话事实召回，项目记忆是文件系统作用域的运营记忆，构念不匹配。冒烟只为复现「写入→检索→作答→打分」并留下可复查的评测报告。真正的公开基准证明要在构念匹配的基准（例如 SWE-ContextBench）上用同底座、同 harness 和空记忆/安慰剂/随机等对照。

**How to apply:**
- 写评测、任务、笔记或 PR 时：LoCoMo 分数只能写成评测冒烟 / 评测报告，不能写成记忆评测通过、benchmark 证明有效、或项目记忆增益。
- 公开基准证明仍走独立 Task（找公开 benchmark 证明 memory 有效性）；不要用冒烟分数交差。
- 复用上游 LoCoMo harness，不要自研评测 runner，也不要把项目记忆接到 LoCoMo 当后端。
- 对照 CONTEXT 术语与 ADR `docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md`。
