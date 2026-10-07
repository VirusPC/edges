---
name: project_grill_type_index_as_readme
description: >-
  改类型索引、init/remember/doctor 或 PROTOCOL 时：memory 与 skills 的类型索引只写
  README+project-entries。空的同目录 AGENTS 桩删除；缺失索引不补 AGENTS。层系统入口仍是 AGENTS.md。
metadata:
  edges-title: 类型入口只写 README，空的类型 AGENTS 桩删除
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T13:54:54+00:00'
---

节点模型 grill（2026-10-06）Q18=A。类型入口（Memory Type 与 Skills 类型索引）只是组织清单 `README.md`，组成用 `project-entries-local` / `project-entries-descendants`（标题本层内容 / 下层内容）。层系统入口 `AGENTS.md` 链到这些 README。memory 与 skills 相同。

不要在类型目录上 init `AGENTS.md` 来装组织清单。空的同目录桩删掉，不留系统入口。尚未迁走、文件还在且仍带条目列表的旧 `AGENTS.md` 类型索引只读兼容；缺失时新建的是 README，不补 AGENTS。层系统入口、看板和技能包自己的 `AGENTS.md` 仍保留。

**Why:** 用户 2026-10-07 先要求类型索引用 README，随后明确空的类型目录 AGENTS 桩（含 `.harness/skills/managed` 与 `referenced`）没有登记价值，应删除。硬约束若只是迁移时生成的两行套话，不是需要保留的系统入口。

**How to apply:** init / add-type / doctor / remember 写类型索引时只发 README + `project-entries-*`。`TYPE_INDEX_FILE_NAME` 与 `typeIndexRelpath` 指向 README。已存在的旧 AGENTS 类型索引可以原地更新；文件不在时不要重建它。不要把名单抄进同目录 AGENTS，也不要让它挂同目录 README。
