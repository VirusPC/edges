---
name: project_grill_basenode_type_agents_readme_text
description: >-
  改节点类层次或 type 时：取消 Internal/Leaf/internal；各节点直继 BaseNode；type 为
  agents|readme|task|memory|note|skill|text；运行时虚拟超节点用 --super，不是落盘 type。
metadata:
  edges-title: BaseNode 直继；type 含 agents/readme/text
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:40:32+00:00'
---

节点模型架构（2026-10-06）类层次与 type：

**类：** 所有具体节点直接继承 `BaseNode`。取消 `InternalNode` / `LeafNode` 中间层，取消 `internal` 概念。

**`type` 字段保留并扩展：**
- `agents` — `AGENTS.md` 系统入口
- `readme` — `README.md` 组织清单
- `task` / `memory` / `note` / `skill` — 既有业务
- `text` — 兜底：普通文本内容入口

组成上收到基类；组织/叶子仍是派生状态。不另造 `entryKind`。

运行时 **虚拟超节点**（`VirtualSuperNode`）不是落盘 type；仅 `--super` 启用。

**Why:** 用户确认；术语后改为虚拟超节点 / `--super`。

**How to apply:** layout 识别：AGENTS→agents，README→readme，已知业务→对应 type，其余 INDEX→text。旧 `internal` 读兼容、写只发 `agents`。
