---
name: project_tasks_board_mutations_via_cli
description: 任务记录员等 agent 改 knowledge/tasks 时优先调用 edges tasks CLI；CLI 不可用须上报用户，勿默认手搓文件推 main。
metadata:
  edges-title: Task 看板变更优先走 edges tasks CLI
  edges-type: project
  edges-origin-session-id: bc-c0103a88-0443-5dd2-8ea4-9f76501e86ab
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-19T05:58:09+00:00"
---

改 Task 状态/字段/搬家必须优先使用 `edges tasks`（list/get/create/update/status 等），不要默认手写 markdown 再 git push。

**Why:**
与 ADR 0005 能力面一致；避免双轨导致 frontmatter/路径漂移；暴露 CLI 缺口才能补齐。

**How to apply:**
Agent 先尝试 CLI；若缺依赖、缺动词、或 tasks 只写盘不推远程导致流程断掉，向用户说明具体缺口，请用户决定补 CLI 还是临时改流程。git commit/push 若 CLI 未覆盖，可在 CLI 改盘成功后单独提交，但仍禁止跳过 CLI 直接改 Task 文件。
