---
name: project_task_project_readme_org_lists
description: >-
  改 Task Project / 看板列表或 physicalParent 时：Task Project 与看板项目列表用
  README+project-entries；新项目默认 README 种子，勿伪造 AGENTS；任务叶子的物理父是项目 README。
metadata:
  edges-title: Task Project 组织清单用 README
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T21:17:03+00:00'
---

Task Project 与看板项目列表以 `README.md` + `project-entries-*` 为组织清单；新项目默认 README 种子，只有用户 init 才造系统入口 AGENTS。任务叶子的 physical parent 是含 project-entries 的项目 README，不是看板 AGENTS。

**Why:** 落实 Q13/Q18：有列表 ≠ 系统入口；避免任务登记回写污染 `project-harness-local`。

**How to apply:** 改 `parentEntryIn` / `createProject` / `refreshProjectIndex` 或看板迁移时保持 README 为系统一表面；真系统入口（含硬约束）仍用 AGENTS。迁移用 `migrate:task-project-lists`。
