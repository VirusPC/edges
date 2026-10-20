---
name: project_virtual_system_entry_personal_root
description: >-
  设计个人任务或无 AGENTS.md 的主体根时：默认 scope/AGENTS.md；显式 --super 启用 SuperAgentsNode（继承
  AgentsNode，不落盘）。勿用 VirtualSuperNode。
metadata:
  edges-title: 虚拟超节点用于个人根与个人任务查询
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:44:27+00:00'
---

**虚拟超节点**（不落盘）：相对当前 `--scope` 再上一级的运行时系统入口。默认仍用 scope 下真实 `AGENTS.md`；仅当显式 `--super` 时启用。实现类 **`SuperAgentsNode` extends `AgentsNode`**。用途：主体（如「人」）无真实 AGENTS 时查询个人相关任务等——经 Edges 根 README 组成下钻（Q9b）。

**Why:** 用户定名；类名定为 SuperAgentsNode 继承 AgentsNode。

**How to apply:** 用「虚拟超节点」与 `--super`；代码写 `SuperAgentsNode`。不要 VirtualSuperNode、virtual-root，不要落盘，不要缺 AGENTS 自动合成。
