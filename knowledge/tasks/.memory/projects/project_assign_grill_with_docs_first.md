---
name: project_assign_grill_with_docs_first
description: 指派 tasks 工作项时默认要求执行方先 grill-with-docs，过关再实现；除非用户当次跳过
metadata:
  edges-title: 派发默认先 grill-with-docs
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-12T10:45:45+08:00"
---

派发 `knowledge/tasks` 工作项时，默认要求执行方先跑 grill-with-docs（grilling + domain-modeling，结论进 CONTEXT.md / docs/adr），过关后再 writing-plans / 实现。不限于 coding。用户当次明确说跳过细聊才可例外。

**Why:**
peng cheng 2026-09-12 定为派发前默认。#21 曾有人先 brainstorming / 直接开写，被纠正。细聊落 CONTEXT/ADR 后，跨 agent 才能接着做，而不是只靠聊天。

**How to apply:**
- 任务记录员指派时：升状态 + 通知里写明「先 grill-with-docs，过关再实现」；看板状态仍由记录员改。
- 执行方：不要只用 brainstorming 交差；不要未过关就开实现 PR。
- 例外：用户明确说「直接做 / 跳过 grill」。
