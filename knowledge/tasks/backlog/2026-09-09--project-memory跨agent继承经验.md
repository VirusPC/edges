---
name: project-memory跨agent继承经验
description: Project Memory 的一个核心作用是跨 Agent / 账号切换时继承经验
metadata:
  edges-type: task
  edges-title: project-memory 跨 Agent 继承经验
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T08:00:00+08:00"
---

Project Memory 的一个核心点是知识的自主权：知识不锁死在某一家模型账号 / 某一 Agent 运行时里，用户可带走、可迁移、可换工具续用；填出来之后，当 Claude Code 账号被封或某个 Agent 达到限额时，可以切换到其他 Agent 继续工作并继承已沉淀的经验。

**Why:**
记忆层的价值不只是「当前会话更好用」，还包括容灾与连续性：限额、封号、换工具时工作不中断。更深一层是知识自主权：经验属于用户与项目，不绑死在单一 runtime / 账号上。

**How to apply:**
- 设计 project-memory 时显式支持「跨 Agent 可读可续」：记忆落在项目侧，不依赖单个 runtime / 账号会话。
- 评估与可扩展 memory type、assets 等方案时，以「换 Agent 仍能接着干」作为验收标准之一。
