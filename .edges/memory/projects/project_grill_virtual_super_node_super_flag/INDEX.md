---
name: project_grill_virtual_super_node_super_flag
description: >-
  改遍历根或 CLI scope 时：默认 scope/AGENTS.md；显式 --super 启用 SuperAgentsNode（继承
  AgentsNode，不落盘）；勿用 VirtualSuperNode/virtual-root。
metadata:
  edges-title: 虚拟超节点与 --super flag
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:44:13+00:00'
---

节点模型（2026-10-06）：原「虚拟系统入口 / 虚拟根」改称 **虚拟超节点**。

- CLI/API flag：**`--super`**。
- 默认：当前 `--scope` 下真实 `AGENTS.md`（`AgentsNode`）。
- `--super`：再上一级运行时虚拟超节点；实现类 **`SuperAgentsNode` extends `AgentsNode`**，不落盘。
- 缺 AGENTS 且未开 `--super` → 报错，不自动合成。

**Why:** 用户定名；类名后定为 SuperAgentsNode 继承 AgentsNode。

**How to apply:** 对外说虚拟超节点 / `--super`；代码类名 `SuperAgentsNode`。不要 VirtualSuperNode、virtual-root。
