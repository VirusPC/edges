---
name: project_locomo_online_produce_consume_vs_posthoc_qa
description: 评 Project Memory / PM-online 或对照官方 RAG/截断基线时：官方 QA 是事后静态库，不等于对话中 write→use。全文见 knowledge/projects/memory/2026-09-16-LoCoMo-paper-10-questions.md「补充：过程中产生/消费 vs 事后静态库」。四臂仍 paused；分数按 ADR 0008 不是 PM proof。
metadata:
  edges-title: LoCoMo 官方 QA 是事后静态库，不等于 PM-online
  edges-type: project
  edges-origin-session-id: bc-2e6511c6-2f85-5995-9d35-bf42d78b9fcd
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T10:39:14+00:00"
---

LoCoMo 官方 RAG / 截断 QA 把已结束对话（或整份 observation 语料）当静态库事后检索，不等于 Project Memory / PM-online 的对话中 write→use。用户所述（peng cheng / 2026-09-16 grill）；全文见知识笔记，本条只作评测侧指针。

**Why:**
数据生成是 Park 式按 session 在线 produce，官方 QA 消费却在对话结束后。测的是长历史事实检索。若把官方基线分数当成 PM-online 证据，是构念错位，不是「LoCoMo 做错了」。ADR 0008 已规定 Evaluation Smoke ≠ Benchmark Proof / PM proof。

**How to apply:**
- 完整讨论读 [`knowledge/projects/memory/2026-09-16-LoCoMo-paper-10-questions.md`](../../../knowledge/projects/memory/2026-09-16-LoCoMo-paper-10-questions.md) 的「补充：过程中产生/消费 vs 事后静态库（2026-09-16）」。
- 若以后评 PM / online write→recall：加因果或 session 顺序约束（用 session ≤k 的证据答题时，只读写到 k 的记忆；或沿时间线交错 write/answer——禁止偷看未来 session）。
- 四臂 exploratory 仍 paused；本条不恢复实现。
- 不要把官方冒烟分数写成 PM proof。
