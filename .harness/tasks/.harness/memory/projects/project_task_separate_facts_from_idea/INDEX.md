---
name: project_task_separate_facts_from_idea
description: 适用于各层领域与维护任务；写法统一由 conversation-to-tasks 维护，本条仅保留原因和范围。
metadata:
  edges-title: Task 写法：事实与想法分开
  edges-type: project
  edges-origin-session-id: local-it-asset-2026-09-27
  edges-agent-client: grok-bot
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T19:54:17+08:00'
---

所有层级的领域任务与维护任务都应区分事实、判断和候选做法；具体写法统一由 [conversation-to-tasks](../../../../../../extensions/skills/conversation-to-tasks/SKILL.md) 维护。

**Why:** 旧卡把事实背景与设想混在一起，接手者难以判断哪些已经发生、哪些仍需验证；在各看板重复存写作模板又会与 STAR 正文规则分叉。

**How to apply:** 创建或更新任务时引用该 Skill。这里只保留规则的原因和适用范围，不维护第二份模板，不增加背景、目标之外的必填字段。
