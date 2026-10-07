---
name: feedback_traverse_single_system_and_forest_roots
description: >-
  改 traverse/森林/Super 时：扫盘收根；Service 交 TreeNode[][]；review 全部独立；resolve
  遇其它根早停并可拼接该树数组；嵌套形式只留内层；Super 挂 .harness 路径+可选 README。
metadata:
  edges-title: traverse 单系统；森林根、Super 与交林两种形式
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T06:40:30+00:00'
---

用户所述规则（森林 / Super 设计约束）：

1. **traverse**：只走单系统 `children`；不拼森林。
2. **收根**：扫盘找带 `project-harness` 的 `AGENTS.md`。
3. **整仓 = 个人系统二** + Super 虚拟根；traverse Super 当普通 AgentsNode。
4. **Super 挂载**：`.harness` 式固定相对路径 + 可选 `README.md`。
5. **Service → review**：完整森林为 **`TreeNode[][]`**（Q15=A：每棵树是先序节点数组）。单根正常 traverse。
6. **交林**：review 默认全部独立；树间无从属。落实（Q14=B）：resolve 若目标是其它森林根则 `undefined` **早停**；早停后可将**该根对应树的数组直接拼接/接上**（用户所述，与扁平数组形状配合）。嵌套形式：从 B traverse 可达 A 根 ⇒ 只留 A。

**Why:** grill 确认 Q15=A，并与 Q14 早停拼接相合。

**How to apply:** 森林用二维节点数组；禁入其它根用 resolve；组装时可接其它树数组，勿先转嵌套再拆。
