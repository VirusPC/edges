---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：扫盘收根；Super 挂 .harness 式材料路径（不挂其它系统 AGENTS）；Service 交
  TreeNode[][]；review 全部独立+resolve 早停；底层完整节点、Service 可裁字段。
metadata:
  edges-title: traverse 单系统；森林根、Super 与交林两种形式
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:47:24+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：只走单系统 `children`；不拼森林。
2. **收根**：扫盘找带 `project-harness` 的 `AGENTS.md`（含 Edges 等真系统入口）。
3. **整仓 = 个人系统二** + Super 虚拟根；traverse Super 当普通 AgentsNode。
4. **Super 挂载**：对齐 `.harness` 的固定相对**材料**路径 + 可选 `README.md`。**不要挂其它系统的 `AGENTS.md`**（那是另一棵树的根，由扫盘收根，不进 Super 组成）。
5. **Service → review**：森林 `TreeNode[][]`；底层展开用完整节点；Service 可按需投影字段。review 默认全部独立；resolve 遇其它根早停并可拼接；利于按根并行。嵌套形式：从 B traverse 可达 A 根 ⇒ 只留 A。
6. **Q17=A**：Super 自己也是森林里可切换的一根。

**Why:** 用户纠正 Super 挂 AGENTS 会串进另一系统；Q17/Q18 确认。

**How to apply:** Super 只挂 harness 材料路径；系统入口只出现在扫盘根集合与各自 traverse 里。
