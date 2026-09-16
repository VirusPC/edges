---
name: locomo_fork_thin_wrap_edges_submodule
description: LoCoMo fork 薄封装 + edges submodule，替换仓内 port harness
metadata:
  edges-type: task
  edges-title: LoCoMo fork 薄封装 + edges submodule（替换 port harness）
  edges-tasks-status: backlog
  edges-task-assignee: Agent Memory 专家
  edges-task-assignee-id: ae52bd9d-c3d6-414d-977d-f07b6d20d1a3
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-16T17:20:00+08:00"
---

评测改走官方入口：在 fork 的 LoCoMo 上做薄封装，edges 用 submodule 钉住该 fork；逐步替换 edges 里自己移植的 scoring/context port。F1 走官方 `evaluation.py`。

**Why:**
四臂探索仍 paused（先读论文）。本卡是**独立前置**：不再维护 edges 内 port 出来的打分/上下文路径。用户已 fork：https://github.com/VirusPC/locomo（自 snap-research/locomo）。冒烟 #70 已证明管道能跑，但长期应以官方评测语义为准，只保留必要差异（模型后端等）。

**How to apply:**
1. 在 `VirusPC/locomo` 做薄改：OpenAI-compatible / kimi-for-coding 路由；可选 subset 过滤；尽量不改 `evaluation.py` 打分与官方 prompt 语义。
2. 在 `VirusPC/edges` 以 submodule 钉住该 fork commit（例如 `evaluation/third_party/locomo`）。
3. edges 只留：裁数据 / 调用入口 / reports / ADR；逐步替换 `evaluation/cases/locomo-smoke` 里的 port 打分路径；F1 走官方 `evaluation.py`。
4. 裁数据保留 RAG 字段（dialog / observation 等）；报告写清 base commit、子集规则、相对官方的唯一差异（模型后端）。

**非目标：**
- 现在不恢复四臂实现
- 不把分数当 Project Memory 证明
- 不替代 SWE-ContextBench

**交叉：**
- backlog（paused）：`2026-09-16--LoCoMo四臂探索对照`
- done：`2026-09-16--LoCoMo评测流水线冒烟` / PR #70

派发：已指派 Agent Memory 专家；开干前默认先 grill-with-docs。
