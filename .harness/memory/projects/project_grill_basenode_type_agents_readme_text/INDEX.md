---
name: project_grill_basenode_type_agents_readme_text
description: >-
  改节点类层次或 type 时：各节点直继 BaseNode；type 含 agents/readme/text；虚拟超节点为 SuperAgentsNode
  继承 AgentsNode，用 --super。
metadata:
  edges-title: BaseNode 直继；type 含 agents/readme/text
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:44:29+00:00'
---

节点模型架构（2026-10-06）类层次与 type：

各节点直接继承 `BaseNode`。取消 Internal/Leaf/internal。

`type`：`agents` | `readme` | `task` | `memory` | `note` | `skill` | `text`。

运行时虚拟超节点：**`SuperAgentsNode` extends `AgentsNode`**，不是落盘 type；仅 `--super` 启用。

**Why:** 用户确认。

**How to apply:** layout 识别 AGENTS→agents 等；旧 internal 读兼容。实现超节点用 SuperAgentsNode，勿 VirtualSuperNode。
