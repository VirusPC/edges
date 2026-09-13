---
name: project_engineering_knowledge_chain
description: 设计或整理仓库工程文档时：按 Problem/Requirement → RFC/Design → ADR → Code/PR → RCA 的闭环区分提议、设计、决策、实现与反馈；不要把所有文档角色都做成 project-memory type，也不要用 ADR 记录小决定。
metadata:
  edges-title: 工程知识链：ADR 不单独看
  edges-type: project
  edges-origin-session-id: bc-fbd2693b-bb5b-4000-980f-7d85017c8116
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-13T06:42:47+00:00"
---

ADR 必须放进「问题 → 方案 → 决策 → 实现 → 反馈」工程知识链里读和写，不能单独当完整上下文。这是用户确认的仓库约定。

**Why:** 单独看 ADR 会丢掉需求、被否决的提议、实现与线上教训，容易把 RFC 当成已决、把小改动写成 ADR，或把仓库文档角色误建成 project-memory type。Project memory 只补充、索引代码与 git 推不出的持久 Why 与规则；仓库文档各自保留文档角色。AI Coding 的高收益仓库上下文通常是 Intent + Design + Decision + Implementation + Feedback，常落成 Design Doc + ADR + Git History + RCA。

**How to apply:** 设计或整理工程文档时按最小生命周期走：Requirement/Problem → RFC 或 Design → ADR → Tech Spec/tasks → Code/PR → Release/Monitoring → RCA/Postmortem → 可能新 ADR。角色不要混：PRD/Requirement 记 Why/用户需求；RFC 是决策前提议，可被否决；Design Doc 写方案架构；Tech Spec 写具体实现；ADR 只记难逆转或非显然、后人会问「为什么」的最终关键决策与取舍；Issue/Task 执行；PR 是实际代码变更；Runbook 运维；RCA/Postmortem 把生产教训回流到新决策；Changelog 记已发布变更。命名、UI、次要实现选择不写 ADR。不要把这些文档角色自动做成新的 project-memory type。
