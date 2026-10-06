---
name: locomo_official_rag_single_file_followup
description: LoCoMo 官方 RAG 单档（rag-mode dialog、单一 top-k）——冒烟基线过关后的可选跟进
metadata:
  edges-type: task
  edges-title: LoCoMo 官方 RAG 单档跟进（非冒烟范围）
  edges-tasks-status: cancelled
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-16T16:05:00+08:00"
---

LoCoMo 官方 RAG 单档对照（如 `rag-mode` dialog、单一 top-k）：在「截断上下文基线」冒烟过关后的**可选**跟进。

**Why:**
Agent Memory 专家 grill-with-docs 已定当前冒烟只做截断上下文基线（Q12=A），模型用 kimi-for-coding。官方 RAG 单档能补一条检索对照，但不进本轮冒烟范围，避免和「先跑通管道」缠在一起。

**How to apply:**
- 依赖 / 链到：done `knowledge/tasks/_default/done/2026-09-16--LoCoMo评测流水线冒烟.md`（#70 已合）；**父项** `2026-09-16--LoCoMo四臂探索对照`（本条作臂 1 子项，不另开冒烟证明）。
- **结论（2026-09-16）：** baseline 冒烟已过关；本条并入四臂 exploratory 的 RAG 臂，仍独立 backlog 文件便于指派，但范围服从父项同一子集/模型/F1。
- 范围：官方 RAG 单档配置（rag-mode dialog、单一 top-k 等）；与冒烟同一评测管道可复用则复用。
- **非目标：** 不进当前冒烟；不把 LoCoMo（含 RAG 分）当 filesystem project-memory 证明；不替代 SWE-ContextBench 主证据。
- 派发时默认先 grill-with-docs。

**合并取消（2026-09-16）：** 内容并入 `2026-09-16--LoCoMo四臂探索对照` 的臂 1；本条 cancelled，不再单独跟踪。
