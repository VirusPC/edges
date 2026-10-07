---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：扫盘收根；Super 挂
  tasks/memory/skills/evaluation/observation（相对虚拟 scope，整仓=.harness 语义）+可选
  README，不挂其它系统 AGENTS；Service TreeNode[][]；review 全部独立+resolve 早停。
metadata:
  edges-title: traverse 单系统；森林根、Super 与交林两种形式
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:50:21+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：只走单系统 `children`；不拼森林。
2. **收根**：扫盘找带 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二（语义上的一份 .harness）** + `SuperAgentsNode` 虚拟根；traverse Super 当普通 AgentsNode。Super **也是**森林一根（可切换主体）。
4. **Super 挂载（Q16′=A，细则）**：
   - 相对**虚拟 Super scope**（整仓当个人系统二时，该 scope 对准「这份 harness 的根」，即仓根语义，而不是再套一层 `.harness/` 前缀）。
   - 固定材料相对路径（有则挂）：`tasks`、`memory`、`skills`、`evaluation`、`observation`。
   - 可选：`README.md` 显式索引（可缺，只读兼容）。
   - **不挂**其它系统的 `AGENTS.md`（那是另一棵树的根，只出现在扫盘根集合里）。
5. **Service → review**：底层完整节点；可投影字段；森林 `TreeNode[][]`；全部独立；resolve 遇其它根早停可拼接；可按根并行。嵌套形式：从 B traverse 可达 A 根 ⇒ 只留 A。

**Why:** grill 确认挂载表；用户要求把「相对谁 / 为何不带 .harness 前缀 / 与收根分工」说透。

**How to apply:** 实现 Super 组成时用上表相对路径；禁止把仓根或子系统 AGENTS 挂进 Super.children。
