---
name: project_grill_super_agents_node_extends_agents
description: 改虚拟超节点实现时：类名 SuperAgentsNode，继承 AgentsNode；flag 仍 --super；勿用 VirtualSuperNode。
metadata:
  edges-title: SuperAgentsNode 继承 AgentsNode
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:44:08+00:00'
---

节点模型（2026-10-06）：运行时虚拟超节点的实现类名为 **`SuperAgentsNode`**，**继承 `AgentsNode`**（从而也是系统入口形状：可有 constraints / 系统维护信息组成）。

- 对外术语仍是「虚拟超节点」；CLI flag 仍是 **`--super`**。
- 不落盘；默认仍用 scope 下真实 `AGENTS.md`（`AgentsNode`）。
- 不要用 `VirtualSuperNode` / `VirtualSystemEntry` 作类名。

**Why:** 用户指定类名与继承：超节点也是一种 agents 入口，只是上一级、无文件。

**How to apply:** 类图与代码：`AgentsNode <|-- SuperAgentsNode`。Wave B Task 10 按此实现。
