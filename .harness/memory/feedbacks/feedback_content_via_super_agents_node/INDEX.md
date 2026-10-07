---
name: feedback_content_via_super_agents_node
description: >-
  改 traverse/--super/tasks 查询时：真 AGENTS 只逛系统二；内容面用 SuperAgentsNode；无
  includeContentFace/companion 兼容；Task 板 dual-face；写路径 README 另起根。
metadata:
  edges-title: 系统一内容经 SuperAgentsNode 当虚拟系统二
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T03:59:54+00:00'
---

真系统入口 `AGENTS.md` 的 traverse 只覆盖该系统的系统二。同目录 README 上的 tasks/notes **不要**靠从真 AGENTS「并边」或任何 `includeContentFace` / companion 兼容开关到达。

内容面：`--super` → SuperAgentsNode（优先 scope README，否则仓根）。Task 板 `taskBoardQuery` 默认并查两面；仓级扫描先找各板 AGENTS，再对每板 dual-face。写路径 `#registered` 把每个 AGENTS 同目录 README **另起根**遍历，不是 AGENTS 的 child 边。

**Why:** 用户纠正：不要兼容层；有问题直接改调用方。并边与 `includeContentFace` 都会把两套入口揉进一次从真 AGENTS 出发的 traverse。

**How to apply:** 删除 companion 别名与 `includeContentFace`。查询用 `--super` 或板级 dual-face；写路径用另起根。发现兼容开关就删掉并改调用处。
