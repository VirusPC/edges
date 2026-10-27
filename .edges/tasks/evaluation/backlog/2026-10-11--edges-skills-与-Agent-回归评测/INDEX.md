---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-11T10:22:00.729Z'
  edges-title: edges skills 与 Agent 回归评测
  edges-tasks-status: backlog
  edges-task-priority: none
name: edges_skills_与_agent_回归评测
description: 用固定真实任务做回归集，自动检查 Agent 是否按 skill 执行、是否守住 AGENTS.md 硬约束。
---
**背景：**
同一次讨论里，peng cheng 问到第二块是什么意思。这一块要评的不是 Agent 记住了什么，而是它在 edges 里干活守不守规矩、做得对不对。现有的 LoCoMo、MemoryBench、SWE-ContextBench 都不涉及 skills 和仓库操作，测不到这一块。
- 现状：仓库里没有 skill 质量检查，也没有 Agent 回归测试或裁判打分框架，CI 里只有 `deploy.yml`。
- 预期收益：每次改了 skill、`AGENTS.md` 或换了模型，都能重跑一遍，知道哪里变差了。
- 关联：知识库 Evaluation 系统（卡一）、`AGENTS.md` 硬约束、Langfuse 冒烟（PR #205）。

**目标：**
有一批固定的真实任务作为回归集，能自动检查 Agent 有没有按 skill 走、有没有守住 `AGENTS.md` 的硬约束，每次改动后重跑都能拿到可以对比的结果。

**动作：**
- 选几条真实任务当回归用例，比如用 edges-conversation-to-notes 整理笔记、用 edges-conversation-to-tasks 开卡、改仓库提 PR。
- 用脚本检查能用规则判的部分：文件名、目录、有没有用独立 worktree、是不是走 PR、Co-authored-by trailer、有没有碰 `posts/`。
- 脱敏够不够、写得好不好这类判断不了对错的，用模型当裁判打分；运行 trace 打进自建的 Langfuse。

（完成标准待 grill-with-docs 补，本栏省略。）
