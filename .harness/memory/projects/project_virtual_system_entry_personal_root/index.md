---
name: project_virtual_system_entry_personal_root
description: >-
  设计个人任务或无 AGENTS.md 的主体根时打开：默认 scope/AGENTS.md；显式 --super
  启用不落盘虚拟超节点（上一级），挂顶层入口后再遍历。勿用 virtual-root 旧名。
metadata:
  edges-title: 虚拟超节点用于个人根与个人任务查询
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:39:55+00:00'
---

**虚拟超节点**（不落盘）：相对当前 `--scope` 再上一级的运行时超节点。默认仍用 scope 下真实 `AGENTS.md`；仅当显式 `--super` 时启用。用途：主体（如「人」）无真实 AGENTS、Edges 为其系统二时，查询个人相关任务等——超节点把可识别顶层入口挂进组成后再遍历（经 Edges 根 README 等，Q9b）。

旧称「虚拟系统入口 / 虚拟根」已废止。

**Why:** 用户 2026-10-06 定名：super = 上一级超节点。

**How to apply:** 设计与实现用「虚拟超节点」与 `--super`。不要因缺 AGENTS 自动合成；不要落盘。实现类名建议 `VirtualSuperNode`。
