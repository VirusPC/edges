---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：扫盘收根；Service 交 TreeNode[][]；review 全部独立；resolve
  遇其它根早停可拼接；扁平数组利并行；嵌套只留内层；Super 挂 .harness 路径+可选 README。
metadata:
  edges-title: traverse 单系统；森林根、Super 与交林两种形式
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:41:14+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：只走单系统 `children`；不拼森林。
2. **收根**：扫盘找带 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二** + Super 虚拟根；traverse Super 当普通 AgentsNode。
4. **Super 挂载**：`.harness` 式固定相对路径 + 可选 `README.md`。
5. **Service → review**：森林为 **`TreeNode[][]`**。单根正常 traverse。
6. **交林**：review 默认全部独立；树间无从属。resolve 遇其它森林根则早停；早停后可拼接该树数组。**扁平按根展开也利于按根并行**（用户所述）。嵌套形式：从 B traverse 可达 A 根 ⇒ 只留 A。

**Why:** grill 确认形状与早停拼接；用户补充并行收益。

**How to apply:** 按根并行 traverse 再拼二维数组；禁入其它根用 resolve；勿先嵌套再拆。
