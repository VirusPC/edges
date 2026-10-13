---
name: project_star_for_agent_task_formulation
description: 各层维护与领域任务采用 STAR 的原因和适用范围；具体写作方法引用 conversation-to-tasks，不重复维护正文、不固定版本，不用于复盘。
metadata:
  edges-title: STAR 用来制定任务（尤其给 agent），不是复盘
  edges-type: project
  edges-origin-session-id: local-it-asset-2026-09-27
  edges-agent-client: grok-bot
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T18:35:10+08:00'
---

所有层级的维护 `.harness/tasks` 和领域 `tasks/` 都采用 STAR 组织任务，尤其是交给 Agent 的任务与 brief；该约定用于制定任务，不用于复盘笔记。

**Why:**
统一任务表达，使执行者先理解语境与目标，再理解行动和完成条件，也便于将笔记中的行动指南转为可接续的任务。

**How to apply:**
具体写作方法、字段顺序、必填与可选规则，以 [conversation-to-tasks Skill](../../../../../../extensions/skills/conversation-to-tasks/SKILL.md) 为准。本记忆只保留采用原因与适用范围，不重复维护方法正文，也不固定引用版本。
