---
name: memory_type_indexes_as_folder_agents_md
description: 协议级改造：.memory 内类型索引改为类型目录下的 AGENTS.md（如 feedbacks/AGENTS.md），求一致与可扩展
metadata:
  edges-type: task
  edges-title: .memory 类型索引改为目录下 AGENTS.md
  edges-tasks-status: backlog
  edges-origin-session-id: idea-recorder-2026-09-17
  edges-agent-client: grok-bot
  edges-username: Idea 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T02:32:15+00:00"
---

**特殊：协议 / 布局级改造**，不是普通功能加料。动的是 project-memory 的索引合同（init / remember / doctor / PROTOCOL / LAYOUT），迁移面大，派发前必须 grill，不能和「多加一个 type」混成一条。

## 要做什么

`.memory` 里的类型索引（如平铺的 `FEEDBACK.md` / `PROJECT.md` / `REFERENCE.md`）改为：

1. 索引形态统一为 `AGENTS.md`
2. **直接放在对应类型文件夹下**，例如 `feedbacks/AGENTS.md`

## Why

比 `.memory/` 内平铺类型索引**更加具备一致性和可扩展性**：索引形态统一为各处都认识的 `AGENTS.md`；新类型只需加目录 + 一份 `AGENTS.md`，不必再发明/维护另一套索引文件名约定。

## How to apply

- 先 grill 定：目录命名（`feedbacks` vs 现 type）、条目正文是否同目录、作用域根 `AGENTS.md` 与类型子目录 `AGENTS.md` 如何分层。
- 同步改 PROTOCOL / LAYOUT / design-decisions、scripts、已有仓库迁移策略。
- **交叉但不合并：**
  - idea 笔记：`knowledge/notes/2026-09-17--memory索引改为目录下AGENTS.md.md`
  - backlog：`Memory 模块解耦与可插拔接口`（后端可插拔 ≠ 本条索引布局）
  - backlog：`明确 memory 与 docs 边界`、`project-memory 可扩展 memory type`（若仍在）
  - note：`2026-09-11--项目memory可见性思考.md`
- 未指派。派发时默认先 grill-with-docs。
