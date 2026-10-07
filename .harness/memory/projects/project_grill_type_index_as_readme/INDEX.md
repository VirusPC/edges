---
name: project_grill_type_index_as_readme
description: >-
  改类型索引、init/remember/doctor 或 PROTOCOL 时：类型索引用 README+project-entries；层 AGENTS
  链到这些 README。已有类型目录 AGENTS 留下作系统入口，不删、不抄名单、不挂同目录 README。
metadata:
  edges-title: 类型入口统一为 README + project-entries
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T12:27:51+00:00'
---

节点模型 grill（2026-10-06）Q18=A，并由 2026-10-07 grill 收紧：类型入口（Memory Type / Skills 类型索引）是组织清单 `README.md`，`type=readme`，组成用 `project-entries-local` / `project-entries-descendants`（标题本层内容 / 下层内容）。层系统入口 `AGENTS.md` 的本层系统维护信息链到这些 README。不要再用类型目录下的 `AGENTS.md` 当索引。

目录若已经有 `AGENTS.md`（含曾经被误写成类型索引、后来拆出 README 的），保留它作系统入口（硬约束与系统维护信息），不要删。不要把类型条目从 README 抄回这份 `AGENTS.md`，也不要让它挂同目录 README。

**Why:** 用户要统一规范；类型入口本质是列条目的组织清单，不是系统二。2026-10-07 否掉「类型索引用 AGENTS + project-harness」以及「AGENTS 本层必须挂同目录 README」。已有系统入口删掉会丢掉硬约束。

**How to apply:** init/remember/doctor 写类型索引时发 README+project-entries-*；读兼容旧 `AGENTS.md`+`project-memory-entries` 直至迁移完成。README 与旧 AGENTS 并存时以 README 为索引。PROTOCOL/LAYOUT 与 ADR 0029 一致。不要把「类型目录有列表」自动当成系统入口，也不要因为留下了 AGENTS 就再抄一份名单。
