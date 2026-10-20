---
name: feedback_harness_markers_not_task_project_indexes
description: >-
  改任意目录上的 AGENTS.md 时：系统入口由用户自行 init 决定，不按路径白名单禁配；未 init 勿伪造。配套 project harness
  init skill 待办。
metadata:
  edges-title: 系统入口由用户对目录 init，不按路径禁配
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:21:18+00:00'
---

任意目录都可以有真实系统入口 `AGENTS.md`：由用户决定重点维护哪个目录，并自行调用 init（现 `$project-memory-init`，待演进为 project harness init）初始化。不是按路径白名单禁止 Task Project / 类型目录拥有系统入口。

**Why:** 用户 2026-10-06 grill Q10。递归系统二的基础是系统入口带组成；谁拥有入口是产品/用户选择，不是「只有某些固定路径才算系统二」。

**How to apply:** 看到 `.harness/tasks/<project>/AGENTS.md` 或类型目录 `AGENTS.md` 时，若用户已 init，其上的组成登记合法。不要仅因路径在 `.harness/tasks/` 下就批量剥 `project-harness-*`。未 init 的目录不要自动铺完整系统二。配套实现见看板待办 project harness init skill。
