---
name: project_grill_type_index_as_readme
description: >-
  改类型索引、init/remember/doctor 或 PROTOCOL 时：类型入口用 README.md（type=readme）+
  project-entries-*；层 AGENTS 链到这些 README；迁移后不用 project-memory-entries / 类型目录
  AGENTS 当索引。
metadata:
  edges-title: 类型入口统一为 README + project-entries
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:14:51+00:00'
---

节点模型 grill（2026-10-06）Q18=A：类型入口（Memory Type / Skills 类型索引）统一为组织清单规范——文件 `README.md`，`type=readme`，组成用 `project-entries-local` / `project-entries-descendants`（标题本层内容 / 下层内容）。层系统入口 `AGENTS.md` 的本层系统维护信息链到这些 README。迁移后不再用类型专用 `project-memory-entries` / 类型目录下的 `AGENTS.md` 当索引（除非该目录另经用户 init 成真正系统入口）。

**Why:** 用户要统一规范；类型入口本质是列条目的组织清单，不是系统二。

**How to apply:** init/remember/doctor 写类型索引时发 README+project-entries-*；读兼容旧 `AGENTS.md`+`project-memory-entries` 直至迁移完成。PROTOCOL/LAYOUT/模板与 ADR 0012 路径表述随实施更新。不要把「类型目录有列表」自动当成系统入口。
