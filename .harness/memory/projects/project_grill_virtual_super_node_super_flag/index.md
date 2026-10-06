---
name: project_grill_virtual_super_node_super_flag
description: >-
  改遍历根或 CLI scope 时：默认用 scope 下 AGENTS.md；显式 --super 启用不落盘的虚拟超节点（上一级）；勿用
  virtual-root/虚拟根/虚拟系统入口作现行对外名。
metadata:
  edges-title: 虚拟超节点与 --super flag
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:39:50+00:00'
---

节点模型（2026-10-06）：原「虚拟系统入口 / 虚拟根」改称 **虚拟超节点**。

- CLI/API flag 名：**`--super`**（不要 virtual-root / virtual-node）。
- 默认行为不变：取当前 `--scope` 下真实 `AGENTS.md` 为根。
- `--super` 表示再上一级的运行时虚拟超节点（不落盘），把当前 scope 可识别的顶层入口挂进其组成后再遍历；用于个人根 / 跨主体查询等。
- 缺 AGENTS 且未开 `--super` → 报错 / 发现失败，不自动合成。

**Why:** 用户审计划：super = 上一级超节点，比 virtual root/node 更贴语义。

**How to apply:** CONTEXT、spec、ADR、实施计划、记忆与代码用词一律「虚拟超节点」；flag 只写 `--super`。不要再写 virtual-root、虚拟根、VirtualSystemEntry 作为对外名（实现类名可 `SuperNode` / `VirtualSuperNode`）。
