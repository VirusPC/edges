---
name: queue_auto_dispatch_ready_tasks
description: 参考消息队列，把明确且依赖就绪的 Tasks 自动推给 Agent；结合额度窗口吃满配额
metadata:
  edges-type: task
  edges-title: 按消息队列自动推送就绪 task
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:12.662Z"
  edges-task-project: edges-tasks
---

参考消息队列：把一些明确的 Tasks 在依赖就绪时自动推给 Agent，让他自己做下一步。更重要的是结合约 5 小时额度窗口，尽量吃满各 Agent 配额。

**Why:**
现在出栈、指派、开工多靠人点。依赖齐了、规格够清楚时，还等人推就浪费额度窗口。TaskGraph 依赖是前提；没有边就不敢自动派。和「落盘时推荐相关 task 并问依赖」是上下游：那边攒边，这边按就绪队列消费。

**How to apply:**
- 定义「可自动推」：依赖已满足、规格够明确、有默认执行方；不够清楚的仍走人审。
- 队列语义：就绪集、投递、ack/失败回队；仍是指派制，不是抢单 daemon。
- 额度窗口：按各 Agent 的约 5 小时窗口排期，窗口将尽时优先投递明确短任务。
- 依赖：`2026-09-14--落盘时推荐相关task并问依赖.md`；交叉 tasks CLI、grill-first，不绕过细聊默认。
- 未指派。派发时默认先 grill-with-docs。
