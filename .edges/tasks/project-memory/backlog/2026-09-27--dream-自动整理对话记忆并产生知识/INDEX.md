---
name: dream_auto_memory_to_knowledge
description: "需要 dream：后台自动整理对话记忆并产出可复用知识（非手动复盘；非把 STAR 当复盘模板）。"
metadata:
  edges-type: task
  edges-title: dream — 自动整理对话记忆并产生知识
  edges-tasks-status: backlog
  edges-task-project: project-memory
  edges-task-priority: medium
  edges-updated-at: "2026-09-27T09:30:00+08:00"
---

缺的是后台自动把对话记忆整理成可复用知识的 dream；做成后应有一套可跑的 dream 流程，而不是再靠人手动复盘。

**背景：**
2026-09-27，peng cheng 在「IT资产管理」对话里点名任务记录员开卡：还是需要 dream，用来自动整理对话记忆并产生知识，不是手动复盘。
- 相关现状：已有 conversation-to-notes（人触发整理笔记）、project-memory（仓内记忆沉淀）、以及用 STAR 定任务结构的做法；这些偏手动或结构约定，缺的是后台自动从对话记忆走向知识的机制。
- 预期收益：对话里积累的经验能定期/自动变成可复用知识，减少只靠人想起才整理。
- 非目标：不要把 STAR 当成复盘模板；本卡不是再写一篇手动复盘流程。
- 关联：`knowledge/notes/1. memory.md` 里提过 auto dream（例如用 /loop 检测 AGENTS.md 是否新鲜、不新鲜则提交 CR，并写「也是一种 auto dream」）；开卡请求来自助手 IT资产管理（id 5fcd37e7-eacb-4cc8-b9ed-b96a8ef4e344）。

**目标：**
有一套 dream 流程，能自动从对话记忆整理并产出可复用知识。

**动作：**
- 对照现有 conversation-to-notes、project-memory、STAR 定任务结构，划清 dream 与它们的边界（dream = 自动记忆→知识；不是手动复盘 skill）。
- 设计并落地可调度的 dream 流程（触发、输入来源、产出落到 notes / project-memory 等何处），出栈前默认 grill-with-docs。
- 参考 `knowledge/notes/1. memory.md` 中的 auto dream 线索，但不必绑定那一条防腐/loop 实现。

**完成标准：**
- [ ] 存在可描述、可触发的 dream 流程（文档或可加载 Skill/例程），明确输入是对话记忆、输出是可复用知识
- [ ] 至少跑通一次自动整理（非纯手动 conversation-to-notes），产出可核对的知识条目或笔记
- [ ] 书面划清：dream ≠ 手动复盘；STAR 不作为复盘模板
