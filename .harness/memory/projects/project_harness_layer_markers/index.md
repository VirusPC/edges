---
name: project_harness_layer_markers
description: >-
  改 AGENTS.md 层入口注释或章节标题时：外层与三章改为 project-harness / constraints / local /
  descendants，标题为本层硬约束 / 本层组成 / 下层节点；type 与 entries 仍用 project-memory-*。设计见
  docs/superpowers/specs/2026-10-06-project-harness-layer-markers-design.md。
metadata:
  edges-title: 层入口表面命名改为 project-harness
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T13:54:04+00:00'
---

AGENTS.md 层入口三章是 Project Harness（Git 项目上的系统二写法）。表面标记从 `project-memory` 改为 `project-harness` / `project-harness-constraints` / `project-harness-local` / `project-harness-descendants`，标题改为本层硬约束 / 本层组成 / 下层节点。类型入口的 `project-memory-type` / `project-memory-entries` 本轮不改。

**Why:** 三章服务于系统二，不是 Project Memory 目录。旧标题「本层记忆」已经装不下 tasks / evaluation / observation。type / entries 只给工具读写类型目录，没有同样的名实冲突，不跟这轮绑在一起。用户 2026-10-06 确认：只改表面、前缀用 `project-harness`、类型标记不动。

**How to apply:** 改协议/模板/codec 时按 [设计](../../../../docs/superpowers/specs/2026-10-06-project-harness-layer-markers-design.md)。读兼容旧 `project-memory` 层标记，写只发新标记。不要改 type/entries 前缀，不要改 `.harness/` 目录名，不要重划三章职责。blocks.ts 的标记工厂必须拆开层前缀与类型前缀。
