---
name: project_benchmark_review_checklist
description: 设计或审阅 agent-memory / long-context 类 benchmark、或判断仓内冒烟分数能不能当证明时：先看构念效度 → 数据可信 → 区分度 → 可复现公平协议；分数表是证据不是贡献。全文见 knowledge/projects/memory/2026-09-16-benchmark-review-checklist.md。LoCoMo 个案仍看十问笔记；ADR 0008：Evaluation Smoke ≠ Benchmark Proof。
metadata:
  edges-title: Benchmark 审稿先看构念、数据、区分度与公平协议
  edges-type: project
  edges-origin-session-id: bc-3985043b-9392-59f5-a0cd-0c5ce37656d3
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T11:07:48+00:00"
---

设计或审阅 agent-memory / long-context 类 benchmark 时，先按构念效度 → 数据可信 → 区分度 → 可复现公平协议来看；分数表是证据不是贡献。用户所述（peng cheng 与 Agent Memory 专家 / 2026-09-16）；全文见知识笔记，本条只作评测侧指针。

**Why:**
评测侧经常要判断一份公开基准或仓内冒烟能不能支撑「记忆有效」之类的句子。把分数当贡献、把 Evaluation Smoke 当 Benchmark Proof，都会走偏。ADR 0008 已钉住冒烟≠证明；这份清单把审稿优先级写清，避免每次讨论再从零复述。

**How to apply:**
- 完整讨论读 [`knowledge/projects/memory/2026-09-16-benchmark-review-checklist.md`](../../../knowledge/projects/memory/2026-09-16-benchmark-review-checklist.md)。
- 不要把全文复制进 `.memory`。
- LoCoMo 个案仍看同目录十问笔记；本条是通用审稿清单，不恢复四臂实现，也不把冒烟分数写成 PM proof。
