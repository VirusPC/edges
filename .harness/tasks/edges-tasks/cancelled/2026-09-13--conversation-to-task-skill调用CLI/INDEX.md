---
name: conversation_to_task_skill_via_cli
description: conversation-to-task skill：按模板从对话总结 Task，并调用 edges tasks CLI 落盘
metadata:
  edges-type: task
  edges-title: conversation-to-task skill：按模板总结 Task 并调用 CLI
  edges-tasks-status: cancelled
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-24T10:41:28+08:00"
  edges-task-project: edges-tasks
---

另做一条 skill：从对话里按模板/约定总结出 Task（结论 → Why → How to apply、frontmatter 等），然后调用 CLI 落盘，而不是手搓 git / 只写 markdown。

**Why:**
正在 grill `edges tasks` CLI（list/get/create/update/status + runs/run-messages）；约定先 CLI，再叠 Skill/MCP（能力面仍是 CLI+Skill+MCP）。peng cheng 要求对话→Task 的入口也走 CLI。与已在做的 #15「tasks 配套 skill：CRUD 与状态流转」相关但可分开：本条偏「对话→创建/更新入口」；#15 偏看板操作接口。等 CLI 就绪后再实现本 skill。

**How to apply:**
- 设计 skill：输入=对话或摘要；输出=符合 `knowledge/tasks/README.md` + ADR 0002 的 Task 字段。
- 落盘路径：调用 `edges tasks create`（及必要的 update/status）；禁止 Skill → 仓根 `bin/`，禁止只靠手写文件当主路径。
- 模板/字段与任务记录员现有落盘习惯对齐。
- 依赖：`edges tasks` CLI 过关后再派（可派 Coding Agent 专家）；#15 可并行细聊，实现上本 skill 应调同一套 CLI。


---

**2026-09-24 收口：** 本卡把「总结 skill」与「CLI 落盘」捆在一起，已过时。薄 skill 只整理（PR https://github.com/VirusPC/edges/pull/127）；CLI 落库见后继 `2026-09-24--conversation-to-tasks整理后调CLI落库`。本卡 → cancelled。
