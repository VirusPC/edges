---
name: feedback_content_via_super_agents_node
description: >-
  改 traverse 并边、--super 或 tasks/notes 查询根时：真 AGENTS 只逛真系统二；要内容面须
  SuperAgentsNode；Task 板发现默认并查内容面与真 AGENTS（系统入口/遗留链）。
metadata:
  edges-title: 系统一内容经 SuperAgentsNode 当虚拟系统二
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T03:53:59+00:00'
---

真系统入口 `AGENTS.md` 的 traverse 只覆盖该系统的系统二（维护信息与下层系统入口）。同目录 README 上的 tasks/notes 等**不要**靠从真 AGENTS「并边」到达。

若需要这些内容：在该 `--scope` 下创建 **SuperAgentsNode**（虚拟系统入口），把原先挂在 README 上的内容面**看作这个虚拟系统的系统二**，从该节点开始遍历。`--super` 即开启这条路径；SuperAgentsNode 优先挂 scope README，否则回退仓根 README。

Task 板发现（`taskBoardQuery`）默认**并查两面**：内容面（org-list 项目与其 Task）与真 AGENTS（系统入口项目与遗留 README 链，供迁移）。单面排查时显式 `super: true|false`。写路径图闭合仍用 `includeContentFace`，不是查询并边。

**Why:** 用户纠正：并边把两套入口揉进一次从真 AGENTS 出发的 traverse；正确模型是「真系统二」与「虚拟系统（内容面）的系统二」分开。板级 list 仍须覆盖两种项目形态，故默认并查而非只走一面。

**How to apply:** 删掉/勿依赖 AGENTS→同目录 README 的遍历并边。内容查询以 SuperAgentsNode 为根；真 AGENTS 路径保持纯系统二。Task/Project 发现用 `taskBoardQuery` 默认并查；`NodeService.list(board)` 若不加 `super` 到不了 README 上的 Task 是预期。
