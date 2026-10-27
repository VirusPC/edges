---
name: feedback_interface_plans_in_memory
description: >-
  写接入层调研或技术方案时：进根 .edges/memory（reference/project），不要放 docs/ 或
  knowledge/projects，否则 ask 检索不到。
metadata:
  edges-title: 接口层方案进根 .edges/memory，不进 docs
  edges-type: feedback
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-20T07:36:13+00:00'
  edges-origin-session-id: bc-3219fe95-afee-53c8-9317-6d04fc05bc4f
  edges-agent-client: cursor
---

接入层的调研、技术方案、设计决策写入仓库根 `.edges/memory`（reference / project）。不要放 `docs/`，也不要放 `knowledge/projects`。2026-10-20 起不再有 `extensions/.memory` 或 `extensions/docs`。

**Why:** 根 `AGENTS.md` 索引 `.edges/memory`。方案放进 `docs/` 后，下次 `$project-memory-ask` 会当没有这条记忆，重复调研。`docs/` 是给人看的说明，不是决策的家。2026-09-07 曾把调研初稿放到当时的 `extensions/docs/` 被纠正。2026-10-20 平铺取消那一层，家改到根 `.edges/memory`。见 ADR 0040。

**How to apply:**

- 写外部实践调研：`edges memory remember --type reference`，作用域是仓库根。
- 写「为什么这样接」的决策：`edges memory remember --type project`，作用域是仓库根。
- 走 `edges memory remember`，不要手写记忆文件。
- `docs/` 只留用法与架构说明。
