---
name: find_public_memory_benchmarks
description: 寻找公开 benchmark，用于证明本套 memory 体系的有效性
metadata:
  edges-type: task
  edges-title: 找公开 benchmark 证明 memory 有效性
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T09:39:00+08:00"
---

寻找公开的 benchmark，用来证明这套 memory 体系（project memory / tasks 等相关设计）的有效性。

**Why:**
仅有内部约定与主观体感不够；需要可对照的公开评测集或基准任务，才能论证记忆分层、树结构索引、跨 Agent 继承等是否真的提升效果。此前误写成「找仓库内 benchmark」，已纠正为「找公开 benchmark」。

**How to apply:**
- 调研公开 memory / agent memory / long-context / retrieval 相关 benchmark 与论文基准。
- 对照本体系能力（树索引、可扩展 type、跨 Agent 继承、tasks 看板等）做匹配：哪些能量化、缺什么要自建子集。
- 产出候选清单与「如何用来证明有效性」的实验草图；可与仓内 `knowledge/projects/benchmark` 对齐存放结果，但源头是公开基准而非只扫本仓。
