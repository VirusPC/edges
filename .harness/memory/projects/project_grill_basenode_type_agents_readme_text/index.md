---
name: project_grill_basenode_type_agents_readme_text
description: >-
  改节点类层次或 type 时：取消 Internal/Leaf/internal；各节点直继 BaseNode；type 为
  agents|readme|task|memory|note|skill|text（普通文本兜底）；不另造 entryKind。
metadata:
  edges-title: BaseNode 直继；type 含 agents/readme/text
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:09:44+00:00'
---

节点模型架构（2026-10-06）类层次与 type：

**类：** 所有具体节点直接继承 `BaseNode`（或语义名 DocumentNode）。取消 `InternalNode` / `LeafNode` 中间层，取消 `internal` 概念。

**`type` 字段保留并扩展：**
- `agents` — `AGENTS.md` 系统入口
- `readme` — `README.md` 组织清单
- `task` / `memory` / `note` / `skill` — 既有业务
- `text` — 兜底：普通文本内容入口（无法归到业务 type 的 `INDEX.md` 等）

组成（constraints / localChildren / descendantChildren）上收到基类；组织/叶子仍是有无组成登记的派生状态。不另造 `entryKind`。

**Why:** 用户确认；比 system|organization|content|skill 更贴文件合同与现行 `type`；兜底叫 text 表示普通文本内容。

**How to apply:** 目标架构图与实施以本条为准。layout 识别：AGENTS→agents，README→readme，已知业务目录→对应 type，其余 INDEX→text。旧 `internal` 读兼容、写只发 `agents`。VirtualSystemEntry 仍是运行时对象，不是落盘 type。
