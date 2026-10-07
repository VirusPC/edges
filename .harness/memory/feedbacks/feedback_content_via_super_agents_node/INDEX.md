---
name: feedback_content_via_super_agents_node
description: >-
  改 traverse/--super/tasks 查询时：同目录 README 不并边；层入口可登记材料 README 供默认 list；--super
  把材料接到 scope 目录。无 includeContentFace。
metadata:
  edges-title: 系统一内容经 SuperAgentsNode 当虚拟系统二
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T12:27:50+00:00'
---

真系统入口 `AGENTS.md` 的 traverse 只走已登记的 children。同目录 README 上的 tasks/notes 不要靠从真 AGENTS「并边」或任何 `includeContentFace` / companion 兼容开关到达。

层入口可以在本层系统维护信息里登记材料 README（`harness-materials.json` 的路径，仓库根是 `.harness/tasks/README.md`）。默认 list 顺着这条 child 走到维护任务。`--super` → SuperAgentsNode，把同一份材料路径接到 scope 目录上（仓库根因此看到领域 `tasks/README.md`），不挂其它系统 AGENTS；材料缺失可空。Task 板 `taskBoardQuery` 默认并查两面；仓级扫描先找各板 AGENTS，再对每板 dual-face。写路径 `#registered` 把每个 AGENTS 同目录 README 另起根遍历，不是 AGENTS 的 child 边。

**Why:** 用户纠正：不要兼容层；有问题直接改调用方。并边与 `includeContentFace` 都会把两套入口揉进一次从真 AGENTS 出发的 traverse。2026-10-07 grill 同时要求层入口挂看板 README，使仓库根默认 list 能走到 `.harness/tasks`，且不改 list / dual-face 代码。

**How to apply:** 不恢复 companion 别名与 `includeContentFace`。默认可达的维护任务靠层入口登记材料 README。`--super` 仍是虚拟系统，材料接到 scope 目录。发现兼容开关就删掉并改调用处。
