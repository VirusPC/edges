---
name: feedback_content_via_super_agents_node
description: >-
  改 traverse 并边、--super 或 tasks/notes 查询根时：真 AGENTS 只逛真系统二；要 tasks/notes 等须在该
  scope 建 SuperAgentsNode，把内容面当作虚拟系统的系统二再遍历，勿从真 AGENTS 并 README 边。
metadata:
  edges-title: 系统一内容经 SuperAgentsNode 当虚拟系统二
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T03:24:41+00:00'
---

真系统入口 `AGENTS.md` 的 traverse 只覆盖该系统的系统二（维护信息与下层系统入口）。同目录 README 上的 tasks/notes 等**不要**靠从真 AGENTS「并边」到达。

若需要这些内容：在该 `--scope` 下创建 **SuperAgentsNode**（虚拟系统入口），把原先挂在 README 上的内容面**看作这个虚拟系统的系统二**，从该节点开始遍历。`--super` 即开启这条路径。

**Why:** 用户纠正：并边把两套入口揉进一次从真 AGENTS 出发的 traverse；正确模型是「真系统二」与「虚拟系统（内容面）的系统二」分开，后者用 SuperAgentsNode 为根。

**How to apply:** 删掉/勿依赖 AGENTS→同目录 README 的遍历并边。内容查询（tasks/notes 等）以 SuperAgentsNode 为根；真 AGENTS 路径保持纯系统二。实现上 SuperAgentsNode 的组成应对齐该 scope 的内容面（如 README entries），而不是把 README 塞进真 AGENTS 的 children。
