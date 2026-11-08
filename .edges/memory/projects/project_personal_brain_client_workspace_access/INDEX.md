---
name: project_personal_brain_client_workspace_access
description: 个人大脑接入各 Agent 客户端的检索入口：主路径是跨客户端复用同一大脑；取舍与开放问题见 ADR 0053。
metadata:
  edges-title: 个人大脑跨客户端与工作空间接入
  edges-type: project
  edges-origin-session-id: sand-subagent-d9cb7c5c-5e95-1267-09c4-27242a91b53a
  edges-agent-client: grok-bot
  edges-username: Grok Bot
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: '2026-11-08T09:42:05+08:00'
---

个人大脑接入各 Agent 客户端：主路径是在不同客户端复用同一份大脑，不是把大脑 Compose 进代码项目。取舍、已定项、待验证事实与开放问题只在 ADR 0053 维护，这里不重复。

**Why:** 记忆只做检索入口；设计决定以 ADR 为单一真源，避免两处漂移。

**How to apply:**
- ADR：[0053 个人大脑以跨客户端复用为主路径](<../../../../docs/adr/0053-personal-brain-reused-across-agent-clients.md>)
- 任务：[个人大脑跨客户端与工作空间接入指南](<../../../projects/2026-09-09--agent-clients-ux/tasks/in_progress/2026-11-08--%E4%B8%AA%E4%BA%BA%E5%A4%A7%E8%84%91%E8%B7%A8%E5%AE%A2%E6%88%B7%E7%AB%AF%E4%B8%8E%E5%B7%A5%E4%BD%9C%E7%A9%BA%E9%97%B4%E6%8E%A5%E5%85%A5%E6%8C%87%E5%8D%97/INDEX.md>)
- ADR「开放问题」里的条目未定，不要当成已定或已实现。
